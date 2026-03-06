# Rough PRD: ultrapower 用户使用指南

**版本**: v1.1 (Revised after Expert Review)
**状态**: Rough PRD
**评审结果**: 4/5 REVISE, 1/5 APPROVE WITH MINOR REVISIONS
**创建时间**: 2026-03-05

---

## 评审聚合摘要

### 共识问题（所有专家都提到）
1. **文档维护机制缺失** — 需要 CI 验证和文档生成脚本
2. **示例代码验证不足** — 需要 E2E 测试和多环境验证
3. **安装步骤不清晰** — 需要前置条件、验证步骤和故障排查

### 冲突解决
- **Tech Lead**: APPROVE WITH MINOR REVISIONS（技术可行，工作量合理）
- **其他 4 位专家**: REVISE（存在事实错误、战略问题、用户体验问题、风险问题）

**仲裁决定**: **REVISE**

**理由**: 按照优先级层级（安全 > 技术 > 战略 > 业务 > 用户体验），Domain Expert 指出的 4 个 P0 事实性错误必须修正，Product Director 的战略对齐问题和 Critic 的风险缓解措施优先级高于 Tech Lead 的技术可行性评估。

---

## P0 阻塞项（必须修复）

### 1. 事实性错误修正（Domain Expert）
- ❌ Skills 数量错误：71 → **70**
- ❌ Agents 分类错误：领域专家 16 → **15**，新增**协调 2 个**
- ❌ 安装步骤错误：插件命令 `omc@ultrapower` → **`ultrapower`**
- ❌ 遗漏关键功能：**MCP 服务器**、**Axiom 自我进化系统**、**Team 流水线**

### 2. 目标用户重新定位（Product Director）
- ❌ 当前定位过窄："已熟悉 Claude Code 的用户"
- ✅ 修订为用户分层：
  - 主要受众：Claude Code 现有用户（60%）+ AI 辅助开发工具用户（30%）
  - 次要受众：企业开发团队（10%）
  - 用户层级：初学者 / 进阶用户 / 专家用户

### 3. 成功指标量化（Product Director）
- ❌ 缺乏基线和可衡量性
- ✅ 修订为 SMART 指标：
  - 北极星指标：WAU 增长 30%
  - KR1: 激活率 60%
  - KR2: 文档覆盖率 90%
  - KR3: 支持成本降低 50%
  - KR4: 30 天留存率 40%

### 4. 上手时间调整（UX Director）
- ❌ 5 分钟目标不现实（实际需 8-12 分钟）
- ✅ 修订为 **10 分钟**，包含前置条件检查和安装验证

---

## P1 强烈建议

### 1. 文档同步机制（Critic + Tech Lead）
**问题**: 代码与文档不同步，导致用户按文档操作失败

**解决方案**:
- CI 自动化验证（检查 agent/skill 数量一致性）
- 文档生成脚本（从源代码提取功能列表）
- Pre-commit hook（提示开发者同步更新文档）

### 2. 版本兼容性策略（Critic）
**问题**: 缺少破坏性变更处理流程

**解决方案**:
- 语义化版本控制（MAJOR.MINOR.PATCH）
- 废弃策略（N 版本标记 → N+2 版本移除）
- 迁移指南（每个 MAJOR 版本提供迁移文档）

### 3. 故障排查指南（UX Director + Critic）
**问题**: 缺少错误处理和调试指南

**解决方案**:
- 常见错误代码和解决方案
- 日志查看指南
- 前置条件检查清单

### 4. 优先级调整（Product Director）
**问题**: 文档计划与项目路线图脱节

**解决方案**:
- Phase 0（前置条件）: 等待质量基线完成（安全加固 + Hook 超时 + 测试覆盖率 85%+）
- 文档发布必须在 Phase 0 完成后，避免描述不稳定功能

---

## P2 优化项

### 1. 交互式教程降级（Tech Lead）
- 原计划：实现 `/ultrapower:tutorial` skill（8-12 小时）
- 修订为：静态教程 `docs/TUTORIAL.md`（4-6 小时）
- 理由：实现复杂度高，ROI 低

### 2. 边界情况文档（Critic）
- 多版本共存方案
- 离线模式说明
- 平台差异（Windows/macOS/Linux）

---

## 修订后的 PRD 内容

### 1. 问题陈述（修订）

#### 1.1 核心问题
用户不知道如何使用 ultrapower 项目，导致：
- 新用户无法快速上手
- 功能发现困难
- 安装配置门槛高
- 版本更新不清晰

#### 1.2 目标用户（修订）

