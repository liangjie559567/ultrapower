# 性能优化最佳实践

**来源**: v5.5.18 QUALITY-C01 内存泄漏修复
**置信度**: 高
**最后更新**: 2026-03-05

## 内存泄漏修复策略

1. **识别长生命周期对象**（Map、Set、EventEmitter）
2. **添加清理逻辑**（clear()、removeListener()）
3. **添加泄漏检测测试**（heap snapshot 对比）
4. **文档化清理时机**（agent 终止、超时）

## 示例

❌ **泄漏**：
```typescript
start() {
  this.timer = setTimeout(...);
}
```

✅ **修复**：
```typescript
start() {
  this.stop(); // 清理旧 timer
  this.timer = setTimeout(...);
}
```

## 验证

* 无内存增长

* 清理逻辑正确执行
