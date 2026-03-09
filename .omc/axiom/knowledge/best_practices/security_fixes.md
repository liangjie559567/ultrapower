# 安全修复最佳实践

**来源**: v5.5.18 SEC-H01/H02 修复
**置信度**: 高
**最后更新**: 2026-03-05

## 验证标准

1. **添加攻击测试用例**（路径遍历、命令注入、XSS）
2. **运行现有测试套件**（确保无回归）
3. **手动验证边界情况**（空输入、特殊字符）
4. **更新安全文档**（runtime-protection.md）

## Windows 命令注入防护

❌ **不安全**：
```typescript
execSync(`taskkill ${args.join(' ')}`);
```

✅ **安全**：
```typescript
execFileAsync('taskkill', args, { timeout: 5000 });
```

## 成功标准

* 攻击测试失败（被正确阻止）

* 零回归问题

* 文档已更新
