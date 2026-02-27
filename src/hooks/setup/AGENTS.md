<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/setup/

## Purpose
安装配置 hook。处理 ultrapower 首次安装和升级时的 hook 注册、CLAUDE.md 注入和环境验证。

## For AI Agents

### 修改此目录时
- 安装逻辑变更需同步更新 `scripts/setup-init.mjs`
- 参见 `src/installer/` 了解完整安装流程

## Dependencies

### Internal
- `scripts/setup-init.mjs` — 安装脚本
- `src/installer/` — 安装管理模块

<!-- MANUAL: -->
