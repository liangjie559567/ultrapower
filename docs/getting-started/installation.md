# 安装指南

> **预计时间**: 5 分钟
> **适用版本**: v5.5.15+

---

## 前置要求

- Node.js >= 18
- npm >= 9
- Claude Code CLI

---

## 安装步骤

### 1. 全局安装 ultrapower

```bash
npm install -g @liangjie559567/ultrapower@latest
```

✅ **检查点**: 运行 `omc --version` 应显示版本号

---

### 2. 初始化项目

在您的项目目录中运行：

```bash
omc install
```

这将：
- 创建 `.omc/` 目录
- 生成 `CLAUDE.md` 配置文件
- 安装必要的 hooks

✅ **检查点**: 项目根目录应包含 `CLAUDE.md` 文件

---

### 3. 验证安装

```bash
# 检查 ultrapower 状态
omc doctor
```

✅ **检查点**: 所有检查项应显示 ✅

---

## 常见问题

### 错误: `command not found: omc`

**原因**: npm 全局路径未添加到 PATH

**解决**:
```bash
# 查看 npm 全局路径
npm config get prefix

# 添加到 PATH（macOS/Linux）
export PATH="$PATH:$(npm config get prefix)/bin"

# 添加到 PATH（Windows）
# 将 %APPDATA%\npm 添加到系统环境变量
```

---

### 错误: `EACCES: permission denied`

**原因**: 权限不足

**解决**:
```bash
# 使用 sudo（不推荐）
sudo npm install -g @liangjie559567/ultrapower

# 或配置 npm 使用用户目录（推荐）
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

---

## 下一步

✅ 安装完成！继续：
- [快速开始](./quickstart.md) - 15 分钟跑通第一个示例
- [核心概念](./concepts.md) - 理解 ultrapower 工作原理

---

**遇到问题？** [查看故障排查指南](../guides/troubleshooting.md)
