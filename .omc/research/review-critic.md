# ultrapower v7.0.0 PRD 安全与质量评审报告

**评审者**: Critic Agent
**评审日期**: 2026-03-10
**PRD 版本**: v7.0.0 草案
**评审类型**: 安全风险 + 质量保证

---

## 执行摘要

PRD 整体结构完善，目标明确，但存在**关键安全隐患**和**质量保证不足**问题。主要风险集中在：

**🔴 P0 安全风险**:
1. 缓存系统缺乏安全边界（缓存投毒风险）
2. 重试机制可能导致敏感操作重复执行
3. 状态管理迁移缺乏数据完整性验证

**🟡 P1 质量风险**:
1. 测试策略不足以覆盖并发场景
2. 回滚机制设计缺失
3. 性能监控可能泄露敏感信息

---

## 1. 安全风险分析

### 1.1 缓存系统安全隐患 🔴 P0

**问题描述**:
PRD 第 217-222 行定义的 `AgentCache` 缺乏安全边界：

```
缓存键生成（agentType + prompt + context + model）
```

**安全风险**:
1. **缓存投毒攻击**: 恶意用户可构造特定 prompt，污染缓存，影响其他用户
2. **信息泄露**: 缓存键未包含用户隔离标识，可能跨用户共享敏感结果
3. **权限绕过**: 缓存未验证权限上下文，可能返回未授权数据

**影响范围**: 所有使用缓存的 Agent 调用

**严重程度**: **高** - 可能导致数据泄露和权限绕过

**改进建议**:
```typescript
// 缓存键必须包含安全上下文
const cacheKey = hash({
  agentType,
  prompt,
  context,
  model,
  userId: session.userId,        // 用户隔离
  permissions: session.permissions, // 权限上下文
  securityLevel: context.securityLevel // 敏感度标记
});

// 添加缓存访问控制
class SecureAgentCache {
  async get(key: string, securityContext: SecurityContext): Promise<CachedResult | null> {
    const cached = await this.storage.get(key);
    if (!cached) return null;

    // 验证权限匹配
    if (!this.validatePermissions(cached.permissions, securityContext.permissions)) {
      return null; // 权限不匹配，视为缓存未命中
    }

    return cached.result;
  }
}
```

**测试要求**:
- 跨用户缓存隔离测试
- 权限降级后缓存失效测试
- 缓存投毒攻击模拟测试

---

### 1.2 重试机制的敏感操作风险 🔴 P0

**问题描述**:
PRD 第 161-166 行定义的自动重试机制未区分操作类型：

```
错误分类（可重试/不可重试/需人工）
最大重试 3 次
```

**安全风险**:
1. **重复执行敏感操作**: git push、文件删除、API 调用可能被重试 3 次
2. **成本攻击**: 恶意触发重试导致成本激增
3. **状态不一致**: 部分成功的操作重试可能导致数据损坏

**影响范围**: 所有 Agent 执行的破坏性操作

**严重程度**: **高** - 可能导致数据丢失和成本失控

**改进建议**:
```typescript
// 操作分类白名单
const RETRYABLE_OPERATIONS = new Set([
  'read_file',
  'search_code',
  'lsp_diagnostics',
  'api_get_request', // 仅 GET 请求
]);

const NON_RETRYABLE_OPERATIONS = new Set([
  'write_file',
  'delete_file',
  'git_push',
  'api_post_request',
  'api_delete_request',
  'send_notification',
]);

async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    operationType: string;
    maxRetries: number;
    isIdempotent: boolean; // 显式声明幂等性
  }
): Promise<T> {
  // 非幂等操作禁止重试
  if (!options.isIdempotent && NON_RETRYABLE_OPERATIONS.has(options.operationType)) {
    return operation(); // 单次执行
  }

  // 幂等操作才允许重试
  // ... 重试逻辑
}
```

**测试要求**:
- 破坏性操作禁止重试测试
- 幂等性验证测试
- 重试成本上限测试

---

### 1.3 状态管理迁移的数据完整性风险 🔴 P0

**问题描述**:
PRD 第 182-186 行定义的统一状态管理缺乏迁移安全保障：

