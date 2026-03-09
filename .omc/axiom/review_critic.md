# Critic 评审报告：Draft PRD - ultrapower 用户使用指南

**评审人**: Critic Agent
**评审时间**: 2026-03-05
**文档版本**: v1.0 Draft
**评审结论**: **REVISE** ⚠️

---

## 执行摘要

Draft PRD 方向正确，但存在 **4 个关键风险** 需要在实施前解决：

1. **文档维护机制缺失** — 代码与文档同步无保障
2. **示例代码验证策略不足** — 可能导致过时示例误导用户
3. **版本兼容性考虑不充分** — 缺少向后兼容性策略
4. **用户困惑点未充分识别** — 边界情况和错误处理不清晰

---

## 1. 文档维护机制风险 🔴 P0

### 1.1 问题识别

**当前状态**:

* PRD 提到 "文档与代码不同步（需要建立更新机制）"（§6.1）

* 但未提供具体的同步机制设计

**风险场景**:
```
场景 1: Agent 定义变更

* src/agents/definitions.ts 新增 agent

* docs/USER_GUIDE.md 未同步更新

* 用户查阅文档时发现功能缺失

场景 2: Skill 触发词变更

* skills/*/SKILL.md 修改触发关键词

* README.md 快速开始示例仍使用旧关键词

* 新用户首次执行失败（违反 5 分钟目标）
```

### 1.2 改进建议

**方案 A: CI 自动化验证**（推荐）
```yaml

# .github/workflows/doc-sync-check.yml

name: Documentation Sync Check
on: [pull_request]
jobs:
  check-agent-count:
    - name: Verify agent count in USER_GUIDE.md
      run: |
        AGENT_COUNT=$(grep -c "^- \`" src/agents/definitions.ts)
        DOC_COUNT=$(grep -c "^- \`" docs/USER_GUIDE.md)
        if [ "$AGENT_COUNT" != "$DOC_COUNT" ]; then
          echo "Agent count mismatch: code=$AGENT_COUNT, docs=$DOC_COUNT"
          exit 1
        fi
```

**方案 B: 文档生成脚本**
```typescript
// scripts/generate-user-guide.ts
// 从 src/agents/definitions.ts 自动生成 agent 列表
// 从 skills/*/SKILL.md 提取触发词和描述
// 输出到 docs/USER_GUIDE.md（部分章节）
```

**方案 C: Pre-commit Hook**
```bash

# .omc/hooks/pre-commit-doc-check.sh

# 检测 src/agents/ 或 skills/ 变更时

# 提示开发者同步更新文档

```

**推荐**: 方案 A + 方案 B 组合（自动生成 + CI 验证）

---

## 2. 示例代码验证策略不足 🔴 P0

### 2.1 问题识别

**当前状态**:

* PRD 提到 "示例代码可能过时（需要 CI 验证）"（§6.1）

* 快速开始示例（§3.2）包含 4 个命令，但未说明如何验证

**风险场景**:
```
场景 1: 安装命令过时
README.md:
  npm install -g @liangjie559567/ultrapower

实际情况:
  - 包名已改为 @ultrapower/cli
  - 新用户执行失败，首次体验受损

场景 2: Skill 触发词失效
README.md:
  autopilot "创建一个 hello world 函数"

实际情况:
  - autopilot 已改为 /ultrapower:autopilot
  - 用户收到 "unknown command" 错误
```

### 2.2 改进建议

**方案 A: E2E 测试覆盖示例**
```typescript
// tests/e2e/quick-start.test.ts
describe('Quick Start Guide', () => {
  it('should complete installation in 5 minutes', async () => {
    // 1. 模拟 npm install
    // 2. 模拟 plugin install
    // 3. 模拟 omc-setup
    // 4. 执行 autopilot 示例
    // 5. 验证输出包含预期结果
  });
});
```

**方案 B: 文档内嵌测试标记**
```markdown
<!-- test:quick-start:step-1 -->
```bash
npm install -g @liangjie559567/ultrapower
```
<!-- /test -->

<!-- 测试脚本自动提取并执行 -->
```

**方案 C: 定期手动验证**

* 每次发布前人工执行快速开始指南

* 记录执行时间和遇到的问题

**推荐**: 方案 A（E2E 测试）+ 方案 B（文档标记）

---

## 3. 版本兼容性考虑不充分 🟡 P1

### 3.1 问题识别

**当前状态**:

* PRD 提到 "版本更新指南"（§3.1.2）

* 但未说明如何处理破坏性变更（breaking changes）

**风险场景**:
```
场景 1: Agent 重命名
v5.5.18: researcher agent
v5.6.0:  document-specialist agent (researcher 废弃)

用户影响:

* 旧文档/教程仍使用 researcher

* 新用户不知道该用哪个

* 旧用户升级后脚本失效

场景 2: Skill 参数变更
v5.5.18: /ultrapower:team "task description"
v5.6.0:  /ultrapower:team --mode=parallel "task description"

用户影响:

* 旧命令在新版本中报错

* 文档未说明迁移路径
```

### 3.2 改进建议

