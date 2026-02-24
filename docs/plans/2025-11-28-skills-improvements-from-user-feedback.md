# 基于用户反馈的 Skills 改进

**日期：** 2025-11-28
**状态：** 草稿
**来源：** 两个在真实开发场景中使用 superpowers 的 Claude 实例

---

## 执行摘要

两个 Claude 实例提供了来自实际开发会话的详细反馈。他们的反馈揭示了当前 skills 中存在的**系统性缺口**，这些缺口导致可预防的 bug 在遵循 skills 的情况下仍然被发布。

**关键洞察：** 这些是问题报告，而非仅仅是解决方案提案。问题是真实存在的；解决方案需要仔细评估。

**主要主题：**
1. **验证缺口** - 我们验证操作是否成功，但不验证是否达到预期结果
2. **流程卫生** - 后台进程在子 agents 之间积累并相互干扰
3. **上下文优化** - 子 agents 获取了过多无关信息
4. **缺少自我反思** - 没有在交接前批判自己工作的提示
5. **Mock 安全性** - Mock 可能在不被检测到的情况下偏离接口
6. **Skill 激活** - Skills 存在但未被读取/使用

---

## 已识别的问题

### 问题 1：配置变更验证缺口

**发生了什么：**
- 子 agent 测试"OpenAI 集成"
- 设置了 `OPENAI_API_KEY` 环境变量
- 获得了 200 状态响应
- 报告"OpenAI 集成正常工作"
- **但是**响应包含 `"model": "claude-sonnet-4-20250514"` - 实际上使用的是 Anthropic

**根本原因：**
`verification-before-completion` 检查操作是否成功，但不检查结果是否反映了预期的配置变更。

**影响：** 高 - 对集成测试产生虚假信心，bug 被发布到生产环境

**示例失败模式：**
- 切换 LLM 提供商 → 验证状态 200 但不检查模型名称
- 启用功能标志 → 验证无错误但不检查功能是否激活
- 更改环境 → 验证部署成功但不检查环境变量

---

### 问题 2：后台进程积累

**发生了什么：**
- 会话期间调度了多个子 agents
- 每个都启动了后台服务器进程
- 进程积累（运行了 4+ 个服务器）
- 陈旧进程仍然绑定到端口
- 后续 E2E 测试命中了配置错误的陈旧服务器
- 测试结果混乱/不正确

**根本原因：**
子 agents 是无状态的 - 不知道之前子 agents 的进程。没有清理协议。

**影响：** 中高 - 测试命中错误的服务器，产生假通过/失败，调试混乱

---

### 问题 3：子 Agent 提示中的上下文膨胀

**发生了什么：**
- 标准方法：给子 agent 完整的计划文件来读取
- 实验：只给任务 + 模式 + 文件 + 验证命令
- 结果：更快、更专注，单次尝试完成更常见

**根本原因：**
子 agents 在无关的计划章节上浪费 token 和注意力。

**影响：** 中 - 执行较慢，失败尝试更多

**有效的方式：**
```
You are adding a single E2E test to packnplay's test suite.

**Your task:** Add `TestE2E_FeaturePrivilegedMode` to `pkg/runner/e2e_test.go`

**What to test:** A local devcontainer feature that requests `"privileged": true`
in its metadata should result in the container running with `--privileged` flag.

**Follow the exact pattern of TestE2E_FeatureOptionValidation** (at the end of the file)

**After writing, run:** `go test -v ./pkg/runner -run TestE2E_FeaturePrivilegedMode -timeout 5m`
```

---

### 问题 4：交接前缺少自我反思

**发生了什么：**
- 添加了自我反思提示："用新鲜的眼光看你的工作 - 什么可以更好？"
- 任务 5 的实现者发现失败的测试是由于实现 bug，而非测试 bug
- 追踪到第 99 行：`strings.Join(metadata.Entrypoint, " ")` 创建了无效的 Docker 语法
- 没有自我反思，只会报告"测试失败"而不找根本原因

**根本原因：**
实现者在报告完成之前不会自然地退后一步批判自己的工作。