**主要受众（Primary）**:
1. **Claude Code 现有用户**（60%）
   - 痛点：手动编排 agents 效率低，缺少工作流自动化
   - 目标：通过 ultrapower 提升 10x 开发效率

2. **AI 辅助开发工具用户**（30%）
   - 来源：Cursor、Windsurf、GitHub Copilot 用户
   - 痛点：单 agent 能力有限，缺少多 agent 协作
   - 目标：迁移到更强大的编排系统

**次要受众（Secondary）**:
3. **企业开发团队**（10%）
   - 痛点：团队协作效率低，代码审查流程繁琐
   - 目标：标准化开发工作流，提升团队产出

**用户分层**:
- **初学者**（Beginner）: 10 分钟快速上手，运行第一个示例
- **进阶用户**（Intermediate）: 理解 agent 编排、配置 hooks
- **专家用户**（Advanced）: 自定义 agent、扩展 MCP、贡献代码

#### 1.3 影响范围
- 用户体验
- 项目采用率
- 社区活跃度
- 支持成本

---

### 2. 目标与成功指标（修订）

#### 2.1 目标
1. **快速上手**: 10 分钟内完成安装并运行第一个示例（含前置条件检查）
2. **功能发现**: 用户能快速了解核心功能（agents/skills/hooks/tools）
3. **配置清晰**: 提供清晰的配置指南
4. **更新简单**: 明确的版本更新流程

#### 2.2 成功指标（SMART）

**北极星指标（North Star Metric）**:
- **活跃用户数（WAU）**: 文档发布后 4 周内 WAU 增长 30%

**关键结果（Key Results）**:

**KR1: 用户激活率（Activation）**
- 指标：新用户在 7 天内成功运行 ≥3 个不同 skills
- 基线：当前激活率 = 未知（需要添加遥测）
- 目标：激活率达到 60%

**KR2: 文档完整性（Completeness）**
- 指标：核心功能文档覆盖率
  - 50 agents：每个 agent 有使用示例
  - 70 skills：每个 skill 有触发条件说明
  - 35 hooks：每个 hook 有配置示例
- 基线：当前覆盖率 = 40%（估算）
- 目标：覆盖率达到 90%

**KR3: 支持成本降低（Efficiency）**
- 指标：GitHub Issues 中"文档相关"标签的问题数量
- 基线：过去 30 天平均 20 个/月（需验证）
- 目标：减少至 10 个/月（降低 50%）

**KR4: 用户留存率（Retention）**
- 指标：安装后 30 天内仍活跃的用户比例
- 基线：当前留存率 = 未知（需要添加遥测）
- 目标：30 天留存率 ≥ 40%

#### 2.3 商业目标（新增）

**1. 提升项目采用率**
- npm 周下载量增长 50%
- GitHub Stars 增长 30%
- WAU 增长 40%

**2. 建设开发者社区**
- 外部贡献者增加至 20+
- 社区提交的 PR 占比 ≥ 30%
- 形成 3-5 个活跃的社区维护者

**3. 降低支持成本**
- 文档相关 Issues 减少 50%
- 平均 Issue 解决时间减少 30%
- 自助解决率提升至 70%

**4. 提升品牌认知**
- 技术博客引用 ultrapower 的文章 ≥ 10 篇
- 在 AI 辅助开发工具对比中被提及
- 获得至少 1 个技术社区的推荐

---


### 3. 解决方案（修订）

#### 3.1 文档结构

**3.1.1 README.md 更新**
- 项目简介（1 段话）
- 快速开始（前置条件 + 3 步安装 + 验证 + 1 个示例）
- 核心功能概览（agents/skills/hooks/tools）
- 链接到详细文档

**3.1.2 独立用户手册**
- 完整安装指南（Claude Code + ultrapower）
- 功能详解（50 agents + 70 skills + 35 hooks + 35 tools）
- 配置指南：
  - MCP 服务器配置（Claude Desktop 和 Cursor 集成）
  - Hooks 系统（事件驱动自动化工作流）
  - Steering 规则（项目级上下文和指令）
  - Axiom 框架（LSP/AST/记忆系统配置）
- 常见问题（FAQ）
- 版本更新指南
- 故障排查指南

**3.1.3 静态教程**（修订）
- 位置：`docs/TUTORIAL.md`
- 5 个核心场景的分步指南：
  1. 环境验证与配置
  2. 使用第一个 agent（executor）
  3. 创建自定义 skill
  4. 配置 hook 自动化
  5. 团队协作模式（team）
- 每个场景包含代码示例和预期输出

