# 开发体验故障排除指南

本指南帮助开发者快速诊断和解决 ultrapower 常见问题。

## 常见问题

### 1. 状态污染（State Pollution）

**症状**
- 执行 agent 任务时出现 "State already exists" 错误
- 多个 session 之间状态相互干扰
- `.omc/state/` 目录下存在多个过期的状态文件

**原因**
- 前一个 session 异常中断，状态文件未清理
- 多个 worktree 共享同一个 `.omc/state/` 目录
- 并发执行多个 agent 导致状态冲突

**解决方案**

使用 `omc repair` 命令清理污染状态：

```bash
# 交互式向导（推荐）
omc repair

# 直接清理状态污染
omc repair --fix-state-pollution

# 预览将要删除的文件（不执行）
omc repair --fix-state-pollution --dry-run

# 清理所有问题
omc repair --fix-state-pollution --fix-orphan-agents --validate-state
```

**预防措施**
- 使用独立的 worktree 进行并发工作
- 正常退出 session 时调用 `/ultrapower:cancel`
- 定期运行 `omc repair --validate-state` 检查状态完整性

---

### 2. 孤儿 Agent（Orphan Agents）

**症状**
- Agent 进程在后台持续运行，占用资源
- 无法启动新的 agent 任务
- `.omc/agents/` 目录下存在陈旧的 agent 目录

**原因**
- Agent 执行超时或被强制中断
- 网络连接中断导致 agent 无法正常关闭
- 系统崩溃或进程被杀死

**解决方案**

```bash
# 清理超过 24 小时的孤儿 agent
omc repair --fix-orphan-agents

# 预览将要清理的 agent
omc repair --fix-orphan-agents --dry-run

# 手动清理特定 agent
rm -rf .omc/agents/<agent-id>
```

**预防措施**
- 为长时间运行的任务设置合理的超时时间
- 使用 `--run-in-background` 时监控 job 状态
- 定期检查 `.omc/agents/` 目录大小

---

### 3. 状态验证失败（State Validation Failure）

**症状**
- 错误信息：`Invalid JSON in <state-file>`
- 状态文件损坏或格式错误
- 无法读取或写入状态

**原因**
- 磁盘写入中断导致文件不完整
- 并发写入导致 JSON 格式破坏
- 文件权限问题

**解决方案**

```bash
# 验证所有状态文件
omc repair --validate-state

# 手动修复损坏的状态文件
cat .omc/state/<mode>-state.json | jq . > /tmp/backup.json
# 检查 /tmp/backup.json 内容，然后恢复
cp /tmp/backup.json .omc/state/<mode>-state.json
```

**预防措施**
- 使用原子写入操作（atomic-write）
- 避免在状态文件写入时强制关闭进程
- 定期备份 `.omc/state/` 目录

---

## omc repair 命令使用指南

### 交互式向导

无参数运行 `omc repair` 启动交互式向导：

```bash
$ omc repair
Interactive Repair Wizard
1. Fix state pollution
2. Fix orphan agents
3. Validate state files

Select action (1-3, or "all"): all
Dry run? (y/n): y
```

**选项说明**
- `1`: 清理跨 session 的状态污染
- `2`: 移除超过 24 小时的孤儿 agent
- `3`: 验证所有状态文件的 JSON 格式
- `all`: 执行全部三项检查

### 子命令

#### 清理状态污染

```bash
omc repair --fix-state-pollution [--dry-run]
```

- 扫描 `.omc/state/` 目录
- 识别非活跃的状态文件
- 删除过期状态（保留活跃 session 的状态）

#### 清理孤儿 Agent

```bash
omc repair --fix-orphan-agents [--dry-run]
```

- 扫描 `.omc/agents/` 目录
- 检查 agent 目录的修改时间
- 删除超过 24 小时未更新的 agent

#### 验证状态文件

```bash
omc repair --validate-state
```

- 逐个检查 `.omc/state/` 中的 JSON 文件
- 报告格式错误和损坏的文件
- 输出验证统计信息

### 干运行模式

所有修复操作都支持 `--dry-run` 标志：

```bash
omc repair --fix-state-pollution --dry-run
```

输出示例：
```
[DRY RUN] Cleaning state pollution...
[DRY RUN] Removing inactive state: autopilot-state.json
[DRY RUN] Cleaned 1 state file(s)
```

---

## 最佳实践

### 状态管理

1. **定期清理**
   ```bash
   # 每周运行一次验证
   omc repair --validate-state
   ```

2. **监控状态大小**
   ```bash
   du -sh .omc/state/
   ```

3. **备份重要状态**
   ```bash
   cp -r .omc/state .omc/state.backup
   ```

### Agent 生命周期

1. **正常退出**
   ```bash
   # 不要直接 Ctrl+C，使用 cancel 命令
   /ultrapower:cancel
   ```

2. **超时处理**
   - 为后台任务设置合理的超时时间
   - 使用 `check_job_status` 监控长时间运行的任务

3. **资源清理**
   ```bash
   # 定期检查孤儿 agent
   ls -lh .omc/agents/
   omc repair --fix-orphan-agents --dry-run
   ```

### 错误处理

1. **捕获详细错误信息**
   ```bash
   # 启用详细日志
   export OMC_LOG_LEVEL=debug
   omc repair --validate-state
   ```

2. **逐步诊断**
   - 先运行 `--dry-run` 预览
   - 确认无误后执行实际修复
   - 检查修复后的状态

3. **恢复策略**
   - 保留 `.omc/state.backup` 作为恢复点
   - 记录修复前的状态快照
   - 必要时使用 git 恢复历史版本

---

## 故障排除流程图

```
遇到问题
  ↓
检查错误信息
  ├─ "State already exists" → 状态污染 → omc repair --fix-state-pollution
  ├─ "Agent timeout" → 孤儿 agent → omc repair --fix-orphan-agents
  ├─ "Invalid JSON" → 状态损坏 → omc repair --validate-state
  └─ 其他错误 → 查看日志 → 手动诊断
  ↓
运行 omc repair --dry-run 预览
  ↓
确认修复内容无误
  ↓
执行实际修复
  ↓
验证问题已解决
```

---

## 常用命令速查

| 场景 | 命令 |
|------|------|
| 快速诊断 | `omc repair` |
| 预览修复 | `omc repair --fix-state-pollution --dry-run` |
| 清理所有问题 | `omc repair --fix-state-pollution --fix-orphan-agents --validate-state` |
| 仅验证状态 | `omc repair --validate-state` |
| 查看状态大小 | `du -sh .omc/state/` |
| 列出活跃 agent | `ls -lh .omc/agents/` |
| 手动清理 agent | `rm -rf .omc/agents/<id>` |

---

## 获取帮助

- 查看 repair 命令帮助：`omc repair --help`
- 查看日志：`cat .omc/logs/*.log`
- 检查状态文件：`cat .omc/state/<mode>-state.json | jq .`
- 提交 issue：https://github.com/anthropics/ultrapower/issues
