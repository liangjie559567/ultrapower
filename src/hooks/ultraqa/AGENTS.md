<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/ultraqa/

## Purpose
UltraQA 模式 hook。实现 QA 循环工作流：测试 → 验证 → 修复 → 重复，直到所有测试通过。由 autopilot 模式自动激活。

## For AI Agents

### UltraQA 循环
```
运行测试 → 分析失败 → 修复代码 → 重新测试 → 全部通过? → 完成 : 继续
```

### 状态文件
- `.omc/state/ultraqa-state.json`

### 修改此目录时
- UltraQA 由 autopilot 激活，修改需考虑 autopilot 的触发逻辑
- 参见 `skills/ultraqa/SKILL.md` 了解 skill 定义

## Dependencies

### Internal
- `src/hooks/autopilot/` — 激活 ultraqa 的父模式
- `skills/ultraqa/SKILL.md` — UltraQA skill 定义

<!-- MANUAL: -->
