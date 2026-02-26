# OMC 分析系统

## 概述

ultrapower 中 Claude API 使用情况的自动 token 追踪与费用估算。

## 功能特性

- **自动 Token 追踪**：零手动记录——追踪每次 HUD 渲染
- **费用估算**：基于模型的定价与缓存经济学
- **会话管理**：跨多个会话追踪费用
- **美观的 CLI**：增强的分析可视化
- **HUD 集成**：在状态栏实时显示费用

## 架构

```
StatuslineStdin → TokenExtractor → TokenTracker → Analytics Summary
                                         ↓
                                    HUD Display
                                         ↓
                                    CLI Reports
```

## 自动追踪

每次 HUD 渲染时自动捕获 token 使用情况：

1. **TokenExtractor** 解析 StatuslineStdin 中的 token 数据
2. **增量计算** 计算与上次渲染的差值
3. **Agent 关联** 将 token 与正在运行的 agent 关联
4. **TokenTracker** 将使用情况记录到 JSONL 日志
5. **摘要文件** 提供 <10ms 的快速会话加载

## 输出 Token 估算

由于 StatuslineStdin 仅提供输入 token，输出 token 通过估算得出：

- **Haiku**：输入 token 的 30%
- **Sonnet**：输入 token 的 40%
- **Opus**：输入 token 的 50%

所有费用显示时带有"~"前缀以表示为估算值。

## HUD 集成

在状态栏实时显示分析数据：

- 会话费用和 token 数
- 每小时费用
- 缓存效率
- 预算警告（>$2 警告，>$5 严重警告）

使用 `analytics` 预设以获得详细显示。

## CLI 用法

```bash
# 查看所有内容（默认仪表盘）
omc

# 查看当前会话统计
omc stats

# 费用报告
omc cost daily
omc cost weekly
omc cost monthly

# 会话历史
omc sessions

# Agent 明细
omc agents

# 导出数据
omc export cost csv ./costs.csv
```

## 性能

- **HUD 渲染**：<100ms 总计（含分析）
- **Token 提取**：每次渲染 <5ms
- **摘要加载**：<10ms（mtime 缓存）
- **CLI 启动**：<500ms

## 文件

- `src/analytics/token-extractor.ts` - Token 提取
- `src/analytics/output-estimator.ts` - 输出估算与会话 ID
- `src/analytics/analytics-summary.ts` - 快速摘要加载
- `src/hud/index.ts` - 自动记录集成
- `.omc/state/token-tracking.jsonl` - 仅追加的 token 日志
- `.omc/state/analytics-summary-{sessionId}.json` - 缓存的摘要

## 离线转录分析

### 概述

分析系统可以分析 `~/.claude/projects/` 中的历史 Claude Code 会话转录，以回填 token 使用数据。

### `omc backfill` 命令

从 Claude Code 转录中提取实际 token 使用情况并添加到分析数据库。

```bash
omc backfill [options]
```

#### 选项

| 选项 | 描述 |
|--------|-------------|
| `--project <glob>` | 过滤到特定项目路径 |
| `--from <date>` | 仅处理在该日期之后修改的转录（ISO 格式） |
| `--to <date>` | 仅处理在该日期之前修改的转录 |
| `--dry-run` | 预览而不写入数据库 |
| `--reset` | 清除去重索引并重新处理所有内容 |
| `--verbose` | 显示详细的逐文件进度 |
| `--json` | 以 JSON 格式输出 |

#### 示例

```bash
# 预览所有可用转录
omc backfill --dry-run

# 回填特定项目
omc backfill --project "*VibeQuant*"

# 仅回填最近的转录
omc backfill --from "2026-01-01"

# 重新处理所有内容
omc backfill --reset
```

### 自动回填

`omc` CLI 在启动时，如果距上次回填超过 24 小时，会自动静默运行回填。这确保您的分析数据无需手动干预即可保持最新。

### 数据来源

- **转录位置**：`~/.claude/projects/<encoded-path>/<uuid>.jsonl`
- **Token 数据**：来自 API 响应的实际 `output_tokens`（非估算值）
- **Agent 检测**：从带有 Task 工具的 `tool_use` 块中提取

### 去重

使用 `sessionId + timestamp + model` 的哈希值进行去重。可安全多次运行。
