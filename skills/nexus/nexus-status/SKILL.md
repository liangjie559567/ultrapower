---
name: nexus-status
description: 查看 nexus 系统状态
triggers:
  - nexus status
  - nexus-status
  - nexus health
---

# nexus Status

显示 nexus 系统当前状态。

## 执行步骤

1. 读取 `.omc/nexus/config.json` 确认 nexus 是否启用
2. 检查 `.omc/nexus/events/` 目录，统计待推送事件数量
3. 检查 `.omc/nexus/improvements/` 目录，统计待审批改进数量
4. 输出状态摘要：

```
nexus Status
============
Enabled: true/false
Pending events: N
Pending improvements: N
Last sync: <timestamp or "never">
```

如果 nexus 未启用，提示用户配置 `.omc/nexus/config.json`。
