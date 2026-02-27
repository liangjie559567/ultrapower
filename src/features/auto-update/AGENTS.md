<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/auto-update/

## Purpose
自动更新模块。检测 ultrapower 新版本，提示用户升级，并执行升级流程（npm install + hook 重新注册）。

## For AI Agents

### 升级流程
```bash
npm install -g @liangjie559567/ultrapower@latest
omc install --force --skip-claude-check --refresh-hooks
```

### 配置
- 禁用升级提示：在 `~/.claude/.omc-config.json` 中设置 `"autoUpgradePrompt": false`

### 修改此目录时
- 版本检测逻辑变更需测试网络不可用的场景
- 参见 `docs/MIGRATION.md` 了解版本迁移规范

## Dependencies

### Internal
- `src/installer/` — 安装管理模块
- `scripts/setup-maintenance.mjs` — 维护脚本

<!-- MANUAL: -->
