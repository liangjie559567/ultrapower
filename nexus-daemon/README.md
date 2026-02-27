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
