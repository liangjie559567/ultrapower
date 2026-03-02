# Critic 评审报告（安全与边缘情况）

**评审者**: axiom-critic
**评审时间**: 2026-03-02
**评审对象**: PRD v0.2 - Axiom 记忆与进化系统 Token 使用效率优化

---

## 总体评分

**5 / 10**

PRD 所列的已知风险均已描述，但在安全性和逻辑严谨性两个维度存在多处遗漏。核心问题在于：T4 的状态标记名称内部自相矛盾（`auto_evolve_done` vs `auto_evolve`），T3 v1/v2 的接口语义不统一，`stop_hook_active` 守卫在现有代码中并无对应实现，以及若干并发写入和边界值场景未被处理。这些问题若进入实现阶段，将直接导致功能行为不可预测。

---

## 评审意见

### 1. 安全性问题

#### 1.1 归档文件路径：路径遍历风险（P0 级别评估）

PRD 将归档路径硬编码为 `.omc/axiom/evolution/learning_queue_archive.md` 和 `.omc/axiom/evolution/reflection_log_archive.md`，属于固定路径，**本身不存在路径遍历漏洞**。

然而，隐患存在于**触发链**上：

- T1 的归档触发时机是"ax-evolve 处理完一批条目后"。ax-evolve 的 LQ 条目内容（`内容` 字段、`元数据` 字段）是由系统自动生成并写入的，但 `learning_queue.md` 是纯 Markdown 文件，**不经过任何输入消毒**。
- 若恶意内容（例如通过 ax-reflect 写入的会话内容）在 `内容` 字段中包含文件路径片段（如 `../../.claude/settings.json`），这些内容会被**原样写入归档文件**。
- 归档文件本身不执行，写入无害。但若后续有代码从归档文件中提取路径并做文件操作（未来扩展），则构成路径遍历预留风险。
- **当前 PRD 版本不涉及动态路径构建，故严重程度为 LOW**，但须在未来实现中明确标注"归档路径不可来自文件内容"。

#### 1.2 MiniSearch 查询输入净化（HIGH）

PRD 第 3 节 T3 描述 `ax-knowledge` 接受 `--filter <keyword>` 参数，交由 MiniSearch 执行全文匹配（模糊搜索 fuzzy: 0.2 + 前缀 prefix: true）。

**关键漏洞**：MiniSearch 本身是纯内存的 JavaScript 库，没有 SQL 注入面，但其**查询字符串未经净化时存在两类风险**：

