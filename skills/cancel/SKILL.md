---
name: cancel
description: 取消任何活跃的 OMC 模式（autopilot、ralph、ultrawork、ultraqa、swarm、ultrapilot、pipeline、team）
---

# Cancel Skill

智能取消，自动检测并取消活跃的 OMC 模式。

**cancel skill 是完成并退出任何 OMC 模式的标准方式。**
当 stop hook 检测到工作完成时，它会指示 LLM 调用此 skill 进行正确的状态清理。若 cancel 失败或被中断，使用 `--force` 标志重试，或等待 2 小时过期超时作为最后手段。

## 功能

自动检测活跃模式并取消：
- **Autopilot**：停止工作流，保留进度以便恢复
- **Ralph**：停止持久化循环，如适用则清理关联的 ultrawork
- **Ultrawork**：停止并行执行（独立或关联）
- **UltraQA**：停止 QA 循环工作流
- **Swarm**：停止协调 agent swarm，释放已认领的任务
- **Ultrapilot**：停止并行 autopilot worker
- **Pipeline**：停止顺序 agent pipeline
- **Team**：向所有队友发送 shutdown_request，等待响应，调用 TeamDelete，清理关联的 ralph（如存在）
- **Team+Ralph（关联）**：先取消 team（优雅关闭），再清理 ralph 状态。关联时取消 ralph 也会先取消 team。

## 用法

```
/ultrapower:cancel
```

或说："cancelomc"、"stopomc"

## 自动检测

`/ultrapower:cancel` 遵循会话感知状态契约：
- 默认情况下，命令通过 `state_list_active` 和 `state_get_status` 检查当前会话，导航 `.omc/state/sessions/{sessionId}/…` 发现活跃模式。
- 当提供或已知 session id 时，该会话范围路径具有权威性。仅当 session id 缺失或为空时，才将 `.omc/state/*.json` 中的旧版文件作为兼容性回退。
- Swarm 是共享的 SQLite/marker 模式（`.omc/state/swarm.db` / `.omc/state/swarm-active.marker`），不在会话范围内。
- 默认清理流程使用 session id 调用 `state_clear`，仅删除匹配的会话文件；模式保持绑定到其原始会话。

活跃模式仍按依赖顺序取消：
1. Autopilot（包含关联的 ralph/ultraqa/ 清理）
2. Ralph（清理其关联的 ultrawork）
3. Ultrawork（独立）
4. UltraQA（独立）
6. Swarm（独立）
7. Ultrapilot（独立）
8. Pipeline（独立）
9. Team（Claude Code 原生）
10. Plan Consensus（独立）

## 强制清除全部

当需要清除每个会话及旧版产物时使用 `--force` 或 `--all`，例如完全重置工作区。

```
/ultrapower:cancel --force
```

```
/ultrapower:cancel --all
```

Steps under the hood:
1. `state_list_active` enumerates `.omc/state/sessions/{sessionId}/…` to find every known session.
2. `state_clear` runs once per session to drop that session’s files.
3. A global `state_clear` without `session_id` removes legacy files under `.omc/state/*.json`, `.omc/state/swarm*.db`, and compatibility artifacts (see list).
4. Team artifacts (`~/.claude/teams/*/`, `~/.claude/tasks/*/`, `.omc/state/team-state.json`) are best-effort cleared as part of the legacy fallback.

Every `state_clear` command honors the `session_id` argument, so even force mode still uses the session-aware paths first before deleting legacy files.

Legacy compatibility list (removed only under `--force`/`--all`):
- `.omc/state/autopilot-state.json`
- `.omc/state/ralph-state.json`
- `.omc/state/ralph-plan-state.json`
- `.omc/state/ralph-verification.json`
- `.omc/state/ultrawork-state.json`
- `.omc/state/ultraqa-state.json`
- `.omc/state/swarm.db`
- `.omc/state/swarm.db-wal`
- `.omc/state/swarm.db-shm`
- `.omc/state/swarm-active.marker`
- `.omc/state/swarm-tasks.db`
- `.omc/state/ultrapilot-state.json`
- `.omc/state/ultrapilot-ownership.json`
- `.omc/state/pipeline-state.json`
- `.omc/state/plan-consensus.json`
- `.omc/state/ralplan-state.json`
- `.omc/state/boulder.json`
- `.omc/state/hud-state.json`
- `.omc/state/subagent-tracking.json`
- `.omc/state/subagent-tracker.lock`
- `.omc/state/rate-limit-daemon.pid`
- `.omc/state/rate-limit-daemon.log`
- `.omc/state/checkpoints/` (directory)
- `.omc/state/sessions/` (empty directory cleanup after clearing sessions)

