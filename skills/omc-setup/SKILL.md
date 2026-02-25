---
name: omc-setup
description: 设置和配置 ultrapower（你唯一需要学习的命令）
---

# OMC 设置

这是**你唯一需要学习的命令**。运行此命令后，其他一切都是自动的。

注意：本指南中所有 `~/.claude/...` 路径在设置了 `CLAUDE_CONFIG_DIR` 环境变量时会遵循该变量。

## 预设置检查：已配置？

**关键**：在做任何其他事情之前，检查设置是否已完成。这可以防止用户在每次更新后重新运行完整的设置向导。

```bash
# 检查设置是否已完成
CONFIG_FILE="$HOME/.claude/.omc-config.json"

if [ -f "$CONFIG_FILE" ]; then
  SETUP_COMPLETED=$(jq -r '.setupCompleted // empty' "$CONFIG_FILE" 2>/dev/null)
  SETUP_VERSION=$(jq -r '.setupVersion // empty' "$CONFIG_FILE" 2>/dev/null)

  if [ -n "$SETUP_COMPLETED" ] && [ "$SETUP_COMPLETED" != "null" ]; then
    echo "OMC setup was already completed on: $SETUP_COMPLETED"
    [ -n "$SETUP_VERSION" ] && echo "Setup version: $SETUP_VERSION"
    ALREADY_CONFIGURED="true"
  fi
fi
```

### 如果已配置（且无 --force 标志）

如果 `ALREADY_CONFIGURED` 为 true 且用户未传递 `--force`、`--local` 或 `--global` 标志：

使用 AskUserQuestion 工具提示：

**问题：** "OMC is already configured. What would you like to do?"

**选项：**
1. **Update CLAUDE.md only** - 下载最新 CLAUDE.md 而不重新运行完整设置
2. **Run full setup again** - 完整设置向导
3. **Cancel** - 不做任何更改退出

**如果用户选择"Update CLAUDE.md only"：**
- 检测本地（.claude/CLAUDE.md）或全局（~/.claude/CLAUDE.md）配置是否存在
- 如果本地存在，运行步骤 2A 中的下载/合并脚本
- 如果只有全局存在，运行步骤 2B 中的下载/合并脚本
- 跳过所有其他步骤
- 报告成功并退出

**如果用户选择"Run full setup again"：**
- 继续步骤 0（恢复检测）

**如果用户选择"Cancel"：**
- 不做任何更改退出

### Force 标志覆盖

如果用户传递 `--force` 标志，跳过此检查直接进行设置。

## 优雅中断处理

**重要**：此设置过程在每个步骤后保存进度。如果中断（Ctrl+C 或连接丢失），设置可以从中断处恢复。

### 状态文件位置
- `.omc/state/setup-state.json` - 跟踪已完成的步骤

### 恢复检测（步骤 0）

在开始任何步骤之前，检查现有状态：

```bash
# 检查现有设置状态
STATE_FILE=".omc/state/setup-state.json"

# 跨平台 ISO 日期转 epoch
iso_to_epoch() {
  local iso_date="$1"
  local epoch=""
  # 先尝试 GNU date（Linux）
  epoch=$(date -d "$iso_date" +%s 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$epoch" ]; then
    echo "$epoch"
    return 0
  fi
  # 尝试 BSD/macOS date
  local clean_date=$(echo "$iso_date" | sed 's/[+-][0-9][0-9]:[0-9][0-9]$//' | sed 's/Z$//' | sed 's/T/ /')
  epoch=$(date -j -f "%Y-%m-%d %H:%M:%S" "$clean_date" +%s 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$epoch" ]; then
    echo "$epoch"
    return 0
  fi
  echo "0"
}

if [ -f "$STATE_FILE" ]; then
  # 检查状态是否过期（超过 24 小时）
  TIMESTAMP_RAW=$(jq -r '.timestamp // empty' "$STATE_FILE" 2>/dev/null)
  if [ -n "$TIMESTAMP_RAW" ]; then
    TIMESTAMP_EPOCH=$(iso_to_epoch "$TIMESTAMP_RAW")
    NOW_EPOCH=$(date +%s)
    STATE_AGE=$((NOW_EPOCH - TIMESTAMP_EPOCH))
  else
    STATE_AGE=999999  # 无时间戳时强制重新开始
  fi
  if [ "$STATE_AGE" -gt 86400 ]; then
    echo "Previous setup state is more than 24 hours old. Starting fresh."
    rm -f "$STATE_FILE"
  else
    LAST_STEP=$(jq -r ".lastCompletedStep // 0" "$STATE_FILE" 2>/dev/null || echo "0")
    TIMESTAMP=$(jq -r .timestamp "$STATE_FILE" 2>/dev/null || echo "unknown")
    echo "Found previous setup session (Step $LAST_STEP completed at $TIMESTAMP)"
  fi
fi
```

如果状态存在，使用 AskUserQuestion 提示：

**问题：** "Found a previous setup session. Would you like to resume or start fresh?"

**选项：**
1. **Resume from step $LAST_STEP** - 从中断处继续
2. **Start fresh** - 从头开始（清除已保存状态）

如果用户选择"Start fresh"：
```bash
rm -f ".omc/state/setup-state.json"
echo "Previous state cleared. Starting fresh setup."
```

### 保存进度辅助函数

完成每个主要步骤后保存进度：

```bash
# 保存设置进度（每步后调用）
# 用法：save_setup_progress STEP_NUMBER
save_setup_progress() {
  mkdir -p .omc/state
  cat > ".omc/state/setup-state.json" << EOF
{
  "lastCompletedStep": $1,
  "timestamp": "$(date -Iseconds)",
  "configType": "${CONFIG_TYPE:-unknown}"
}
EOF
}
```

### 完成时清除状态

成功完成设置后（步骤 7/8），删除状态文件：

```bash
rm -f ".omc/state/setup-state.json"
echo "Setup completed successfully. State cleared."
```

