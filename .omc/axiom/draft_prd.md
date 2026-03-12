# Draft PRD: Hook 系统安全加固 v6.0.0

**版本:** Draft v1.0
**创建时间:** 2026-03-10
**目标版本:** ultrapower v6.0.0
**优先级:** P0 (D-05), P1 (D-06, D-07)

---

## 1. 背景与动机

### 问题陈述

ultrapower v5.6.11 存在 3 个已识别的技术债务：

1. **D-05 (P0):** permission-request hook 失败时静默降级
2. **D-06 (P1):** 非敏感 hook 透传未知字段
3. **D-07 (P1):** subagent-tracker 使用非原子写入

### 影响范围

- **安全性:** D-05/D-06 可能导致权限绕过
- **可靠性:** D-07 可能导致状态文件损坏
- **合规性:** 违反 runtime-protection.md 规范

---

## 2. 核心目标

1. **D-05:** permission-request 失败时强制阻塞
2. **D-06:** 全部 15 类 HookType 定义严格白名单
3. **D-07:** subagent-tracker 使用原子写入

### 成功指标

- [ ] 所有现有测试通过
- [ ] 新增测试覆盖 3 个修复点
- [ ] tsc --noEmit 无错误
- [ ] 手动验证阻塞行为

---

## 3. 技术方案

### D-05: permission-request 强制阻塞

**当前实现:**
```typescript
// src/hooks/persistent-mode/index.ts
function createHookOutput(result) {
  return { continue: true }; // 始终返回 true
}
```

**目标实现:**
```typescript
function createHookOutput(result, hookType?: HookType) {
  if (hookType === 'permission-request' && result.error) {
    return { continue: false }; // 失败时阻塞
  }
  return { continue: true };
}
```

**修改文件:**
- `src/hooks/persistent-mode/index.ts`

---

### D-06: 全部 HookType 严格白名单

**当前实现:**
- 仅 4 类敏感 hook 使用白名单
- 其他 hook 透传未知字段

**目标实现:**
- 扩展 `STRICT_WHITELIST` 为全部 15 类 HookType
- 所有 hook 丢弃未知字段

**修改文件:**
- `src/hooks/bridge-normalize.ts`

---

### D-07: subagent-tracker 原子写入

**当前实现:**
```typescript
fs.writeFileSync(path, JSON.stringify(data));
```

**目标实现:**
```typescript
import { atomicWriteJsonSync } from '../../lib/atomic-write.js';
atomicWriteJsonSync(path, data);
```

**修改文件:**
- `src/hooks/subagent-tracker/index.ts`

---

## 4. 实施计划

### 执行顺序

1. **D-07** (最简单，独立性强)
2. **D-06** (为 D-05 奠定基础)
3. **D-05** (依赖 D-06 的白名单定义)

### 测试策略

**单元测试:**
- D-05: 测试 permission-request 失败时返回 `continue: false`
- D-06: 测试未知字段被丢弃
- D-07: 测试原子写入的并发安全性

**集成测试:**
- 验证 3 个修复的交互效果
- 确保现有工作流不受影响

---

## 5. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| D-05 影响现有工作流 | 中 | 完整回归测试 |
| D-06 导致 hook 失败 | 高 | 完整定义 15 类白名单 |
| D-07 性能下降 | 低 | 可接受的权衡 |

---

## 6. 验收标准

- [ ] 所有现有测试通过
- [ ] 新增测试覆盖率 > 90%
- [ ] 手动验证 permission-request 阻塞
- [ ] 代码审查通过
- [ ] 文档更新完成

---

**Draft PRD 完成，等待用户评审。**
