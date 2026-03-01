---
name: ax-export
description: "/ax-export — Axiom 系统导出：将 Axiom 配置打包为可移植 zip，支持模板模式和完整模式"
---

# Axiom 系统导出

本 skill 将 Axiom 系统配置导出为可移植的 zip 包，用于迁移、备份或分享。

**开始时宣告：** "I'm using the ax-export skill to export the Axiom system."

## 导出模式

### 模板模式（template）

导出干净的 Axiom 框架，不含项目特定数据：
- Axiom Skill 文件（`skills/ax-*/SKILL.md`）
- Agent 提示词（`agents/axiom-*.md`）
- 规则模板（`templates/rules/`）
- 配置模板（`.mcp.json`，不含实际数据）

**适用场景：** 在新项目中复用 Axiom 框架

### 完整模式（full）

导出完整系统，包含所有数据：
- 模板模式的所有内容
- 知识库（`.omc/knowledge/`）
- 记忆文件（`.omc/axiom/`）
- 项目决策记录
- 反思日志

**适用场景：** 完整备份或迁移到新环境

## 执行步骤

### Step 1: 确认导出模式

询问用户：
```
选择导出模式：
1. template — 干净框架（不含项目数据）
2. full — 完整系统（含知识库和记忆）

输入 1 或 2：
```

### Step 2: 收集文件列表

**模板模式文件清单：**
```
skills/ax-*/SKILL.md
agents/axiom-*.md
templates/rules/
.mcp.json
```

**完整模式额外包含：**
```
.omc/knowledge/
.omc/axiom/
```

### Step 3: 生成导出包

**macOS / Linux (bash)：**

```bash
# 创建临时目录（使用 $TMPDIR 兼容 macOS；Linux 回退到 /tmp）
mkdir -p ${TMPDIR:-/tmp}/axiom-export-[timestamp]

# 复制文件
cp -r [文件列表] ${TMPDIR:-/tmp}/axiom-export-[timestamp]/

# 生成 README
cat > ${TMPDIR:-/tmp}/axiom-export-[timestamp]/README.md << 'EOF'
# Axiom Export
- 导出时间: [timestamp]
- 导出模式: [template/full]
- 源项目: [project-name]

## 安装说明
1. 解压到目标项目根目录
2. 运行 /ultrapower:deepinit 初始化
3. 运行 /ax-status 验证安装
EOF

# 打包
cd ${TMPDIR:-/tmp} && zip -r axiom-export-[timestamp].zip axiom-export-[timestamp]/
```

**Windows (PowerShell)：**

```powershell
# 获取系统临时目录（$env:TEMP 或 GetTempPath()）
$tmpDir = [System.IO.Path]::GetTempPath()
$exportDir = Join-Path $tmpDir "axiom-export-[timestamp]"

# 创建临时目录
New-Item -ItemType Directory -Path $exportDir -Force

# 复制文件
Copy-Item -Recurse [文件列表] $exportDir

# 生成 README
@"
# Axiom Export
- 导出时间: [timestamp]
- 导出模式: [template/full]
- 源项目: [project-name]

## 安装说明
1. 解压到目标项目根目录
2. 运行 /ultrapower:deepinit 初始化
3. 运行 /ax-status 验证安装
"@ | Set-Content -Path (Join-Path $exportDir "README.md") -Encoding UTF8

# 打包（使用 Compress-Archive 替代 zip）
$zipPath = Join-Path $tmpDir "axiom-export-[timestamp].zip"
Compress-Archive -Path $exportDir -DestinationPath $zipPath -Force
```

### Step 4: 输出结果

```
✓ 导出完成

文件: ${TMPDIR:-/tmp}/axiom-export-[timestamp].zip（Windows: %TEMP%\axiom-export-[timestamp].zip）
大小: [X] KB
包含:
  - 工作流: X 个
  - Skills: X 个
  - 规则: X 个
  [完整模式额外:]
  - 知识条目: X 条
  - 记忆文件: X 个

安装到新项目：
  unzip axiom-export-[timestamp].zip -d [目标项目路径]
```

## 注意事项

- 完整模式导出可能包含敏感的项目信息，分享前请检查内容
- 模板模式适合开源分享
- 导出包不含 `.git` 目录和 `node_modules`
