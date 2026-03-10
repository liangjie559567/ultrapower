# 🚀 15 分钟快速上手指南

完整的 ultrapower 入门教程，从安装到第一个自主执行任务。

---

## ⏱️ 第 1-2 分钟：安装与初始化

在 Claude Code 会话中执行：

```bash
# 1. 添加应用市场
/plugin marketplace add https://github.com/liangjie559567/ultrapower

# 2. 安装 ultrapower
/plugin install omc@ultrapower

# 3. 运行配置向导
/ultrapower:omc-setup
```

**预期输出**：配置向导会引导你设置基础权限和偏好设置。

---

## ⏱️ 第 3-5 分钟：理解核心概念

ultrapower 由四个核心层组成：

| 层级 | 说明 | 示例 |
|------|------|------|
| **Agents** | 专业 AI 助手 | `executor`（代码实现）、`debugger`（问题诊断） |
| **Skills** | 预定义工作流 | `autopilot`（全自主）、`team`（多 agent 协作） |
| **Hooks** | 事件驱动触发 | 用户输入时自动激活相关 skill |
| **Tools** | 35 个扩展工具 | LSP（代码智能）、AST（结构搜索）、State（状态管理） |

**工作流程**：
```
用户需求 → Hook 检测 → 调用 Skill → 分配 Agents → 使用 Tools → 完成任务
```

---

## ⏱️ 第 6-10 分钟：体验自主执行（Autopilot）

无需手动选择模型或 Agent，直接输入想法：

```bash
/ultrapower:autopilot "创建一个带密码强度验证的登录组件，要求响应式设计"
```

**autopilot 会自动**：
1. 分析你的需求
2. 拆解为原子任务
3. 分配最合适的 agents
4. 并行执行任务
5. 验证完成质量

---

## ⏱️ 第 11-13 分钟：体验多 Agent 协作（Team 模式）

对于复杂任务，启动团队协同模式：

```bash
/ultrapower:team "重构所有的 API 请求，替换为统一的 Axios 实例，并添加错误重试拦截器"
```

**Team 模式流水线**：
```
规划 → 需求确认 → 代码实现 → 验证测试 → 修复（如需）
```

每个阶段使用专业 agents：
- **规划**：`explore` + `planner`
- **实现**：`executor` + 领域专家
- **验证**：`verifier` + 审查 agents

---

## ⏱️ 第 14-15 分钟：验证安装

运行诊断工具确保一切正常：

```bash
/ultrapower:omc-doctor
```

**检查项**：
- ✅ 依赖安装
- ✅ 权限配置
- ✅ 工具可用性
- ✅ 状态文件

---

## 📚 接下来学什么？

| 目标 | 资源 |
|------|------|
| 了解所有 49 个 Agents | [Agent 参考手册](../reference/AGENTS.md) |
| 掌握 71 个 Skills | [Skills 清单](../reference/SKILLS.md) |
| 学习端到端工作流 | [Workflows 深度指南](../guides/workflows.md) |
| 配置 MCP 服务器 | [MCP 使用指南](../guides/mcp-server-usage.md) |
| 了解 Axiom 进化系统 | [Axiom 文档](../AXIOM.md) |

---

## 🔧 常见问题

**Q: 如何查看 Agent 执行进度？**
```bash
/ultrapower:omc-doctor
```

**Q: 如何取消正在执行的任务？**
```bash
/ultrapower:cancel
```

**Q: 如何查看执行历史？**
```bash
/ultrapower:trace
```

**Q: 遇到错误怎么办？**
1. 运行 `/ultrapower:omc-doctor` 诊断
2. 查看 [故障排查指南](./TROUBLESHOOTING.md)
3. 提交 Issue：https://github.com/liangjie559567/ultrapower/issues
