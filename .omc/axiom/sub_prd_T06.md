---
task_id: T-06
feature: 用户插件部署 自动更新版本流程
status: pending
estimated: S (<2h)
depends_on: []
blocks: [T-08]
---

# T-06 — 增强 formatUpdateNotification()

## 目标

修改 `src/features/auto-update.ts` 的 `formatUpdateNotification()`（第 601-631 行），根据安装模式显示不同更新指令，替换现有双命令并列展示。

## 当前代码（第 614-615 行）

```typescript
'  To update, run: /update',
'  Or reinstall via: /plugin install ultrapower',
```

## 目标代码

```typescript
// 根据安装模式显示不同指令
const updateInstruction = isRunningAsPlugin()
  ? '  To update, run: /plugin install ultrapower'
  : '  To update, run: /update';

// 替换原来的两行为单行
lines.push(updateInstruction);
```

## 注意事项

1. `isRunningAsPlugin()` 已在文件中 import（来自 `installer/index.ts`）
2. 只替换第 614-615 行，不修改其他部分
3. 不再并列展示两个命令

## 验收标准

- [ ] plugin 模式：通知只显示 `/plugin install ultrapower`
- [ ] npm 模式：通知只显示 `/update`
- [ ] 不再同时显示两个命令
- [ ] TypeScript 编译无错误