#### 3.2 快速开始指南（修订）

**目标**: 10 分钟内让用户运行起来

**前置条件**（新增）:
- Claude Code >= v1.0.0
- Node.js >= 18.0.0
- 操作系统：macOS / Linux / Windows (WSL)

**验证命令**:
```bash
claude --version  # 检查 Claude Code 版本
node --version    # 检查 Node.js 版本
```

**安装步骤**:

**方式一：Claude Code 插件（推荐）**
```bash
# 1. 添加 marketplace 并安装
/plugin marketplace add https://github.com/liangjie559567/ultrapower
/plugin install ultrapower

# 2. 运行安装向导
/omc-setup
```

**方式二：npm 全局安装**
```bash
npm install -g @liangjie559567/ultrapower
```

**验证安装**（新增）:
```bash
/ultrapower:omc-doctor
```

**运行第一个示例**（修订）:
在 Claude Code 会话中说：
```
help me plan this feature: 添加用户登录功能
```

系统会自动调用 `planner` agent 生成执行计划。

或使用 autopilot 模式：
```
build me a REST API endpoint for user authentication
```

**遇到问题？** 查看 [故障排查指南](docs/TROUBLESHOOTING.md)

#### 3.3 功能概览（修订）

**核心执行模式**（新增）:
- **Team 流水线**: 默认多 agent 编排器（team-plan → team-prd → team-exec → team-verify → team-fix）
- **autopilot**: 全自主执行
- **ralph**: 带验证的自引用循环
- **ultrawork**: 最大并行度编排

**MCP 服务器**（新增）:
- 35 个自定义工具
- 支持 Claude Desktop 和 Cursor
- LSP/AST/Python REPL 集成

**Axiom 自我进化系统**（新增）:
- 知识收割：自动提取经验教训
- 模式检测：识别重复模式（≥3 次）
- 工作流优化：分析执行指标
- 跨会话记忆：越用越聪明

**agents 分类**（修订）:
- 构建/分析通道（8 个）
- 审查通道（6 个）
- 领域专家（15 个）
- 产品通道（4 个）
- Axiom 通道（14 个）
- 协调（2 个：critic + vision）

**skills 分类**:
- 工作流 skills（autopilot/ralph/ultrawork/team 等）
- Agent 快捷方式（analyze/deepsearch/tdd 等）
- 工具类（cancel/note/hud 等）

**hooks 系统**:
- 15 种 hook 类型
- 事件驱动执行
- 自动化工作流

**tools 分类**:
- LSP 工具（12 个）
- AST 工具（2 个）
- Python REPL（1 个）
- Notepad/State/Memory 工具


---

### 4. 技术实现（修订）

#### 4.1 文件变更

| 文件 | 操作 | 优先级 | 变更说明 |
|------|------|--------|----------|
| README.md | 更新 | P0 | 添加前置条件、修正安装步骤、添加验证 |
| docs/USER_GUIDE.md | 创建 | P1 | 完整手册，包含 MCP/Axiom/Team 说明 |
| docs/TUTORIAL.md | 创建 | P1 | 静态教程（5 个场景） |
| docs/TROUBLESHOOTING.md | 创建 | P1 | 故障排查指南 |
| docs/FAQ.md | 创建 | P2 | 常见问题 |
| docs/VERSION_COMPATIBILITY.md | 创建 | P2 | 版本兼容性策略 |

#### 4.2 实施计划（修订）

**Phase 0: 质量基线（P0 - 前置条件）**
- 时间：4-6 周
- 负责：工程团队
- 内容：
  - 完成安全加固
  - 完成 Hook 超时实现
  - 完成测试覆盖率提升至 85%+
- 文档团队行动：
  - 同步进行：收集现有文档、整理功能清单、设计文档结构
  - 输出：文档大纲、内容框架、示例代码草稿
- 门禁：Phase 0 完成前，不发布正式用户文档

**Phase 1: 快速开始（P0）**
- 时间：1 周
- 依赖：Phase 0 完成
- 工作量：3-4 小时
- 内容：
  - 更新 README.md（添加前置条件、修正安装步骤）
  - 创建 docs/QUICKSTART.md（10 分钟上手指南）
  - 添加故障排查（常见安装问题）
- 验收标准：
  - 新用户在 10 分钟内完成安装并运行第一个示例
  - 安装步骤经过 3 个平台测试（macOS/Linux/Windows）
  - 提供安装失败的排查指南

