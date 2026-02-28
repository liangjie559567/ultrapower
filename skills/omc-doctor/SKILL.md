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
npm view @liangjie559567/ultrapower version 2>/dev/null || echo "Latest: (unavailable)"
```

**诊断**：
- 未安装版本：严重错误——插件未安装
- 已安装版本 != 最新版本：警告——插件已过时
- 存在多个版本：警告——缓存陈旧

### 第一步 bis：检查 npm-cache 复用问题

检查插件缓存目录标注的版本号与实际内容是否一致：

```bash
node -e "
const p=require('path'),f=require('fs'),h=require('os').homedir();
const d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude');
const b=p.join(d,'plugins','cache','omc','ultrapower');
try {
  const vs=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));
  if(!vs.length){console.log('No cache versions found');process.exit();}
  const latest=vs[vs.length-1];
  const pkgPath=p.join(b,latest,'package.json');
  if(f.existsSync(pkgPath)){
    const pkg=JSON.parse(f.readFileSync(pkgPath,'utf-8'));
    if(pkg.version!==latest){
      console.log('MISMATCH: dir='+latest+' pkg.version='+pkg.version);
      console.log('CAUSE: npm-cache reuse (semver range satisfied old version)');
    } else {
      console.log('OK: version matches ('+latest+')');
    }
  } else {
    console.log('WARN: package.json not found in cache/'+latest);
  }
} catch(e){console.log('Error:',e.message);}
"

# 检查 npm-cache 中存储的 semver 范围
node -e "
const p=require('path'),f=require('fs'),h=require('os').homedir();
const d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude');
const npmCachePkg=p.join(d,'plugins','npm-cache','package.json');
if(f.existsSync(npmCachePkg)){
  const pkg=JSON.parse(f.readFileSync(npmCachePkg,'utf-8'));
  const dep=pkg.dependencies&&pkg.dependencies['@liangjie559567/ultrapower'];
  console.log('npm-cache range:',dep||'(not found)');
} else {
  console.log('npm-cache: not present (normal for fresh installs)');
}
"
```

**诊断**：
- `MISMATCH: dir=X pkg.version=Y`：严重错误——npm-cache 复用导致旧内容被安装到新版本目录
- npm-cache range 显示旧版本范围（如 `^5.0.11`）：警告——下次安装仍会复用旧缓存

### 第一步 ter：检查无限嵌套缓存目录

检查插件缓存目录是否存在无限嵌套（Claude Code 安装器 `xF6` bug 导致）：

```bash
node -e "
const p=require('path'),f=require('fs'),h=require('os').homedir();
const d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude');
const b=p.join(d,'plugins','cache','ultrapower','ultrapower');
try {
  const vs=f.readdirSync(b).filter(x=>/^\d/.test(x));
  let found=false;
  for(const v of vs){
    const nested=p.join(b,v,'ultrapower');
    if(f.existsSync(nested)){
      console.log('CRITICAL: nested dir found: '+nested);
      found=true;
    }
  }
  if(!found) console.log('OK: no nested ultrapower/ dirs found');
} catch(e){console.log('Cache not found (normal if not installed)');}
"
```

**诊断**：
- `CRITICAL: nested dir found`：严重错误——安装器 `xF6` bug 导致无限嵌套，插件内容可能损坏
  - 根本原因：`xF6(src, dest)` 先 `mkdir -p dest`，再 `readdir(src)`；因 `dest` 是 `src` 子目录，readdir 包含刚创建的子目录，递归复制时把自身复制进去
  - 加剧因素：`PM1()` 检测目标非空则跳过复制，嵌套一旦产生安装器永远不会自动修复
  - 自动修复：5.0.20+ 的 `postinstall` 脚本会自动检测并修复任意深度嵌套

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
| npm-cache 复用 | OK/WARN/CRITICAL | ... |
| 无限嵌套缓存 | OK/CRITICAL | ... |
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

### 修复：无限嵌套缓存目录

症状：`versionDir/ultrapower/` 子目录存在，插件内容可能损坏。

```bash
# 完整清洁重装（5.0.20+ postinstall 会自动修复残留嵌套）
claude plugin uninstall omc@ultrapower
rm -rf ~/.claude/plugins/npm-cache
rm -rf ~/.claude/plugins/cache/omc
claude plugin marketplace update omc
claude plugin install omc@ultrapower
```

> ✅ 安装 5.0.20+ 后，`postinstall` 脚本会自动检测并修复任意深度嵌套，无需手动干预。

### 修复：npm-cache 复用（插件内容是旧版本）

症状：插件缓存目录版本号与 `package.json` 内 `version` 字段不一致。

```bash
# 完整清洁重装（必须同时清除 npm-cache）
claude plugin uninstall omc@ultrapower
rm -rf ~/.claude/plugins/npm-cache        # 关键：清除 semver 范围缓存
rm -rf ~/.claude/plugins/cache/omc
claude plugin marketplace update omc
claude plugin install omc@ultrapower
```

> ⚠️ 仅清除插件缓存不够——npm-cache 中的 `^` semver 范围会导致安装器继续复用旧内容。

### 修复：陈旧缓存（多个版本）
```bash
# 仅保留最新版本（跨平台）
node -e "const p=require('path'),f=require('fs'),h=require('os').homedir(),d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude'),b=p.join(d,'plugins','cache','omc','ultrapower');try{const v=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));v.slice(0,-1).forEach(x=>f.rmSync(p.join(b,x),{recursive:true,force:true}));console.log('Removed',v.length-1,'old version(s)')}catch(e){console.log('No cache to clean')}"
```

### 修复：缺失/过时的 CLAUDE.md
从 GitHub 获取最新版本并写入 `~/.claude/CLAUDE.md`：
```
WebFetch(url: "https://raw.githubusercontent.com/liangjie559567/ultrapower/main/docs/CLAUDE.md", prompt: "Return the complete raw markdown content exactly as-is")
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