## 使用模式

此 skill 处理三种场景：

1. **初始设置（无标志）**：首次安装向导
2. **本地配置（`--local`）**：配置项目特定设置（.claude/CLAUDE.md）
3. **全局配置（`--global`）**：配置全局设置（~/.claude/CLAUDE.md）

## 模式检测

检查用户调用中的标志：
- 如果有 `--local` 标志 → 跳过预设置检查，进入本地配置（步骤 2A）
- 如果有 `--global` 标志 → 跳过预设置检查，进入全局配置（步骤 2B）
- 如果有 `--force` 标志 → 跳过预设置检查，运行初始设置向导（步骤 1）
- 如果无标志 → 先运行预设置检查，如需要再运行初始设置向导（步骤 1）

## 步骤 1：初始设置向导（默认行为）

**注意**：如果恢复且 lastCompletedStep >= 1，根据 configType 跳到相应步骤。

使用 AskUserQuestion 工具提示用户：

**问题：** "Where should I configure ultrapower?"

**选项：**
1. **Local (this project)** - 在当前项目目录创建 `.claude/CLAUDE.md`。最适合项目特定配置。
2. **Global (all projects)** - 创建 `~/.claude/CLAUDE.md` 用于所有 Claude Code session。最适合全局一致行为。

## 步骤 2A：本地配置（--local 标志或用户选择 LOCAL）

**关键**：这始终从 GitHub 下载新鲜的 CLAUDE.md 到本地项目。不要使用 Write 工具——专用 bash curl。

### 创建本地 .claude 目录

```bash
# 在当前项目创建 .claude 目录
mkdir -p .claude && echo ".claude directory ready"
```

### 下载新鲜 CLAUDE.md

```bash
# 定义目标路径
TARGET_PATH=".claude/CLAUDE.md"

# 下载前提取旧版本
OLD_VERSION=$(grep -m1 "^# ultrapower" "$TARGET_PATH" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "none")

# 备份现有文件
if [ -f "$TARGET_PATH" ]; then
  BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
  BACKUP_PATH="${TARGET_PATH}.backup.${BACKUP_DATE}"
  cp "$TARGET_PATH" "$BACKUP_PATH"
  echo "Backed up existing CLAUDE.md to $BACKUP_PATH"
fi

# 下载新鲜 OMC 内容到临时文件
TEMP_OMC=$(mktemp /tmp/omc-claude-XXXXXX.md)
trap 'rm -f "$TEMP_OMC"' EXIT
curl -fsSL "https://raw.githubusercontent.com/Yeachan-Heo/ultrapower/main/docs/CLAUDE.md" -o "$TEMP_OMC"

if [ ! -s "$TEMP_OMC" ]; then
  echo "ERROR: Failed to download CLAUDE.md. Aborting."
  rm -f "$TEMP_OMC"
  return 1
fi

# 从下载内容中剥离现有标记（幂等性）
if grep -q '<!-- OMC:START -->' "$TEMP_OMC"; then
  # 提取标记之间的内容
  sed -n '/<!-- OMC:START -->/,/<!-- OMC:END -->/{//!p}' "$TEMP_OMC" > "${TEMP_OMC}.clean"
  mv "${TEMP_OMC}.clean" "$TEMP_OMC"
fi

if [ ! -f "$TARGET_PATH" ]; then
  # 全新安装：用标记包裹
  {
    echo '<!-- OMC:START -->'
    cat "$TEMP_OMC"
    echo '<!-- OMC:END -->'
  } > "$TARGET_PATH"
  rm -f "$TEMP_OMC"
  echo "Installed CLAUDE.md (fresh)"
else
  # 合并：保留 OMC 标记外的用户内容
  if grep -q '<!-- OMC:START -->' "$TARGET_PATH"; then
    # 有标记：替换 OMC 部分，保留用户内容
    BEFORE_OMC=$(sed -n '1,/<!-- OMC:START -->/{ /<!-- OMC:START -->/!p }' "$TARGET_PATH")
    AFTER_OMC=$(sed -n '/<!-- OMC:END -->/,${  /<!-- OMC:END -->/!p }' "$TARGET_PATH")
    {
      [ -n "$BEFORE_OMC" ] && printf '%s\n' "$BEFORE_OMC"
      echo '<!-- OMC:START -->'
      cat "$TEMP_OMC"
      echo '<!-- OMC:END -->'
      [ -n "$AFTER_OMC" ] && printf '%s\n' "$AFTER_OMC"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Updated OMC section (user customizations preserved)"
  else
    # 无标记：用标记包裹新内容，将旧内容作为用户部分追加
    OLD_CONTENT=$(cat "$TARGET_PATH")
    {
      echo '<!-- OMC:START -->'
      cat "$TEMP_OMC"
      echo '<!-- OMC:END -->'
      echo ""
      echo "<!-- User customizations (migrated from previous CLAUDE.md) -->"
      printf '%s\n' "$OLD_CONTENT"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Migrated existing CLAUDE.md (added OMC markers, preserved old content)"
  fi
  rm -f "$TEMP_OMC"
fi

# 提取新版本并报告
NEW_VERSION=$(grep -m1 "^# ultrapower" "$TARGET_PATH" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
if [ "$OLD_VERSION" = "none" ]; then
  echo "Installed CLAUDE.md: $NEW_VERSION"
elif [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "CLAUDE.md unchanged: $NEW_VERSION"
else
  echo "Updated CLAUDE.md: $OLD_VERSION -> $NEW_VERSION"
fi
```

**注意**：下载的 CLAUDE.md 包含带 `<remember>` 标签的上下文持久化指令，用于在对话压缩后存活。

**注意**：如果找到现有 CLAUDE.md，在下载新版本前会备份到 `.claude/CLAUDE.md.backup.YYYY-MM-DD`。

**强制**：始终运行此命令。不要跳过。不要使用 Write 工具。

