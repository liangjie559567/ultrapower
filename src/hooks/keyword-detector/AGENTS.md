<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/keyword-detector/

## Purpose
魔法关键词检测 hook。扫描用户输入，识别触发特定执行模式的关键词（如 "autopilot"、"ulw"、"ralph"），并路由到对应的 skill。

## For AI Agents

### 关键词优先级
1. 显式模式关键词（`ulw`、`ultrawork`）覆盖默认值
2. 通用关键词（"fast"/"parallel"）读取配置文件
3. Ralph 包含 ultrawork（持久性包装器）

### 修改此目录时
- 新增关键词需同步更新 `src/features/magic-keywords.ts`
- 更新 `docs/REFERENCE.md` 的魔法关键词部分
- 关键词冲突解决规则在 `src/features/magic-keywords.ts` 中定义

## Dependencies

### Internal
- `src/features/magic-keywords.ts` — 关键词定义和冲突解决
- `scripts/keyword-detector.mjs` — 脚本层关键词检测

<!-- MANUAL: -->
