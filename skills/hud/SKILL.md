---
name: hud
description: 配置 HUD 显示选项（布局、预设、显示元素）
role: config-writer  # 仅文档说明 - 此 skill 写入 ~/.claude/ 路径
scope: ~/.claude/**  # 仅文档说明 - 允许的写入范围
---

# HUD Skill

配置 OMC HUD（Heads-Up Display）状态栏。

注意：本指南中所有 `~/.claude/...` 路径在设置了 `CLAUDE_CONFIG_DIR` 环境变量时均遵循该变量。

## 快速命令

| 命令 | 描述 |
|---------|-------------|
| `/ultrapower:hud` | 显示当前 HUD 状态（如需则自动设置） |
| `/ultrapower:hud setup` | 安装/修复 HUD 状态栏 |
| `/ultrapower:hud minimal` | 切换到最小显示 |
| `/ultrapower:hud focused` | 切换到专注显示（默认） |
| `/ultrapower:hud full` | 切换到完整显示 |
| `/ultrapower:hud status` | 显示详细 HUD 状态 |

## 自动设置

运行 `/ultrapower:hud` 或 `/ultrapower:hud setup` 时，系统将自动：
1. 检查 `~/.claude/hud/omc-hud.mjs` 是否存在
2. 检查 `~/.claude/settings.json` 中是否配置了 `statusLine`
3. 若缺失，创建 HUD 包装脚本并配置设置
4. 报告状态，若有变更则提示重启 Claude Code

**重要**：若参数为 `setup` 或 HUD 脚本不存在于 `~/.claude/hud/omc-hud.mjs`，必须按以下说明直接创建 HUD 文件。

### 设置说明（运行以下命令）

**步骤 1：** 检查是否需要设置：
```bash
node -e "const p=require('path'),f=require('fs'),d=process.env.CLAUDE_CONFIG_DIR||p.join(require('os').homedir(),'.claude');console.log(f.existsSync(p.join(d,'hud','omc-hud.mjs'))?'EXISTS':'MISSING')"
```

**步骤 2：** 验证插件已安装：
```bash
node -e "const p=require('path'),f=require('fs'),d=process.env.CLAUDE_CONFIG_DIR||p.join(require('os').homedir(),'.claude'),b=p.join(d,'plugins','cache','omc','ultrapower');try{const v=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));if(v.length===0){console.log('Plugin not installed - run: /plugin install ultrapower');process.exit()}const l=v[v.length-1],h=p.join(b,l,'dist','hud','index.js');console.log('Version:',l);console.log(f.existsSync(h)?'READY':'NOT_FOUND - try reinstalling: /plugin install ultrapower')}catch{console.log('Plugin not installed - run: /plugin install ultrapower')}"
```

**步骤 3：** 若 omc-hud.mjs 缺失或参数为 `setup`，创建 HUD 目录和脚本：

首先，创建目录：
```bash
node -e "require('fs').mkdirSync(require('path').join(process.env.CLAUDE_CONFIG_DIR||require('path').join(require('os').homedir(),'.claude'),'hud'),{recursive:true})"
```

然后，使用 Write 工具创建 `~/.claude/hud/omc-hud.mjs`，内容如下：

```javascript
#!/usr/bin/env node
/**
 * OMC HUD - Statusline Script
 * Wrapper that imports from plugin cache or development paths
 */

