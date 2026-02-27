# nexus-daemon

VPS 守护进程，每分钟 git pull 拉取 ultrapower 会话事件，运行进化引擎，生成改进建议。

## 运行

```bash
pip install -r requirements.txt
NEXUS_REPO_PATH=/path/to/nexus-daemon python daemon.py
```

## 测试

```bash
python -m pytest tests/ -v
```

## 数据流：TS → Python

### 概览

```
Claude Code (TS)                    nexus-daemon (Python, VPS)
─────────────────                   ──────────────────────────
PostToolUse hook                    git pull (每 60s)
  │                                   │
  ▼                                   ▼
usage-tracker.ts                    daemon.py
  recordUsage()                       _run_cycle()
  → .omc/axiom/evolution/               │
    usage_metrics.json                  ├─ EvolutionEngine.process_events()
                                        │    detect_patterns()
session-end hook                        │    → evolution/knowledge_base.md
  handleNexusSessionEnd()               │    → evolution/pattern_library.md
  readToolCallsFromMetrics()            │
  collectSessionEvent()               ├─ SelfModifier.apply()
  → .omc/nexus/events/                │    improvements/*.json → skills/*.md
    {sessionId}-{ts}.json             │                        → agents/*.md
                                      │
  git push (session end)            └─ ConsciousnessLoop (每 300s)
                                         periodic reflection
```

### 详细步骤

#### 1. TS 侧：工具调用记录

每次工具调用后，`bridge.ts` 的 PostToolUse hook 触发：

```
bridge.ts PostToolUse
  → usage-tracker.ts recordUsage(event)
      - 过滤空 toolName（guard: if (!event.toolName) return）
      - 提取 skillName（toolName === 'Task' 或 'skill'）
      - 写入 .omc/axiom/evolution/usage_metrics.json
        { agents: {}, skills: {}, tools: { "ToolName": { totalCalls, lastUsed } } }
```

#### 2. TS 侧：会话事件收集

会话结束时，`session-end/index.ts` 触发：

```
session-end hook
  → handleNexusSessionEnd(sessionId, directory)
      - readToolCallsFromMetrics()  ← 从 usage_metrics.json 动态读取
      - collectSessionEvent({ sessionId, toolCalls, modesUsed, ... })
      - 写入 .omc/nexus/events/{sessionId}-{timestamp}.json
      - git push → 推送到远端仓库
```

事件文件格式：
```json
{
  "sessionId": "...",
  "timestamp": "...",
  "toolCalls": [{ "name": "Bash", "count": 11 }],
  "modesUsed": ["autopilot"],
  "duration": 3600
}
```

#### 3. Python 侧：进化引擎

`daemon.py` 每 60 秒执行一次 `_run_cycle()`：

```
_run_cycle()
  1. git_pull()  ← git fetch + rebase origin/main
  2. 读取 .omc/nexus/events/*.json
  3. EvolutionEngine.process_events(events)
       detect_patterns(events)
         - 统计 modesUsed 跨事件出现次数
         - confidence = min(100, 50 + count * 10)
         - PATTERN_THRESHOLD = 3（出现 ≥ 3 次才晋升）
       promoted patterns → 追加写入：
         - evolution/knowledge_base.md
         - evolution/pattern_library.md
  4. 扫描 improvements/*.json
       SelfModifier.apply(improvement)
         - confidence < 70 → skipped
         - targetFile 必须在 skills/ 或 agents/ 下
         - 仅允许 .md 文件
         - 写入新内容到目标文件
  5. git add + commit + push（有变更时）
```

#### 4. 安全边界

| 组件 | 限制 |
|------|------|
| SelfModifier | 只能修改 `skills/*.md` 和 `agents/*.md` |
| SelfModifier | confidence < 70 的改进自动跳过 |
| SelfModifier | 路径遍历检测（resolve + relative_to） |
| EvolutionEngine | 只追加写入，不覆盖现有内容 |
| daemon | git rebase（非 merge），保持历史线性 |
