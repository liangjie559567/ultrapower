# Codex 的 Superpowers

通过原生 skill 发现功能，在 OpenAI Codex 中使用 Superpowers 的指南。

## 快速安装

告诉 Codex：

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

## 手动安装

### 前提条件

- OpenAI Codex CLI
- Git

### 步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. 创建 skills 符号链接：
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. 重启 Codex。

4. **For subagent skills** (optional): Skills like `dispatching-parallel-agents` and `subagent-driven-development` require Codex's collab feature. Add to your Codex config:
   ```toml
   [features]
   collab = true
   ```

### Windows

使用 junction 代替符号链接（无需开发者模式）：

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
```

## 工作原理

Codex 具有原生 skill 发现功能——它在启动时扫描 `~/.agents/skills/`，解析 SKILL.md frontmatter，并按需加载 skills。Superpowers skills 通过单个符号链接变得可见：

```
~/.agents/skills/superpowers/ → ~/.codex/superpowers/skills/
```

`using-superpowers` skill 会被自动发现并强制执行 skill 使用规范——无需额外配置。

## 使用方法

Skills 会被自动发现。Codex 在以下情况激活它们：
- 你按名称提及某个 skill（例如，"use brainstorming"）
- 任务与某个 skill 的描述匹配
- `using-superpowers` skill 指示 Codex 使用某个 skill

### 个人 Skills

在 `~/.agents/skills/` 中创建你自己的 skills：

```bash
mkdir -p ~/.agents/skills/my-skill
```

创建 `~/.agents/skills/my-skill/SKILL.md`：

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

`description` 字段是 Codex 决定何时自动激活 skill 的依据——将其写成清晰的触发条件。

## 更新

```bash
cd ~/.codex/superpowers && git pull
```

Skills 通过符号链接即时更新。

## 卸载

```bash
rm ~/.agents/skills/superpowers
```

**Windows (PowerShell)：**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\superpowers"
```

可选择删除克隆：`rm -rf ~/.codex/superpowers`（Windows：`Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\superpowers"`）。

## 故障排除

### Skills 未显示

1. 验证符号链接：`ls -la ~/.agents/skills/superpowers`
2. 检查 skills 是否存在：`ls ~/.codex/superpowers/skills`
3. 重启 Codex——skills 在启动时被发现

### Windows junction 问题

Junction 通常无需特殊权限即可工作。如果创建失败，请尝试以管理员身份运行 PowerShell。

## 获取帮助

- 报告问题：https://github.com/obra/superpowers/issues
- 主要文档：https://github.com/obra/superpowers
