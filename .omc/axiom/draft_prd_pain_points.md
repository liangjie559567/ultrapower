# Draft PRD：ultrapower 项目全面痛点修复计划

**生成时间：** 2026-03-01
**需求来源：** `/ax-draft` — 用户指令"分析当前项目的痛点和Bug，全面完整所有功能模块"
**分析范围：** src/features, src/hooks, src/tools, src/mcp, src/lib, src/installer, scripts, skills, agents, commands
**分析方法：** 4 个并行 Explore Agent 全量扫描

---

## 一、背景与目标

ultrapower 经过多轮快速迭代（v5.4.1~v5.4.8），积累了跨模块的技术债、平台兼容性缺陷、安全隐患和文档漂移问题。本 PRD 定义优先级分级的修复方案，覆盖全部 10 个功能模块。

**目标：**
- 消除 HIGH 严重度安全与稳定性 Bug（共 23 项）
- 修复 Windows 平台兼容性问题（用户主运行环境）
- 补全测试覆盖空白（atomic-write, version, hooks）
- 修复命名空间迁移遗留（superpowers: → ultrapower:）
- 纠正文档与实现漂移（AGENTS.md, skills 引用）

---

## 二、问题全景（按严重度汇总）

| 模块 | HIGH | MEDIUM | LOW | 合计 |
|------|------|--------|-----|------|
| src/features | 7 | 7 | 2 | 16 |
| src/hooks | 5 | 8 | 5 | 18 |
| src/tools | 4 | 10 | 6 | 20 |
| src/mcp | 7 | 10 | 9 | 26 |
| src/lib | 1 | 5 | 3 | 9 |
| src/installer | 1 | 4 | 2 | 7 |
| scripts | 2 | 3 | 4 | 9 |
| skills/commands | 4 | 6 | 3 | 13 |
| **总计** | **31** | **53** | **34** | **118** |

---

## 三、P0 安全与稳定性问题（必须修复）

### P0-1：state-manager 路径遍历防护缺失（违反 CLAUDE.md P0 规范）
- **位置：** `src/features/state-manager/index.ts:82`
- **问题：** `getStatePath(name: string)` 直接将 name 拼接路径，未调用 `assertValidMode()`，违反 runtime-protection.md P0 安全规则
- **修复：** 在函数入口添加 `assertValidMode(name)` 调用

### P0-2：LSP servers.ts Shell 注入风险
- **位置：** `src/tools/lsp/servers.ts:155-163`
- **问题：** `execSync(\`${checkCommand} ${command}\`)` 拼接命令字符串，存在 shell 注入
- **修复：** 改用 `execFileSync('which', [command])` / `execFileSync('where', [command])`

### P0-3：release-steps.mjs 违反分支策略
- **位置：** `scripts/release-steps.mjs:84`
- **问题：** `git push origin main` 直接推送到 main，违反 CLAUDE.md"默认分支为 dev，禁止直接推送 main"规范
- **修复：** 删除此行或改为走 PR 流程

### P0-4：gemini-core.ts `--yolo` 标志硬编码
- **位置：** `src/mcp/gemini-core.ts`
- **问题：** `--yolo` 禁用所有安全确认，硬编码无法关闭，是生产环境安全风险
- **修复：** 通过 `OMC_GEMINI_YOLO=false` 环境变量使其可配置

### P0-5：prompt-injection.ts 角色列表静默失败
- **位置：** `src/mcp/prompt-injection.ts`
- **问题：** 文件系统扫描失败时返回空数组，拒绝所有合法 agent role，无任何错误日志
- **修复：** 失败时输出 `console.warn`，并使用硬编码默认角色列表作为 fallback

### P0-6：daemon.ts Windows 路径 ESM import 失败
- **位置：** `src/features/rate-limit-wait/daemon.ts:424-430`
- **问题：** Windows 路径 `C:\Users\...` 插入 `import('...')` 字符串，Node.js 无效
- **修复：** 使用 `pathToFileURL(modulePath).href` 构建合法 URL

### P0-7：daemon.ts 动态代码注入风险
- **位置：** `src/features/rate-limit-wait/daemon.ts:425-430`
- **问题：** `config` 通过 `JSON.stringify` 注入到 JS 代码字符串，特殊字符可破坏语法
- **修复：** 通过 stdin/环境变量传递 config，不插入代码字符串

---

## 四、P1 Windows 平台兼容性问题

