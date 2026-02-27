<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# hooks/

## Purpose
已安装的 hook 运行时目录。存放实际部署到当前项目的 hook 配置和脚本，是 `templates/hooks/` 模板安装后的实例，由 `omc install` 生成。

## Key Files

| File | Description |
|------|-------------|
| `hooks.json` | Hook 注册配置，定义各事件对应的 hook 脚本 |
| `run-hook.cmd` | Windows 平台 hook 执行入口脚本 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `session-start/` | 会话启动 hook 脚本 |

## For AI Agents

### 修改此目录时
- 此目录是运行时文件，通常由安装程序管理，不手动编辑
- 参见 `templates/hooks/` 了解模板源文件

## Dependencies

### Internal
- `templates/hooks/` — Hook 脚本模板

<!-- MANUAL: -->