```
支持文件系统和 SQLite 后端
添加乐观锁（版本号）
```

**安全风险**:
1. **数据丢失**: 迁移失败时无回滚机制
2. **版本冲突**: 乐观锁冲突处理不当可能丢弃更新
3. **权限泄露**: 状态文件权限未明确（参考 v6.0.0 的 D-05/06/07 安全问题）

**影响范围**: 所有依赖状态的模块

**严重程度**: **高** - 可能导致数据丢失和权限问题

**改进建议**:
```typescript
// 迁移必须包含完整性验证
class StateMigration {
  async migrate(from: StateBackend, to: StateBackend): Promise<MigrationResult> {
    // 1. 备份原始数据
    const backup = await this.createBackup(from);

    // 2. 迁移数据
    const migrated = await this.copyData(from, to);

    // 3. 完整性验证
    const validation = await this.validateIntegrity(from, to);
    if (!validation.success) {
      await this.rollback(backup);
      throw new MigrationError(validation.errors);
    }

    // 4. 设置安全权限（参考 runtime-protection.md）
    await this.setSecurePermissions(to);

    return { success: true, backup };
  }

  private async setSecurePermissions(backend: StateBackend): Promise<void> {
    if (backend.type === 'filesystem') {
      // 确保状态文件权限为 0600（仅所有者读写）
      await fs.chmod(backend.path, 0o600);
    }
  }
}
```

**测试要求**:
- 迁移失败回滚测试
- 数据完整性校验测试
- 文件权限验证测试

---

### 1.4 OpenTelemetry 追踪的信息泄露风险 🟡 P1

**问题描述**:
PRD 第 202-207 行定义的追踪系统未考虑敏感信息过滤：

```
支持 Span 嵌套
导出到 Console/File/Jaeger
```

**安全风险**:
1. **敏感数据泄露**: prompt、context 可能包含 API key、密码等
2. **日志注入**: 恶意 prompt 可能注入日志系统
3. **外部导出风险**: Jaeger 等外部系统可能不安全

**影响范围**: 所有启用追踪的操作

**严重程度**: **中** - 可能导致敏感信息泄露

**改进建议**:
```typescript
// 追踪数据必须脱敏
class SecureAgentTracer {
  private sensitivePatterns = [
    /api[_-]?key/i,
    /password/i,
    /token/i,
    /secret/i,
    /credential/i,
  ];

  createSpan(name: string, attributes: Record<string, any>): Span {
    // 脱敏属性
    const sanitized = this.sanitizeAttributes(attributes);

    return this.tracer.startSpan(name, {
      attributes: sanitized,
    });
  }

  private sanitizeAttributes(attrs: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(attrs)) {
      // 检测敏感字段
      if (this.isSensitive(key)) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        result[key] = this.redactSensitiveContent(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
```

**测试要求**:
- 敏感信息脱敏测试
- 日志注入防护测试
- 外部导出安全测试

---

## 2. 边界情况分析

### 2.1 并发场景覆盖不足 🟡 P1

**问题描述**:
PRD 第 348-368 行的测试要求未充分覆盖并发场景：

```
状态并发冲突测试
```

**缺失场景**:
1. **缓存并发写入**: 多个 Agent 同时写入同一缓存键
2. **熔断器竞态**: 多个请求同时触发熔断状态转换
3. **状态版本冲突**: 高并发下乐观锁冲突率可能超过预期
4. **重试风暴**: 多个 Agent 同时重试导致雪崩

**影响范围**: 高并发使用场景

**严重程度**: **中** - 可能导致系统不稳定

**改进建议**:
```yaml
# 补充并发测试场景
并发测试套件:
  - 缓存并发写入测试:
      并发数: 100
      预期: 无数据损坏，最终一致性

  - 熔断器竞态测试:
      场景: 50 个请求同时失败
      预期: 状态转换原子性，无死锁

  - 状态版本冲突测试:
      并发数: 50
      预期: 冲突率 <5%，重试成功率 >95%

  - 重试风暴测试:
      场景: 10 个 Agent 同时重试
      预期: 指数退避生效，总请求数 <30
```

---

