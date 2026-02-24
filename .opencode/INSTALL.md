# 为 OpenCode 安装 Superpowers

## 前提条件

- [OpenCode.ai](https://opencode.ai) 已安装
- Git 已安装

## 安装步骤

### 1. 克隆 Superpowers

```bash
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers
```

### 2. 注册插件

创建符号链接，使 OpenCode 能够发现插件：

```bash
mkdir -p ~/.config/opencode/plugins
rm -f ~/.config/opencode/plugins/superpowers.js
ln -s ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js ~/.config/opencode/plugins/superpowers.js
```

### 3. 创建 Skills 符号链接

创建符号链接，使 OpenCode 的原生 skill 工具能够发现 superpowers skills：

```bash
mkdir -p ~/.config/opencode/skills
rm -rf ~/.config/opencode/skills/superpowers
ln -s ~/.config/opencode/superpowers/skills ~/.config/opencode/skills/superpowers
```

### 4. 重启 OpenCode

重启 OpenCode。插件将自动注入 superpowers 上下文。

通过询问以下内容来验证："do you have superpowers?"

## 使用方法

### 查找 Skills

使用 OpenCode 的原生 `skill` 工具列出可用的 skills：

```
use skill tool to list skills
```

### 加载 Skill

使用 OpenCode 的原生 `skill` 工具加载特定 skill：

```
use skill tool to load superpowers/brainstorming
```

### 个人 Skills

在 `~/.config/opencode/skills/` 中创建你自己的 skills：

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

创建 `~/.config/opencode/skills/my-skill/SKILL.md`：

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### 项目 Skills

在项目的 `.opencode/skills/` 目录中创建项目专属 skills。

**Skill 优先级：** 项目 skills > 个人 skills > Superpowers skills

## 更新

```bash
cd ~/.config/opencode/superpowers
git pull
```

## 故障排查

### 插件未加载

1. 检查插件符号链接：`ls -l ~/.config/opencode/plugins/superpowers.js`
2. 检查源文件是否存在：`ls ~/.config/opencode/superpowers/.opencode/plugins/superpowers.js`
3. 检查 OpenCode 日志中的错误信息

### Skills 未找到

1. 检查 skills 符号链接：`ls -l ~/.config/opencode/skills/superpowers`
2. 验证其指向：`~/.config/opencode/superpowers/skills`
3. 使用 `skill` 工具列出已发现的内容

### 工具映射

当 skills 引用 Claude Code 工具时：
- `TodoWrite` → `update_plan`
- `Task` with subagents → `@mention` 语法
- `Skill` tool → OpenCode 的原生 `skill` 工具
- 文件操作 → 你的原生工具

## 获取帮助

- 报告问题：https://github.com/obra/superpowers/issues
- 完整文档：https://github.com/obra/superpowers/blob/main/docs/README.opencode.md
