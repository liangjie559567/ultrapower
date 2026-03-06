# 快速开始

> **预计时间**: 20 分钟
> **前置条件**: 已完成[安装](./installation.md)

---

## 第一个示例：使用 Autopilot

### 步骤 1: 创建测试项目

```bash
mkdir ultrapower-demo && cd ultrapower-demo
npm init -y
omc install
```

✅ **检查点 1**: 项目包含 `CLAUDE.md` 文件

---

### 步骤 2: 启动 Claude Code

```bash
claude chat
```

✅ **检查点 2**: Claude Code CLI 已启动

---

### 步骤 3: 运行第一个 Autopilot 任务

在 Claude Code 中输入：

```
/ultrapower:autopilot "创建一个简单的 HTTP 服务器，监听 3000 端口"
```

**预期输出**:
- Agent 自动分析需求
- 生成代码文件
- 运行测试验证

✅ **检查点 3**: 生成了 `server.js` 或类似文件

---

### 步骤 4: 验证结果

```bash
node server.js
# 访问 http://localhost:3000
```

✅ **检查点 4**: 服务器正常运行

---

## 🎉 恭喜！

你已经成功运行了第一个 ultrapower 示例！

---

## 下一步学习

### 理解核心概念
- [什么是 Agents？](./concepts.md#agents)
- [什么是 Skills？](./concepts.md#skills)

### 尝试更多功能
- [Team 协作](../guides/workflow-team-pipeline.md) - 多 agent 并行工作
- [Ralph 循环](../guides/workflow-ralph-loop.md) - 持续执行直到完成

---

## 常见问题

### Q: Autopilot 没有响应？

**检查**:
1. 确认 `CLAUDE.md` 存在
2. 运行 `omc doctor` 检查状态
3. 查看 [故障排查](../guides/troubleshooting.md)

### Q: 生成的代码有错误？

**正常现象**！Autopilot 会自动：
1. 检测错误
2. 调用 debugger agent
3. 自动修复并重试

---

**遇到问题？** [查看完整故障排查指南](../guides/troubleshooting.md)
