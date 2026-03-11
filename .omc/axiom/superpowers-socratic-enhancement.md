# Superpowers 苏格拉底式增强方案

**日期**: 2026-03-11
**目标**: 深度融合 obra/superpowers 的苏格拉底式对话理念

## 核心理念

### 1. 苏格拉底式需求澄清

**当前问题**：
- brainstorming skill 存在，但不够主动
- 用户说"做个功能"就直接开始实现
- 缺少深度提问环节

**改进方向**：
- 强制多轮对话，直到需求完全明确
- 使用 5W1H 框架系统化提问
- 记录用户回答，形成需求文档

### 2. 外部资料搜索

**当前问题**：
- 缺少自动搜索最佳实践的环节
- 没有对比开源方案的流程

**改进方向**：
- 集成 sciomc skill（科学研究）
- 集成 external-context skill（外部资料）
- 自动搜索相关开源项目、最佳实践

### 3. 方案评审机制

**当前问题**：
- 缺少多角度评审
- 没有强制的方案对比环节

**改进方向**：
- 使用 ax-review（5 专家并行评审）
- 强制列出至少 3 种实现方案
- 对比优缺点后让用户选择

### 4. TDD 模式开发

**当前问题**：
- test-driven-development skill 存在但不强制
- 没有与工作流门禁集成

**改进方向**：
- 在 workflow-gate 中添加 TDD 检查
- 执行阶段强制先写测试
- CI 门禁验证测试覆盖率

### 5. 生产级质量保证

**当前问题**：
- verification-before-completion 存在但不够严格
- 缺少多维度质量检查

**改进方向**：
- 集成 security-reviewer、performance-reviewer
- 强制代码审查（code-reviewer）
- 自动化质量门禁

## 增强工作流

```
用户需求
    ↓
[苏格拉底式澄清] ← brainstorming + 5W1H 框架
    ↓
[外部资料搜索] ← sciomc + external-context
    ↓
[方案设计] ← architect + 至少 3 种方案
    ↓
[多专家评审] ← ax-review（5 专家）
    ↓
[用户确认方案]
    ↓
[任务拆解] ← ax-decompose
    ↓
[TDD 开发] ← test-driven-development（强制）
    ↓
[代码审查] ← code-reviewer + security-reviewer
    ↓
[质量验证] ← verification-before-completion
    ↓
[生产部署]
```

## 实现计划

### Phase 1: 苏格拉底式对话增强（高优先级）

**目标**: 让 brainstorming skill 更主动、更系统化

**实现**:
1. 增强 brainstorming skill 的提问框架
2. 添加 5W1H 检查清单
3. 强制多轮对话直到需求明确

### Phase 2: 外部资料集成（高优先级）

**目标**: 自动搜索最佳实践和开源方案

**实现**:
1. 在 brainstorming 后自动调用 sciomc
2. 搜索相关开源项目（GitHub、npm）
3. 搜索最佳实践文章

### Phase 3: 方案评审强化（中优先级）

**目标**: 强制多方案对比

**实现**:
1. architect 必须提供至少 3 种方案
2. 使用 ax-review 进行多专家评审
3. 生成方案对比表格

### Phase 4: TDD 强制执行（高优先级）

**目标**: 将 TDD 集成到工作流门禁

**实现**:
1. workflow-gate 添加 TDD 检查
2. 执行前验证测试文件存在
3. CI 门禁验证测试通过

### Phase 5: 质量门禁体系（中优先级）

**目标**: 多维度质量保证

**实现**:
1. 代码审查（code-reviewer）
2. 安全审查（security-reviewer）
3. 性能审查（performance-reviewer）
4. 自动化质量报告

## 关键改进点

### 1. 强制性 vs 可选性

| 环节 | 当前 | 改进后 |
| ------ | ------ | -------- |
| 需求澄清 | 可选 | **强制**（workflow-gate） |
| 外部搜索 | 无 | **强制**（brainstorming 后） |
| 方案评审 | 可选 | **强制**（至少 3 方案） |
| TDD | 可选 | **强制**（workflow-gate） |
| 代码审查 | 可选 | **强制**（完成前） |

### 2. 自动化程度

| 环节 | 当前 | 改进后 |
| ------ | ------ | -------- |
| 提问 | 手动 | **自动**（5W1H 框架） |
| 搜索 | 手动 | **自动**（sciomc） |
| 评审 | 手动 | **自动**（ax-review） |
| 测试 | 手动 | **自动**（TDD 门禁） |
| 质量检查 | 手动 | **自动**（多 reviewer） |

### 3. 质量保证

| 维度 | 当前 | 改进后 |
| ------ | ------ | -------- |
| 需求完整性 | 低 | **高**（5W1H + 多轮对话） |
| 方案合理性 | 中 | **高**（3 方案 + 5 专家） |
| 代码质量 | 中 | **高**（TDD + 多 reviewer） |
| 安全性 | 低 | **高**（security-reviewer） |
| 性能 | 低 | **高**（performance-reviewer） |

## 下一步行动

1. **立即实施**: Phase 1（苏格拉底式对话增强）
2. **本周完成**: Phase 2（外部资料集成）
3. **本月完成**: Phase 4（TDD 强制执行）
4. **持续优化**: Phase 3、5（评审和质量门禁）
