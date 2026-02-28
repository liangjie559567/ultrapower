<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-28 -->

# nexus-daemon/tests/

## Purpose
Nexus 自进化系统测试目录。包含 375 个 Python 单元测试，覆盖 15 个子系统的功能验证、故障隔离、集成管线和持久化。

## Key Files

| File | Description |
|------|-------------|
| `conftest.py` | pytest 测试配置和共享 fixtures |
| `test_nexus_integrator.py` | 中央编排器测试（管线、故障隔离、持久化、子系统验证） |
| `test_evolution_engine.py` | 进化引擎测试（模式检测、知识收割） |
| `test_self_evaluator.py` | 多维健康评估测试 |
| `test_anomaly_detector.py` | Z-score/IQR 异常检测测试 |
| `test_recommendation_engine.py` | 协同过滤推荐测试 |
| `test_bottleneck_analyzer.py` | 瓶颈分析测试（失败率、错误率、资源、错误集中度） |
| `test_reflexion.py` | 自我反思循环测试 |
| `test_knowledge_graph.py` | 知识图谱测试 |
| `test_experience_sharing.py` | 经验传播测试 |
| `test_prompt_optimizer.py` | 提示词优化测试 |
| `test_memory_model.py` | 记忆衰减模型测试 |
| `test_code_health_scorer.py` | 代码健康评分测试 |
| `test_evolution_dashboard.py` | 综合仪表盘测试 |
| `test_consciousness_loop.py` | 意识循环测试 |
| `test_daemon.py` | 守护进程主循环测试 |
| `test_self_modifier.py` | 自我修改器测试 |
| `test_telegram_bot.py` | Telegram bot 集成测试 |

## For AI Agents

### 修改此目录时
- 运行测试：`cd nexus-daemon && python -m pytest tests/ -v`
- 运行 CI 门禁：`cd nexus-daemon && python ci_gate.py`
- 新模块必须有对应的 `test_<module>.py`
- 故障隔离测试使用 `patch("builtins.__import__")` 模式
- 参见 `nexus-daemon/` 了解被测模块实现

## Dependencies

### Internal
- `nexus-daemon/` — 被测 Python 模块（15 个子系统）

<!-- MANUAL: -->
