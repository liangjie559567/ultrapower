<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# lib/brainstorm-server/

## Purpose
头脑风暴服务器实现。提供本地 HTTP 服务，支持 brainstorming skill 的交互式创意探索功能，包含前端页面模板和服务器管理脚本。

## Key Files

| File | Description |
|------|-------------|
| `index.js` | 服务器主入口，启动本地 HTTP 服务 |
| `helper.js` | 服务器工具函数 |
| `frame-template.html` | 头脑风暴交互界面 HTML 模板 |
| `package.json` | 服务器依赖配置 |
| `start-server.sh` | 启动服务器脚本 |
| `stop-server.sh` | 停止服务器脚本 |

## For AI Agents

### 修改此目录时
- 服务器端口变更需同步更新 brainstorming skill 配置
- 参见 `skills/brainstorming/` 了解 skill 层调用方式

## Dependencies

### Internal
- `skills/brainstorming/` — Brainstorming skill

<!-- MANUAL: -->
