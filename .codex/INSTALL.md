# 为 Codex 安装 ultrapower

通过原生 skill 发现机制在 Codex 中启用 ultrapower skills。只需克隆并创建符号链接。

## 前提条件

- Git

## 安装步骤

1. **克隆 ultrapower 仓库：**
   ```bash
   git clone https://github.com/liangjie559567/ultrapower.git ~/.codex/ultrapower
   ```

2. **创建 skills 符号链接：**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/ultrapower/skills ~/.agents/skills/ultrapower
   ```

   **Windows (PowerShell)：**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\ultrapower" "$env:USERPROFILE\.codex\ultrapower\skills"
   ```

3. **重启 Codex**（退出并重新启动 CLI）以发现 skills。

## 从旧版 bootstrap 迁移

如果你在原生 skill 发现机制出现之前安装了 ultrapower，需要执行以下操作：

1. **更新仓库：**
   ```bash
   cd ~/.codex/ultrapower && git pull
   ```

2. **创建 skills 符号链接**（上方步骤 2）——这是新的发现机制。

3. **从 `~/.codex/AGENTS.md` 中删除旧的 bootstrap 块** ——任何引用 `ultrapower-codex bootstrap` 的块都不再需要。

4. **重启 Codex。**

## 验证

```bash
ls -la ~/.agents/skills/ultrapower
```

你应该看到一个符号链接（Windows 上为 junction），指向你的 ultrapower skills 目录。

## 更新

```bash
cd ~/.codex/ultrapower && git pull
```

Skills 通过符号链接即时更新。

## 卸载

```bash
rm ~/.agents/skills/ultrapower
```

可选择删除克隆目录：`rm -rf ~/.codex/ultrapower`。
