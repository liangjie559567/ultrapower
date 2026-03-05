# Performance Monitoring

轻量级性能监控系统，用于跟踪 ultrapower 关键指标。

## 使用

### 查看仪表板
```bash
omc perf                    # 显示最近 24 小时
omc perf --hours 48         # 显示最近 48 小时
```

### 设置基线
```bash
omc perf --baseline
```

### 导出数据
```bash
omc perf --export json --output metrics.json
omc perf --export csv --type build --output build.csv
```

## 指标类型

- `build`: 构建时间（增量/完整）
- `worker_health`: Worker 健康检查响应时间
- `worker_status`: Worker 状态查询响应时间
- `lsp_init`: LSP 首次调用延迟
- `memory`: 内存占用

## 回归检测

自动对比基线，阈值：
- 构建时间: +20%
- 响应时间: +50%

## 数据存储

指标存储在 `.omc/metrics/` 目录：
- `{type}.jsonl`: 时序数据
- `baseline.json`: 基线值
