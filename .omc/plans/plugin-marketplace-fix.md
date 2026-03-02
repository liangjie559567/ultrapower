# 插件市场合规修复计划

**基于研究报告:** `.omc/research/plugin-analysis-20260228/report.md`
**目标:** 修复 P0/P1 问题，提升插件市场合规性和自动更新能力
**预计影响文件:** 5 个

---

## 任务总览

| # | 任务 | 优先级 | 影响文件 | 复杂度 |
|---|------|--------|---------|--------|
| 1 | 修复 settings.json agent 字段格式 | P0 | `settings.json` | 低 |
| 2 | 统一 author 字段 | P0 | `plugin.json`, `marketplace.json`, `package.json` | 低 |
| 3 | 实现 syncMarketplace() | P1 | `scripts/release-steps.mjs` | 中 |
| 4 | bump-version 同步 marketplace source.version | P1 | `scripts/bump-version.mjs` | 低 |
| 5 | 验证所有变更 | — | — | 低 |

---

## 任务 1：修复 settings.json agent 字段格式 [P0]

**问题：** `agent` 字段为对象格式，官方规范要求为字符串或移除。

**当前：**
```json
{"agent": {"description": "ultrapower multi-agent orchestration settings"}}
```

**修复为：**
```json
{}
```

**说明：** ultrapower 不需要指定默认 agent，移除无效字段即可。

**文件：** `settings.json`
**验证：** JSON 格式有效。

---

## 任务 2：统一 author 字段 [P0]

**问题：** author 信息跨 3 个文件不一致。

| 文件 | 当前值 |
|------|--------|
| plugin.json | `{"name": "Yeachan Heo"}` |
| marketplace.json (owner) | `{"name": "liangjie559567"}` |
| marketplace.json (plugin author) | `{"name": "liangjie559567"}` |
| package.json | `"Yeachan Heo"` |

**修复方案：** 统一为 `"liangjie559567"`（与 GitHub 用户名和 npm 包名一致）。

**变更：**
- `plugin.json`: `author.name` 改为 `"liangjie559567"`
- `package.json`: `author` 改为 `"liangjie559567"`

**文件：** `.claude-plugin/plugin.json`, `package.json`
**验证：** 3 个文件的 author 值一致。

---

## 任务 3：实现 syncMarketplace() [P1]

**问题：** `scripts/release-steps.mjs` 中 `syncMarketplace()` 为空实现（no-op），导致发布后 marketplace.json 版本不自动更新。用户通过 marketplace 安装的插件无法自动获取新版本。

**当前：**
```javascript
export async function syncMarketplace(opts = {}) {
  const { dryRun = false } = opts;
  // Version already in sync (bumped before tagging); no-op
  if (dryRun) { console.log('[dry-run] syncMarketplace: no-op'); }
  return { success: true };
}
```

**修复方案：** 实现真正的 syncMarketplace()，在 npm publish 成功后：
1. 读取当前版本号
2. 更新 marketplace.json 中的版本
3. git commit + push 到 main 分支

**修复为：**
```javascript
export async function syncMarketplace(opts = {}) {
  const { dryRun = false } = opts;
  const version = getVersion();
  const marketplacePath = resolve('.claude-plugin/marketplace.json');
  const market = JSON.parse(readFileSync(marketplacePath, 'utf-8'));

  let changed = false;
  for (const p of market.plugins ?? []) {
    if (p.version !== version) { p.version = version; changed = true; }
    if (p.source?.version !== version) { p.source.version = version; changed = true; }
  }

  if (!changed) {
    console.log('syncMarketplace: versions already in sync');
    return { success: true };
  }

  writeFileSync(marketplacePath, JSON.stringify(market, null, 2) + '\n');
  run(`git add .claude-plugin/marketplace.json`, dryRun);
  run(`git commit -m "chore: sync marketplace.json to v${version}"`, dryRun);
  run(`git push origin main`, dryRun);

  console.log(`syncMarketplace: updated to v${version} and pushed`);
  return { success: true };
}
```

**注意：** 需要在文件顶部添加 `writeFileSync` 的 import（当前只 import 了 `readFileSync`）。

**文件：** `scripts/release-steps.mjs`
**验证：** `node scripts/release-steps.mjs sync --dry-run` 输出正确的 dry-run 日志。

---

## 任务 4：bump-version 同步 marketplace source.version [P1]

**问题：** `readVersions()` 只读取 `market.plugins[0].version`，未校验 `source.version`。如果两者不一致，`assertVersionsSync()` 不会报错。

**当前 readVersions()：**
```javascript
return {
  pkg: pkg.version,
  plugin: plugin.version,
  marketplace: market.plugins?.[0]?.version,
};
```

**修复为：**
```javascript
return {
  pkg: pkg.version,
  plugin: plugin.version,
  marketplace: market.plugins?.[0]?.version,
  marketplaceSource: market.plugins?.[0]?.source?.version,
};
```

**说明：** `bumpVersion()` 已正确同步 `source.version`（第 53 行），但 `readVersions()` 和 `assertVersionsSync()` 未校验它。添加 `marketplaceSource` 字段后，版本不一致时会被 preflight 拦截。

**文件：** `scripts/bump-version.mjs`
**验证：** `node scripts/bump-version.mjs` 输出 4 个版本值且全部一致。

---

## 任务 5：验证所有变更

**目标：** 确认任务 1-4 的所有变更正确无误。

**验证步骤：**

1. **JSON 格式验证：**
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('settings.json','utf-8'))"
   node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf-8'))"
   node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf-8'))"
   ```

2. **Author 一致性检查：**
   ```bash
   node -e "
     const p = JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf-8'));
     const m = JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf-8'));
     const k = JSON.parse(require('fs').readFileSync('package.json','utf-8'));
     console.log('plugin:', p.author.name);
     console.log('marketplace:', m.plugins[0].author.name);
     console.log('package:', k.author);
   "
   ```
   预期：三个值均为 `liangjie559567`。

3. **版本同步校验：**
   ```bash
   node scripts/bump-version.mjs
   ```
   预期：输出 4 个版本值（pkg、plugin、marketplace、marketplaceSource）且全部一致。

4. **settings.json 无 agent 字段：**
   ```bash
   node -e "
     const s = JSON.parse(require('fs').readFileSync('settings.json','utf-8'));
     console.log('has agent:', 'agent' in s);
   "
   ```
   预期：`has agent: false`。

5. **syncMarketplace dry-run：**
   ```bash
   node scripts/release-steps.mjs sync --dry-run
   ```
   预期：输出 dry-run 日志，无报错。

6. **构建验证：**
   ```bash
   tsc --noEmit && npm run build
   ```
   预期：无错误。

---

## 执行顺序

```
任务 1 (P0) ──┐
              ├──→ 任务 5 (验证)
任务 2 (P0) ──┤
              │
任务 3 (P1) ──┤
              │
任务 4 (P1) ──┘
```

任务 1-4 互相独立，可并行执行。任务 5 依赖全部完成后执行。
