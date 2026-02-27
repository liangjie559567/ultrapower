<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# scripts/

## Purpose
包含构建脚本、工具和自动化脚本。分为两类：构建产物生成脚本（`build-*.mjs`）和运行时辅助脚本（hook 处理、会话管理等）。

## Key Files

| 文件 | 描述 |
|------|------|
| `build-mcp-server.mjs` | 构建主 MCP 工具服务器 → `bridge/mcp-server.cjs` |
| `build-codex-server.mjs` | 构建 Codex MCP 代理 → `bridge/codex-server.cjs` |
| `build-gemini-server.mjs` | 构建 Gemini MCP 代理 → `bridge/gemini-server.cjs` |
| `build-bridge-entry.mjs` | 构建 Team 桥接入口 → `bridge/team-bridge.cjs` |
| `build-skill-bridge.mjs` | 构建 skill 桥接层 |
| `session-start.mjs` | 会话启动 hook 脚本 |
| `session-end.mjs` | 会话结束 hook 脚本 |
| `setup-init.mjs` | 初始化安装脚本 |
| `setup-maintenance.mjs` | 维护和升级脚本 |
| `sync-metadata.ts` | 同步 agent/skill 元数据 |
| `skill-injector.mjs` | Skill 注入处理器 |
| `plugin-setup.mjs` | 插件配置脚本 |
| `pre-compact.mjs` | 上下文压缩前处理 |
| `compose-docs.mjs` | 文档合成脚本 |
| `uninstall.sh` | 卸载脚本 |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `hooks/` | Hook 事件处理脚本 |
| `lib/` | 脚本共享工具库 |

## For AI Agents

### 构建流程
```bash
npm run build          # 运行所有构建脚本
npm run sync-metadata  # 同步 agent/skill 元数据
```

### 修改此目录时
- 构建脚本修改后需运行 `npm run build` 验证
- `session-start.mjs` 和 `session-end.mjs` 是 Claude Code hook 的入口点
- `sync-metadata.ts` 在 agent 或 skill 数量变化时需要运行

### Hook 脚本规范
- Hook 脚本从 stdin 读取 JSON 输入
- 输出到 stdout（JSON 格式）
- 错误输出到 stderr
- 退出码：0=成功，非0=失败

## Dependencies

### Internal
- `src/mcp/` — MCP 服务器源码（构建目标）
- `src/hooks/` — Hook 实现（被 hook 脚本调用）
- `bridge/` — 构建产物输出目录

### External
- `esbuild` — 打包工具
- `typescript` — TypeScript 编译

<!-- MANUAL: -->
