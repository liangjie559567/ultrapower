# Axiom 错误分析报告：HUD 不显示

**分析时间**: 2026-03-11T12:22:58Z
**问题**: 用户安装完项目后 HUD 不显示

## 根因诊断

### ✅ 已验证正常的部分
1. **HUD 文件存在**: `~/.claude/hud/omc-hud.mjs` ✓
2. **插件缓存完整**: `~/.claude/plugins/cache/omc/ultrapower/7.0.3/dist/hud/index.js` ✓
3. **配置正确**: `settings.json` 中 `statusLine` 配置正确 ✓
4. **HUD 可执行**: 测试运行成功，输出正常 ✓
5. **Node.js 环境**: v24.13.0 正常 ✓

### 🔍 问题定位

**HUD 实际上在工作！** 测试输出显示：
```
[OMC#7.0.3] | session:0m | 🟢 | ~$0.0090 | 1.0k | 缓存: 0.0%
```

**可能的原因**：

1. **Claude Code 未重启** - statusLine 配置需要重启 Claude Code 才能生效
2. **终端不支持 ANSI 颜色** - Windows 终端可能不显示格式化输出
3. **Safe Mode 启用** - Windows 平台自动启用 safe mode，可能影响显示

## 修复方案

### 方案 1：重启 Claude Code（推荐）
```bash
# 完全退出 Claude Code，然后重新启动
# statusLine 配置只在启动时加载
```

### 方案 2：检查终端兼容性
HUD 在 Windows 上自动启用 safe mode（src/hud/index.ts:474）：
```typescript
const useSafeMode = config.elements.safeMode || process.platform === 'win32';
```

这会移除 ANSI 颜色码，使用纯 ASCII 输出。

### 方案 3：手动测试 HUD
```bash
# 在项目目录运行
echo '{"cwd":"'$(pwd)'","transcript_path":"test.jsonl","context_window":{"current_usage":{"input_tokens":1000}}}' | node ~/.claude/hud/omc-hud.mjs
```

## 验证步骤

1. 完全退出 Claude Code
2. 重新启动 Claude Code
3. 打开任意项目
4. 检查状态栏是否显示 `[OMC#7.0.3]`

## 预期结果

重启后应该看到类似输出：
```
[OMC#7.0.3] | session:Xm | 🟢 | ~$X.XX | X.Xk | 缓存: X.X%
```

## 备用方案

如果重启后仍不显示，运行：
```bash
/ultrapower:omc-setup
```

这会重新配置所有 hooks 和 statusLine。