**备用方案**（如果 curl 失败）：
告知用户手动从以下地址下载：
https://raw.githubusercontent.com/Yeachan-Heo/ultrapower/main/docs/CLAUDE.md

### 验证插件安装

```bash
grep -q "ultrapower" ~/.claude/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: claude /install-plugin ultrapower"
```

### 确认本地配置成功

完成本地配置后，保存进度并报告：

```bash
# 保存进度 - 步骤 2 完成（本地配置）
mkdir -p .omc/state
cat > ".omc/state/setup-state.json" << EOF
{
  "lastCompletedStep": 2,
  "timestamp": "$(date -Iseconds)",
  "configType": "local"
}
EOF
```

**OMC 项目配置完成**
- CLAUDE.md：已从 GitHub 更新最新配置到 ./.claude/CLAUDE.md
- 备份：之前的 CLAUDE.md 已备份到 `.claude/CLAUDE.md.backup.YYYY-MM-DD`（如存在）
- 范围：**项目** - 仅适用于此项目
- Hooks：由插件提供（无需手动安装）
- Agents：28+ 可用（基础 + 分层变体）
- 模型路由：基于任务复杂度的 Haiku/Sonnet/Opus

**注意**：此配置是项目特定的，不会影响其他项目或全局设置。

如果使用了 `--local` 标志，清除状态并**在此停止**：
```bash
rm -f ".omc/state/setup-state.json"
```
不要继续到 HUD 设置或其他步骤。

## 步骤 3：设置 HUD 状态栏

**注意**：如果恢复且 lastCompletedStep >= 3，跳到步骤 3.5。

HUD 在 Claude Code 状态栏中显示实时状态。**调用 hud skill** 进行设置和配置：

使用 Skill 工具调用：`hud`，参数：`setup`

这将：
1. 将 HUD 包装脚本安装到 `~/.claude/hud/omc-hud.mjs`
2. 在 `~/.claude/settings.json` 中配置 `statusLine`
3. 报告状态并在需要时提示重启

