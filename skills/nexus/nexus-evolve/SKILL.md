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

1. 检查 `.omc/nexus/events/` 是否有未处理事件
2. 如果有，执行 git push 将事件推送到 nexus-daemon 仓库
3. 提示用户：进化引擎将在 VPS 端处理这些事件
4. 等待约 2 分钟后，执行 git pull 拉取改进建议
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