import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Semantic version comparison: returns negative if a < b, positive if a > b, 0 if equal
function semverCompare(a, b) {
  // Use parseInt to handle pre-release suffixes (e.g. "0-beta" -> 0)
  const pa = a.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  const pb = b.replace(/^v/, "").split(".").map(s => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  // If numeric parts equal, non-pre-release > pre-release
  const aHasPre = /-/.test(a);
  const bHasPre = /-/.test(b);
  if (aHasPre && !bHasPre) return -1;
  if (!aHasPre && bHasPre) return 1;
  return 0;
}

async function main() {
  const home = homedir();
  let pluginCacheDir = null;

  // 1. Try plugin cache first (marketplace: omc, plugin: ultrapower)
  const pluginCacheBase = join(home, ".claude/plugins/cache/omc/ultrapower");
  if (existsSync(pluginCacheBase)) {
    try {
      const versions = readdirSync(pluginCacheBase);
      if (versions.length > 0) {
        const latestVersion = versions.sort(semverCompare).reverse()[0];
        pluginCacheDir = join(pluginCacheBase, latestVersion);
        const pluginPath = join(pluginCacheDir, "dist/hud/index.js");
        if (existsSync(pluginPath)) {
          await import(pathToFileURL(pluginPath).href);
          return;
        }
      }
    } catch { /* continue */ }
  }

  // 2. Development paths
  const devPaths = [
    join(home, "Workspace/oh-my-claude-sisyphus/dist/hud/index.js"),
    join(home, "workspace/oh-my-claude-sisyphus/dist/hud/index.js"),
    join(home, "Workspace/ultrapower/dist/hud/index.js"),
    join(home, "workspace/ultrapower/dist/hud/index.js"),
  ];

  for (const devPath of devPaths) {
    if (existsSync(devPath)) {
      try {
        await import(pathToFileURL(devPath).href);
        return;
      } catch { /* continue */ }
    }
  }

  // 3. Fallback - HUD not found (provide actionable error message)
  if (pluginCacheDir) {
    console.log(`[OMC] HUD not built. Run: cd "${pluginCacheDir}" && npm install`);
  } else {
    console.log("[OMC] Plugin not found. Run: /ultrapower:omc-setup");
  }
}

main();
```

**步骤 3（续）：** 设置可执行权限（仅 Unix，Windows 跳过）：
```bash
node -e "if(process.platform==='win32'){console.log('Skipped (Windows)')}else{require('fs').chmodSync(require('path').join(process.env.CLAUDE_CONFIG_DIR||require('path').join(require('os').homedir(),'.claude'),'hud','omc-hud.mjs'),0o755);console.log('Done')}"
```

**步骤 4：** 更新 settings.json 以使用 HUD：

读取 `~/.claude/settings.json`，然后更新/添加 `statusLine` 字段。

**重要：** 命令必须使用绝对路径，而非 `~`，因为 Windows 不会在 shell 命令中展开 `~`。

首先，确定正确路径：
```bash
node -e "const p=require('path').join(require('os').homedir(),'.claude','hud','omc-hud.mjs');console.log(JSON.stringify(p))"
```

然后使用解析后的路径设置 `statusLine` 字段。Unix 上如下所示：
```json
{
  "statusLine": {
    "type": "command",
    "command": "node /home/username/.claude/hud/omc-hud.mjs"
  }
}
```

Windows 上如下所示：
```json
{
  "statusLine": {
    "type": "command",
    "command": "node C:\\Users\\username\\.claude\\hud\\omc-hud.mjs"
  }
}
```

使用 Edit 工具添加/更新此字段，同时保留其他设置。

**步骤 5：** 清理旧 HUD 脚本（如有）：
```bash
node -e "const p=require('path'),f=require('fs'),d=process.env.CLAUDE_CONFIG_DIR||p.join(require('os').homedir(),'.claude'),t=p.join(d,'hud','sisyphus-hud.mjs');try{if(f.existsSync(t)){f.unlinkSync(t);console.log('Removed legacy script')}else{console.log('No legacy script found')}}catch{}"
```

**步骤 6：** 告知用户重启 Claude Code 以使变更生效。

## 显示预设

### 最小（Minimal）
仅显示必要信息：

### 专注（Focused，默认）
显示所有相关元素：
```
[OMC] branch:main | ralph:3/10 | US-002 | ultrawork skill:planner | ctx:67% | agents:2 | bg:3/5 | todos:2/5
```

### 完整（Full）
显示所有内容，包括多行 agent 详情：
```
[OMC] repo:ultrapower branch:main | ralph:3/10 | US-002 (2/5) | ultrawork | ctx:[████░░]67% | agents:3 | bg:3/5 | todos:2/5
├─ O architect    2m   analyzing architecture patterns...
├─ e explore     45s   searching for test files
└─ s executor     1m   implementing validation logic
```

## 多行 Agent 显示

Agent 运行时，HUD 在独立行显示详细信息：
- **树形字符**（`├─`、`└─`）显示视觉层级
- **Agent 代码**（O、e、s）表示 agent 类型及模型层级颜色
- **持续时间** 显示每个 agent 已运行多长时间
- **描述** 显示每个 agent 正在做什么（最多 45 个字符）

## 显示元素

| 元素 | 描述 |
|---------|-------------|
| `[OMC]` | 模式标识符 |
| `repo:name` | Git 仓库名称（青色） |
| `branch:name` | Git 分支名称（青色） |
| `ralph:3/10` | Ralph 循环迭代/最大次数 |
| `US-002` | 当前 PRD story ID |
| `ultrawork` | 活跃模式徽章 |
| `skill:name` | 最后激活的 skill（青色） |
| `ctx:67%` | 上下文窗口使用率 |
| `agents:2` | 运行中的子 agent 数量 |
| `bg:3/5` | 后台任务槽位 |
| `todos:2/5` | 待办完成情况 |

## 颜色编码

- **绿色**：正常/健康
- **黄色**：警告（上下文 >70%，ralph >7）
- **红色**：严重（上下文 >85%，ralph 达到最大值）

## 配置位置

HUD 配置存储于：`~/.claude/.omc/hud-config.json`

## 手动配置

可手动编辑配置文件。每个选项可单独设置 —— 未设置的值将使用默认值。

```json
{
  "preset": "focused",
  "elements": {
    "omcLabel": true,
    "ralph": true,
    "prdStory": true,
    "activeSkills": true,
    "lastSkill": true,
    "contextBar": true,
    "agents": true,
    "backgroundTasks": true,
    "todos": true,
    "showCache": true,
    "showCost": true,
    "maxOutputLines": 4
  },
  "thresholds": {
    "contextWarning": 70,
    "contextCritical": 85,
    "ralphWarning": 7
  }
}
```

## 故障排除

若 HUD 未显示：
1. 运行 `/ultrapower:hud setup` 自动安装并配置
2. 设置完成后重启 Claude Code
3. 若仍不工作，运行 `/ultrapower:omc-doctor` 进行完整诊断

手动验证：
- HUD 脚本：`~/.claude/hud/omc-hud.mjs`
- 设置：`~/.claude/settings.json` 应已配置 `statusLine`

---

*HUD 在活跃会话期间每约 300ms 自动更新。*
