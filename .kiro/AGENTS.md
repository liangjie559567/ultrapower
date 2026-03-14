<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# .kiro

## Purpose

Kiro IDE 配置目录，包含 steering 规则和项目特定配置。

## Key Files

| File | Description |
| ------ | ------------- |
| 无顶层文件 | 配置存储在子目录中 |

## Subdirectories

| Directory | Purpose |
| ----------- | --------- |
| `steering/` | Steering 规则文件（见 `steering/AGENTS.md`） |

## For AI Agents

### Working In This Directory

* Steering 文件用于为 Kiro IDE 提供项目特定的上下文和指令
* 修改 steering 规则时需确保与项目规范一致

### Testing Requirements

* 验证 steering 规则语法正确
* 确保规则不与全局配置冲突
