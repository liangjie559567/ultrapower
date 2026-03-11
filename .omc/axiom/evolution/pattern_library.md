# Pattern Library

## Patterns

### PAT-001: 发布流程标准模式

**出现次数**: 2
**置信度**: 95%
**模式描述**:
```
1. 版本同步（package.json + marketplace.json + VERSION 常量等）
2. 运行完整测试套件（ESLint + 单元测试）
3. Git commit + tag（由 CI 自动创建）
4. npm publish（changesets 自动执行）
5. GitHub Release（changesets 自动创建）
6. CI 验证（所有工作流通过）
```
**适用场景**: npm 包发布
**反模式**: 跳过测试、版本不同步、手动推送 tag
**最新验证**: v7.0.1 发布成功（2026-03-10）

### PAT-002: Skill 集成检查清单

**出现次数**: 1
**置信度**: 90%
**模式描述**:
```
1. 创建 skills/<name>/SKILL.md（含 frontmatter）
2. 更新 skills.test.ts（3处同步）
3. 运行测试验证
4. 更新 CHANGELOG.md
```
**适用场景**: 新增或修改 skill
**反模式**: 仅创建文件不更新测试

### PAT-003: 临时诊断脚本模式

**出现次数**: 1
**置信度**: 80%
**模式描述**: 创建临时 .mjs 脚本快速定位问题，用完即删
**适用场景**: 测试失败根因不明确时
**示例**: check-skills.mjs 定位空描述 skill

### PAT-004: TODO 注释分类模式

**出现次数**: 1
**置信度**: 85%
**模式描述**:
```
TODO 分为两类：
1. 实际待办项：需要立即实现的功能缺失
2. 预留扩展点：为未来可能的需求保留接口，当前无需实现
```
**适用场景**: 代码审查时区分 TODO 优先级
**反模式**: 将所有 TODO 视为同等紧急

### PAT-005: 模块化检测器模式

**出现次数**: 1
**置信度**: 90%
**模式描述**:
```
每个检测器独立模块，通过统一路由器集成：

* tech-stack-detector: 技术栈检测

* structure-analyzer: 项目结构分析

* task-assigner: 任务分配

* workflow-router: 统一入口点
```
**适用场景**: 构建多层检测/分析系统
**反模式**: 将所有检测逻辑放在单一文件中

### PAT-006: 边界条件验证模式

**出现次数**: 1
**置信度**: 85%
**模式描述**:
```
检测逻辑应避免使用不可靠的判断依据：

* 反例: pkg.private 不能判断 monorepo（很多单包项目也设置 private: true）

* 正例: 仅检查明确的标识符（pkg.workspaces）
```
**适用场景**: 编写条件检测逻辑时
**反模式**: 使用模糊或不可靠的判断条件

### PAT-007: Git 协作推送流程

**出现次数**: 3
**置信度**: 90%
**模式描述**:
```
标准推送流程（应对远程冲突）：
1. git stash（保存本地未提交变更）
2. git pull --rebase origin <branch>（获取远程变更并变基）
3. git push origin <branch>（推送本地提交）
```
**适用场景**: 推送被拒绝时（"remote contains work that you do not have locally"）
**反模式**: 使用 --force 强制推送（会覆盖远程变更）
**验证**: 本次会话 3 次成功应用

### PAT-008: 发布流程故障恢复

**出现次数**: 1
**置信度**: 85%
**模式描述**:
```
自动发布失败时的恢复流程：
1. 检查实际发布状态（npm view <package> version, gh release view <tag>）
2. 识别缺失步骤（npm 发布？GitHub Release？）
3. 手动补充缺失步骤
4. 验证最终状态
```
**适用场景**: CI/CD 发布流程部分失败
**反模式**: 盲目重试整个流程（可能导致重复发布错误）
**关键**: 始终先验证当前状态，避免重复操作

### PAT-009: 代码审查驱动修复

**出现次数**: 1
**置信度**: 85%
**模式描述**:
```
1. 完成功能实现
2. 委托 code-reviewer agent 审查
3. 按优先级修复问题（CRITICAL → HIGH → MEDIUM）
4. 重新验证测试
5. 提交修复
```
**适用场景**: 重要功能实现后的质量保障
**反模式**: 跳过代码审查直接合并
**关键**: HIGH 优先级必须修复才能合并

### PAT-010: ESLint 豁免策略

**出现次数**: 1
**置信度**: 90%
**模式描述**:
对于合理的同步操作（CLI、installer、双 API 模块），使用 ESLint 豁免而非强制修复。
**豁免条件**:

* CLI 工具（用户交互，同步可接受）

* Installer 脚本（简单性优先）

* 双 API 模块（提供异步替代）

* 测试文件（模拟简单性）
**适用场景**: 规则有合理例外时
**反模式**: 全局禁用规则或强制修复所有违规

