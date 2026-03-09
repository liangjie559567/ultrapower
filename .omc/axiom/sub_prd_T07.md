---
task_id: T-07
feature: 用户插件部署 自动更新版本流程
status: pending
estimated: S (<2h)
depends_on: [T-01]
blocks: [T-08]
---

# T-07 — omc-doctor 集成 checkVersionConsistency()

## 目标

在 `src/cli/index.ts` 的 `doctor` 命令中集成 `checkVersionConsistency()`，检测版本漂移并输出修复命令。

## 集成位置

`src/cli/index.ts` 第 1494 行附近的 `doctorCmd` 处理逻辑，或在 `src/cli/commands/doctor-conflicts.ts` 中新增版本检查。

## 实现方案

在 `omc doctor` 或 `omc doctor conflicts` 执行时，追加版本一致性检查：

```typescript
import { checkVersionConsistency } from '../lib/plugin-registry.js';

// 在 doctor 命令输出末尾追加
const report = checkVersionConsistency();
if (!report.consistent && !report.isUpdating) {
  console.log(chalk.yellow('[WARN] Version drift detected:'));
  if (report.registryVersion) {
    console.log(`  installed_plugins.json: v${report.registryVersion}`);
  }
  if (report.versionMetadataVersion) {
    console.log(`  version metadata:       v${report.versionMetadataVersion}`);
  }
  console.log(`  package.json:           v${report.packageJsonVersion}`);
  if (report.fixCommand) {
    console.log(`  Fix: ${report.fixCommand}`);
  }
} else if (report.consistent) {
  console.log(chalk.green('✓ Version consistency: OK'));
}
```

## 注意事项

1. 优先集成到现有 `doctor` 命令，不新建命令
2. 使用 `.js` 扩展名 import（ESM 规范，与项目现有 import 风格一致）
3. 版本检查失败时静默（try/catch），不影响其他 doctor 检查

## 验收标准

* [ ] `omc doctor` 输出包含版本一致性检查结果

* [ ] 版本一致时显示 `✓ Version consistency: OK`

* [ ] 版本漂移时显示 `[WARN]` + 各源版本 + `Fix:` 命令

* [ ] TypeScript 编译无错误
