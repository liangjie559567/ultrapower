# 工具名称过长错误修复

## 问题描述

用户在运行 `/ultrapower:omc-setup` 时遇到错误：

```
API Error: 400 {"error":{"code":"invalid_request_error","message":"工具名称过长，请检查:
mcp__plugin_ultrapower_t__ultrapower_project_memory_add_directive","type":"invalid_request_error"}}
```

## 根本原因

旧版本（< v5.5.16）的工具名称过长，超过了 Claude API 的限制。

## 解决方案

### 1. 更新到最新版本

```bash
npm install @liangjie559567/ultrapower@latest
```

或者如果是全局安装：

```bash
npm install -g @liangjie559567/ultrapower@latest
```

### 2. 验证版本

```bash
ultrapower --version
```

应该显示 `5.5.16` 或更高版本。

### 3. 重新运行命令

```bash
ultrapower omc-setup
```

## 技术细节

v5.5.16 中的修复（提交 f9f2967）将工具名称缩短：

| 旧名称 | 新名称 |
|--------|--------|
| `ultrapower_project_memory_read` | `mem_read` |
| `ultrapower_project_memory_write` | `mem_write` |
| `ultrapower_project_memory_add_note` | `mem_add_note` |
| `ultrapower_project_memory_add_directive` | `mem_add_directive` |

完整的 MCP 工具名称格式：`mcp__t__<tool_name>`

例如：`mcp__t__mem_read`
