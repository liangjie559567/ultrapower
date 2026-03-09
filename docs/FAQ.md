# ultrapower 常见问题（FAQ）

**版本**: v5.5.18
**更新时间**: 2026-03-05

---

## 目录

1. [安装问题](#1-安装问题)
2. [使用问题](#2-使用问题)
3. [配置问题](#3-配置问题)
4. [性能问题](#4-性能问题)

---

## 1. 安装问题

### Q1: 支持哪些操作系统？

**A**: ultrapower 支持以下操作系统：

* macOS（推荐）

* Linux（Ubuntu、Debian、Fedora 等）

* Windows（通过 WSL 2）

### Q2: 需要什么版本的 Node.js？

**A**: Node.js >= 18.0.0

检查版本：
```bash
node --version  # 应显示 v18.x.x 或更高
```

### Q3: 可以离线使用吗？

**A**: 部分功能可以离线使用：

* ✅ 本地 agents（executor、debugger、verifier）

* ✅ 本地 tools（LSP、AST）

* ❌ MCP 工具（需要网络）

* ❌ 外部文档查找（需要网络）

### Q4: 如何更新到最新版本？

**A**:
```bash

# 方式 1: npm 更新

npm install -g @liangjie559567/ultrapower@latest

# 方式 2: 插件更新

/plugin uninstall omc@ultrapower
/plugin install omc@ultrapower

# 验证版本

/ultrapower:omc-doctor
```

### Q5: 安装失败怎么办？

**A**: 参考 [TROUBLESHOOTING.md](TROUBLESHOOTING.md#e003)

常见原因：

* Node.js 版本过低

* 权限问题

* 网络问题

---

## 2. 使用问题

### Q6: Agent 和 Skill 有什么区别？

**A**:

* **Agent**: 执行单元（如 executor、debugger）
  - 专注单一职责
  - 通过 `Task()` 调用

* **Skill**: 工作流编排（如 autopilot、team）
  - 内部调用多个 Agents
  - 通过触发词或 `/ultrapower:` 调用

**决策树**:
```
需求 → 单步任务？
       ├─ 是 → 使用 Agent
       └─ 否 → 使用 Skill
```

### Q7: 什么时候用 Team 模式？

**A**: Team 模式适用于：

* 多文件修改

* 复杂功能开发

* 需要多 agent 协作

* 需要分阶段验证

**示例**:
```
team "重构用户认证模块"
```

### Q8: 如何查看可用的 agents？

**A**:
```bash
/ultrapower:omc-help agents
```

或查看 [REFERENCE.md](REFERENCE.md#agents)

### Q9: 如何取消正在执行的任务？

**A**:
```bash
/ultrapower:cancel

# 强制取消所有任务

/ultrapower:cancel --force
```

### Q10: 支持哪些编程语言？

**A**: ultrapower 通过 LSP 和 AST 工具支持：

* TypeScript / JavaScript

* Python

* Rust

* Go

* Java

* C / C++

* Ruby

* Swift

* Kotlin

### Q11: 如何自定义 agent？

**A**: 参考 [USER_GUIDE.md 第 6.4 节](USER_GUIDE.md#64-自定义扩展指南)

简要步骤：
1. 在 `agents/` 创建 Markdown 文件
2. 定义 agent 提示词
3. 在 `src/agents/definitions.ts` 注册

### Q12: 执行速度慢怎么办？

**A**: 优化策略：

* 使用更快的模型（haiku）

* 使用并行模式（ultrawork）

* 拆分大任务

* 限制并发数

### Q13: 如何查看执行日志？

**A**:
```bash

# Agent 执行日志

cat .omc/logs/agent-execution.log

# Hook 执行日志

cat .omc/logs/hook-execution.log

# 实时监控

/ultrapower:trace timeline
```

### Q14: 支持多项目吗？

**A**: 支持。每个项目有独立的：

* `.omc/` 目录（状态、日志）

* `.claude/` 目录（hooks、配置）

* `.kiro/` 目录（steering 规则）

### Q15: 如何备份配置？

**A**:
```bash

# 备份项目配置

tar -czf omc-backup.tar.gz .omc/ .claude/ .kiro/

# 恢复配置

tar -xzf omc-backup.tar.gz
```

---

## 3. 配置问题

### Q16: 如何配置 MCP？

**A**: 编辑 `~/.claude/.omc-config.json`:
```json
{
  "mcpServers": {
    "codex": {
      "enabled": true,
      "apiKey": "your-openai-api-key"
    },
    "gemini": {
      "enabled": true,
      "apiKey": "your-google-api-key"
    }
  }
}
```

### Q17: Hook 配置在哪里？

**A**: `.claude/hooks/*.json`

示例：
```json
{
  "name": "auto-format",
  "event": "PostToolUse",
  "condition": "tool_name === 'Edit'",
  "action": "prettier --write {{file_path}}"
}
```

### Q18: 如何禁用某个 hook？

**A**: 在 hook 配置中设置：
```json
{
  "name": "my-hook",
  "enabled": false
}
```

或使用环境变量：
```bash
export OMC_SKIP_HOOKS="hook1,hook2"
```

### Q19: Steering 规则如何生效？

**A**:
1. 创建文件：`.kiro/steering/my-rule.md`
2. 添加 front-matter：
```markdown
---
inclusion: always
---

# My Rule

规则内容...
```

### Q20: 如何配置默认执行模式？

**A**: 在 `~/.claude/.omc-config.json` 设置：
```json
{
  "defaultExecutionMode": "ultrawork"
}
```

可选值：`autopilot`、`ralph`、`ultrawork`、`team`

---

## 4. 性能问题

### Q21: 如何减少 API 成本？

**A**: 成本优化策略：

* 使用 haiku 模型（更便宜）

* 避免不必要的 agent 调用

* 使用本地工具（LSP、AST）

* 限制并发数

### Q22: 内存占用高怎么办？

**A**:
```bash

# 清理日志

rm -rf .omc/logs/*.log

# 限制并发数

# 在 ~/.claude/.omc-config.json 中设置

{
  "maxConcurrentAgents": 5
}
```

### Q23: 如何提升执行速度？

**A**: 速度优化策略：

* 使用并行模式（ultrawork/team）

* 使用更快的模型（haiku）

* 预热 LSP 服务器

* 使用本地缓存

---

## 获取更多帮助

* **用户指南**: [USER_GUIDE.md](USER_GUIDE.md)

* **完整参考**: [REFERENCE.md](REFERENCE.md)

* **故障排查**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

* **社区讨论**: [GitHub Discussions](https://github.com/liangjie559567/ultrapower/discussions)

* **问题反馈**: [GitHub Issues](https://github.com/liangjie559567/ultrapower/issues)

---

**最后更新**: 2026-03-05
