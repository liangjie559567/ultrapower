# Ultrapower 示例项目

这是一个 Ultrapower (OMC) 的示例项目，展示基本配置和使用方法。

## 快速开始

1. 初始化配置：
```bash
omc setup
```

2. 查看可用 agents：
```bash
omc agents
```

3. 在 Claude Code 中使用：
- `/autopilot` - 全自主执行
- `/team` - 多 agent 协作
- `/ralph` - 持久循环执行

## 项目结构

```
.omc/
├── config.json          # 项目配置
├── state/              # 运行时状态
└── plans/              # 规划文档
```

## 常用命令

- `omc stats` - 查看统计信息
- `omc cost` - 查看成本分析
- `omc sessions` - 查看会话历史

## 更多信息

访问 https://github.com/liangjie559567/ultrapower
