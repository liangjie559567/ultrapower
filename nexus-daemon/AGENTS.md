<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-28 -->

# nexus-daemon/

## Purpose
Nexus 多维智能自进化系统，基于 Python 实现。包含 15 个子系统：模式检测、健康评估、异常检测、推荐引擎、瓶颈分析、自我反思、知识图谱、经验传播、提示词优化、记忆模型、代码健康评分、综合仪表盘、模块注册、自我修改和守护进程。由 NexusIntegrator 编排为 8 步故障隔离管线。

## Key Files

| 文件 | 描述 |
|------|------|
| `nexus_integrator.py` | 中央编排器，8 步管线 + 故障隔离 |
| `ci_gate.py` | CI 四门验证（导入/测试/集成/健康） |
| `evolution_engine.py` | 进化引擎，模式检测与知识收割 |
| `self_evaluator.py` | 多维健康评估（5 维度评分） |
| `anomaly_detector.py` | Z-score/IQR 异常检测 |
| `recommendation_engine.py` | 协同过滤推荐引擎 |
| `bottleneck_analyzer.py` | 失败率/错误率/资源瓶颈分析 |
| `reflexion.py` | 自我反思循环引擎 |
| `knowledge_graph.py` | 知识图谱构建与查询 |
| `experience_sharing.py` | 跨会话经验传播 |
| `prompt_optimizer.py` | 提示词优化器 |
| `memory_model.py` | 记忆衰减模型 |
| `code_health_scorer.py` | 代码可维护性评分 |
| `evolution_dashboard.py` | 综合仪表盘（8 区域） |
| `module_registry.py` | 模块注册与发现 |
| `self_modifier.py` | 自我修改器 |
| `daemon.py` | 主守护进程入口 |
| `consciousness_loop.py` | 意识循环 |
| `telegram_bot.py` | Telegram 通知集成 |
| `conftest.py` | pytest 测试配置 |
| `pytest.ini` | pytest 配置文件 |
| `README.md` | 项目文档 |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `tests/` | 375 个单元测试和集成测试（17 个测试文件） |

## For AI Agents

### 运行环境
- Python 3.10+
- 安装依赖：`pip install -r requirements.txt`
- 启动守护进程：`python daemon.py`
- 作为系统服务：`systemctl start nexus-daemon`

### 测试
```bash
cd nexus-daemon
pytest tests/ -v              # 完整测试（375 tests）
python ci_gate.py             # CI 四门验证
```

### 修改此目录时
- Python 代码遵循 PEP 8 规范
- 新模块需在 `tests/` 中添加 `test_<module>.py`
- 新模块需在 `nexus_integrator.py:verify_subsystems()` 中注册
- 运行 `python ci_gate.py` 确认四门全部通过
- 与 TypeScript 层的集成通过 session-end hook 的事件文件实现

### 架构要点
- NexusIntegrator 是中央编排器，8 步管线每步独立捕获异常
- 单个子系统失败不阻塞其他步骤（故障隔离）
- IntegrationResult.success 为 True 当且仅当 errors 列表为空
- CI gate 要求 15/15 子系统可导入 + 375 测试全通过

## Dependencies

### Internal
- `.omc/nexus/events/` — 会话事件 JSON 文件
- `.omc/axiom/evolution/` — 进化数据存储目录

### External
- `asyncio` — 异步 I/O
- `python-telegram-bot` — Telegram 集成

<!-- MANUAL: -->
