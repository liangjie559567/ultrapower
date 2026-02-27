<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/installer/

## Purpose
安装和升级管理模块。处理 ultrapower 的初始安装、版本升级、hook 注册和 CLAUDE.md 注入等安装生命周期操作。

## For AI Agents

### 安装流程
1. 检测现有安装版本
2. 备份现有配置
3. 写入新版本文件
4. 注册 Claude Code hooks
5. 注入 CLAUDE.md 内容

### 修改此目录时
- 安装脚本修改需在干净环境中测试
- 升级逻辑需考虑从旧版本迁移的场景
- 参见 `docs/MIGRATION.md` 了解版本迁移规范

## Dependencies

### Internal
- `scripts/setup-init.mjs` — 安装入口脚本
- `scripts/setup-maintenance.mjs` — 维护脚本
- `docs/CLAUDE.md` — 注入到用户项目的内容

<!-- MANUAL: -->
