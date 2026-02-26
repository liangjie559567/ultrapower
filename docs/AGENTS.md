<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-31 | Updated: 2026-02-24 -->

# docs

ultrapower 的用户文档和技术指南。

## 目的

本目录包含面向终端用户和开发者的文档：

- **终端用户指南**：如何使用 ultrapower 功能
- **技术参考**：架构、兼容性、迁移
- **设计文档**：功能设计规范

## 关键文件

| 文件 | 说明 |
|------|-------------|
| `CLAUDE.md` | 终端用户编排说明（安装到用户项目） |
| `FEATURES.md` | 内部功能的开发者 API 参考 |
| `REFERENCE.md` | API 参考和配置选项 |
| `ARCHITECTURE.md` | 系统架构概览 |
| `MIGRATION.md` | 版本迁移指南 |
| `COMPATIBILITY.md` | 兼容性矩阵和系统要求 |
| `TIERED_AGENTS_V2.md` | 模型路由和分层 agent 设计 |
| `DELEGATION-ENFORCER.md` | 委派协议文档 |
| `SYNC-SYSTEM.md` | 状态同步系统 |
| `ANALYTICS-SYSTEM.md` | 分析数据收集文档 |
| `LOCAL_PLUGIN_INSTALL.md` | 插件安装指南 |

## 子目录

| 目录 | 用途 |
|-----------|---------|
| `design/` | 功能设计规范 |

## 面向 AI Agents

### 在本目录中工作

1. **终端用户视角**：CLAUDE.md 会安装到用户项目——面向终端用户而非开发者编写
2. **保持链接可访问**：CLAUDE.md 中的链接使用原始 GitHub URL（agents 无法导航 GitHub UI）
3. **版本一致性**：发布时更新所有文档中的版本号

### 何时更新各文件

| 触发条件 | 需更新的文件 |
|---------|---------------|
| Agent 数量或列表变更 | `REFERENCE.md`（Agents 章节） |
| Skill 数量或列表变更 | `REFERENCE.md`（Skills 章节） |
| Hook 数量或列表变更 | `REFERENCE.md`（Hooks System 章节） |
| Magic keywords 变更 | `REFERENCE.md`（Magic Keywords 章节） |
| Agent 工具分配变更 | `CLAUDE.md`（Agent Tool Matrix） |
| Skill 组合或架构变更 | `ARCHITECTURE.md` |
| 新增内部 API 或功能 | `FEATURES.md` |
| 破坏性变更或迁移 | `MIGRATION.md` |
| 分层 agent 设计更新 | `TIERED_AGENTS_V2.md` |
| 平台或版本支持变更 | `COMPATIBILITY.md` |
| 终端用户说明变更 | `CLAUDE.md` |
| 主要面向用户的功能 | `../README.md` |

### 测试要求

- 验证 markdown 渲染正确
- 检查所有内部链接可解析
- 验证文档中的代码示例

### 常见模式

#### 链接到原始内容

使用原始 GitHub URL 以确保外部可访问：

[Migration Guide](https://raw.githubusercontent.com/liangjie559567/ultrapower/main/docs/MIGRATION.md)

#### 版本引用

使用一致的版本标题格式，标题后留空行：

```markdown
## v3.8.17 Changes

- Feature A
- Feature B
```

## 依赖

### 内部依赖

- 引用 `agents/` 中的 agents
- 引用 `skills/` 中的 skills
- 引用 `src/tools/` 中的工具

### 外部依赖

无——纯 markdown 文件。

<!-- MANUAL: -->