HUD 设置完成后，保存进度：
```bash
mkdir -p .omc/state
CONFIG_TYPE=$(cat ".omc/state/setup-state.json" 2>/dev/null | grep -oE '"configType":\s*"[^"]+"' | cut -d'"' -f4 || echo "unknown")
cat > ".omc/state/setup-state.json" << EOF
{
  "lastCompletedStep": 3,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## 步骤 3.5：清除过期插件缓存

清除旧的缓存插件版本以避免冲突：

```bash
node -e "const p=require('path'),f=require('fs'),h=require('os').homedir(),d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude'),b=p.join(d,'plugins','cache','omc','ultrapower');try{const v=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));if(v.length<=1){console.log('Cache is clean');process.exit()}v.slice(0,-1).forEach(x=>{f.rmSync(p.join(b,x),{recursive:true,force:true})});console.log('Cleared',v.length-1,'stale cache version(s)')}catch{console.log('No cache directory found (normal for new installs)')}"
```

## 步骤 3.6：检查更新

如果有新版本可用，通知用户：

```bash
# 检测已安装版本（跨平台）
node -e "
const p=require('path'),f=require('fs'),h=require('os').homedir();
const d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude');
let v='';
const b=p.join(d,'plugins','cache','omc','ultrapower');
try{const vs=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));if(vs.length)v=vs[vs.length-1]}catch{}
if(v==='')try{const j=JSON.parse(f.readFileSync('.omc-version.json','utf-8'));v=j.version||''}catch{}
if(v==='')for(const c of['.claude/CLAUDE.md',p.join(d,'CLAUDE.md')]){try{const m=f.readFileSync(c,'utf-8').match(/^# ultrapower.*?(v?\d+\.\d+\.\d+)/m);if(m){v=m[1].replace(/^v/,'');break}}catch{}}
console.log('Installed:',v||'(not found)');
"

# 检查 npm 最新版本
LATEST_VERSION=$(npm view @liangjie559567/ultrapower version 2>/dev/null)

if [ -n "$INSTALLED_VERSION" ] && [ -n "$LATEST_VERSION" ]; then
  if [ "$INSTALLED_VERSION" != "$LATEST_VERSION" ]; then
    echo ""
    echo "UPDATE AVAILABLE:"
    echo "  Installed: v$INSTALLED_VERSION"
    echo "  Latest:    v$LATEST_VERSION"
    echo ""
    echo "To update, run: claude /install-plugin ultrapower"
  else
    echo "You're on the latest version: v$INSTALLED_VERSION"
  fi
elif [ -n "$LATEST_VERSION" ]; then
  echo "Latest version available: v$LATEST_VERSION"
fi
```

## 步骤 3.7：设置默认执行模式

使用 AskUserQuestion 工具提示用户：

**问题：** "Which parallel execution mode should be your default when you say 'fast' or 'parallel'?"

**选项：**
1. **ultrawork（最大能力）** - 使用所有 agent 层级，包括 Opus 处理复杂任务。最适合质量最重要的挑战性工作。（推荐）
2. **（token 高效）** - 优先使用 Haiku/Sonnet agents，避免 Opus。最适合希望节省成本的 pro 计划用户。

将偏好存储在 `~/.claude/.omc-config.json` 中：

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# 将 USER_CHOICE 替换为 "ultrawork" 或 ""
echo "$EXISTING" | jq --arg mode "USER_CHOICE" '. + {defaultExecutionMode: $mode, configuredAt: (now | todate)}' > "$CONFIG_FILE"
echo "Default execution mode set to: USER_CHOICE"
```

**注意**：此偏好仅影响通用关键词（"fast"、"parallel"）。明确关键词（"ulw"）始终覆盖此偏好。

## 步骤 3.8：安装 CLI 分析工具（可选）

OMC CLI 提供独立的 token 分析命令（`omc stats`、`omc agents`、`omc tui`）。

CLI（`omc` 命令）**不再支持**通过 npm/bun 全局安装。

所有功能通过插件系统提供：
- 使用 `/ultrapower:omc-help` 获取指导
- 使用 `/ultrapower:omc-doctor` 进行诊断

跳过此步骤——插件提供所有功能。

## 步骤 3.8.5：选择任务管理工具

首先，检测可用的任务工具：

```bash
BD_VERSION=""
if command -v bd &>/dev/null; then
  BD_VERSION=$(bd --version 2>/dev/null | head -1 || echo "installed")
fi

BR_VERSION=""
if command -v br &>/dev/null; then
  BR_VERSION=$(br --version 2>/dev/null | head -1 || echo "installed")
fi

if [ -n "$BD_VERSION" ]; then
  echo "Found beads (bd): $BD_VERSION"
fi
if [ -n "$BR_VERSION" ]; then
  echo "Found beads-rust (br): $BR_VERSION"
fi
if [ -z "$BD_VERSION" ] && [ -z "$BR_VERSION" ]; then
  echo "No external task tools found. Using built-in Tasks."
fi
```

如果**两者都未**检测到，跳过此步骤（默认使用内置）。

如果检测到 beads 或 beads-rust，使用 AskUserQuestion：

**问题：** "Which task management tool should I use for tracking work?"

**选项：**
1. **Built-in Tasks（默认）** - 使用 Claude Code 原生 TaskCreate/TodoWrite。任务仅限 session。
2. **Beads (bd)** - Git 支持的持久化任务。跨 session 存活。[仅在检测到时显示]
3. **Beads-Rust (br)** - beads 的轻量级 Rust 移植版。[仅在检测到时显示]

（仅在检测到对应工具时显示选项 2/3）

存储偏好：

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# USER_CHOICE 根据用户选择为 "builtin"、"beads" 或 "beads-rust"
echo "$EXISTING" | jq --arg tool "USER_CHOICE" '. + {taskTool: $tool, taskToolConfig: {injectInstructions: true, useMcp: false}}' > "$CONFIG_FILE"
echo "Task tool set to: USER_CHOICE"
```

**注意：** beads 上下文指令将在下次 session 启动时自动注入。配置生效无需重启。（--global 标志或用户选择 GLOBAL）

**关键**：这始终从 GitHub 下载新鲜的 CLAUDE.md 到全局配置。不要使用 Write 工具——专用 bash curl。

### 下载新鲜 CLAUDE.md

```bash
# 定义目标路径
TARGET_PATH="$HOME/.claude/CLAUDE.md"

# 下载前提取旧版本
OLD_VERSION=$(grep -m1 "^# ultrapower" "$TARGET_PATH" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "none")

# 备份现有文件
if [ -f "$TARGET_PATH" ]; then
  BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
  BACKUP_PATH="${TARGET_PATH}.backup.${BACKUP_DATE}"
  cp "$TARGET_PATH" "$BACKUP_PATH"
  echo "Backed up existing CLAUDE.md to $BACKUP_PATH"
fi

# 下载新鲜 OMC 内容到临时文件
TEMP_OMC=$(mktemp /tmp/omc-claude-XXXXXX.md)
trap 'rm -f "$TEMP_OMC"' EXIT
curl -fsSL "https://raw.githubusercontent.com/Yeachan-Heo/ultrapower/main/docs/CLAUDE.md" -o "$TEMP_OMC"

if [ ! -s "$TEMP_OMC" ]; then
  echo "ERROR: Failed to download CLAUDE.md. Aborting."
  rm -f "$TEMP_OMC"
  return 1
fi

# 从下载内容中剥离现有标记（幂等性）
if grep -q '<!-- OMC:START -->' "$TEMP_OMC"; then
  sed -n '/<!-- OMC:START -->/,/<!-- OMC:END -->/{//!p}' "$TEMP_OMC" > "${TEMP_OMC}.clean"
  mv "${TEMP_OMC}.clean" "$TEMP_OMC"
fi

if [ ! -f "$TARGET_PATH" ]; then
  {
    echo '<!-- OMC:START -->'
    cat "$TEMP_OMC"
    echo '<!-- OMC:END -->'
  } > "$TARGET_PATH"
  rm -f "$TEMP_OMC"
  echo "Installed CLAUDE.md (fresh)"
else
  if grep -q '<!-- OMC:START -->' "$TARGET_PATH"; then
    BEFORE_OMC=$(sed -n '1,/<!-- OMC:START -->/{ /<!-- OMC:START -->/!p }' "$TARGET_PATH")
    AFTER_OMC=$(sed -n '/<!-- OMC:END -->/,${  /<!-- OMC:END -->/!p }' "$TARGET_PATH")
    {
      [ -n "$BEFORE_OMC" ] && printf '%s\n' "$BEFORE_OMC"
      echo '<!-- OMC:START -->'
      cat "$TEMP_OMC"
      echo '<!-- OMC:END -->'
      [ -n "$AFTER_OMC" ] && printf '%s\n' "$AFTER_OMC"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Updated OMC section (user customizations preserved)"
  else
    OLD_CONTENT=$(cat "$TARGET_PATH")
    {
      echo '<!-- OMC:START -->'
      cat "$TEMP_OMC"
      echo '<!-- OMC:END -->'
      echo ""
      echo "<!-- User customizations (migrated from previous CLAUDE.md) -->"
      printf '%s\n' "$OLD_CONTENT"
    } > "${TARGET_PATH}.tmp"
    mv "${TARGET_PATH}.tmp" "$TARGET_PATH"
    echo "Migrated existing CLAUDE.md (added OMC markers, preserved old content)"
  fi
  rm -f "$TEMP_OMC"
fi

NEW_VERSION=$(grep -m1 "^# ultrapower" "$TARGET_PATH" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
if [ "$OLD_VERSION" = "none" ]; then
  echo "Installed CLAUDE.md: $NEW_VERSION"
elif [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "CLAUDE.md unchanged: $NEW_VERSION"
else
  echo "Updated CLAUDE.md: $OLD_VERSION -> $NEW_VERSION"
fi
```

**注意**：如果找到现有 CLAUDE.md，在下载新版本前会备份到 `~/.claude/CLAUDE.md.backup.YYYY-MM-DD`。

### 清理旧版 Hooks（如存在）

检查旧的手动 hooks 是否存在并删除以防止重复：

```bash
# 删除旧版 bash hook 脚本（现由插件系统处理）
rm -f ~/.claude/hooks/keyword-detector.sh
rm -f ~/.claude/hooks/stop-continuation.sh
rm -f ~/.claude/hooks/persistent-mode.sh
rm -f ~/.claude/hooks/session-start.sh
echo "Legacy hooks cleaned"
```

检查 `~/.claude/settings.json` 中的手动 hook 条目。如果"hooks"键存在且有指向 bash 脚本的 UserPromptSubmit、Stop 或 SessionStart 条目，通知用户：

> **注意**：在 settings.json 中发现旧版 hooks。由于插件现在自动提供 hooks，应将其删除。从 ~/.claude/settings.json 中删除"hooks"部分以防止重复执行。

### 验证插件安装

```bash
grep -q "ultrapower" ~/.claude/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: claude /install-plugin ultrapower"
```

### 确认全局配置成功

完成全局配置后，保存进度并报告：

```bash
mkdir -p .omc/state
cat > ".omc/state/setup-state.json" << EOF
{
  "lastCompletedStep": 2,
  "timestamp": "$(date -Iseconds)",
  "configType": "global"
}
EOF
```

**OMC 全局配置完成**
- CLAUDE.md：已从 GitHub 更新最新配置到 ~/.claude/CLAUDE.md
- 备份：之前的 CLAUDE.md 已备份到 `~/.claude/CLAUDE.md.backup.YYYY-MM-DD`（如存在）
- 范围：**全局** - 适用于所有 Claude Code session
- Hooks：由插件提供（无需手动安装）
- Agents：28+ 可用（基础 + 分层变体）
- 模型路由：基于任务复杂度的 Haiku/Sonnet/Opus

**注意**：Hooks 现在由插件系统自动管理。无需手动安装 hooks。

如果使用了 `--global` 标志，清除状态并**在此停止**：
```bash
rm -f ".omc/state/setup-state.json"
```
不要继续到 HUD 设置或其他步骤。

## 步骤 3：设置 HUD 状态栏

**注意**：如果恢复且 lastCompletedStep >= 3，跳到步骤 3.5。

HUD 在 Claude Code 状态栏中显示实时状态。**调用 hud skill** 进行设置和配置：

使用 Skill 工具调用：`hud`，参数：`setup`

这将：
1. 将 HUD 包装脚本安装到 `~/.claude/hud/omc-hud.mjs`
2. 在 `~/.claude/settings.json` 中配置 `statusLine`
3. 报告状态并在需要时提示重启

HUD 设置完成后，保存进度：
```bash
mkdir -p .omc/state
CONFIG_TYPE=$(cat ".omc/state/setup-state.json" 2>/dev/null | grep -oE '"configType":\s*"[^"]+"' | cut -d'"' -f4 || echo "unknown")
cat > ".omc/state/setup-state.json" << EOF
{
  "lastCompletedStep": 3,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## 步骤 3.5：清除过期插件缓存

清除旧的缓存插件版本以避免冲突：

```bash
node -e "const p=require('path'),f=require('fs'),h=require('os').homedir(),d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude'),b=p.join(d,'plugins','cache','omc','ultrapower');try{const v=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));if(v.length<=1){console.log('Cache is clean');process.exit()}v.slice(0,-1).forEach(x=>{f.rmSync(p.join(b,x),{recursive:true,force:true})});console.log('Cleared',v.length-1,'stale cache version(s)')}catch{console.log('No cache directory found (normal for new installs)')}"
```

## 步骤 3.6：检查更新

如果有新版本可用，通知用户：

```bash
node -e "
const p=require('path'),f=require('fs'),h=require('os').homedir();
const d=process.env.CLAUDE_CONFIG_DIR||p.join(h,'.claude');
let v='';
const b=p.join(d,'plugins','cache','omc','ultrapower');
try{const vs=f.readdirSync(b).filter(x=>/^\d/.test(x)).sort((a,c)=>a.localeCompare(c,void 0,{numeric:true}));if(vs.length)v=vs[vs.length-1]}catch{}
if(v==='')try{const j=JSON.parse(f.readFileSync('.omc-version.json','utf-8'));v=j.version||''}catch{}
if(v==='')for(const c of['.claude/CLAUDE.md',p.join(d,'CLAUDE.md')]){try{const m=f.readFileSync(c,'utf-8').match(/^# ultrapower.*?(v?\d+\.\d+\.\d+)/m);if(m){v=m[1].replace(/^v/,'');break}}catch{}}
console.log('Installed:',v||'(not found)');
"

LATEST_VERSION=$(npm view @liangjie559567/ultrapower version 2>/dev/null)

if [ -n "$INSTALLED_VERSION" ] && [ -n "$LATEST_VERSION" ]; then
  if [ "$INSTALLED_VERSION" != "$LATEST_VERSION" ]; then
    echo "UPDATE AVAILABLE:"
    echo "  Installed: v$INSTALLED_VERSION"
    echo "  Latest:    v$LATEST_VERSION"
    echo "To update, run: claude /install-plugin ultrapower"
  else
    echo "You're on the latest version: v$INSTALLED_VERSION"
  fi
elif [ -n "$LATEST_VERSION" ]; then
  echo "Latest version available: v$LATEST_VERSION"
fi
```

## 步骤 3.7：设置默认执行模式

使用 AskUserQuestion 工具提示用户：

**问题：** "Which parallel execution mode should be your default when you say 'fast' or 'parallel'?"

**选项：**
1. **ultrawork（最大能力）** - 使用所有 agent 层级，包括 Opus 处理复杂任务。最适合质量最重要的挑战性工作。（推荐）
2. **（token 高效）** - 优先使用 Haiku/Sonnet agents，避免 Opus。最适合希望节省成本的 pro 计划用户。

将偏好存储在 `~/.claude/.omc-config.json` 中：

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"
if [ -f "$CONFIG_FILE" ]; then EXISTING=$(cat "$CONFIG_FILE"); else EXISTING='{}'; fi
echo "$EXISTING" | jq --arg mode "USER_CHOICE" '. + {defaultExecutionMode: $mode, configuredAt: (now | todate)}' > "$CONFIG_FILE"
echo "Default execution mode set to: USER_CHOICE"
```

**注意**：此偏好仅影响通用关键词（"fast"、"parallel"）。明确关键词（"ulw"）始终覆盖此偏好。

## 步骤 3.8：安装 CLI 分析工具（可选）

CLI（`omc` 命令）**不再支持**通过 npm/bun 全局安装。

所有功能通过插件系统提供：
- 使用 `/ultrapower:omc-help` 获取指导
- 使用 `/ultrapower:omc-doctor` 进行诊断

跳过此步骤——插件提供所有功能。

## 步骤 3.8.5：选择任务管理工具

首先，检测可用的任务工具：

```bash
BD_VERSION=""; if command -v bd &>/dev/null; then BD_VERSION=$(bd --version 2>/dev/null | head -1 || echo "installed"); fi
BR_VERSION=""; if command -v br &>/dev/null; then BR_VERSION=$(br --version 2>/dev/null | head -1 || echo "installed"); fi
[ -n "$BD_VERSION" ] && echo "Found beads (bd): $BD_VERSION"
[ -n "$BR_VERSION" ] && echo "Found beads-rust (br): $BR_VERSION"
[ -z "$BD_VERSION" ] && [ -z "$BR_VERSION" ] && echo "No external task tools found. Using built-in Tasks."
```

如果**两者都未**检测到，跳过此步骤（默认使用内置）。

如果检测到 beads 或 beads-rust，使用 AskUserQuestion：

**问题：** "Which task management tool should I use for tracking work?"

**选项：**
1. **Built-in Tasks（默认）** - 使用 Claude Code 原生 TaskCreate/TodoWrite。任务仅限 session。
2. **Beads (bd)** - Git 支持的持久化任务。跨 session 存活。[仅在检测到时显示]
3. **Beads-Rust (br)** - beads 的轻量级 Rust 移植版。[仅在检测到时显示]

存储偏好：

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"
if [ -f "$CONFIG_FILE" ]; then EXISTING=$(cat "$CONFIG_FILE"); else EXISTING='{}'; fi
echo "$EXISTING" | jq --arg tool "USER_CHOICE" '. + {taskTool: $tool, taskToolConfig: {injectInstructions: true, useMcp: false}}' > "$CONFIG_FILE"
echo "Task tool set to: USER_CHOICE"
```

**注意：** beads 上下文指令将在下次 session 启动时自动注入。配置生效无需重启。

## 步骤 4：验证插件安装

```bash
grep -q "ultrapower" ~/.claude/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: claude /install-plugin ultrapower"
```

## 步骤 5：提供 MCP 服务器配置

MCP 服务器通过额外工具（网络搜索、GitHub 等）扩展 Claude Code。

询问用户："Would you like to configure MCP servers for enhanced capabilities? (Context7, Exa search, GitHub, etc.)"

如果是，调用 mcp-setup skill：
```
/ultrapower:mcp-setup
```

如果否，跳到下一步。

## 步骤 5.5：配置 Agent Teams（可选）

**注意**：如果恢复且 lastCompletedStep >= 5.5，跳到步骤 6。

Agent teams 是 Claude Code 的实验性功能，允许你生成 N 个协调 agent 处理共享任务列表并进行 agent 间消息传递。**Teams 默认禁用**，需要通过 `settings.json` 启用。

参考：https://code.claude.com/docs/en/agent-teams

使用 AskUserQuestion 工具提示：

**问题：** "Would you like to enable agent teams? Teams let you spawn coordinated agents (e.g., `/team 3:executor 'fix all errors'`). This is an experimental Claude Code feature."

**选项：**
1. **Yes, enable teams（推荐）** - 启用实验性功能并配置默认值
2. **No, skip** - 保持 teams 禁用（可以稍后启用）

### 如果用户选择 YES：

#### 步骤 5.5.1：在 settings.json 中启用 Agent Teams

**关键**：Agent teams 需要在 `~/.claude/settings.json` 中设置 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`。必须谨慎操作以保留现有用户设置。

首先，读取当前 settings.json：

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
  echo "Current settings.json found"
  cat "$SETTINGS_FILE"
else
  echo "No settings.json found - will create one"
fi
```

然后使用 Read 工具读取 `~/.claude/settings.json`（如存在）。使用 Edit 工具合并 teams 配置，同时保留所有现有设置。

**如果 settings.json 存在且有 `env` 键**，将新环境变量合并进去：

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

使用 jq 安全合并而不覆盖现有设置：

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
  TEMP_FILE=$(mktemp)
  jq '.env = (.env // {} | . + {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"})' "$SETTINGS_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$SETTINGS_FILE"
  echo "Added CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS to existing settings.json"
else
  mkdir -p "$(dirname "$SETTINGS_FILE")"
  cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
SETTINGS_EOF
  echo "Created settings.json with teams enabled"
fi
```

**重要**：在可能的情况下，Edit 工具是修改 settings.json 的首选，因为它保留格式和注释。上面的 jq 方法是需要结构合并时的备用方案。

#### 步骤 5.5.2：配置 Teammate 显示模式

使用 AskUserQuestion 工具：

**问题：** "How should teammates be displayed?"

**选项：**
1. **Auto（推荐）** - 在 tmux 中使用分割窗格，否则在进程内。适合大多数用户。
2. **In-process** - 所有 teammate 在主终端中。使用 Shift+Up/Down 选择。随处可用。
3. **Split panes (tmux)** - 每个 teammate 在独立窗格中。需要 tmux 或 iTerm2。

如果用户选择"Auto"以外的选项，将 `teammateMode` 添加到 settings.json：

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"
# TEAMMATE_MODE 根据用户选择为 "in-process" 或 "tmux"
jq --arg mode "TEAMMATE_MODE" '. + {teammateMode: $mode}' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"
echo "Teammate display mode set to: TEAMMATE_MODE"
```

#### 步骤 5.5.3：在 omc-config 中配置 Team 默认值

使用 AskUserQuestion 工具提出多个问题：

**问题 1：** "How many agents should teams spawn by default?"

**选项：**
1. **3 agents（推荐）** - 速度和资源使用的良好平衡
2. **5 agents（最大）** - 大型任务的最大并行性
3. **2 agents** - 保守，适合较小项目

**问题 2：** "Which agent type should teammates use by default?"

**选项：**
1. **executor（推荐）** - 通用代码实现 agent
2. **build-fixer** - 专门用于构建/类型错误修复
3. **designer** - 专门用于 UI/前端工作

将 team 配置存储在 `~/.claude/.omc-config.json` 中：

```bash
CONFIG_FILE="$HOME/.claude/.omc-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"
if [ -f "$CONFIG_FILE" ]; then EXISTING=$(cat "$CONFIG_FILE"); else EXISTING='{}'; fi
echo "$EXISTING" | jq \
  --argjson maxAgents MAX_AGENTS \
  --arg agentType "AGENT_TYPE" \
  '. + {team: {maxAgents: $maxAgents, defaultAgentType: $agentType, monitorIntervalMs: 30000, shutdownTimeoutMs: 15000}}' > "$CONFIG_FILE"
echo "Team configuration saved: Max agents: MAX_AGENTS, Default agent: AGENT_TYPE"
```

**注意：** Teammate 没有单独的模型默认值。每个 teammate 是继承你配置模型的完整 Claude Code session。Teammate 生成的 subagent 可以使用任何模型层级。

#### 验证 settings.json 完整性

所有修改后，验证 settings.json 是有效 JSON 且包含预期键：

```bash
SETTINGS_FILE="$HOME/.claude/settings.json"
if jq empty "$SETTINGS_FILE" 2>/dev/null; then
  echo "settings.json: valid JSON"
else
  echo "ERROR: settings.json is invalid JSON!"
  exit 1
fi
if jq -e '.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS' "$SETTINGS_FILE" > /dev/null 2>&1; then
  echo "Agent teams: ENABLED"
else
  echo "WARNING: Agent teams env var not found in settings.json"
fi
echo "Final settings.json:"; jq '.' "$SETTINGS_FILE"
```

### 如果用户选择 NO：

跳过此步骤。Agent teams 将保持禁用。用户可以稍后通过添加到 `~/.claude/settings.json` 来启用：
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

或通过运行 `/ultrapower:omc-setup --force` 并选择启用 teams。

### 保存进度

```bash
mkdir -p .omc/state
CONFIG_TYPE=$(cat ".omc/state/setup-state.json" 2>/dev/null | grep -oE '"configType":\s*"[^"]+"' | cut -d'"' -f4 || echo "unknown")
cat > ".omc/state/setup-state.json" << EOF
{
  "lastCompletedStep": 5.5,
  "timestamp": "$(date -Iseconds)",
  "configType": "$CONFIG_TYPE"
}
EOF
```

## 步骤 6：检测从 2.x 升级

检查用户是否有现有配置：
```bash
ls ~/.claude/commands/ralph-loop.md 2>/dev/null || ls ~/.claude/commands/ultrawork.md 2>/dev/null
```

如果找到，这是从 2.x 的升级。

## 步骤 7：显示欢迎消息

### 新用户：

```
OMC Setup Complete!

You don't need to learn any commands. I now have intelligent behaviors that activate automatically.

WHAT HAPPENS AUTOMATICALLY:
- Complex tasks -> I parallelize and delegate to specialists
- "plan this" -> I start a planning interview
- "don't stop until done" -> I persist until verified complete
- "stop" or "cancel" -> I intelligently stop current operation

MAGIC KEYWORDS (optional power-user shortcuts):
Just include these words naturally in your request:

| Keyword | Effect | Example |
|---------|--------|---------|
| ralph | Persistence mode | "ralph: fix the auth bug" |
| ralplan | Iterative planning | "ralplan this feature" |
| ulw | Max parallelism | "ulw refactor the API" |
| eco | Token-efficient mode | "eco refactor the API" |
| plan | Planning interview | "plan the new endpoints" |
| team | Coordinated agents | "/team 3:executor fix errors" |

**ralph includes ultrawork:** When you activate ralph mode, it automatically includes ultrawork's parallel execution. No need to combine keywords.

TEAMS:
Spawn coordinated agents with shared task lists and real-time messaging:
- /ultrapower:team 3:executor "fix all TypeScript errors"
- /ultrapower:team 5:build-fixer "fix build errors in src/"
Teams use Claude Code native tools (TeamCreate/SendMessage/TaskCreate).

MCP SERVERS:
Run /ultrapower:mcp-setup to add tools like web search, GitHub, etc.

HUD STATUSLINE:
The status bar now shows OMC state. Restart Claude Code to see it.

That's it! Just use Claude Code normally.
```

### 从 2.x 升级的用户：

```
OMC Setup Complete! (Upgraded from 2.x)

GOOD NEWS: Your existing commands still work!
- /ralph, /ultrawork, /plan, etc. all still function

WHAT'S NEW in 3.0:
You no longer NEED those commands. Everything is automatic now:
- Just say "don't stop until done" instead of /ralph
- Just say "fast" or "parallel" instead of /ultrawork
- Just say "plan this" instead of /plan
- Just say "stop" instead of /cancel

MAGIC KEYWORDS (power-user shortcuts):

| Keyword | Same as old... | Example |
|---------|----------------|---------|
| ralph | /ralph | "ralph: fix the bug" |
| ralplan | /ralplan | "ralplan this feature" |
| ulw | /ultrawork | "ulw refactor API" |
| eco | (new!) | "eco fix all errors" |
| plan | /plan | "plan the endpoints" |
| team | (new!) | "/team 3:executor fix errors" |

TEAMS (NEW!):
Spawn coordinated agents with shared task lists and real-time messaging:
- /ultrapower:team 3:executor "fix all TypeScript errors"
- Uses Claude Code native tools (TeamCreate/SendMessage/TaskCreate)

HUD STATUSLINE:
The status bar now shows OMC state. Restart Claude Code to see it.

Your workflow won't break - it just got easier!
```

## 步骤 8：询问是否为仓库加星

首先，检查 `gh` CLI 是否可用且已认证：

```bash
gh auth status &>/dev/null
```

### 如果 gh 可用且已认证：

使用 AskUserQuestion 工具提示用户：

**问题：** "If you're enjoying ultrapower, would you like to support the project by starring it on GitHub?"

**选项：**
1. **Yes, star it!** - 为仓库加星
2. **No thanks** - 跳过，不再提示
3. **Maybe later** - 跳过，不再提示

如果用户选择"Yes, star it!"：

```bash
gh api -X PUT /user/starred/Yeachan-Heo/ultrapower 2>/dev/null && echo "Thanks for starring!" || true
```

**注意：** 如果 API 调用失败，静默失败——绝不阻塞设置完成。

### 如果 gh 不可用或未认证：

```bash
echo ""
echo "If you enjoy ultrapower, consider starring the repo:"
echo "  https://github.com/Yeachan-Heo/ultrapower"
echo ""
```

### 清除设置状态并标记完成

步骤 8 完成后（无论是否加星），清除临时状态并标记设置为已完成：

```bash
rm -f ".omc/state/setup-state.json"

CONFIG_FILE="$HOME/.claude/.omc-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

OMC_VERSION=""
if [ -f ".claude/CLAUDE.md" ]; then
  OMC_VERSION=$(grep -m1 "^# ultrapower" .claude/CLAUDE.md 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
elif [ -f "$HOME/.claude/CLAUDE.md" ]; then
  OMC_VERSION=$(grep -m1 "^# ultrapower" "$HOME/.claude/CLAUDE.md" 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
fi

if [ -f "$CONFIG_FILE" ]; then EXISTING=$(cat "$CONFIG_FILE"); else EXISTING='{}'; fi
echo "$EXISTING" | jq --arg ts "$(date -Iseconds)" --arg ver "$OMC_VERSION" \
  '. + {setupCompleted: $ts, setupVersion: $ver}' > "$CONFIG_FILE"

echo "Setup completed successfully!"
echo "Note: Future updates will only refresh CLAUDE.md, not the full setup wizard."
```

## 保持更新

安装 ultrapower 更新后（通过 npm 或插件更新）：

**自动**：只需运行 `/ultrapower:omc-setup` - 它会检测你已配置并提供快速"Update CLAUDE.md only"选项，跳过完整向导。

**手动选项**：
- `/ultrapower:omc-setup --local` 仅更新项目配置
- `/ultrapower:omc-setup --global` 仅更新全局配置
- `/ultrapower:omc-setup --force` 重新运行完整向导（重新配置偏好）

这确保你拥有最新功能和 agent 配置，而无需重复完整设置的 token 成本。

## 帮助文本

当用户运行 `/ultrapower:omc-setup --help` 或仅 `--help` 时，显示：

```
OMC Setup - Configure ultrapower

USAGE:
  /ultrapower:omc-setup           Run initial setup wizard (or update if already configured)
  /ultrapower:omc-setup --local   Configure local project (.claude/CLAUDE.md)
  /ultrapower:omc-setup --global  Configure global settings (~/.claude/CLAUDE.md)
  /ultrapower:omc-setup --force   Force full setup wizard even if already configured
  /ultrapower:omc-setup --help    Show this help

MODES:
  Initial Setup (no flags)
    - Interactive wizard for first-time setup
    - Configures CLAUDE.md (local or global)
    - Sets up HUD statusline
    - Checks for updates
    - Offers MCP server configuration
    - Configures team mode defaults (agent count, type, model)
    - If already configured, offers quick update option

  Local Configuration (--local)
    - Downloads fresh CLAUDE.md to ./.claude/
    - Backs up existing CLAUDE.md to .claude/CLAUDE.md.backup.YYYY-MM-DD
    - Project-specific settings
    - Use this to update project config after OMC upgrades

  Global Configuration (--global)
    - Downloads fresh CLAUDE.md to ~/.claude/
    - Backs up existing CLAUDE.md to ~/.claude/CLAUDE.md.backup.YYYY-MM-DD
    - Applies to all Claude Code sessions
    - Cleans up legacy hooks
    - Use this to update global config after OMC upgrades

  Force Full Setup (--force)
    - Bypasses the "already configured" check
    - Runs the complete setup wizard from scratch
    - Use when you want to reconfigure preferences

EXAMPLES:
  /ultrapower:omc-setup           # First time setup (or update CLAUDE.md if configured)
  /ultrapower:omc-setup --local   # Update this project
  /ultrapower:omc-setup --global  # Update all projects
  /ultrapower:omc-setup --force   # Re-run full setup wizard

For more info: https://github.com/Yeachan-Heo/ultrapower
```
