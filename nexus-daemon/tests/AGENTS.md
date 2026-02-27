<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# nexus-daemon/tests/

## Purpose
Nexus 守护进程测试目录。包含 Python 单元测试，覆盖意识循环、进化引擎、自我评估器、自我修改器和 Telegram bot 等核心模块的功能验证。

## Key Files

| File | Description |
|------|-------------|
| `conftest.py` | pytest 测试配置和共享 fixtures |
| `test_consciousness_loop.py` | 意识循环模块测试 |
| `test_daemon.py` | 守护进程主循环测试 |
| `test_evolution_engine.py` | 进化引擎测试 |
| `test_self_evaluator.py` | 自我评估器测试 |
| `test_self_modifier.py` | 自我修改器测试 |
| `test_telegram_bot.py` | Telegram bot 集成测试 |

## For AI Agents

### 修改此目录时
- 运行测试：`cd nexus-daemon && python -m pytest tests/`
- 参见 `nexus-daemon/` 了解被测模块实现

## Dependencies

### Internal
- `nexus-daemon/` — 被测 Python 模块

<!-- MANUAL: -->