### P1-1：auto-update.ts Windows 路径/shell 语法混用
- **位置：** `src/features/auto-update.ts:611-614`
- **问题：** `which omc 2>/dev/null || where omc 2>NUL` 在 PowerShell 不可靠；路径含 `\r` 未清理
- **修复：** 按 `process.platform` 分支调用 `which`/`where`，统一 `.trim()`

### P1-2：subagent-tracker Windows 路径替换失效
- **位置：** `src/hooks/subagent-tracker/index.ts:1128`
- **问题：** `filePath.replace(directory, "")` 在路径分隔符不一致时失效
- **修复：** 改用 `path.relative(directory, filePath)`

### P1-3：pre-tool.ts 路径安全检查无规范化
- **位置：** `src/hooks/guards/pre-tool.ts:52-58`
- **问题：** `filePath.includes('~/.claude')` 在 Windows 无效（`~` 不展开）
- **修复：** 使用 `path.resolve()` 规范化后比较

### P1-4：ax-export skill 使用 `/tmp` 路径
- **位置：** `skills/ax-export/SKILL.md`
- **问题：** Windows 无 `/tmp` 目录，`zip` 命令不内置，导出功能完全不可用
- **修复：** 改用 `os.tmpdir()` 路径，Windows 提供 PowerShell Compress-Archive 替代

---

## 五、P1 内存泄漏与资源问题

### P1-5：Python REPL executionCounters Map 内存泄漏
- **位置：** `src/tools/python-repl/tool.ts:102`
- **问题：** session 销毁时 Map 条目从不删除，长时间运行 OOM
- **修复：** 在 `handleReset`/`killBridgeWithEscalation` 成功后调用 `executionCounters.delete(sessionId)`

### P1-6：LSP client disconnect 不清理 setTimeout
- **位置：** `src/tools/lsp/client.ts:191-207`
- **问题：** `pendingRequests.clear()` 不清理 timer，进程无法退出
- **修复：** 遍历 Map 调用 `clearTimeout(item.timeout)` 后再 `clear()`

### P1-7：LSP client 缓冲区无上限
- **位置：** `src/tools/lsp/client.ts:121`
- **问题：** `this.buffer` 字符串无限增长，可导致 OOM
- **修复：** 添加 64MB 上限，超出时断开连接

---

## 六、P1 功能缺失与占位实现

### P1-8：session-recovery recoverToolResultMissing 占位实现报成功
- **位置：** `src/features/session-recovery/session-recovery.ts:183-189`
- **问题：** 函数体是注释占位，仅返回 `true`，调用方误认为恢复成功
- **修复：** 返回 `false` 或抛出"未实现"错误；或完成真实实现

### P1-9：delegation-enforcer 集成测试整体跳过（功能未集成）
- **位置：** `src//__tests__/delegation-enforcer-integration.test.ts:13`
- **问题：** `describe.skip` 注明 enforcer 模块存在但 `processHook()` 从未调用它，是功能死区
- **修复：** 在 bridge.ts 的 processHook 中实际集成 delegation-enforcer，解除 skip

### P1-10：MCP job-management handleWaitForJob 阻塞事件循环
- **位置：** `src/mcp/job-management.ts`
- **问题：** 轮询等待阻塞整个 MCP 服务器，无法并发处理其他工具调用
- **修复：** 添加单次 wait_for_job 最长等待时间上限，强制客户端轮询

### P1-11：MCP handleKillJob 状态写入与进程终止顺序颠倒
- **位置：** `src/mcp/job-management.ts`
- **问题：** 先写状态文件再 kill 进程，kill 失败时状态已损坏
- **修复：** 先 `process.kill()`，成功后再更新状态文件

---

## 七、P2 命名空间迁移遗留问题

### P2-1：3 个 commands 使用 superpowers: 旧命名空间
- **位置：** `commands/brainstorm.md`, `commands/execute-plan.md`, `commands/write-plan.md`
- **问题：** 调用 `superpowers:brainstorming` 等，当前系统已迁移到 `ultrapower:`
- **修复：** 全部替换为 `ultrapower:` 命名空间

### P2-2：6 个 skills 内残留 superpowers: 引用
- **位置：** executing-plans, subagent-driven-development, systematic-debugging, writing-plans, writing-skills, requesting-code-review
- **问题：** Skill 内部指令含旧命名空间，AI 执行时找不到对应 skill
- **修复：** 批量替换为 `ultrapower:` 命名空间

