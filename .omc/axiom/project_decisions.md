---
project_name: Axiom v4.2
last_updated: 2026-02-13
---

# Project Decisions (长期记忆 - 架构决策)

## 1. 技术栈 (Framework Core)
- **Language**: Dart (Flutter) for Core Logic & UI.
- **Backend/Scripting**: Python (Evolution Engine) / PowerShell (Guards).
- **Architecture**: Manifest-Driven Agentic Pipeline.

## 2. 架构设计原则
- **Stateless Skills**: 技能必须是纯函数，无副作用。
- **Controller Workflows**: 状态管理和门禁逻辑必须在 Workflow 层实现。
- **Evidence-Based Gates**: 所有门禁必须基于可验证的产物 (Artifacts/Logs)。

## 3. 编码规范
- **Lint**: flutter_lints
- **Formatting**: dart format
- **Naming**: `snake_case` for docs/scripts, `PascalCase` for classes.

## 4. 核心依赖
| 库名 | 用途 |
|------|------|
| Lucide | 标准图标库 |
| Mermaid | 流程图标准 |

## 5. 已知问题 (错误模式学习)
| 日期 | 错误类型 | 根因分析 | 修复方案 |
|------|---------|---------|---------|
| 2026-02-12 | Race Condition | 并行读写同一临时文件 | 实施 Unique Artifact Injection (k-028) |
| 2026-02-26 | Vitest 并发竞态 | 模块级固定路径常量被多个并发测试共享，beforeEach 的 rmSync/mkdirSync 互相干扰 | 每测试用 randomBytes(6) 生成唯一 uid，路径改为 tmpdir() + uid，vi.mock 通过模块级 let 变量闭包动态返回 |
| 2026-02-26 | Slash Command 未安装 | CORE_COMMANDS=[] + COMMANDS_DIR 创建被注释掉，导致 ~/.claude/commands/ 目录不存在，所有命令安装被跳过 | 恢复 COMMANDS_DIR mkdirSync，移除 CORE_COMMANDS 白名单检查 |
| 2026-02-26 | Plugin Cache 缺少 templates/ | npm postinstall 从 npm-cache node_modules 运行，Claude Code 在 postinstall 后才复制文件到缓存，导致 templates/hooks/ 不在缓存中，hooks.json 的 ${CLAUDE_PLUGIN_ROOT}/templates/hooks/*.mjs 路径解析失败 | 在 plugin-setup.mjs 添加 copyTemplatesToCache()，用 withFileTypes+isDirectory() 守卫，失败时清理空目录允许重试 |

## 6. Deprecated (废弃决策归档)
- [Archived] "Test Flutter App" MVVM specific rules (Replaced by Generic Axiom rules).

## 7. 🎨 UI/UX Standards (Mandatory)
- **Design Philosophy**: Minimalist, Terminal-inspired, Cyberpunk (optional).
- **Interactive**: CLI interactions must be clear and structured.
