<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/cli/

## Purpose
命令行界面（CLI）实现层。处理 Claude Code 的启动检测、命令解析、tmux 会话管理和跨平台兼容性。

## Key Files

| 文件 | 描述 |
|------|------|
| `index.ts` | CLI 模块导出入口 |
| `launch.ts` | CLI 启动逻辑，处理参数解析和初始化 |
| `cli-detection.ts` | 检测当前运行环境（交互式/非交互式/CI） |
| `interop.ts` | 跨工具互操作性处理 |
| `analytics.ts` | CLI 使用分析收集 |
| `tmux-utils.ts` | tmux 会话工具函数 |
| `README.md` | CLI 模块文档 |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `commands/` | CLI 子命令实现 |
| `utils/` | CLI 工具函数 |

## For AI Agents

### 环境检测
`cli-detection.ts` 提供以下检测能力：
- 是否在 CI 环境中运行
- 是否有 TTY（交互式终端）
- 是否在 tmux 会话中
- 当前 shell 类型

### 修改此目录时
- 修改启动逻辑后需测试交互式和非交互式两种模式
- `analytics.ts` 收集匿名使用数据，修改需遵守隐私规范
- tmux 相关功能在 Windows 上可能不可用，需添加平台检测

## Dependencies

### Internal
- `src/features/` — 特性层
- `src/hooks/` — Hook 系统

### External
- `commander` — CLI 参数解析

<!-- MANUAL: -->
