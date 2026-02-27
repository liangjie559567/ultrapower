<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# nexus-daemon/

## Purpose
Nexus 自我改进守护进程，基于 Python 实现。包含意识循环、进化引擎、自我评估和自我修改能力，是 ultrapower 自主进化系统的后端服务。

## Key Files

| 文件 | 描述 |
|------|------|
| `daemon.py` | 主守护进程入口，管理服务生命周期 |
| `consciousness_loop.py` | 意识循环实现，持续监控和反思 |
| `evolution_engine.py` | 进化引擎，处理知识收割和模式检测 |
| `self_evaluator.py` | 自我评估模块，分析执行质量 |
| `self_modifier.py` | 自我修改模块，应用改进建议 |
| `telegram_bot.py` | Telegram 通知集成 |
| `requirements.txt` | Python 依赖列表 |
| `install.sh` | 安装脚本 |
| `nexus-daemon.service` | systemd 服务配置文件 |
| `conftest.py` | pytest 测试配置 |
| `pytest.ini` | pytest 配置文件 |
| `README.md` | Nexus 守护进程文档 |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `tests/` | Python 单元测试和集成测试 |

## For AI Agents

### 运行环境
- Python 3.8+
- 安装依赖：`pip install -r requirements.txt`
- 启动守护进程：`python daemon.py`
- 作为系统服务：`systemctl start nexus-daemon`

### 测试
```bash
cd nexus-daemon
pytest tests/ -v
```

### 修改此目录时
- Python 代码遵循 PEP 8 规范
- 新功能需在 `tests/` 中添加对应测试
- 修改 `requirements.txt` 后需更新 `install.sh`
- 与 TypeScript 层的集成通过 `bridge/gyoshu_bridge.py` 实现

## Dependencies

### Internal
- `bridge/gyoshu_bridge.py` — 与 TypeScript 层的桥接
- `.omc/axiom/evolution/` — 进化数据存储目录

### External
- `asyncio` — 异步 I/O
- `python-telegram-bot` — Telegram 集成

<!-- MANUAL: -->
