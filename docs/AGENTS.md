<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# docs/ - 用户文档和指南

**用途：** 用户文档、指南、参考资料和架构说明。

**版本：** 7.2.0

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `README.md` | 项目主文档 |
| `REFERENCE.md` | 完整 API 参考（智能体、skills、hooks、工具） |
| `ARCHITECTURE.md` | 系统架构和设计决策 |
| `FEATURES.md` | 功能列表和说明 |
| `CLAUDE.md` | 终端用户编排说明（安装到用户项目） |
| `MIGRATION.md` | 版本迁移指南 |
| `COMPATIBILITY.md` | 兼容性矩阵 |
| `INSTALL.md` | 安装说明 |
| `testing.md` | 测试策略和覆盖率 |

## 子目录表

| 目录 | 用途 | 文件数 |
| ------ | ------ | -------- |
| `standards/` | 规范体系（P0/P1 文档） | 10+ |
| `guides/` | 用户指南和教程 | 8+ |
| `design/` | 设计文档和决策记录 | 5+ |
| `prd/` | 产品需求文档 | 10+ |
| `reviews/` | 审查报告和分析 | 15+ |
| `tasks/` | 任务规划和分解 | 20+ |
| `troubleshooting/` | 故障排查指南 | 8+ |
| `superpowers/` | 超级功能说明 | 5+ |
| `windows/` | Windows 特定文档 | 3+ |
| `partials/` | 文档片段（用于组合） | 10+ |
| `shared/` | 共享文档资源 | 5+ |

## 面向 AI 智能体

### 在此目录中工作

1. **更新参考文档**
   - 修改 `REFERENCE.md` 时更新智能体/skills/hooks/工具列表
   - 保持版本号和日期同步

1. **编写用户指南**
   - 在 `guides/` 中创建新指南
   - 包含代码示例和验证步骤
   - 链接到相关参考文档

1. **维护架构文档**
   - 修改 `ARCHITECTURE.md` 时记录设计决策
   - 更新系统图表和流程图
   - 保持与实现代码同步

### 修改检查清单

| 修改位置 | 更新文档 |
| --------- | --------- |
| 智能体数量/列表变化 | `REFERENCE.md` |
| Skills 数量/列表变化 | `REFERENCE.md` |
| Hooks 数量/列表变化 | `REFERENCE.md` |
| 工具数量/列表变化 | `REFERENCE.md` |
| 架构或设计变化 | `ARCHITECTURE.md` |
| 新功能 | `FEATURES.md` |
| 破坏性变化 | `MIGRATION.md` |
| 兼容性问题 | `COMPATIBILITY.md` |

### 常见任务

```bash

# 查看参考文档

cat docs/REFERENCE.md

# 查看架构

cat docs/ARCHITECTURE.md

# 查看用户指南

ls -la docs/guides/

# 查看规范

ls -la docs/standards/
```

### 文档更新规则

* 保留 "Generated" 日期不变

* 更新 "Updated" 日期为当前日期

* 版本号与 package.json 同步

* 所有代码示例必须经过测试

* 链接必须指向有效的文件或 URL