### 2.2 资源限制处理不完善 🟡 P1

**问题描述**:
PRD 未明确资源耗尽场景的处理策略。

**缺失场景**:
1. **磁盘空间耗尽**: 缓存、日志、状态文件持续增长
2. **内存泄露**: Agent 上下文未及时释放
3. **文件描述符耗尽**: SQLite 连接、文件句柄泄露
4. **Token 配额耗尽**: API 限流时的降级策略

**改进建议**:
```typescript
// 资源监控和限制
class ResourceGuard {
  async checkDiskSpace(): Promise<void> {
    const free = await this.getFreeDiskSpace();
    if (free < 1_000_000_000) { // <1GB
      await this.cleanupCache();
      await this.rotateLogs();
    }
  }

  async checkMemoryUsage(): Promise<void> {
    const usage = process.memoryUsage();
    if (usage.heapUsed > 500_000_000) { // >500MB
      await this.releaseIdleAgents();
      global.gc?.(); // 触发 GC
    }
  }

  async checkFileDescriptors(): Promise<void> {
    const open = await this.getOpenFileCount();
    if (open > 900) { // 接近 ulimit
      await this.closeSQLiteConnections();
    }
  }
}
```

---

### 2.3 熔断器恢复策略风险 🟡 P1

**问题描述**:
PRD 第 168-174 行的熔断器设计缺乏渐进式恢复：

```
自动恢复探测
```

**风险**:
1. **雪崩重启**: HALF_OPEN 状态下大量请求涌入
2. **抖动**: 频繁在 OPEN/HALF_OPEN 间切换
3. **误判**: 单次探测失败立即重新熔断

**改进建议**:
```typescript
class CircuitBreaker {
  private halfOpenMaxRequests = 3; // 半开状态最多 3 个探测请求
  private successThreshold = 2;     // 需要 2 次成功才恢复

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.halfOpenAttempts = 0;
      } else {
        throw new CircuitBreakerError('Circuit is OPEN');
      }
    }

    if (this.state === 'HALF_OPEN') {
      // 限流：半开状态下限制并发
      if (this.halfOpenAttempts >= this.halfOpenMaxRequests) {
        throw new CircuitBreakerError('Too many half-open attempts');
      }
      this.halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      // 需要连续成功才恢复
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }
}
```

---

## 3. 质量保证评审

### 3.1 测试策略充分性 🟡 P1

**当前测试要求**（PRD 第 348-368 行）:
- ✅ 单元测试覆盖
- ✅ 集成测试覆盖
- ✅ 性能测试覆盖
- ⚠️ 回归测试覆盖（不够具体）

**缺失测试类型**:
1. **混沌测试**: 随机故障注入
2. **压力测试**: 极限负载下的行为
3. **安全测试**: 渗透测试、模糊测试
4. **兼容性测试**: 跨版本升级测试

**补充建议**:
```yaml
测试矩阵扩展:
  混沌测试:
    - 随机网络延迟（100-5000ms）
    - 随机进程终止
    - 随机磁盘满
    - 预期: 系统自动恢复，无数据丢失

  压力测试:
    - 100 并发 Agent
    - 持续 1 小时
    - 预期: 内存稳定，无泄露，成功率 >95%

  安全测试:
    - 路径遍历攻击测试
    - SQL 注入测试（SQLite 后端）
    - 缓存投毒测试
    - 预期: 所有攻击被阻止

  兼容性测试:
    - v6.0.0 → v7.0.0 升级
    - 状态文件迁移
    - Skill 向后兼容
    - 预期: 零停机升级，无数据丢失
```

---

### 3.2 质量门禁设计 🟢 P2

**当前质量标准**（PRD 第 329-345 行）:
- ✅ TypeScript 严格模式
- ✅ 测试覆盖率 >80%
- ✅ 无新增 TODO/FIXME
- ✅ 安全测试通过