### P2-3：ax-export 引用不存在的 .agent/ 目录
- **位置：** `skills/ax-export/SKILL.md`
- **问题：** 导出清单列出 `.agent/workflows/` 等路径，项目中根本不存在
- **修复：** 更新为实际路径（`.omc/axiom/`, `.omc/plans/` 等）

### P2-4：ax-status 引用不存在的状态文件
- **位置：** `skills/ax-status/SKILL.md`
- **问题：** Step 1 要读取 `.omc/state/axiom-context.json`，该文件不存在
- **修复：** 改为读取 `.omc/axiom/active_context.md`（实际存在的文件）

---

## 八、P2 文档与实现漂移

### P2-5：AGENTS.md 版本号滞后（5.2.2 vs 实际 5.4.8）
- **位置：** `/AGENTS.md:4`
- **修复：** 同步版本号，并加入 release skill 版本文件清单

### P2-6：src/agents/definitions.ts 声明 "48 Agents" 但实际超过
- **位置：** `src/agents/definitions.ts:592`
- **修复：** 更新为实际 agent 数量

### P2-7：bump-version.mjs 版本正则无结尾锚点
- **位置：** `scripts/bump-version.mjs:37`
- **问题：** `/^\d+\.\d+\.\d+/` 无 `$`，`1.2.3-beta` 等非法格式通过
- **修复：** 改为 `/^\d+\.\d+\.\d+$/`

---

## 九、P2 测试覆盖空白

### P2-8：atomic-write.ts 无测试文件
- **影响：** 核心原子写入功能无单元测试，双函数重复逻辑无覆盖
- **修复：** 新增 `src/lib/__tests__/atomic-write.test.ts`

### P2-9：version.ts 无测试文件
- **影响：** `getRuntimePackageVersion` 路径搜索逻辑无测试（从 i=1 跳过当前目录的 bug 无法被发现）
- **修复：** 新增 `src/lib/__tests__/version.test.ts`

### P2-10：installer/hooks.ts 无测试文件
- **影响：** `loadTemplate` 静默失败、`getHookScripts` 完整性均无覆盖
- **修复：** 新增 `src/installer/__tests__/hooks.test.ts`

---

## 十、P3 代码质量改进（低优先级）

- installer/index.ts：4 处 `writeFileSync` 改为 `atomicWriteJson`（非原子写入）
- safeReadJson：区分"文件不存在"和"文件损坏"的错误处理
- rules-injector：添加最大向上遍历深度限制（防无限循环）
- session-recovery.ts：修复 "preceeding" 拼写错误（应为 "preceding"）
- codex-core.ts/gemini-core.ts：`parseInt("0") || default` 改为 `isNaN(n) ? default : n`
- prompt-persistence.ts：generatePromptId 从 4 字节扩展到 8 字节
- notepads-tools.ts：catch 块统一返回 `isError: true`
- skills-tools.ts：ALLOWED_BOUNDARIES 改为动态计算（不缓存）

---

## 十一、实现优先级与分批计划

### Batch 1（P0 安全 + 稳定性）- 估计 2 个任务
- P0-1~P0-7（安全问题）+ P1-6/P1-7（资源泄漏）
- CI Gate：tsc --noEmit + npm test + 人工安全验证

### Batch 2（P1 Windows + 功能）- 估计 3 个任务
- P1-1~P1-5，P1-8~P1-11
- CI Gate：在 Windows 环境真实测试 hooks/auto-update

### Batch 3（P2 命名空间 + 文档 + 测试）- 估计 2 个任务
- P2-1~P2-10
- CI Gate：tsc + npm test（含新增测试通过）

### Batch 4（P3 代码质量）- 估计 1 个任务
- 全部 P3 项
- CI Gate：tsc + npm test + code-reviewer 审查

---

## 十二、验收标准

1. **零回归**：npm test 中 4698+ 测试全部通过（不新增失败）
2. **安全门禁**：P0-1 路径遍历防护测试通过（validateMode 覆盖）
3. **Windows 测试**：P1-1/P1-2/P1-3 在 Windows 11 真实环境验证
4. **测试新增**：atomic-write、version、hooks 三个测试文件各 ≥ 10 cases
5. **命名空间**：grep 全项目无 `superpowers:` 引用（除注释外）
6. **文档同步**：AGENTS.md 版本号 = package.json 版本号