**补充章节: 版本兼容性策略**
```markdown

## 版本兼容性

### 语义化版本控制

* MAJOR: 破坏性变更（需要用户修改代码）

* MINOR: 新功能（向后兼容）

* PATCH: Bug 修复（向后兼容）

### 废弃策略

1. 废弃通知: 在 N 版本中标记为 deprecated
2. 兼容期: N+1 和 N+2 版本保持兼容
3. 移除: N+3 版本完全移除

### 迁移指南

* 每个 MAJOR 版本提供迁移文档

* 包含自动化迁移脚本（如适用）

* 列出所有破坏性变更和替代方案
```

**示例: Agent 废弃处理**
```typescript
// src/agents/definitions.ts
export const DEPRECATED_AGENTS = {
  researcher: {
    replacement: 'document-specialist',
    deprecatedIn: '5.5.18',
    removedIn: '6.0.0',
    message: 'Use document-specialist instead'
  }
};
```

---

## 4. 用户困惑点未充分识别 🟡 P1

### 4.1 问题识别

**当前状态**:

* PRD 假设用户 "已熟悉 Claude Code"（§1.2）

* 但未考虑边界情况和常见错误

**潜在困惑点**:

#### 4.1.1 Agent vs Skill 概念混淆

```
用户问题:

* "什么时候用 agent，什么时候用 skill？"

* "executor 是 agent 还是 skill？"

* "为什么有 /ultrapower:analyze 和 debugger agent？"

文档缺失:

* 概念关系图

* 决策树（何时用哪个）
```

#### 4.1.2 模型路由不清晰

```
用户问题:

* "为什么同一个任务有时用 haiku，有时用 opus？"

* "我能手动指定模型吗？"

* "模型选择会影响成本吗？"

文档缺失:

* 模型选择指南

* 成本估算工具
```

#### 4.1.3 错误处理不明确

```
用户问题:

* "autopilot 执行失败了，如何调试？"

* "team 模式卡在 team-verify 阶段怎么办？"

* "如何查看 agent 执行日志？"

文档缺失:

* 故障排查流程图

* 常见错误代码和解决方案

* 日志查看指南
```

### 4.2 改进建议

**补充章节 1: 概念澄清**
```markdown

## 核心概念

### Agent vs Skill

* **Agent**: 执行单元（如 executor、debugger）

* **Skill**: 工作流编排（如 autopilot、team）

* **关系**: Skill 内部调用多个 Agents

### 决策树

```
需求 → 单步任务？
       ├─ 是 → 使用 Agent（executor/debugger）
       └─ 否 → 使用 Skill（autopilot/team）
```
```

**补充章节 2: 故障排查**
```markdown

## 故障排查

### 常见错误

#### E001: Agent 执行超时

**症状**: "Agent execution timeout after 5 minutes"
**原因**: 任务复杂度超出预期
**解决**: 使用 ralph 模式（持续执行）或拆分任务

#### E002: Skill 触发失败

**症状**: "Unknown skill: autopilot"
**原因**: 触发词不匹配或 skill 未安装
**解决**: 检查 skills/ 目录，运行 /ultrapower:omc-setup

### 日志查看

```bash

# 查看最近的 agent 执行日志

cat .omc/logs/agent-execution.log

# 查看 team 模式状态

cat .omc/state/team-state.json
```
```

---

## 5. 安全风险评估 🟢 低风险

### 5.1 路径遍历风险（已缓解）

**评估**:

* PRD 未涉及文件操作代码

* 现有代码库已有 `assertValidMode()` 防护（runtime-protection.md）

* 用户指南不会引入新的路径遍历风险

**建议**: 无需额外措施

### 5.2 示例代码注入风险（低风险）

**评估**:

* 快速开始示例使用硬编码字符串

* 无用户输入拼接到命令中

**建议**: 在文档中添加安全提示
```markdown

## 安全最佳实践

* 不要在 skill 命令中直接拼接未验证的用户输入

* 使用参数化命令而非字符串拼接
```

---

## 6. 质量风险评估 🟡 中等风险

### 6.1 文档覆盖率验证

**当前目标**: "文档覆盖率 > 90%（核心功能）"（§2.2）

**问题**: 如何定义和测量 "覆盖率"？

**建议**: 明确覆盖率定义
```markdown

### 文档覆盖率定义

* **Agent 覆盖**: 50 个 agents 中至少 45 个有文档说明

* **Skill 覆盖**: 71 个 skills 中至少 64 个有使用示例

* **Hook 覆盖**: 35 个 hooks 中至少 32 个有配置示例

* **Tool 覆盖**: 35 个 tools 中至少 32 个有 API 文档

### 测量方法

```bash

# 自动化脚本统计文档覆盖率

npm run doc-coverage
```
```

### 6.2 用户反馈机制

**当前目标**: "用户反馈问题减少 50%"（§2.2）

**问题**: 如何收集和跟踪用户反馈？

**建议**: 建立反馈渠道
```markdown

## 反馈渠道

* GitHub Issues: 功能请求和 Bug 报告

* Discord 社区: 实时问答

* 文档内嵌反馈按钮: "这个文档有帮助吗？"

## 反馈跟踪

* 每周统计 GitHub Issues 中标记为 "documentation" 的问题数量

* 对比发布前后的问题数量变化
```