**建议增强**:
```yaml
质量门禁增强:
  代码质量:
    - 圈复杂度 <10
    - 函数长度 <50 行
    - 文件长度 <500 行
    - 依赖深度 <5 层

  性能门禁:
    - CLI 启动 <120ms
    - 测试时间 <15s
    - 内存占用 <40MB
    - 构建时间 <30s

  安全门禁:
    - npm audit 无高危漏洞
    - 文件权限验证通过
    - 敏感信息扫描通过
    - OWASP Top 10 检查通过

  文档门禁:
    - API 文档覆盖率 100%
    - 迁移指南完整性检查
    - 示例代码可执行性验证
```

---

### 3.3 回归测试覆盖 🟡 P1

**问题描述**:
PRD 第 365-368 行的回归测试要求过于笼统：

```
所有现有测试通过
无功能退化
向后兼容性验证
```

**具体化建议**:
```typescript
// 回归测试套件
describe('v7.0.0 回归测试', () => {
  describe('hooks 拆分回归', () => {
    it('所有 15 种 HookType 行为不变', async () => {
      // 对比 v6.0.0 和 v7.0.0 的 hook 输出
    });

    it('keyword-detector 性能不退化', async () => {
      // 确保拆分后性能提升，而非下降
    });
  });

  describe('状态管理迁移回归', () => {
    it('v6.0.0 状态文件可正常迁移', async () => {
      // 加载真实的 v6.0.0 状态文件
    });

    it('迁移后功能完全一致', async () => {
      // 对比迁移前后的行为
    });
  });

  describe('Agent 配置化回归', () => {
    it('所有现有 Agent 行为不变', async () => {
      // 确保 YAML 配置与硬编码行为一致
    });
  });
});
```

---

## 4. 改进建议汇总

### 4.1 安全加固措施（必须实施）

**P0 级别**:
1. ✅ **缓存系统安全边界**
   - 添加用户隔离和权限验证
   - 实现 SecureAgentCache 类
   - 测试: 跨用户隔离、权限验证、投毒攻击

2. ✅ **重试机制安全分类**
   - 区分幂等/非幂等操作
   - 破坏性操作禁止重试
   - 测试: 操作分类、成本上限

3. ✅ **状态迁移完整性保障**
   - 实现备份和回滚机制
   - 添加完整性验证
   - 设置安全文件权限
   - 测试: 迁移失败回滚、数据校验

**P1 级别**:
4. ✅ **追踪数据脱敏**
   - 实现 SecureAgentTracer
   - 敏感信息自动脱敏
   - 测试: 脱敏覆盖率、日志注入防护

---

### 4.2 质量提升建议（强烈推荐）

**P1 级别**:
1. ✅ **并发测试增强**
   - 添加缓存并发、熔断器竞态测试
   - 状态版本冲突压力测试
   - 重试风暴场景测试

2. ✅ **资源限制处理**
   - 实现 ResourceGuard 类
   - 磁盘、内存、文件描述符监控
   - 自动清理和降级策略

3. ✅ **熔断器渐进式恢复**
   - 半开状态限流
   - 连续成功才恢复
   - 避免雪崩重启

4. ✅ **测试矩阵扩展**
   - 混沌测试、压力测试
   - 安全测试、兼容性测试
   - 量化验收标准

---

### 4.3 文档补充建议（推荐）

**P2 级别**:
1. ✅ **安全最佳实践文档**
   - 缓存安全使用指南
   - 重试机制安全配置
   - 敏感信息处理规范

2. ✅ **运维手册**
   - 资源监控和告警
   - 故障排查流程
   - 性能调优指南

3. ✅ **升级指南**
   - v6.0.0 → v7.0.0 详细步骤
   - 状态迁移操作手册
   - 回滚应急预案

---

## 5. 风险评估矩阵

| 风险项 | 当前状态 | 严重程度 | 发生概率 | 风险等级 | 缓解措施 |
|--------|---------|---------|---------|---------|---------|
| 缓存投毒攻击 | 未防护 | 高 | 中 | 🔴 高 | 实施 SecureAgentCache |
| 重试导致数据损坏 | 未分类 | 高 | 中 | 🔴 高 | 操作分类白名单 |
| 状态迁移数据丢失 | 无回滚 | 高 | 低 | 🟡 中 | 备份+完整性验证 |
| 追踪信息泄露 | 未脱敏 | 中 | 高 | 🟡 中 | 敏感信息脱敏 |
| 并发状态冲突 | 测试不足 | 中 | 中 | 🟡 中 | 并发测试增强 |
| 资源耗尽 | 无监控 | 中 | 中 | 🟡 中 | ResourceGuard |
| 熔断器抖动 | 设计不足 | 中 | 低 | 🟢 低 | 渐进式恢复 |