### PAT-011: 测试隔离三层修复策略

**出现次数**: 1
**置信度**: 95%
**模式描述**:
```
测试失败修复的系统性方法（89→0 失败）：
1. 架构层：进程隔离（pool: 'forks'）解决原生模块崩溃
2. 全局层：统一清理机制（tests/setup.ts）
3. 局部层：单个测试文件的 mock 清理
```
**适用场景**: 大规模测试失败（>20个）
**反模式**: 逐个文件修复而不找根因
**关键**: 先解决架构问题，再处理局部问题

### PAT-012: Team 协作修复模式

**出现次数**: 3
**置信度**: 90%
**模式描述**:
```
使用 Claude Code Team 并行修复：
1. 创建 team（TeamCreate）
2. 分解任务（TaskCreate）
3. 预分配所有者（TaskUpdate）
4. 生成 workers（Agent with team_name）
5. 监控进度（TaskList + SendMessage）
6. 优雅关闭（shutdown_request）
```
**适用场景**: 10+ 个独立修复任务
**反模式**: 串行修复或手动协调
**性能**: 3轮修复，每轮 3-5 workers


### PAT-013: Git Tag 冲突处理模式

**出现次数**: 1
**置信度**: 90%
**模式描述**:
```
当 CI 推送 tag 失败（tag already exists）：
1. 删除远程 tag: git push origin :refs/tags/<tag>
2. 重新触发 CI 工作流
3. 让 CI 自动创建和推送 tag
```
**适用场景**: changesets 发布流程 tag 冲突
**反模式**: 手动推送 tag（会与 CI 冲突）
**关键**: 始终让 CI 管理 tag，避免手动干预

### PAT-014: 版本文件同步检查模式

**出现次数**: 1
**置信度**: 95%
**模式描述**:
```
发布前检查清单：
- package.json
- marketplace.json
- src/installer/index.ts (VERSION 常量)
- docs/CLAUDE.md
- CLAUDE.md
- README.md
```
**适用场景**: 每次版本发布前
**反模式**: 仅更新 package.json
**验证**: marketplace.json 不同步导致 v7.0.1 首次发布失败

### PAT-015: MCP Tool Schema 转换模式

**出现次数**: 2
**置信度**: 95%
**模式描述**:
```typescript
// Claude Agent SDK tool() 要求 Zod schemas
tool("tool_name", "description", {
  param1: z.string().describe("..."),
  param2: z.boolean().optional().describe("..."),
  param3: z.array(z.string()).optional().describe("..."),
  param4: z.enum(['val1', 'val2']).optional().describe("..."),
}, async (args) => { ... })
```
**转换规则**:
- `{ type: "string" }` → `z.string()`
- `{ type: "boolean" }` → `z.boolean().optional()`
- `{ type: "array", items: { type: "string" } }` → `z.array(z.string())`
- 枚举约束 → `z.enum(['value1', 'value2'])`
**适用场景**: 所有 MCP server 工具定义
**反模式**: 使用 JSON Schema 格式（会导致类型错误）
**验证**: 修复 codex-server.ts 和 gemini-server.ts 共 31 个类型错误

### PAT-016: 发布前工作目录清理模式

**出现次数**: 1
**置信度**: 90%
**模式描述**:
```bash
# npm version 前清理工作目录
git add dist/ bridge/ .tsbuildinfo  # 提交编译产物
git restore .omc/ src/ test-*       # 恢复临时文件
npm version patch                   # 版本升级
```
**适用场景**: npm version 遇到 "Git working directory not clean"
**反模式**: git add -A（会提交不必要的临时文件）
**关键**: 区分编译产物（需提交）和临时文件（需清理）

### PAT-017: 发布流程 Git 冲突恢复模式

**出现次数**: 1
**置信度**: 90%
**模式描述**:
```bash
# 推送被拒绝时的标准流程
git pull --rebase origin main  # 拉取并变基
git push origin main           # 推送代码
git push origin --tags         # 推送标签（如需要）
```
**适用场景**: 发布时远程有新提交
**反模式**: 使用 --force（会覆盖远程变更）
**验证**: v7.0.2 发布成功应用

### PAT-018: Windows 配置文件路径格式模式

**出现次数**: 1
**置信度**: 95%
**模式描述**:
```json
// 错误：Windows 反斜杠格式
"command": "node C:\\Users\\ljyih\\.claude\\hud\\omc-hud.mjs"

// 正确：Unix 正斜杠格式
"command": "node C:/Users/ljyih/.claude/hud/omc-hud.mjs"
```
**适用场景**: Claude Code settings.json 中所有命令路径（statusLine、hooks）
**反模式**: 使用 Windows 反斜杠（会导致命令执行失败）
**验证**: HUD 不显示问题修复后立即生效
**关键**: Windows 平台也必须使用正斜杠