## Implementation Steps

When you invoke this skill:

### 1. Parse Arguments

```bash
# Check for --force or --all flags
FORCE_MODE=false
if [[ "$*" == *"--force"* ]] || [[ "$*" == *"--all"* ]]; then
  FORCE_MODE=true
fi
```

### 2. Detect Active Modes

The skill now relies on the session-aware state contract rather than hard-coded file paths:
1. Call `state_list_active` to enumerate `.omc/state/sessions/{sessionId}/…` and discover every active session.
2. For each session id, call `state_get_status` to learn which mode is running (`autopilot`, `ralph`, `ultrawork`, etc.) and whether dependent modes exist.
3. If a `session_id` was supplied to `/ultrapower:cancel`, skip legacy fallback entirely and operate solely within that session path; otherwise, consult legacy files in `.omc/state/*.json` only if the state tools report no active session. Swarm remains a shared SQLite/marker mode outside session scoping.
4. Any cancellation logic in this doc mirrors the dependency order discovered via state tools (autopilot → ralph → …).

### 3A. Force Mode (if --force or --all)

Use force mode to clear every session plus legacy artifacts via `state_clear`. Direct file removal is reserved for legacy cleanup when the state tools report no active sessions.

### 3B. Smart Cancellation (default)

#### If Team Active (Claude Code native)

Teams are detected by checking for config files in `~/.claude/teams/`:

```bash
# Check for active teams
TEAM_CONFIGS=$(find ~/.claude/teams -name config.json -maxdepth 2 2>/dev/null)
```

**Two-pass cancellation protocol:**

**Pass 1: Graceful Shutdown**
```
For each team found in ~/.claude/teams/:
  1. Read config.json to get team_name and members list
  2. For each non-lead member:
     a. Send shutdown_request via SendMessage
     b. Wait up to 15 seconds for shutdown_response
     c. If response received: member terminates and is auto-removed
     d. If timeout: mark member as unresponsive, continue to next
  3. Log: "Graceful pass: X/Y members responded"
```

**Pass 2: Reconciliation**
```
After graceful pass:
  1. Re-read config.json to check remaining members
  2. If only lead remains (or config is empty): proceed to TeamDelete
  3. If unresponsive members remain:
     a. Wait 5 more seconds (they may still be processing)
     b. Re-read config.json again
     c. If still stuck: attempt TeamDelete anyway
     d. If TeamDelete fails: report manual cleanup path
```

**TeamDelete + Cleanup:**
```
  1. Call TeamDelete() — removes ~/.claude/teams/{name}/ and ~/.claude/tasks/{name}/
  2. Clear team state: state_clear(mode="team")
  3. Check for linked ralph: state_read(mode="ralph") — if linked_team is true:
     a. Clear ralph state: state_clear(mode="ralph")
     b. Clear linked ultrawork if present: state_clear(mode="ultrawork")
  4. Emit structured cancel report
```

**Structured Cancel Report:**
```
Team "{team_name}" cancelled:
  - Members signaled: N
  - Responses received: M
  - Unresponsive: K (list names if any)
  - TeamDelete: success/failed
  - Manual cleanup needed: yes/no
    Path: ~/.claude/teams/{name}/ and ~/.claude/tasks/{name}/
```

**Implementation note:** The cancel skill is executed by the LLM, not as a bash script. When you detect an active team:
1. Read `~/.claude/teams/*/config.json` to find active teams
2. If multiple teams exist, cancel oldest first (by `createdAt`)
3. For each non-lead member, call `SendMessage(type: "shutdown_request", recipient: member-name, content: "Cancelling")`
4. Wait briefly for shutdown responses (15s per member timeout)
5. Re-read config.json to check for remaining members (reconciliation pass)
6. Call `TeamDelete()` to clean up
7. Remove any local state: `rm -f .omc/state/team-state.json`
8. Report structured summary to user

#### If Autopilot Active

Call `cancelAutopilot()` from `src/hooks/autopilot/cancel.ts:27-78`:

