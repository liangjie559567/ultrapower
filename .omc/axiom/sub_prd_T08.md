---
task_id: T-08
feature: 用户插件部署 自动更新版本流程
status: pending
estimated: -
depends_on: [T-01, T-02, T-03, T-04, T-05, T-06, T-07]
blocks: []
---

# T-08 — CI Gate

## 目标

验证所有任务完成后，整体编译和测试通过。

## 执行命令

```bash
tsc --noEmit && npm run build && npm test
```

## 验收标准

- [ ] `tsc --noEmit` 零错误
- [ ] `npm run build` 成功
- [ ] `npm test` 全部通过，无新增失败
- [ ] 新增测试（T-02）全部通过