---

## 6. 最终评审意见

### 6.1 总体评价

PRD **结构完善，目标明确**，但存在**关键安全隐患**需要在实施前解决。

**优点**:
- ✅ 问题识别准确（基于痛点分析）
- ✅ 解决方案务实（分阶段实施）
- ✅ 量化指标清晰（可验证）
- ✅ 风险意识较强（已识别部分风险）

**不足**:
- ❌ 安全设计不足（缓存、重试、迁移）
- ❌ 并发场景考虑不足
- ❌ 测试策略不够全面
- ❌ 回滚机制设计缺失

### 6.2 建议决策

**🔴 不建议直接批准**，需要先解决 P0 安全问题。

**建议流程**:
1. **立即修订 PRD**（1-2 天）
   - 补充安全加固措施（第 4.1 节）
   - 完善测试策略（第 3.1 节）
   - 添加回滚机制设计

2. **安全评审**（1 天）
   - Security-reviewer 复审修订版
   - 确认所有 P0 风险已缓解

3. **技术评审**（1 天）
   - Architect 评审架构设计
   - 确认可行性和资源需求

4. **批准实施**
   - 所有评审通过后开始 M1

### 6.3 关键前置条件

**在开始 M1 实施前，必须完成**:
1. ✅ SecureAgentCache 设计文档
2. ✅ 操作分类白名单定义
3. ✅ 状态迁移方案详细设计
4. ✅ 并发测试用例清单
5. ✅ 回滚应急预案

---

## 7. 后续行动项

### 7.1 立即行动（本周）

1. **PRD 修订**（负责人: Product Team）
   - 补充第 4.1 节的安全措施
   - 完善第 3.1 节的测试策略
   - 添加回滚机制章节

2. **安全设计文档**（负责人: Security-reviewer）
   - SecureAgentCache 详细设计
   - 操作分类白名单定义
   - 敏感信息脱敏规则

3. **测试计划**（负责人: Test-engineer）
   - 并发测试用例设计
   - 混沌测试场景定义
   - 安全测试清单

### 7.2 短期行动（下周）

4. **架构评审**（负责人: Architect）
   - 评审修订后的 PRD
   - 确认技术可行性
   - 评估资源需求

5. **原型验证**（负责人: Executor）
   - SecureAgentCache 原型
   - 熔断器渐进式恢复原型
   - 性能基准测试

---

## 8. 附录

### 8.1 参考规范

- [runtime-protection.md](../docs/standards/runtime-protection.md) - 路径遍历防护、输入消毒
- [hook-execution-order.md](../docs/standards/hook-execution-order.md) - Hook 执行顺序
- [state-machine.md](../docs/standards/state-machine.md) - 状态机设计
- [agent-lifecycle.md](../docs/standards/agent-lifecycle.md) - Agent 生命周期

### 8.2 安全检查清单

```yaml
安全检查清单:
  输入验证:
    - [ ] 所有用户输入经过白名单验证
    - [ ] 路径参数通过 assertValidMode() 校验
    - [ ] prompt 长度限制和内容过滤

  权限控制:
    - [ ] 缓存访问包含权限验证
    - [ ] 状态文件权限设置为 0600
    - [ ] 跨用户操作隔离验证

  数据保护:
    - [ ] 敏感信息自动脱敏
    - [ ] 状态迁移包含备份
    - [ ] 缓存数据加密存储（可选）

  错误处理:
    - [ ] 错误信息不泄露内部路径
    - [ ] 异常堆栈脱敏处理
    - [ ] 失败操作自动回滚
```

---

**评审结论**: 🟡 **有条件通过** - 需修订后重新评审

**下一步**: 等待 Product Team 修订 PRD，预计 2026-03-11 完成

**评审者签名**: Critic Agent
**评审日期**: 2026-03-10