1. **正则注入（RegExp Injection）**：MiniSearch 在处理模糊查询时内部会构建正则表达式。若 `keyword` 参数包含 `[`, `]`, `*`, `+`, `?`, `{`, `}`, `(`, `)`, `\` 等正则特殊字符，可能导致正则异常（抛出 `SyntaxError: Invalid regular expression`）而**穿透降级路径**——即 MiniSearch 并非"加载失败"而是"查询抛异常"，现有降级逻辑（"MiniSearch 加载失败 → grep"）**不会捕获此场景**，ax-knowledge 将直接抛出未处理异常。
   - 证据：LQ-006 已记录 Regex Injection 防护模式（k-034），说明项目已知晓此风险，但 PRD T3 v2 未引用此模式。
   - 示例攻击输入：`ax-knowledge --filter "test[*"`

2. **超长查询字符串**：无长度限制的 `--filter` 参数可触发 MiniSearch 在大数据集下的高 CPU 消耗。当前 62 条规模下影响有限，但 PRD 未定义最大查询长度。

**建议**：在 TypeScript 层对 `keyword` 参数做以下处理：
- 长度上限（建议 256 字符）
- 正则特殊字符转义（参考 k-034 的转义模式：`str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`）

#### 1.3 TOCTOU 竞争条件：SessionEnd hook 读取 active_context.md（HIGH）

T4 的设计依赖以下顺序：

```
Step 1: 读取 active_context.md → 检查 auto_evolve_done 字段
Step 2: 若字段不存在 → 执行 ax-evolve（3 条）
Step 3: 执行完成后 → 写入 auto_evolve: true 到 active_context.md
```

**竞争条件场景**：在多工作区（worktree）环境中，或者用户同时打开两个 Claude Code 会话（共享同一 `.omc/axiom/` 目录），两个 SessionEnd hook 可能**并发触发**：

- Session A 读取 active_context.md（Step 1），判断 `auto_evolve_done` 不存在，决定执行
- Session B 读取 active_context.md（Step 1），同样判断不存在，决定执行
- Session A 执行 ax-evolve，处理条目 LQ-031、LQ-032、LQ-033，写入 learning_queue.md
- Session B 执行 ax-evolve，**同样**处理 LQ-031、LQ-032、LQ-033（因为 Session A 的写入可能尚未完成）
- 结果：**同一批条目被处理两次**，knowledge_base.md 中写入重复知识条目，learning_queue.md 状态可能损坏

这是经典的 **TOCTOU（Time-of-Check-Time-of-Use）** 问题。PRD 在"安全守卫"中仅提及 `stop_hook_active` 守卫，未处理并发 SessionEnd 场景。

**严重性评估**：MEDIUM（多会话并发场景在日常使用中确实存在，特别是 Claude Code 允许在多个终端窗口打开同一项目）。

**建议**：使用文件锁（`lockfile` 或写入专用的 `.lock` 文件 + 原子检查）或在 `active_context.md` 中使用 **写入再读取**（write-then-verify）模式替代 TOCTOU 易发的读写分离模式。

#### 1.4 stop_hook_active 守卫：环境变量检查与实际代码不符（HIGH）

PRD T4 第 5 条："安全守卫：hook 脚本入口检查 `stop_hook_active` 环境变量；若为 `true` 则立即退出"。

**代码层核查发现**：

- `templates/hooks/subagent-stop.mjs` 确实检查了 `stop_hook_active`，但该检查是从**JSON stdin 数据**中解构获取（`const { stop_hook_active } = data`），而非环境变量 `process.env.stop_hook_active`。
- **PRD 描述与实际实现存在根本性差异**：PRD 说"检查环境变量"，实际代码检查的是"JSON 数据字段"。
- 在 T4 新增的 SessionEnd hook 脚本中，若实现者按 PRD 描述做 `process.env.STOP_HOOK_ACTIVE === 'true'` 检查，该守卫将**完全失效**（SessionEnd hook 的触发上下文不提供此环境变量，Claude Code 通过 JSON 字段传递此标志）。
- 更严重的是，**SessionEnd hook 天然不应收到 `stop_hook_active` 字段**（该字段只在 Stop hook 的 JSON payload 中存在），因此该守卫在 SessionEnd hook 中逻辑上是无意义的——PRD 声称这是"防 Stop hook 误触发"，但 SessionEnd hook 本身就不是 Stop hook，守卫的存在目的自相矛盾。

**建议**：在 T4 的实现规格中明确：SessionEnd hook 脚本无需也不应检查 `stop_hook_active`；若要防止意外触发，应检查 `hook_event_name` 字段是否等于 `'SessionEnd'`。

---

### 2. 逻辑不一致

#### 2.1 T1 阈值语义：`done > 10` 与 `done >= 10` 的歧义（MEDIUM）

PRD 第 3 节 T1 第 1 条："主文件中 `done` 条目数超过 **10 条**时触发归档"——"超过 10 条"语义为 `done > 10`（即 done = 11 时触发）。

但 PRD 第 5 节验收标准 T1 写道："触发归档后，主文件 done 条目数 `<= 10`"——这意味着**触发后保留最多 10 条**。

流程图 4.1 写道：`{done 条目数 > 10?}` ——确认触发条件为 `done > 10`，即 done = 11 时触发，归档到 done = 10。

**但** PRD 第 3 节 T1 第 4 条："主文件只保留……最近 10 条 `done` 条目"——这里"最近 10 条"是归档后的目标状态，对应 `done <= 10`，与 `done > 10` 的触发条件逻辑上一致。

**问题**：如果有恰好 10 条 done 时执行 ax-evolve，将第 10 条的 pending 变为 done，done = 11，触发归档，归档后 done = 10。**但 PRD 第 3 节 T1 第 1 条描述是"超过 10 条时触发"，这意味着 done = 10 时不触发**——此处"超过"的文字语义为严格大于（`>`），而非大于等于（`>=`），实现时需要明确。

**真正的逻辑缺陷**：若触发条件为 `done >= 10`（即恰好 10 条也触发），则每次 ax-evolve 将第 9 条变为 done（done = 10），立即触发归档，归档掉 0 条（因为要保留 10 条）——归档操作为空操作，造成无意义的 I/O。

**建议**：明确语义为 `done > 10`（done = 11 时触发），并在代码注释中标注。

#### 2.2 T4 状态标记名称内部不一致（HIGH — 功能级别缺陷）

这是本 PRD **最严重的逻辑不一致**。

PRD 第 3 节 T4：
- 第 4 条（跳过条件）：通过读取 active_context.md 中的 `auto_evolve_done: true` 标记判断是否跳过
- 第 6 条（触发标记）：自动触发完成后在 active_context.md 写入标记 `auto_evolve: true`

**矛盾**：写入的是 `auto_evolve: true`，检查的是 `auto_evolve_done: true`——**两个不同的字段名**。

按照 PRD 当前描述，系统将永远不会跳过自动触发：
1. 第一次会话结束：`auto_evolve_done` 不存在 → 执行 ax-evolve → 写入 `auto_evolve: true`
2. 第二次会话结束：检查 `auto_evolve_done`（仍不存在，因为写入的是 `auto_evolve`）→ 再次执行 ax-evolve
3. **重复无限循环**（跨会话，每次都重新处理相同条目）

这不是措辞问题，是**功能级别的逻辑错误**：跳过条件与写入条件检查的是两个不同名称的字段，导致跳过逻辑永久失效。

实际代码中（`grep "auto_evolve" src/`）**没有找到任何现有实现**，说明这是纯设计层面的错误，尚未在代码中固化，应在 PRD 确认前修正。

**建议**：统一字段名，两处均使用 `auto_evolve_done: true`，或均使用 `auto_evolve: true`，并在 PRD 中保持一致。

#### 2.3 T3 v1 与 v2 的 `--filter` 参数语义不统一（MEDIUM）

T3 v1（SKILL.md 层，基础方案）：`--filter <keyword>` 只返回 **Title 或 Category 包含关键词**的行（字段精确匹配）

T3 v2（MiniSearch）：`--filter <keyword>` 执行**全文匹配**（title + content + tags 加权，支持模糊匹配 fuzzy: 0.2）

验收标准（第 6 节）混合引用了两套语义：
- "ax-knowledge --filter typescript 只返回 Title/Tags 含 typescript 的条目（MiniSearch 全文匹配）"
- "过滤结果正确（无漏匹配、无误匹配）"

**逻辑问题**：同一个验收标准，在 v1 环境下（MiniSearch 失败，降级到 grep）的行为与 v2 环境下**结果集不同**：

- v2：`--filter typescript` 可能返回 content 含 "typescript" 但 Title 不含的条目（全文匹配）
- v1/降级：`--filter typescript` 只返回 Title 或 Category 含 "typescript" 的条目（字段匹配）

这意味着**降级路径的结果集是 v2 结果集的子集**，用户在降级状态下看到的结果比正常状态少，但 PRD 的验收标准未区分这两种状态下的预期行为，无法判断降级时是否"正确"。

**更深的矛盾**：T3 v1 验收标准说 "MiniSearch 加载失败时自动降级至 grep 过滤，不抛异常"，但 T3 v1 本身就是 SKILL.md 层的 grep 过滤，v2 才是 MiniSearch。降级"从 v2 回到 v1"——所以 v1 的 grep 过滤**既是基础方案又是降级方案**，但 PRD 在两个位置（T3 v1 描述和降级路径描述）对该行为的描述逻辑重叠，未明确是否为同一实现。

#### 2.4 流程图 4.1 中"会话结束检测"节点与 SessionEnd hook 技术实现不一致（LOW）

PRD 第 3 节 T4 第 1 条明确："触发点：仅使用 SessionEnd hook（不使用 Stop hook）"。

流程图 4.1 中使用 `J{会话结束检测}` 菱形判断节点，暗示这是一个**主动检测过程**。

**不一致之处**：SessionEnd hook 是**被动触发机制**（Claude Code 在会话结束时主动调用），而非"检测"。图中的表述会让实现者误解为需要轮询或主动检测会话结束状态，而实际只需在 SessionEnd hook 的处理函数中追加 ax-evolve 逻辑即可。这不是功能缺陷，但会给实现者带来认知混乱，可能导致过度设计（例如引入不必要的轮询机制）。

---

### 3. 边缘情况遗漏

#### 3.1 并发写入归档文件（HIGH）

**场景**：用户在同一台机器上同时执行两次 `ax-evolve`（例如两个 Claude Code 窗口并发运行），T1 的归档操作同时触发：

1. 进程 A：读取 learning_queue.md，统计 done = 15，决定归档 5 条
2. 进程 B：读取 learning_queue.md，同样统计 done = 15，决定归档 5 条
3. 进程 A：将 LQ-001~LQ-005 写入归档文件
4. 进程 B：将 LQ-001~LQ-005 **也**写入归档文件（重复追加）
5. 进程 A：重写主文件，删除 LQ-001~LQ-005
6. 进程 B：重写主文件，**再次**删除 LQ-001~LQ-005（实际已无这些条目，可能损坏主文件结构）

**结果**：归档文件中 LQ-001~LQ-005 被写入两次，违反了 PRD 声称的"幂等操作"。PRD 的幂等性声明实际上是**单进程幂等**，不是并发安全的。

T2（reflection_log.md 滚动窗口）存在相同的并发写入问题。

PRD 的"先写归档，再清理主文件"方案在并发场景下既不原子也不幂等。

#### 3.2 knowledge_base.md 完全为空时的 MiniSearch 建索引行为（MEDIUM）

当 `knowledge_base.md` 中无任何有效条目时（初始安装、全部迁移失败或文件为空），MiniSearch 的建索引行为：

- 对空文档数组建索引：MiniSearch 允许，索引为空，查询返回空结果——**行为安全**
- **真正的风险**：YAML front-matter 迁移失败导致**部分条目无法解析**。例如 62 条中有 3 条 YAML 格式错误，解析器会：
  - 方案 A（严格模式）：整个 knowledge_base.md 解析失败，触发降级 → 但降级路径（grep）无法处理损坏的 YAML
  - 方案 B（宽松模式）：跳过错误条目，只对59条建索引 → 用户不知道有 3 条被静默丢弃

**PRD 未定义** YAML 解析部分失败时的行为（全失败 vs 宽松跳过），这是实现层的重要决策，应在 PRD 中明确。

#### 3.3 reflection_log.md 有效条目恰好等于 20 条时的边界值行为（MEDIUM）

PRD T2 第 2 条："滚动窗口：主文件保留最近 20 条完整反思记录"。

**边界值歧义**：当 ax-reflect 写入**第 21 条**时，触发归档。但当前恰好 20 条时：

- 触发条件应为 `count > 20`（写入后大于 20 才归档）还是 `count >= 20`（等于 20 即归档）？
- PRD 第 3 节 T2 说"主文件保留最近 20 条"，暗示 `count <= 20` 是目标状态
- 流程图 4.1 菱形节点写 `{反思条目数 > 20?}`，确认触发条件是严格大于 20

但**边界 off-by-one 仍存在**：若触发条件为 `count > 20`，则 count = 20 时**不触发**；ax-reflect 写入第 21 条后 count = 21，触发归档，归档 1 条，保留 20 条——逻辑自洽。然而 PRD 验收标准写"新写入反思后，主文件反思条目数 `<= 20`"，这与 `count > 20` 触发一致，但实现者可能误读为"每次写入后都检查，若 = 20 就触发"。

**建议**：验收标准改为"主文件反思条目数**恒**保持 <= 20（以 21 条写入测试验证）"，明确触发时机为"写入第 21 条后"。

#### 3.4 T4 ax-evolve 处理中途失败的数据一致性（HIGH）

PRD T4 第 2 条："每次自动触发最多处理 3 条 pending 条目"。

**中途失败场景**：处理第 2 条（LQ-032）时，写入 knowledge_base.md 成功，但随后更新 learning_queue.md 中 LQ-032 的状态（pending → done）时崩溃。

**结果**：
- knowledge_base.md 中已有 LQ-032 的知识条目（k-XXX 已写入）
- learning_queue.md 中 LQ-032 状态仍为 pending
- 下次 SessionEnd 触发时，LQ-032 **再次被处理**，knowledge_base.md 中写入**重复的知识条目**（不同 ID 但相同内容）

PRD 的风险表仅描述了"归档操作崩溃风险"，未描述 **ax-evolve 处理链中途崩溃**的一致性问题。T4 触发的 ax-evolve 属于增量处理，比 T1 的批量归档更难保证原子性。

**建议**：明确 T4 的处理原子性要求：对每条 LQ 条目，必须**先更新 learning_queue.md 状态（pending → processing），再写知识库，再更新状态（processing → done）**。崩溃后下次可通过检查 `processing` 状态的条目恢复，而非重复处理 pending 条目。

#### 3.5 首次安装时 learning_queue_archive.md 不存在的处理（MEDIUM）

PRD T1 第 2 条："归档目标路径：`.omc/axiom/evolution/learning_queue_archive.md`（追加写入）"。

**首次归档时**，该文件不存在。"追加写入"（append 模式）在 Node.js 中：

- `fs.appendFileSync` 若文件不存在，**自动创建**——行为安全
- `fs.open(path, 'a')` 同样自动创建——行为安全

**但**，PRD 第 5.2 节验收标准："`learning_queue_archive.md` 存在且包含所有历史 done 条目（无内容丢失）"——这要求文件被**创建**。这在技术上自动完成，无需额外处理。

**隐患**：归档文件所在目录 `.omc/axiom/evolution/` 在全新安装的系统中**可能不存在**。`fs.appendFileSync` 在目录不存在时会抛出 `ENOENT` 异常，不会自动创建目录。PRD 未提及首次安装时的目录初始化逻辑（对比：LQ-004 / k-032 记录了 `atomicWriteJson` 的目录自动创建能力，但归档操作若不使用 atomicWriteJson 就没有此保障）。

#### 3.6 T4 的 3 条处理上限与实际 pending 数量的交互（LOW）

**场景**：learning_queue.md 中有 50 条 pending 条目（长期积压）。每次 SessionEnd 处理 3 条，按此速率需要 ~17 次会话才能清空。

**未被分析的副作用**：
- 50 条 pending 时，前 17 次会话每次都触发 ax-evolve（3 条），最后第 18 次会话（剩 2 条）只处理 2 条——PRD 未明确是否允许处理少于 3 条（"最多 3 条"语义允许少于 3 条，但未明确）
- 若 ax-evolve 的 pending 条目按优先级（P0/P1/P2/P3）处理，PRD T4 未声明自动触发时是否遵循优先级顺序——实现者可能默认按文件顺序（而非优先级）取前 3 条

---

### 4. PRD 自相矛盾

#### 4.1 "触发点：仅使用 SessionEnd hook" 与流程图节点措辞（LOW）

PRD 第 3 节 T4 第 1 条："触发点：仅使用 SessionEnd hook"——明确说明是被动的 hook 触发。

流程图 4.1 节点 `J{会话结束检测}`——措辞"检测"暗示主动轮询/探测行为，与 SessionEnd hook 的被动触发机制在概念上矛盾。

技术上不影响功能，但会造成实现者认知混乱，建议将节点描述改为 `J{SessionEnd hook 触发}`。

#### 4.2 T3 验收标准混淆了 v1 和 v2 的过滤语义（MEDIUM）

T3 验收标准第一条："ax-knowledge --filter typescript 只返回 Title/Tags 含 typescript 的条目（MiniSearch 全文匹配）"——**括号内"MiniSearch 全文匹配"与前文"Title/Tags 含"相矛盾**：

- "Title/Tags 含 typescript"是**字段精确包含**判断（v1 基础方案语义）
- "MiniSearch 全文匹配"是**跨字段全文搜索**（v2 语义）

这两种描述对应不同的结果集：v2 全文匹配可能返回 Title 不含 "typescript" 但 content 含 "typescript" 的条目；而字段精确包含不会返回这类结果。验收标准**同时要求两种互相矛盾的语义**，导致无法确定正确实现的验证基准。

#### 4.3 T4 标记名称的内部自相矛盾（已在 2.2 节详述）

**跳过条件**：检查 `auto_evolve_done: true`
**写入标记**：写入 `auto_evolve: true`

两个不同字段名，导致跳过逻辑永久失效。这是本 PRD 中**唯一一个会导致实现后功能完全错误**的矛盾，严重程度 HIGH。

---

## 差异点（Diff Points）

| ID | 描述 | 严重程度 | 建议 |
|----|------|----------|------|
| D-C01 | T4 状态标记名称自相矛盾：跳过条件检查 `auto_evolve_done: true`，但写入的是 `auto_evolve: true`，导致跳过逻辑永久失效，每次 SessionEnd 都会重复处理 | HIGH | 统一字段名，两处均使用 `auto_evolve_done: true`，并在 PRD 中同步修正验收标准第 5 条 |
| D-C02 | `stop_hook_active` 守卫描述为"检查环境变量"，但实际代码（subagent-stop.mjs）从 JSON stdin 解构获取；更严重的是，SessionEnd hook payload 中不存在该字段，守卫在 SessionEnd hook 中逻辑上无意义 | HIGH | 删除 T4 中对 `stop_hook_active` 守卫的描述；在实现规格中改为"检查 hook_event_name === 'SessionEnd' 确认正确触发事件" |
| D-C03 | TOCTOU 竞争条件：多窗口/多 worktree 场景下，两个 SessionEnd hook 并发执行可能导致相同的 LQ 条目被处理两次，knowledge_base.md 写入重复条目 | HIGH | 引入基于文件锁的互斥机制（在 SessionEnd ax-evolve 逻辑入口写 `.lock` 文件，完成后删除；检测到 lock 文件则跳过） |
| D-C04 | T4 ax-evolve 中途崩溃的数据一致性：处理链"写知识库 → 更新 LQ 状态"若在写知识库后崩溃，下次重复处理同一条目导致知识库重复条目 | HIGH | 增加中间状态 `processing`：先将 LQ 状态设为 processing，再写知识库，再设为 done；崩溃恢复时跳过 done 条目，对 processing 条目做去重检查 |
| D-C05 | MiniSearch `--filter` 参数未净化：包含正则特殊字符的查询字符串（如 `test[*`）可能导致 MiniSearch 内部抛出 RegExp SyntaxError，该异常不属于"MiniSearch 加载失败"，现有降级路径无法捕获 | HIGH | 在调用 MiniSearch 前，对 keyword 参数做正则特殊字符转义（参考项目已有 k-034 模式），并设置 256 字符长度上限 |
| D-C06 | T3 v1/v2 的 `--filter` 参数语义不同：v1 做字段精确包含，v2 做全文模糊匹配；验收标准混用两套语义，导致降级状态下结果集不一致且无法判断是否正确 | MEDIUM | 分别为 v1（字段匹配）和 v2（全文匹配）定义独立的验收标准；明确降级时允许结果集缩小（subset 行为），并在用户文档中声明 |
| D-C07 | 并发写入归档文件：两个 ax-evolve 实例并发执行时，T1/T2 的归档操作均无并发保护，可能造成归档文件重复写入和主文件双重修改 | MEDIUM | 归档操作入口使用进程级文件锁（`.omc/axiom/evolution/.archive.lock`），或使用 write-to-tmp-then-rename 的原子写入替代 append 操作 |
| D-C08 | 首次安装目录不存在风险：`.omc/axiom/evolution/` 目录在全新系统中可能不存在，`fs.appendFileSync` 会因目录缺失抛出 ENOENT，PRD 未说明目录初始化逻辑 | MEDIUM | 在 T1/T2 归档操作前加入 `mkdirSync({ recursive: true })` 确保目录存在（参考 k-032 的 atomicWriteJson 隐含目录创建模式） |
| D-C09 | T3 v2 YAML 部分解析失败的行为未定义：62 条中部分条目 YAML 格式错误时，是全量失败触发降级，还是宽松模式跳过错误条目？宽松模式会导致条目静默丢失 | MEDIUM | 明确定义：YAML 解析采用宽松模式（跳过错误条目 + 记录警告日志），不因单条错误触发全局降级；对跳过条目数量设上限（如超过 10% 则触发降级） |
| D-C10 | T3 验收标准第一条自相矛盾："只返回 Title/Tags 含 typescript 的条目"（字段匹配）与"MiniSearch 全文匹配"（全文搜索）描述的是不同结果集 | MEDIUM | 修正验收标准：v2 描述改为"返回 title/tags/content 中含 typescript 的条目（MiniSearch 全文匹配，含模糊）" |
| D-C11 | T1 阈值语义歧义："超过 10 条"在自然语言中通常为严格大于（`>`），但未在 PRD 中明确标注为 `count > 10`，实现者可能误用 `count >= 10` | LOW | 在 T1 第 1 条中直接写明条件表达式：`done 条目数 count > 10 时触发`，并在验收测试中使用 done = 11 作为边界测试用例 |
| D-C12 | 流程图 4.1 节点 `J{会话结束检测}` 暗示主动轮询，与 SessionEnd hook 被动触发机制在概念上矛盾，可能导致实现者过度设计 | LOW | 将节点描述改为 `J{SessionEnd hook 触发}`，与 T4 第 1 条的描述一致 |

---

## 总结

### 必须在进入实现前修正的阻断级问题（Blockers）

1. **D-C01（HIGH）**：`auto_evolve_done` vs `auto_evolve` 标记名称不一致——T4 的跳过逻辑因此永久失效，实现后必然产生重复处理 Bug，须在 PRD 确认前修正字段名。

2. **D-C02（HIGH）**：`stop_hook_active` 守卫的描述与实际实现机制不符，且在 SessionEnd hook 中从语义上就是无意义的——实现者若照 PRD 编写将产生无效守卫代码。

3. **D-C05（HIGH）**：MiniSearch `--filter` 参数的 RegExp 注入风险——降级路径无法捕获该异常，项目已有防护模式（k-034）但 PRD 未引用，须在 T3 的实现规格中强制引用。

4. **D-C04（HIGH）**：T4 ax-evolve 中途崩溃的数据一致性问题——缺少中间状态 `processing` 会导致知识库重复条目。

### 建议结论

**Conditional Pass（有条件通过）**

- **严重阻碍（必须修正后才能进入实现）**：D-C01、D-C02、D-C04、D-C05
- **建议修正（可并行进入实现但须跟踪）**：D-C03、D-C06、D-C07、D-C08、D-C09、D-C10
- **低优先级（可在实现时顺手修正）**：D-C11、D-C12