```bash
# Autopilot handles its own cleanup + ralph + ultraqa
# Just mark autopilot as inactive (preserves state for resume)
if [[ -f .omc/state/autopilot-state.json ]]; then
  # Clean up ralph if active
  if [[ -f .omc/state/ralph-state.json ]]; then
    RALPH_STATE=$(cat .omc/state/ralph-state.json)
    LINKED_UW=$(echo "$RALPH_STATE" | jq -r '.linked_ultrawork // false')

    # Clean linked ultrawork first
    if [[ "$LINKED_UW" == "true" ]] && [[ -f .omc/state/ultrawork-state.json ]]; then
      rm -f .omc/state/ultrawork-state.json
      echo "Cleaned up: ultrawork (linked to ralph)"
    fi

    # Clean ralph
    rm -f .omc/state/ralph-state.json
    rm -f .omc/state/ralph-verification.json
    echo "Cleaned up: ralph"
  fi

  # Clean up ultraqa if active
  if [[ -f .omc/state/ultraqa-state.json ]]; then
    rm -f .omc/state/ultraqa-state.json
    echo "Cleaned up: ultraqa"
  fi

  # Mark autopilot inactive but preserve state
  CURRENT_STATE=$(cat .omc/state/autopilot-state.json)
  CURRENT_PHASE=$(echo "$CURRENT_STATE" | jq -r '.phase // "unknown"')
  echo "$CURRENT_STATE" | jq '.active = false' > .omc/state/autopilot-state.json

  echo "Autopilot cancelled at phase: $CURRENT_PHASE. Progress preserved for resume."
  echo "Run /ultrapower:autopilot to resume."
fi
```

#### If Ralph Active (but not Autopilot)

Call `clearRalphState()` + `clearLinkedUltraworkState()` from `src/hooks/ralph-loop/index.ts:147-182`:

```bash
if [[ -f .omc/state/ralph-state.json ]]; then
  # Check if ultrawork is linked
  RALPH_STATE=$(cat .omc/state/ralph-state.json)
  LINKED_UW=$(echo "$RALPH_STATE" | jq -r '.linked_ultrawork // false')

  # Clean linked ultrawork first
  if [[ "$LINKED_UW" == "true" ]] && [[ -f .omc/state/ultrawork-state.json ]]; then
    UW_STATE=$(cat .omc/state/ultrawork-state.json)
    UW_LINKED=$(echo "$UW_STATE" | jq -r '.linked_to_ralph // false')

    # Only clear if it was linked to ralph
    if [[ "$UW_LINKED" == "true" ]]; then
      rm -f .omc/state/ultrawork-state.json
      echo "Cleaned up: ultrawork (linked to ralph)"
    fi
  fi

  # Clean ralph state
  rm -f .omc/state/ralph-state.json
  rm -f .omc/state/ralph-plan-state.json
  rm -f .omc/state/ralph-verification.json

  echo "Ralph cancelled. Persistent mode deactivated."
fi
```

#### If Ultrawork Active (standalone, not linked)

Call `deactivateUltrawork()` from `src/hooks/ultrawork/index.ts:150-173`:

```bash
if [[ -f .omc/state/ultrawork-state.json ]]; then
  # Check if linked to ralph
  UW_STATE=$(cat .omc/state/ultrawork-state.json)
  LINKED=$(echo "$UW_STATE" | jq -r '.linked_to_ralph // false')

  if [[ "$LINKED" == "true" ]]; then
    echo "Ultrawork is linked to Ralph. Use /ultrapower:cancel to cancel both."
    exit 1
  fi

  # Remove local state
  rm -f .omc/state/ultrawork-state.json

  echo "Ultrawork cancelled. Parallel execution mode deactivated."
fi
```

#### If UltraQA Active (standalone)

Call `clearUltraQAState()` from `src/hooks/ultraqa/index.ts:107-120`:

```bash
if [[ -f .omc/state/ultraqa-state.json ]]; then
  rm -f .omc/state/ultraqa-state.json
  echo "UltraQA cancelled. QA cycling workflow stopped."
fi
```

#### No Active Modes

```bash
echo "No active OMC modes detected."
echo ""
echo "Checked for:"
echo "  - Autopilot (.omc/state/autopilot-state.json)"
echo "  - Ralph (.omc/state/ralph-state.json)"
echo "  - Ultrawork (.omc/state/ultrawork-state.json)"
echo "  - UltraQA (.omc/state/ultraqa-state.json)"
echo ""
echo "Use --force to clear all state files anyway."
```

