---
name: omc-doctor
description: 诊断并修复 ultrapower 安装问题
---

# Doctor Skill

注意：本指南中所有 `~/.claude/...` 路径在设置了 `CLAUDE_CONFIG_DIR` 环境变量时均遵循该变量。

## 任务：运行安装诊断

你是 OMC Doctor——负责诊断并修复安装问题。

### 第一步：检查插件版本

```bash
# 获取已安装版本和最新版本（跨平台）
node -e "const p=require('path'),f=require('fs'),h=require('os').homedir(),d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude'),b=p.join(d,'plugins','cache','omc','ultrapower');try{const v=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));console.log('Installed:',v.length?v[v.length-1]:'(none)')}catch{console.log('Installed: (none)')}"
npm view oh-my-claude-sisyphus version 2>/dev/null || echo "Latest: (unavailable)"
```

**诊断**：
- 未安装版本：严重错误——插件未安装
- 已安装版本 != 最新版本：警告——插件已过时
- 存在多个版本：警告——缓存陈旧

### 第二步：检查 settings.json 中的旧版 hook

读取 `~/.claude/settings.json`（用户级）和 `./.claude/settings.json`（项目级），检查是否存在包含以下条目的 `"hooks"` 键：
- `bash $HOME/.claude/hooks/keyword-detector.sh`
- `bash $HOME/.claude/hooks/persistent-mode.sh`
- `bash $HOME/.claude/hooks/session-start.sh`

**诊断**：
- 如果找到：严重错误——旧版 hook 导致重复执行

### 第三步：检查旧版 Bash hook 脚本

```bash
ls -la ~/.claude/hooks/*.sh 2>/dev/null
```

**诊断**：
- 如果存在 `keyword-detector.sh`、`persistent-mode.sh`、`session-start.sh` 或 `stop-continuation.sh`：警告——旧版脚本（可能引起混乱）

### 第四步：检查 CLAUDE.md

```bash
# 检查 CLAUDE.md 是否存在
ls -la ~/.claude/CLAUDE.md 2>/dev/null

# 检查 OMC 标记
grep -q "ultrapower Multi-Agent System" ~/.claude/CLAUDE.md 2>/dev/null && echo "Has OMC config" || echo "Missing OMC config"
```

**诊断**：
- 缺失：严重错误——CLAUDE.md 未配置
- 缺少 OMC 标记：警告——CLAUDE.md 已过时

### 第五步：检查陈旧的插件缓存

```bash
# 统计缓存中的版本数（跨平台）
node -e "const p=require('path'),f=require('fs'),h=require('os').homedir(),d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude'),b=p.join(d,'plugins','cache','omc','ultrapower');try{const v=f.readdirSync(b).filter(x=>/^\d/.test(x));console.log(v.length+' version(s):',v.join(', '))}catch{console.log('0 versions')}"
```

**诊断**：
- 超过 1 个版本：警告——存在多个缓存版本（建议清理）

### 第六步：检查旧版 curl 安装内容

检查通过 curl 安装的旧版 agent、命令和 skill（插件系统之前的方式）：

```bash
# 检查旧版 agents 目录
ls -la ~/.claude/agents/ 2>/dev/null

# 检查旧版 commands 目录
ls -la ~/.claude/commands/ 2>/dev/null

# 检查旧版 skills 目录
ls -la ~/.claude/skills/ 2>/dev/null
```

**诊断**：
- `~/.claude/agents/` 存在且含 ultrapower 相关文件：警告——旧版 agent（现由插件提供）
- `~/.claude/commands/` 存在且含 ultrapower 相关文件：警告——旧版命令（现由插件提供）
- `~/.claude/skills/` 存在且含 ultrapower 相关文件：警告——旧版 skill（现由插件提供）

查找以下文件：
- agents/ 中的 `architect.md`、`document-specialist.md`、`explore.md`、`executor.md` 等
- commands/ 中的 `ultrawork.md`、`deepsearch.md` 等
- skills/ 中任何 ultrapower 相关的 `.md` 文件

---

## 报告格式

运行所有检查后，输出报告：

```
## OMC Doctor 报告

### 摘要
[健康 / 发现问题]

### 检查项

| 检查项 | 状态 | 详情 |
|-------|--------|---------|
| 插件版本 | OK/WARN/CRITICAL | ... |
| 旧版 Hook (settings.json) | OK/CRITICAL | ... |
| 旧版脚本 (~/.claude/hooks/) | OK/WARN | ... |
| CLAUDE.md | OK/WARN/CRITICAL | ... |
| 插件缓存 | OK/WARN | ... |
| 旧版 Agent (~/.claude/agents/) | OK/WARN | ... |
| 旧版命令 (~/.claude/commands/) | OK/WARN | ... |
| 旧版 Skill (~/.claude/skills/) | OK/WARN | ... |

### 发现的问题
1. [问题描述]
2. [问题描述]

### 建议修复方案
[根据问题列出修复方案]
```

---

## 自动修复（用户确认后）

如果发现问题，询问用户："是否希望我自动修复这些问题？"

如果同意，执行修复：

### 修复：settings.json 中的旧版 Hook
从 `~/.claude/settings.json` 中删除 `"hooks"` 部分（保留其他设置）

### 修复：旧版 Bash 脚本
```bash
rm -f ~/.claude/hooks/keyword-detector.sh
rm -f ~/.claude/hooks/persistent-mode.sh
rm -f ~/.claude/hooks/session-start.sh
rm -f ~/.claude/hooks/stop-continuation.sh
```

### 修复：过时的插件
```bash
# 清除插件缓存（跨平台）
node -e "const p=require('path'),f=require('fs'),d=process.env.CLAUDE_CONFIG_DIR||p.join(require('os').homedir(),'.claude'),b=p.join(d,'plugins','cache','omc','ultrapower');try{f.rmSync(b,{recursive:true,force:true});console.log('Plugin cache cleared. Restart Claude Code to fetch latest version.')}catch{console.log('No plugin cache found')}"
```

### 修复：陈旧缓存（多个版本）
```bash
# 仅保留最新版本（跨平台）
node -e "const p=require('path'),f=require('fs'),h=require('os').homedir(),d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude'),b=p.join(d,'plugins','cache','omc','ultrapower');try{const v=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));v.slice(0,-1).forEach(x=>f.rmSync(p.join(b,x),{recursive:true,force:true}));console.log('Removed',v.length-1,'old version(s)')}catch(e){console.log('No cache to clean')}"
```

### 修复：缺失/过时的 CLAUDE.md
从 GitHub 获取最新版本并写入 `~/.claude/CLAUDE.md`：
```
WebFetch(url: "https://raw.githubusercontent.com/Yeachan-Heo/ultrapower/main/docs/CLAUDE.md", prompt: "Return the complete raw markdown content exactly as-is")
```

### 修复：旧版 curl 安装内容

删除旧版 agent、命令和 skill 目录（现由插件提供）：

```bash
# 可选先备份（询问用户）
# mv ~/.claude/agents ~/.claude/agents.bak
# mv ~/.claude/commands ~/.claude/commands.bak
# mv ~/.claude/skills ~/.claude/skills.bak

# 或直接删除
rm -rf ~/.claude/agents
rm -rf ~/.claude/commands
rm -rf ~/.claude/skills
```

**注意**：仅在这些目录包含 ultrapower 相关文件时才删除。如果用户有自定义 agent/命令/skill，请先警告并询问。

---

## 修复后

应用修复后，告知用户：
> 修复已应用。**重启 Claude Code** 使更改生效。
