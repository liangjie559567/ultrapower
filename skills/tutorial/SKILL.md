---
name: tutorial
description: 交互式教程系统，通过3个实战场景帮助新用户快速掌握核心功能
trigger: ["tutorial", "onboarding", "getting started"]
---

# Tutorial Skill

启动交互式教程系统，通过3个实战场景帮助新用户快速掌握 ultrapower 核心功能。

## 使用方式

```
/ultrapower:tutorial
```

## 教程场景

1. **实现功能** - 学习使用 autopilot 从想法到代码
2. **修复Bug** - 学习使用 analyze 诊断问题  
3. **代码审查** - 学习使用 code-review 保证质量

## 特性

- 首次启动自动提示
- 支持中断恢复
- 随时可跳过
- 预计完成时间：15分钟

## 实现

调用 `TutorialEngine.checkAndRun()` 启动教程流程。