---

## 7. 边界情况分析 🟡 P1

### 7.1 多版本共存

**场景**: 用户同时使用多个项目，每个项目使用不同版本的 ultrapower

**问题**:

* 全局安装 `npm install -g` 只能有一个版本

* 不同项目的 CLAUDE.md 可能不兼容

**建议**: 补充版本管理指南
```markdown

## 多版本管理

### 方案 A: 项目级安装（推荐）

```bash
cd project-a
npm install @ultrapower/cli@5.5.18

cd project-b
npm install @ultrapower/cli@5.6.0
```

### 方案 B: 版本切换工具

```bash
ultrapower use 5.5.18  # 切换到指定版本
ultrapower current     # 查看当前版本
```
```

### 7.2 离线使用

**场景**: 用户在无网络环境中使用 ultrapower

**问题**:

* MCP 工具（Codex/Gemini）需要网络

* 文档链接可能失效

**建议**: 补充离线模式说明
```markdown

## 离线模式

### 限制

* MCP 工具（Codex/Gemini）不可用

* 外部文档查找（document-specialist）受限

### 替代方案

* 使用本地 agents（executor/debugger/verifier）

* 预先下载文档到 .omc/docs/
```

### 7.3 Windows 路径兼容性

**场景**: Windows 用户执行示例命令

**问题**:

* 文档示例使用 Unix 路径（`/`）

* Windows 使用反斜杠（`\`）

**建议**: 补充平台差异说明
```markdown

## 平台差异

### Windows 用户注意

* 路径分隔符: 使用 `\` 或 `/`（Node.js 自动处理）

* 环境变量: 使用 `%VAR%` 而非 `$VAR`

* Shell: 推荐使用 Git Bash 或 WSL
```

---

## 8. 改进优先级矩阵

| 问题 | 影响 | 紧急度 | 优先级 | 预估工时 |
| ------ | ------ | -------- | -------- | ---------- |
| 文档维护机制 | 高 | 高 | P0 | 2 天 |
| 示例代码验证 | 高 | 高 | P0 | 3 天 |
| 版本兼容性策略 | 中 | 中 | P1 | 1 天 |
| 用户困惑点澄清 | 中 | 中 | P1 | 2 天 |
| 边界情况文档 | 低 | 低 | P2 | 1 天 |

**总计**: 9 天（约 2 周）

---

## 9. 修订建议清单

### 9.1 必须修订（P0）

* [ ] **§4.1**: 添加 "文档同步机制" 章节
  - CI 自动化验证方案
  - 文档生成脚本设计
  - Pre-commit hook 配置

* [ ] **§4.2**: 添加 "示例代码验证策略" 章节
  - E2E 测试覆盖计划
  - 文档内嵌测试标记规范
  - 测试执行频率（每次 PR/每次发布）

* [ ] **§5.1**: 明确 "文档覆盖率" 定义和测量方法

### 9.2 强烈建议（P1）

* [ ] **§3.1.2**: 补充 "版本兼容性策略" 章节
  - 语义化版本控制说明
  - 废弃策略和迁移指南
  - 破坏性变更处理流程

* [ ] **§3.1.2**: 补充 "概念澄清" 章节
  - Agent vs Skill 关系图
  - 模型路由决策树
  - 使用场景对照表

* [ ] **§3.1.2**: 补充 "故障排查" 章节
  - 常见错误代码和解决方案
  - 日志查看指南
  - 调试工具使用说明

### 9.3 可选优化（P2）

* [ ] **§7**: 补充 "边界情况" 章节
  - 多版本共存方案
  - 离线模式说明
  - 平台差异（Windows/macOS/Linux）

---

## 10. 最终评审结论

### 10.1 总体评价

**优点**:

* 问题定义清晰（§1）

* 目标可量化（§2）

* 实施计划分阶段（§4.2）

**不足**:

* 文档维护机制缺失（高风险）

* 示例验证策略不足（高风险）

* 边界情况考虑不充分（中风险）

### 10.2 评审结论

**REVISE** ⚠️

**理由**:
1. 存在 2 个 P0 级别风险（文档同步、示例验证）
2. 缺少关键章节（版本兼容性、故障排查）
3. 成功指标定义不够明确（覆盖率测量）

### 10.3 下一步行动

**建议流程**:
1. **修订 Draft PRD**（预估 2 天）
   - 补充 P0 和 P1 章节
   - 明确成功指标定义
   - 添加文档同步机制设计

1. **重新评审**（预估 0.5 天）
   - Domain Expert 评审技术可行性
   - Product Manager 评审用户价值
   - UX Researcher 评审用户体验

1. **用户确认**（预估 0.5 天）
   - 展示修订后的 PRD
   - 确认优先级和时间表
   - 获得实施授权

---

**评审人**: Critic Agent (ultrapower:critic)
**评审完成时间**: 2026-03-05T13:44:00Z
**下一步**: 等待 PRD 修订后重新评审