**影响：** 中 - 实现者本可以发现的 bug 被交接给了审查者

---

### 问题 5：Mock-接口漂移

**发生了什么：**
```typescript
// 接口定义了 close()
interface PlatformAdapter {
  close(): Promise<void>;
}

// 代码（有 BUG）调用 cleanup()
await adapter.cleanup();

// Mock（匹配 BUG）定义了 cleanup()
vi.mock('web-adapter', () => ({
  WebAdapter: vi.fn().mockImplementation(() => ({
    cleanup: vi.fn().mockResolvedValue(undefined),  // 错误！
  })),
}));
```
- 测试通过
- 运行时崩溃："adapter.cleanup is not a function"

**根本原因：**
Mock 从有 bug 的代码调用中派生，而非从接口定义派生。TypeScript 无法捕获内联 mock 中错误的方法名。

**影响：** 高 - 测试给出虚假信心，运行时崩溃

**为什么 testing-anti-patterns 没有防止这个问题：**
该 skill 涵盖了测试 mock 行为和不理解就 mock，但没有涵盖"从接口而非实现派生 mock"这个具体模式。

---

### 问题 6：代码审查者文件访问

**发生了什么：**
- 调度了代码审查者子 agent
- 找不到测试文件："该文件似乎不存在于仓库中"
- 文件实际上存在
- 审查者不知道需要先明确读取它

**根本原因：**
审查者提示不包含明确的文件读取说明。

**影响：** 低中 - 审查失败或不完整

---

### 问题 7：修复工作流延迟

**发生了什么：**
- 实现者在自我反思期间发现了 bug
- 实现者知道如何修复
- 当前工作流：报告 → 我调度修复者 → 修复者修复 → 我验证
- 额外的往返增加了延迟而没有增加价值

**根本原因：**
当实现者已经诊断出问题时，实现者和修复者角色之间的刚性分离。

**影响：** 低 - 延迟，但没有正确性问题

---

### 问题 8：Skills 未被读取

**发生了什么：**
- `testing-anti-patterns` skill 存在
- 人类和子 agents 在编写测试前都没有读取它
- 本可以防止一些问题（虽然不是全部 - 见问题 5）

**根本原因：**
没有强制子 agents 读取相关 skills。没有提示包含 skill 读取。

**影响：** 中 - 如果不使用，skill 投资被浪费

---

## 提议的改进

### 1. verification-before-completion：添加配置变更验证

**添加新章节：**

```markdown
## 验证配置变更

在测试配置、提供商、功能标志或环境的变更时：

**不要只验证操作是否成功。验证输出是否反映了预期的变更。**

### 常见失败模式

操作成功是因为*某些*有效配置存在，但不是你打算测试的配置。

### 示例

| 变更 | 不充分的验证 | 必需的验证 |
|--------|-------------|----------|
| 切换 LLM 提供商 | 状态 200 | 响应包含预期的模型名称 |
| 启用功能标志 | 无错误 | 功能行为实际激活 |
| 更改环境 | 部署成功 | 日志/变量引用新环境 |
| 设置凭据 | 认证成功 | 认证的用户/上下文正确 |

### 门控函数

```
在声称配置变更有效之前：

1. 识别：此变更后什么应该不同？
2. 定位：该差异在哪里可以观察到？
   - 响应字段（模型名称、用户 ID）
   - 日志行（环境、提供商）
   - 行为（功能激活/未激活）
3. 运行：显示可观察差异的命令
4. 验证：输出包含预期差异
5. 只有这样：才能声称配置变更有效

红旗：
  - "请求成功"而不检查内容
  - 检查状态码但不检查响应体
  - 验证无错误但没有正面确认
```

**为什么有效：**
强制验证意图，而非仅验证操作成功。

---

### 2. subagent-driven-development：为 E2E 测试添加流程卫生

**添加新章节：**

```markdown
## E2E 测试的流程卫生

在调度启动服务（服务器、数据库、消息队列）的子 agents 时：

### 问题

