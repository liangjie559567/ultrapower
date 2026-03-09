# 🚀 3 分钟快速开始

## 第一步：安装与初始化

在 Claude Code 会话中执行：

```bash
# 1. 挂载应用市场并安装
/plugin marketplace add https://github.com/liangjie559567/ultrapower
/plugin install omc@ultrapower

# 2. 运行配置向导（初始化基础权限与设置）
/ultrapower:omc-setup
```

## 第二步：体验自主执行（Autopilot）

无需手动选择模型或 Agent，直接输入想法，引擎会自动进行需求分析、拆解任务并执行：

```bash
/ultrapower:autopilot "创建一个带密码强度验证的登录组件，要求响应式设计"
```

## 第三步：体验并行多 Agent（Team 模式）

对于复杂重构，启动团队协同模式，多线程同时修改：

```bash
/ultrapower:team "重构所有的 API 请求，替换为统一的 Axios 实例，并添加错误重试拦截器"
```

---

## 💡 接下来？

* **查看实时大盘和 Agent 消耗**：输入 `omc stats`
* **了解端到端的纪律开发流程**：[阅读 Workflows 深度指南](../core-concepts/WORKFLOWS.md)
* **探索 49 个专业 Agents**：[查看 Agent 参考手册](../reference/AGENTS.md)
* **掌握 71 个 Skills**：[浏览 Skills 清单](../reference/SKILLS.md)

## 🔧 遇到问题？

* **诊断工具**：运行 `/ultrapower:omc-doctor` 自动检测并修复常见问题
* **故障排查**：查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
* **提交 Issue**：https://github.com/liangjie559567/ultrapower/issues
