# 快速参考卡片

快速查找常用命令和解决方案。

## 命令速查

### omc repair 命令

```bash
# 交互式向导
omc repair

# 清理状态污染
omc repair --fix-state-pollution

# 清理孤儿 agent
omc repair --fix-orphan-agents

# 验证状态文件
omc repair --validate-state

# 预览修复（不执行）
omc repair --fix-state-pollution --dry-run

# 执行所有修复
omc repair --fix-state-pollution --fix-orphan-agents --validate-state
```

### 状态管理

```bash
# 查看活跃状态
ls -la .omc/state/

# 查看状态内容
cat .omc/state/autopilot-state.json | jq .

# 备份状态
cp -r .omc/state .omc/state.backup

# 清理特定状态
rm .omc/state/autopilot-state.json
```

### Agent 管理

```bash
# 列出活跃 agent
ls -lh .omc/agents/

# 检查 agent 大小
du -sh .omc/agents/

# 清理特定 agent
rm -rf .omc/agents/<agent-id>

# 查看后台任务
list_jobs --status_filter=active
```

## 问题速查

| 错误信息 | 原因 | 解决方案 |
|---------|------|--------|
| State already exists | 状态污染 | `omc repair --fix-state-pollution` |
| Agent timeout | 执行超时 | 增加超时或分解任务 |
| Invalid JSON | 状态损坏 | `omc repair --validate-state` |
| Permission denied | 权限不足 | 检查 `.omc/` 目录权限 |
| Orphan agent | 孤儿进程 | `omc repair --fix-orphan-agents` |

## 工作流速查

```bash
# 快速诊断
omc repair

# 预览修复
omc repair --fix-state-pollution --dry-run

# 执行修复
omc repair --fix-state-pollution

# 验证完成
omc repair --validate-state
```

## 日志查看

```bash
# 查看最新日志
tail -f .omc/logs/*.log

# 查看特定日志
cat .omc/logs/repair.log

# 搜索错误
grep -r "ERROR" .omc/logs/
```

## 紧急恢复

```bash
# 1. 备份当前状态
cp -r .omc/state .omc/state.emergency

# 2. 清理所有状态
rm -rf .omc/state/*

# 3. 验证恢复
omc repair --validate-state

# 4. 如需回滚
cp -r .omc/state.emergency/* .omc/state/
```