子 agents 是无状态的 - 它们不知道之前子 agents 启动的进程。后台进程持续存在并可能干扰后续测试。

### 解决方案

**在调度 E2E 测试子 agent 之前，在提示中包含清理：**

```
在启动任何服务之前：
1. 终止现有进程：pkill -f "<service-pattern>" 2>/dev/null || true
2. 等待清理：sleep 1
3. 验证端口空闲：lsof -i :<port> && echo "ERROR: Port still in use" || echo "Port free"

测试完成后：
1. 终止你启动的进程
2. 验证清理：pgrep -f "<service-pattern>" || echo "Cleanup successful"
```
```

**权衡分析：**
- 为提示增加了样板代码
- 但防止了非常令人困惑的调试
- 对于 E2E 测试子 agents 值得

---

### 3. subagent-driven-development：添加精简上下文选项

**修改步骤 2：使用子 Agent 执行任务**

**之前：**
```
从 [plan-file] 仔细阅读该任务。
```

**之后：**
```
## 上下文方式

**完整计划（默认）：**
当任务复杂或有依赖关系时使用：
```
从 [plan-file] 仔细阅读任务 N。
```

**精简上下文（适用于独立任务）：**
当任务独立且基于模式时使用：
```
你正在实现：[1-2 句任务描述]

要修改的文件：[确切路径]
要遵循的模式：[对现有函数/测试的引用]
要实现的内容：[具体需求]
验证：[要运行的确切命令]

[不要包含完整计划文件]
```

**在以下情况使用精简上下文：**
- 任务遵循现有模式（添加类似测试、实现类似功能）
- 任务是自包含的（不需要其他任务的上下文）
- 模式引用足够（例如，"遵循 TestE2E_FeatureOptionValidation"）

**在以下情况使用完整计划：**
- 任务依赖于其他任务
- 需要理解整体架构
- 需要上下文的复杂逻辑
```

**为什么有效：**
减少 token 使用，提高专注度，在适当时更快完成。

---

### 4. subagent-driven-development：添加自我反思步骤

**修改步骤 2：使用子 Agent 执行任务**

**在提示模板中添加：**

```
完成后，在报告之前：

退后一步，用新鲜的眼光审视你的工作。

问自己：
- 这真的按规定解决了任务吗？
- 有没有我没考虑到的边缘情况？
- 我是否正确遵循了模式？
- 如果测试失败，根本原因是什么（实现 bug 还是测试 bug）？
- 这个实现有什么可以更好的地方？

如果你在反思中发现了问题，现在就修复它们。

然后报告：
- 你实现了什么
- 自我反思发现（如果有）
- 测试结果
- 更改的文件
```

**为什么有效：**
在交接前捕获实现者自己能发现的 bug。有记录的案例：通过自我反思发现了入口点 bug。

**权衡：**
每个任务增加约 30 秒，但在审查前捕获问题。

---

### 5. requesting-code-review：添加明确的文件读取

**修改代码审查者模板：**

**在开头添加：**

```markdown
## 要审查的文件

在分析之前，读取这些文件：

1. [列出 diff 中更改的具体文件]
2. [被更改引用但未修改的文件]

使用 Read 工具加载每个文件。

如果找不到文件：
- 从 diff 检查确切路径
- 尝试备用位置
- 报告："无法找到 [路径] - 请验证文件是否存在"

在读取实际代码之前不要进行审查。
```

**为什么有效：**
明确的说明防止"文件未找到"问题。

---

### 6. testing-anti-patterns：添加 Mock-接口漂移反模式

**添加新的反模式 6：**

```markdown
## 反模式 6：从实现派生的 Mock

**违规：**
```typescript
// 代码（有 BUG）调用 cleanup()
await adapter.cleanup();

// Mock（匹配 BUG）有 cleanup()
const mock = {
  cleanup: vi.fn().mockResolvedValue(undefined)
};

// 接口（正确）定义了 close()
interface PlatformAdapter {
  close(): Promise<void>;
}
```

