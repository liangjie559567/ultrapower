# 本地插件安装

如何将 ultrapower 从本地开发目录作为 Claude Code 插件安装。

## 快速安装

```bash
# 1. 将本地目录添加为 marketplace
claude plugin marketplace add /path/to/ultrapower

# 2. 从本地 marketplace 安装插件
claude plugin install omc@ultrapower

# 3. 重启 Claude Code 以加载插件
```

## 命令参考

```bash
# 列出已配置的 marketplace
claude plugin marketplace list

# 更新 marketplace（从源重新读取）
claude plugin marketplace update omc

# 更新已安装的插件
claude plugin update omc@ultrapower

# 列出已安装的插件
claude plugin list

# 卸载
claude plugin uninstall omc@ultrapower

# 移除 marketplace
claude plugin marketplace remove omc
```

## 插件结构

插件需要一个 `plugin.json` 清单文件：

```json
{
  "name": "ultrapower",
  "version": "3.4.0",
  "description": "Multi-agent orchestration system for Claude Code",
  "hooks": {
    "PreToolUse": ["scripts/pre-tool-enforcer.mjs"],
    "PostToolUse": ["scripts/post-tool-verifier.mjs"],
    "SessionStart": ["scripts/session-start.mjs"]
  },
  "agents": ["agents/*.md"],
  "commands": ["commands/**/*.md"],
  "skills": ["skills/*.md"]
}
```

## 开发工作流

对插件进行修改后：

```bash
# 1. 构建（如有 TypeScript 变更）
npm run build

# 2. 更新 marketplace 缓存
claude plugin marketplace update omc

# 3. 更新已安装的插件
claude plugin update omc@ultrapower

# 4. 重启 Claude Code 会话
```

## 与 npm 全局安装的对比

| 方式 | 命令 | 文件位置 |
|--------|---------|----------------|
| 插件 | `claude plugin install` | `~/.claude/plugins/cache/` |
| npm 全局 | `npm install -g` | `~/.claude/agents/`, `~/.claude/commands/` |

**推荐使用插件模式** — 它将文件隔离存放，并使用原生 Claude Code 插件系统，通过 `${CLAUDE_PLUGIN_ROOT}` 变量进行路径解析。

## 故障排除

**插件未加载：**
- 安装后重启 Claude Code
- 检查 `claude plugin list` 显示状态为"enabled"
- 验证 plugin.json 存在且为有效 JSON

**显示旧版本：**
- 缓存目录名称可能显示旧版本，但实际代码来自最新提交
- 运行 `claude plugin marketplace update` 然后 `claude plugin update`
