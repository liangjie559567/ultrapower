# 插件市场升级验证报告

**版本**: 5.5.14
**验证时间**: 2026-03-05
**验证环境**: Windows 11

---

## ✅ 插件结构验证

### marketplace.json

```json
{
  "name": "omc",
  "plugins": [{
    "name": "ultrapower",
    "version": "5.5.14",
    "source": {
      "source": "npm",
      "package": "@liangjie559567/ultrapower",
      "version": "5.5.14"
    }
  }]
}
```
✓ Marketplace 名称: `omc`（已从 `ultrapower` 迁移）
✓ 插件名称: `ultrapower`
✓ npm 包源配置正确

### plugin.json

```json
{
  "name": "ultrapower",
  "version": "5.5.14"
}
```
✓ 无 `hooks` 字段（通过 hooks/hooks.json 自动发现）
✓ 无 `agents` 字段（通过 agents/ 目录自动发现）

---

## ✅ 组件清单

### Agents: 50 个

```
accessibility-auditor.md, analyst.md, api-designer.md, api-reviewer.md,
architect.md, axiom-* (14个), build-fixer.md, code-reviewer.md, ...
```

### Skills: 72 个

```
analyze, autopilot, ax-* (14个), brainstorming, build-fix, cancel,
ccg, code-review, configure-*, deepinit, deepsearch, ...
```

### Hooks: 14 个事件类型

```json
{
  "SessionStart": [...],
  "PreToolUse": [...],
  "PostToolUse": [...],
  "PostToolUseFailure": [...],
  "Stop": [...],
  "SubagentStop": [...],
  "PreCompact": [...],
  "TeammateIdle": [...],
  "SessionEnd": [...],
  "UserPromptSubmit": [...],
  "PermissionRequest": [...],
  "TaskCompleted": [...],
  "SubagentStart": [...],
  "Notification": [...]
}
```

✓ 所有 hooks 使用 `${CLAUDE_PLUGIN_ROOT}/templates/hooks/*.mjs` 路径

---

## ✅ 构建产物

### dist/ 目录

```
agents/, analytics/, audit/, cli/, commands/, compatibility/,
config/, constants/, core/, features/, hud/, hooks/, lib/,
mcp/, state/, tools/, types/, utils/, index.js
```

✓ TypeScript 编译完成
✓ CLI 入口点存在
✓ HUD 模块已构建

### bridge/ 目录

```
mcp-server.cjs, codex-server.cjs, gemini-server.cjs, team-bridge.cjs
```

✓ MCP 服务器已打包
✓ Codex/Gemini 代理已嵌入 50+ agent prompts

---

## 📋 插件市场安装流程

### 用户操作步骤

**步骤 1: 添加 marketplace**
```
/plugin marketplace add <https://github.com/liangjie559567/ultrapower>
```

**步骤 2: 安装插件**
```
/plugin install omc@ultrapower
```

**步骤 3: 重启 Claude Code**

**步骤 4: 验证安装**
```
/ultrapower:omc-help
/ax-status
```

---

## 🔧 自动发现机制

Claude Code 插件系统会自动发现：

1. **Hooks**: `hooks/hooks.json` → 注册 14 个事件类型
2. **Agents**: `agents/*.md` → 加载 50 个 agent 提示
3. **Skills**: `skills/*/SKILL.md` → 注册 72 个 skills
4. **Commands**: `commands/*.md` → 注册斜杠命令

**关键**: plugin.json 不应包含 `hooks`/`agents` 字段，否则会导致 Zod 验证失败。

---

## ✅ postinstall 修复验证

运行 `node scripts/plugin-setup.mjs` 输出：
```
[OMC] Running post-install setup...
[OMC] Updated npm-cache version range: ^5.5.13 -> 5.5.14
[OMC] Wrote .claude-plugin/plugin.json in install dir
[OMC] Installed HUD wrapper script
[OMC] Configured HUD statusLine in settings.json
[OMC] Setup complete!
```

✓ npm-cache 版本锁定已修复
✓ plugin.json 已重建
✓ HUD 已配置

---

## 🎯 升级路径验证

### 从 5.2.x → 5.5.14

**自动迁移项**:

* Marketplace 名称: `ultrapower` → `omc`

* 状态文件路径: `~/.claude/.omc/` → `{worktree}/.omc/`

* plugin.json 格式: 移除 hooks/agents 字段

**用户操作**:
```
/plugin update ultrapower

# 重启 Claude Code

```

---

## ✅ 结论

**插件市场升级流程完整可靠**

* 所有组件完整（50 agents, 72 skills, 14 hook types）

* 自动发现机制正常工作

* postinstall 修复所有已知问题

* marketplace.json 配置正确

**推荐升级方式**: 插件市场更新（最简单）
```
/plugin update ultrapower
```