**为什么这是错误的：**
- Mock 将 bug 编码到测试中
- TypeScript 无法捕获内联 mock 中错误的方法名
- 测试通过是因为代码和 mock 都是错误的
- 使用真实对象时运行时崩溃

**修复方法：**
```typescript
// ✅ 好的：从接口派生 mock

// 步骤 1：打开接口定义（PlatformAdapter）
// 步骤 2：列出那里定义的方法（close、initialize 等）
// 步骤 3：精确 mock 这些方法

const mock = {
  initialize: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),  // 来自接口！
};

// 现在测试失败，因为代码调用了 mock 中不存在的 cleanup()
// 该失败在运行时之前揭示了 bug
```

### 门控函数

```
在编写任何 mock 之前：

  1. 停止 - 还不要看被测代码
  2. 找到：依赖项的接口/类型定义
  3. 读取：接口文件
  4. 列出：接口中定义的方法
  5. Mock：只 mock 那些方法，使用完全相同的名称
  6. 不要：查看你的代码调用了什么

  如果你的测试失败是因为代码调用了 mock 中没有的东西：
    ✅ 好的 - 测试发现了你代码中的 bug
    修复代码以调用正确的接口方法
    而不是 mock

  红旗：
    - "我会 mock 代码调用的东西"
    - 从实现中复制方法名
    - 没有读取接口就编写 mock
    - "测试失败了，所以我会在 mock 中添加这个方法"
```

**检测：**

当你看到运行时错误"X is not a function"而测试通过时：
1. 检查 X 是否被 mock
2. 比较 mock 方法和接口方法
3. 查找方法名不匹配
```

**为什么有效：**
直接解决来自反馈的失败模式。

---

### 7. subagent-driven-development：要求测试子 Agents 读取 Skills

**在任务涉及测试时添加到提示模板：**

```markdown
在编写任何测试之前：

1. 读取 testing-anti-patterns skill：
   使用 Skill 工具：superpowers:testing-anti-patterns

2. 在以下情况应用该 skill 中的门控函数：
   - 编写 mock
   - 向生产类添加方法
   - Mock 依赖项

这不是可选的。违反反模式的测试将在审查中被拒绝。
```

**为什么有效：**
确保 skills 实际被使用，而不仅仅是存在。

**权衡：**
为每个任务增加时间，但防止整类 bug。

---

### 8. subagent-driven-development：允许实现者修复自己发现的问题

**修改步骤 2：**

**当前：**
```
子 agent 报告工作摘要。
```

**提议：**
```
子 agent 执行自我反思，然后：

如果自我反思发现了可修复的问题：
  1. 修复问题
  2. 重新运行验证
  3. 报告："初始实现 + 自我反思修复"

否则：
  报告："实现完成"

