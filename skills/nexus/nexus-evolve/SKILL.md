---
name: nexus-evolve
description: 手动触发 nexus 进化引擎
triggers:
  - nexus evolve
  - nexus-evolve
  - trigger evolution
---

# nexus Evolve

手动触发 nexus 进化引擎，立即处理积累的会话数据。

## 执行步骤

1. 检查 `.omc/nexus/events/` 是否有未处理事件。如果没有未处理事件，显示 'No pending events to push.' 并退出。
2. 执行 `git push nexus-daemon HEAD:main` 将事件推送到 nexus-daemon 仓库（远端 `nexus-daemon` 必须在 `.omc/nexus/config.json` 的 `gitRemote` 字段中配置）。
3. 提示用户：进化引擎将在 VPS 端处理这些事件
4. 等待约 2 分钟后，执行 `git pull nexus-daemon main` 拉取改进建议。如果 pull 失败或超时，显示警告：'VPS may be unavailable. Run /nexus-status to check.'
5. 如果有新的 `.omc/nexus/improvements/` 文件，显示摘要

## 输出格式

```
nexus Evolve triggered
======================
Events pushed: N
Waiting for VPS processing...
Improvements received: N
Run /nexus-review to review pending improvements.
```