## 实现说明

cancel skill 运行如下：
1. 解析 `--force` / `--all` 标志，跟踪清理是否应跨越每个会话或仅限于当前 session id。
2. 使用 `state_list_active` 枚举已知 session id，使用 `state_get_status` 了解每个会话的活跃模式（`autopilot`、`ralph`、`ultrawork` 等）。
3. 在默认模式下，使用该 session_id 调用 `state_clear` 仅删除会话文件，然后根据状态工具信号运行模式特定清理（autopilot → ralph → …）。
4. 在强制模式下，迭代每个活跃会话，每个会话调用 `state_clear`，然后不带 `session_id` 运行全局 `state_clear` 删除旧版文件（`.omc/state/*.json`、兼容性产物）并报告成功。Swarm 仍是会话范围外的共享 SQLite/marker 模式。
5. Team 产物（`~/.claude/teams/*/`、`~/.claude/tasks/*/`、`.omc/state/team-state.json`）在旧版/全局传递期间作为尽力清理项目。

状态工具始终遵守 `session_id` 参数，因此即使强制模式也会在删除仅兼容性旧版状态之前先清理会话范围路径。

以下模式特定子节描述每个处理程序在状态范围操作完成后执行的额外清理。

## 消息参考

| 模式 | 成功消息 |
|------|-----------------|
| Autopilot | "Autopilot cancelled at phase: {phase}. Progress preserved for resume." |
| Ralph | "Ralph cancelled. Persistent mode deactivated." |
| Ultrawork | "Ultrawork cancelled. Parallel execution mode deactivated." |
| UltraQA | "UltraQA cancelled. QA cycling workflow stopped." |
| Swarm | "Swarm cancelled. Coordinated agents stopped." |
| Ultrapilot | "Ultrapilot cancelled. Parallel autopilot workers stopped." |
| Pipeline | "Pipeline cancelled. Sequential agent chain stopped." |
| Team | "Team cancelled. Teammates shut down and cleaned up." |
| Plan Consensus | "Plan Consensus cancelled. Planning session ended." |
| Force | "All OMC modes cleared. You are free to start fresh." |
| None | "No active OMC modes detected." |

## 保留内容

| 模式 | 状态是否保留 | 恢复命令 |
|------|-----------------|----------------|
| Autopilot | 是（阶段、文件、规格说明、计划、裁决） | `/ultrapower:autopilot` |
| Ralph | 否 | N/A |
| Ultrawork | 否 | N/A |
| UltraQA | 否 | N/A |
| Swarm | 否 | N/A |
| Ultrapilot | 否 | N/A |
| Pipeline | 否 | N/A |
| Plan Consensus | 是（计划文件路径保留） | N/A |

## 说明

- **依赖感知**：Autopilot 取消时清理 Ralph 和 UltraQA
- **关联感知**：Ralph 取消时清理关联的 Ultrawork
- **安全**：仅清理关联的 Ultrawork，保留独立的 Ultrawork
- **仅本地**：清理 `.omc/state/` 目录中的状态文件
- **恢复友好**：Autopilot 状态保留以便无缝恢复
- **Team 感知**：检测原生 Claude Code team 并执行优雅关闭

## MCP Worker 清理

取消可能已生成 MCP worker（team bridge 守护进程）的模式时，cancel skill 还应：

1. **检查活跃 MCP worker**：在 `.omc/state/team-bridge/{team}/*.heartbeat.json` 查找心跳文件
2. **发送关闭信号**：为每个活跃 worker 写入关闭信号文件
3. **终止 tmux 会话**：为每个 worker 运行 `tmux kill-session -t omc-team-{team}-{worker}`
4. **清理心跳文件**：删除 team 的所有心跳文件
5. **清理影子注册表**：删除 `.omc/state/team-mcp-workers.json`

### 强制清除附加项

使用 `--force` 时，还需清理：
```bash
rm -rf .omc/state/team-bridge/       # Heartbeat files
rm -f .omc/state/team-mcp-workers.json  # Shadow registry
# Kill all omc-team-* tmux sessions
tmux list-sessions -F '#{session_name}' 2>/dev/null | grep '^omc-team-' | while read s; do tmux kill-session -t "$s" 2>/dev/null; done
```
