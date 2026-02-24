---
name: note
description: 将笔记保存到 notepad.md 以防对话压缩丢失
---

# Note Skill

将重要上下文保存到 `.omc/notepad.md`，在对话压缩后仍可保留。

## 用法

| 命令 | 操作 |
|---------|--------|
| `/ultrapower:note <内容>` | 带时间戳添加到工作记忆 |
| `/ultrapower:note --priority <内容>` | 添加到优先上下文（始终加载） |
| `/ultrapower:note --manual <内容>` | 添加到 MANUAL 区块（永不清除） |
| `/ultrapower:note --show` | 显示当前笔记本内容 |
| `/ultrapower:note --prune` | 删除 7 天前的条目 |
| `/ultrapower:note --clear` | 清除工作记忆（保留优先上下文和 MANUAL） |

## 区块说明

### 优先上下文（500 字符限制）
- **始终**在会话开始时注入
- 用于关键事实：如"项目使用 pnpm"、"API 在 src/api/client.ts"
- 保持简短——这会占用你的上下文预算

### 工作记忆
- 带时间戳的会话笔记
- 7 天后自动清除
- 适合：调试线索、临时发现

### MANUAL
- 永不自动清除
- 用户控制的永久笔记
- 适合：团队联系方式、部署信息

## 示例

```
/ultrapower:note Found auth bug in UserContext - missing useEffect dependency
/ultrapower:note --priority Project uses TypeScript strict mode, all files in src/
/ultrapower:note --manual Contact: api-team@company.com for backend questions
/ultrapower:note --show
/ultrapower:note --prune
```

## 行为

1. 如果 `.omc/notepad.md` 不存在则创建
2. 解析参数以确定目标区块
3. 追加内容并附带时间戳（工作记忆）
4. 如果优先上下文超过 500 字符则发出警告
5. 确认已保存的内容

## 集成

笔记本内容在会话开始时自动加载：
- 优先上下文：始终加载
- 工作记忆：如有近期条目则加载

这有助于在对话压缩后不丢失关键上下文。
