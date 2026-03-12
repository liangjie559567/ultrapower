# Axiom 错误分析报告：HUD 不显示问题

**分析时间**: 2026-03-11T14:49:16.169Z
**问题描述**: 用户安装完项目后 HUD 不显示
**严重程度**: P2 - 用户体验问题（非功能性缺陷）

---

## 1. 根因诊断

### 问题定位

**表象**：用户执行 `node ~/.claude/hud/omc-hud.mjs` 看到错误提示 `[OMC] run /omc-setup to install properly`

**根因**：HUD 入口点的 stdin 检查逻辑过于严格，导致误导性错误提示

**代码位置**：`src/hud/index.ts:329-333`

```typescript
const stdin = await readStdin();

if (!stdin) {
  // No stdin - suggest setup
  console.log("[OMC] run /omc-setup to install properly");
  return;
}
```

### 问题分析

1. **TTY 模式检测**：`readStdin()` 在 TTY 模式（交互式终端）下返回 `null`
2. **错误提示不准确**：用户手动测试时触发 TTY 检测，看到安装提示，误以为 HUD 未安装
3. **实际状态**：HUD 在 Claude Code 环境中（非 TTY）能正常工作

### 验证证据

```bash
# 场景 1：手动执行（TTY 模式）
$ node omc-hud.mjs
[OMC] run /omc-setup to install properly  # ❌ 误导性提示

# 场景 2：管道输入（非 TTY，模拟 Claude Code）
$ echo '{}' | node omc-hud.mjs
[OMC#7.0.3] | session:0m | 🟢 | ~$0.0000  # ✅ 正常工作
```

---

## 2. 配置验证

### 已验证项目

✅ **HUD 脚本存在**：`C:\Users\ljyih\.claude\hud\omc-hud.mjs`
✅ **settings.json 配置正确**：
```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:/Users/ljyih/.claude/hud/omc-hud.mjs"
  }
}
```
✅ **插件缓存完整**：`~/.claude/plugins/cache/liangjie559567/ultrapower/7.0.3/dist/hud/index.js`
✅ **HUD 功能正常**：管道输入测试通过

---

## 3. 修复方案

### 方案 A：改进错误提示（推荐）

**目标**：区分"安装问题"和"等待输入"两种情况

**实现**：
