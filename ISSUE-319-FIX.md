# Issue #319 修复：Bash 错误时 Stop Hook 冻结

## 问题摘要

当 bash 命令在执行过程中遇到错误时，Stop hook 会触发并导致整个会话冻结/挂起，需要用户手动终止并重启会话。

## 根因分析

问题并非 bash 错误直接触发 Stop hook。实际问题在于 `persistent-mode.mjs` hook 的错误处理：

### 缺陷

```javascript
} catch (error) {
  console.error(`[persistent-mode] Error: ${error.message}`);
  console.log(JSON.stringify({ continue: true }));
}
```

**问题：** 当 try 块中发生错误时，catch 块会：
1. 使用 `console.error()` 写入 STDERR
2. 使用 `console.log()` 写入 STDOUT

然而，如果错误与损坏的 stdout/stderr 流相关（在 bash 错误或其他系统问题期间可能发生）：
- `console.error()` 调用会抛出 EPIPE
- catch 块本身在到达 `console.log()` 之前就会出错
- 没有 JSON 输出到达 Claude Code
- hook 会挂起等待响应
- 会话冻结

### 为何在 Bash 错误时发生

当 bash 命令失败时：
1. Claude Code 可能关闭/重置 hook 进程的流
2. persistent-mode hook 尝试处理 stop 事件
3. 如果遇到任何错误，catch 块尝试写入控制台
4. 由于流已关闭，控制台写入抛出异常
5. 没有 JSON 响应被发送
6. 会话无限期挂起

## 已实施的解决方案

### 1. catch 块中的健壮错误处理

将 `console.log`/`console.error` 替换为包裹在 try-catch 中的直接流写入：

```javascript
} catch (error) {
  try {
    process.stderr.write(`[persistent-mode] Error: ${error?.message || error}\n`);
  } catch {
    // Ignore stderr errors - we just need to return valid JSON
  }
  try {
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
  } catch {
    // If stdout write fails, exit gracefully
    process.exit(0);
  }
}
```

### 2. 全局错误处理器

为未捕获的异常和未处理的 rejection 添加了处理器：

```javascript
process.on('uncaughtException', (error) => {
  try {
    process.stderr.write(`[persistent-mode] Uncaught exception: ${error?.message || error}\n`);
  } catch { }
  try {
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
  } catch { }
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  // Similar handling
});
```

### 3. 安全超时

添加了 10 秒超时，在 hook 未完成时强制退出：

```javascript
const safetyTimeout = setTimeout(() => {
  try {
    process.stderr.write('[persistent-mode] Safety timeout reached, forcing exit\n');
  } catch { }
  try {
    process.stdout.write(JSON.stringify({ continue: true }) + '\n');
  } catch { }
  process.exit(0);
}, 10000);

main().finally(() => {
  clearTimeout(safetyTimeout);
});
```

### 4. 无效 JSON 的提前返回

添加了提前验证以防止处理无效输入：

```javascript
try {
  data = JSON.parse(input);
} catch {
  // Invalid JSON - allow stop to prevent hanging
  process.stdout.write(JSON.stringify({ continue: true }) + '\n');
  return;
}
```

## 测试

所有测试通过：
- ✓ 正常空输入返回 continue:true
- ✓ 空 stdin（管道损坏）返回 continue:true 且不挂起
- ✓ 无效 JSON 返回 continue:true 且不挂起
- ✓ Hook 在超时内完成（< 1 秒）

## 变更的文件

- `templates/hooks/persistent-mode.mjs` - 主要修复
- `src/hooks/persistent-mode/__tests__/error-handling.test.ts` - 测试覆盖
- `CHANGELOG.md` - 文档

## 影响

此修复确保 Stop hook 在任何情况下都不会挂起会话，即使在灾难性错误条件下也是如此。Hook 现在对以下情况具有弹性：
- 损坏的 stdout/stderr 流
- EPIPE 错误
- 无效 JSON 输入
- 未捕获的异常
- 未处理的 promise rejection
- 任何不可预见的错误（通过安全超时）

## 相关 Issue

- Issue #240：stdin 超时问题（与 hook 挂起相关）
- Issue #213：上下文限制停止死锁（不同但相关的 stop hook 问题）