在报告中包含：
- 自我反思发现
- 是否应用了修复
- 最终验证结果
```

**为什么有效：**
当实现者已经知道修复方法时减少延迟。有记录的案例：本可以为入口点 bug 节省一次往返。

**权衡：**
提示稍微复杂，但端到端更快。

---

## 实现计划

### 阶段 1：高影响、低风险（优先执行）

1. **verification-before-completion：配置变更验证**
   - 清晰的添加，不改变现有内容
   - 解决高影响问题（对测试的虚假信心）
   - 文件：`skills/verification-before-completion/SKILL.md`

2. **testing-anti-patterns：Mock-接口漂移**
   - 添加新反模式，不修改现有内容
   - 解决高影响问题（运行时崩溃）
   - 文件：`skills/testing-anti-patterns/SKILL.md`

3. **requesting-code-review：明确文件读取**
   - 简单的模板添加
   - 修复具体问题（审查者找不到文件）
   - 文件：`skills/requesting-code-review/SKILL.md`

### 阶段 2：适度变更（仔细测试）

4. **subagent-driven-development：流程卫生**
   - 添加新章节，不改变工作流
   - 解决中高影响问题（测试可靠性）
   - 文件：`skills/subagent-driven-development/SKILL.md`

5. **subagent-driven-development：自我反思**
   - 更改提示模板（风险较高）
   - 但有记录证明可以捕获 bug
   - 文件：`skills/subagent-driven-development/SKILL.md`

6. **subagent-driven-development：Skills 读取要求**
   - 增加提示开销
   - 但确保 skills 实际被使用
   - 文件：`skills/subagent-driven-development/SKILL.md`

### 阶段 3：优化（先验证）

7. **subagent-driven-development：精简上下文选项**
   - 增加复杂性（两种方式）
   - 需要验证不会造成混乱
   - 文件：`skills/subagent-driven-development/SKILL.md`

8. **subagent-driven-development：允许实现者修复**
   - 更改工作流（风险较高）
   - 优化，而非 bug 修复
   - 文件：`skills/subagent-driven-development/SKILL.md`

---

## 开放性问题

1. **精简上下文方式：**
   - 我们应该将其作为基于模式任务的默认方式吗？
   - 我们如何决定使用哪种方式？
   - 太精简而遗漏重要上下文的风险？

2. **自我反思：**
   - 这会显著减慢简单任务吗？
   - 是否应该只适用于复杂任务？
   - 如何防止"反思疲劳"使其变成例行公事？

3. **流程卫生：**
   - 这应该在 subagent-driven-development 中还是单独的 skill 中？
   - 它是否适用于 E2E 测试之外的其他工作流？
   - 如何处理进程应该持续存在的情况（开发服务器）？

4. **Skills 读取强制：**
   - 我们是否应该要求所有子 agents 读取相关 skills？
   - 如何防止提示变得太长？
   - 过度文档化和失去焦点的风险？

---

## 成功指标

我们如何知道这些改进有效？

1. **配置验证：**
   - 零次"测试通过但使用了错误配置"的情况
   - Jesse 不再说"那实际上没有测试你认为的东西"

2. **流程卫生：**
   - 零次"测试命中了错误的服务器"的情况
   - E2E 测试运行期间没有端口冲突错误

3. **Mock-接口漂移：**
   - 零次"测试通过但运行时因缺少方法崩溃"的情况
   - mock 和接口之间没有方法名不匹配

4. **自我反思：**
   - 可测量：实现者报告是否包含自我反思发现？
   - 定性：更少的 bug 进入代码审查？

5. **Skills 读取：**
   - 子 agent 报告引用 skill 门控函数
   - 代码审查中更少的反模式违规

---

## 风险和缓解措施

### 风险：提示膨胀
**问题：** 添加所有这些要求使提示变得难以承受
**缓解措施：**
- 分阶段实现（不要一次添加所有内容）
- 使某些添加有条件（E2E 卫生仅适用于 E2E 测试）
- 考虑不同任务类型的模板

### 风险：分析瘫痪
**问题：** 过多的反思/验证减慢执行速度
**缓解措施：**
- 保持门控函数快速（秒，而非分钟）
- 最初将精简上下文设为可选
- 监控任务完成时间

### 风险：虚假安全感
**问题：** 遵循清单不能保证正确性
**缓解措施：**
- 强调门控函数是最低要求，而非最高要求
- 在 skills 中保留"使用判断"的语言
- 记录 skills 捕获常见失败，而非所有失败

### 风险：Skill 分歧
**问题：** 不同 skills 给出相互冲突的建议
**缓解措施：**
- 审查所有 skills 的变更以保持一致性
- 记录 skills 如何交互（集成章节）
- 在部署前用真实场景测试

---

## 建议

**立即推进阶段 1：**
- verification-before-completion：配置变更验证
- testing-anti-patterns：Mock-接口漂移
- requesting-code-review：明确文件读取

**在最终确定前与 Jesse 测试阶段 2：**
- 获取关于自我反思影响的反馈
- 验证流程卫生方式
- 确认 skills 读取要求值得开销

**等待验证后再推进阶段 3：**
- 精简上下文需要真实世界测试
- 实现者修复工作流变更需要仔细评估

这些变更解决了用户记录的真实问题，同时最小化了使 skills 变得更差的风险。