**Phase 2: 核心功能文档（P1）**
- 时间：2 周
- 工作量：8-10 小时
- 内容：
  - 创建 docs/USER_GUIDE.md
  - Agent 编排模式（Team/ultrawork/ralph/autopilot）
  - 核心 agents 使用指南（executor/debugger/verifier）
  - Hook 系统配置
  - MCP 集成指南
  - Axiom 自我进化系统说明
- 验收标准：
  - 覆盖 80% 高频使用功能
  - 每个功能包含代码示例和预期输出

**Phase 3: 进阶功能文档（P1）**
- 时间：2 周
- 工作量：8-10 小时
- 内容：
  - 完整 agent 参考（50 agents）
  - 完整 skill 参考（70 skills）
  - Hook 类型参考（15 types）
  - 自定义扩展指南
- 验收标准：
  - 文档覆盖率达到 90%
  - 包含高级用例（自定义 agent、MCP 扩展）

**Phase 4: 静态教程（P2）**
- 时间：1 周
- 工作量：4-6 小时
- 内容：
  - 创建 docs/TUTORIAL.md
  - 5 个交互式场景
- 验收标准：
  - 所有示例经过测试验证
  - 每个场景包含代码示例和预期输出

#### 4.3 文档同步机制（新增）

**CI 自动化验证**:
```yaml
# .github/workflows/doc-sync-check.yml
name: Documentation Sync Check
on: [pull_request]
jobs:
  check-counts:
    - name: Verify agent/skill counts
      run: |
        AGENT_COUNT=$(grep -c "^- \`" src/agents/definitions.ts)
        DOC_COUNT=$(grep -c "^- \`" docs/USER_GUIDE.md)
        if [ "$AGENT_COUNT" != "$DOC_COUNT" ]; then
          echo "Agent count mismatch"
          exit 1
        fi
```

**文档生成脚本**:
```typescript
// scripts/generate-user-guide.ts
// 从 src/agents/definitions.ts 自动生成 agent 列表
// 从 skills/*/SKILL.md 提取触发词和描述
// 输出到 docs/USER_GUIDE.md（部分章节）
```

**Pre-commit Hook**:
```bash
# .omc/hooks/pre-commit-doc-check.sh
# 检测 src/agents/ 或 skills/ 变更时
# 提示开发者同步更新文档
```

#### 4.4 版本兼容性策略（新增）

**语义化版本控制**:
- MAJOR: 破坏性变更（需要用户修改代码）
- MINOR: 新功能（向后兼容）
- PATCH: Bug 修复（向后兼容）

**废弃策略**:
1. 废弃通知：在 N 版本中标记为 deprecated
2. 兼容期：N+1 和 N+2 版本保持兼容
3. 移除：N+3 版本完全移除

**迁移指南**:
- 每个 MAJOR 版本提供迁移文档
- 包含自动化迁移脚本（如适用）
- 列出所有破坏性变更和替代方案


---

### 5. 验收标准（修订）

#### 5.1 Phase 1（快速开始）
- [ ] README.md 包含前置条件检查
- [ ] 提供两种安装方式（插件 + npm）
- [ ] 新用户能在 10 分钟内运行第一个示例
- [ ] 安装步骤经过 3 个平台测试（macOS/Linux/Windows）
- [ ] 提供安装失败的排查指南

#### 5.2 Phase 2（核心功能文档）
- [ ] docs/USER_GUIDE.md 覆盖所有核心功能
- [ ] 包含 MCP 服务器、Axiom 进化系统、Team 流水线说明
- [ ] 包含配置示例和代码片段
- [ ] 链接到相关文档（REFERENCE.md/CLAUDE.md）

#### 5.3 Phase 3（进阶功能文档）
- [ ] 文档覆盖率达到 90%
- [ ] 50 agents 每个有使用示例
- [ ] 70 skills 每个有触发条件说明
- [ ] 35 hooks 每个有配置示例

#### 5.4 Phase 4（静态教程）
- [ ] docs/TUTORIAL.md 包含 5 个场景的分步指南
- [ ] 每个场景包含代码示例和预期输出
- [ ] 所有示例经过测试验证

---

### 6. 风险与依赖（修订）

#### 6.1 风险

**R1: 文档与代码不同步**（高风险）
- 影响：用户按文档操作失败，信任度下降
- 缓解措施：CI 验证 + 文档生成脚本 + Pre-commit hook

**R2: 示例代码验证不足**（高风险）
- 影响：过时示例误导用户
- 缓解措施：E2E 测试覆盖 + 多环境测试

**R3: 安装步骤在不同环境下失败**（中风险）
- 影响：新用户无法完成安装
- 缓解措施：多平台测试 + 故障排查指南 + 前置条件检查

**R4: Phase 0 延期影响文档发布**（中风险）
- 影响：文档发布时间推迟
- 缓解措施：文档团队同步准备，Phase 0 完成后快速发布

#### 6.2 依赖

- Phase 0 质量基线完成（安全加固 + Hook 超时 + 测试覆盖率 85%+）
- 现有文档（REFERENCE.md/CLAUDE.md）作为参考
- 遥测系统（用于收集成功指标基线数据）

---

### 7. 后续优化

- 视频教程
- 多语言支持（英文版）
- 社区贡献指南（链接到 contribution-guide.md）
- 最佳实践案例库
- 交互式教程（如果 ROI 证明合理）

---


## 专家评审引用

### Product Director 评审要点
- **目标用户定位过窄**：需要用户分层（初学者/进阶/专家）
- **成功指标缺乏量化**：需要 SMART 指标和基线数据
- **优先级与路线图不一致**：需要等待 Phase 0 质量基线完成
- **缺少商业目标**：需要明确对采用率、社区、支持成本的贡献

### UX Director 评审要点
- **5 分钟目标不现实**：调整为 10 分钟
- **缺少前置条件检查**：需要说明系统要求和验证命令
- **交互式教程设计不完整**：需要详细的交互流程和错误处理
- **缺少首次运行引导**：需要明确的"下一步"指引

### Domain Expert 评审要点
- **Skills 数量错误**：71 → 70
- **Agents 分类错误**：领域专家 16 → 15，新增协调 2 个
- **安装步骤错误**：插件命令 `omc@ultrapower` → `ultrapower`
- **遗漏关键功能**：MCP 服务器、Axiom 进化系统、Team 流水线

### Tech Lead 评审要点
- **技术可行性高**：所有变更均为文档层面，零技术债务
- **工作量合理**：总计 21-28 小时（5-6 个工作日）
- **建议降级 Phase 3**：交互式教程改为静态教程（降低实现复杂度）
- **需要文档同步机制**：CI 验证 + 文档生成脚本

### Critic 评审要点
- **文档维护机制缺失**：需要 CI 验证和自动化生成
- **示例代码验证不足**：需要 E2E 测试和多环境验证
- **版本兼容性考虑不充分**：需要废弃策略和迁移指南
- **用户困惑点未充分识别**：需要概念澄清和故障排查指南

---

## 工作量估算（修订）

| Phase | 原估算 | 修订后 | 变化 | 说明 |
|-------|--------|--------|------|------|
| Phase 1 | 2-3h | 3-4h | +33% | 新增前置条件和验证 |
| Phase 2 | 6-8h | 8-10h | +25% | 新增 MCP/Axiom/Team |
| Phase 3 | 8-12h | 8-10h | -17% | 进阶文档 |
| Phase 4 | 4-6h | 4-6h | 0% | 静态教程 |
| **总计** | 20-29h | **23-30h** | +15% | |

**修订后时间线**: 5-6 个工作日

---

## 与项目路线图对齐

### 技术演进时间线
```
2026-03 ~ 2026-04: P0 质量基线
├─ 安全加固
├─ Hook 超时
└─ 测试覆盖率 85%+

2026-04 ~ 2026-05: P1 性能优化
├─ 构建并行化（40% 提速）
├─ 状态查询索引
└─ LSP 预热

2026-05 ~ 2026-06: P1 架构重构
├─ 统一 Worker 接口
└─ Swarm 状态迁移

2026-06+: P2 质量改进
├─ 开发者体验
└─ 文档增强
```

### 文档发布策略
- **v1.0 文档（2026-04）**: 基于当前稳定架构（v5.5.18），覆盖核心功能
- **v1.1 文档（2026-05）**: 更新性能优化相关内容
- **v2.0 文档（2026-06）**: 反映架构重构后的变化

---

## 下一步行动

**用户确认门禁**:
专家评审已完成。这是最终的粗设 PRD：

- **评审摘要**: `docs/reviews/user_guide/summary.md`
- **Rough PRD**: `docs/prd/user_guide-rough.md`

**问题**: 是否进入任务拆解阶段（/ax-decompose）？

**如果确认**:
1. 调用 `axiom-system-architect` 进行系统架构设计
2. 生成原子任务 DAG
3. 创建 Manifest 清单
4. 进入实施阶段（/ax-implement）

---

**文档生成时间**: 2026-03-05T13:50:00Z
**状态**: 等待用户确认
**下一步**: /ax-decompose（任务拆解）

