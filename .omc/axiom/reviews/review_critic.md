# Critic Review: ultrapower BUG 分析与修复建议

**评审时间**: 2026-03-15T03:33:37Z
**评审者**: The Critic
**PRD 版本**: DRAFT
**评审状态**: CONDITIONAL PASS

---

## 1. Security Audit (安全审计)

### 🔴 Critical (严重 - 10/10)

**BUG-002: Hook 输入验证绕过**
- **严重性**: 10/10 - 这是一个典型的安全门禁绕过漏洞
- **攻击面**: 所有敏感 hook（permission-request、setup、session-end）
- **潜在后果**:
  - 命令注入（通过未验证的字段传递恶意命令）
  - 路径遍历（绕过白名单访问任意文件）
  - 权限提升（绕过 permission-request 验证）
- **PRD 修复方案评估**: ✅ 正确
  - 方案 1（强制验证敏感 hook）是最安全的选择
  - 方案 2（在快速路径中添加白名单）也可接受，但增加了复杂度
- **额外建议**:
  ```typescript
  // 必须添加审计日志
  if (isSensitive && isAlreadyCamelCase(rawObj)) {
    console.warn(`[SECURITY] Suspicious camelCase input for sensitive hook: ${hookType}`);
    // 记录到安全日志
  }
  ```

### 🟠 High (高危 - 8/10)

**BUG-001: 状态文件竞态条件**
- **严重性**: 8/10 - 数据完整性威胁
- **攻击场景**:
  - 恶意 agent 可以通过竞态条件覆盖其他 agent 的状态
  - 导致状态回滚或数据丢失
  - 影响审计追踪的完整性
- **PRD 修复方案评估**: ⚠️ 部分正确
  - 方案 3（原子写入）是最佳选择 - 简单且可靠
  - 方案 1（文件锁）在 Windows 上可能有兼容性问题
  - 方案 2（写入队列）增加了内存开销和复杂度
- **缺失的边界情况**:
  ```typescript
  // PRD 未考虑：磁盘满时的处理
  writeSync(data: T, sessionId?: string): boolean {
    const path = this.getPath(sessionId);
    const temp = `${path}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(temp, JSON.stringify(data, null, 2));
      fs.renameSync(temp, path);
      return true;
    } catch (error) {
      // 清理临时文件
      try { fs.unlinkSync(temp); } catch {}
      throw new Error(`State write failed: ${error.message}`);
    }
  }
  ```

**BUG-003: ReDoS 攻击**
- **严重性**: 7/10 - 拒绝服务威胁
- **攻击场景**:
  - 恶意用户提交嵌套 HTML 导致 CPU 占用 100%
  - 阻塞所有后续请求
- **PRD 修复方案评估**: ✅ 正确
  - 方案 1（限制输入长度）是必需的第一道防线
  - 方案 2（简单正则）是最佳选择
  - 方案 3（HTML 解析器）引入了新的依赖和攻击面
- **缺失的防护**:
  ```typescript
  // PRD 未考虑：超时保护
  function sanitizeForKeywordDetection(text: string, timeout = 100): string {
    const start = Date.now();
    const MAX_LENGTH = 10000;

    if (text.length > MAX_LENGTH) {
      text = text.slice(0, MAX_LENGTH);
    }

    // 使用简单正则，避免回溯
    let result = text.replace(/<[^>]+>/g, '');

    if (Date.now() - start > timeout) {
      throw new Error('Sanitization timeout');
    }

    return result;
  }
  ```

---

## 2. Edge Case Analysis (边缘场景分析)

### 🔴 Critical Missing Cases

**BUG-001 补充**:
- **磁盘满**: 临时文件写入成功但 rename 失败 → 需要清理临时文件
- **权限不足**: 无法写入 `.omc/state/` 目录 → 需要优雅降级
- **并发 rename**: 多个进程同时 rename 到同一目标 → 需要重试逻辑
- **符号链接攻击**: 攻击者创建符号链接指向敏感文件 → 需要验证路径

**BUG-002 补充**:
- **Unicode 绕过**: 使用 Unicode 字符伪装字段名（例如 `maliciousField` vs `maliciоusField`，其中 `о` 是西里尔字母）
- **原型污染**: 通过 `__proto__` 或 `constructor` 字段污染对象原型
- **深层嵌套**: 嵌套对象中的恶意字段可能绕过浅层白名单检查

**BUG-004 补充**:
- **SIGKILL**: 进程被强制终止时无法执行清理逻辑 → 需要启动时的陈旧状态检测
- **多进程竞争**: 多个进程同时启动时可能同时清理状态 → 需要锁机制
- **状态恢复失败**: 损坏的状态文件导致 JSON 解析失败 → 需要备份机制

### 🟡 Medium Priority Cases

**BUG-005 补充**:
- **三方冲突**: `team` + `ultrapilot` + `autopilot` 同时出现 → 优先级顺序未定义
- **显式 vs 隐式**: 用户显式调用 `/team` 但文本中包含 "autopilot" → 应该优先显式调用
- **大小写变体**: `TEAM` vs `team` vs `Team` → 需要规范化

**BUG-006 补充**:
- **类型错误**: 字段存在但类型错误（例如 `sessionId: 123` 而非字符串）
- **空字符串**: 字段存在但为空字符串 → 需要非空验证
- **超长字段**: 字段值超过合理长度 → 需要长度限制

---

## 3. Logical Consistency (逻辑一致性)

### ⚠️ Conflicts Detected

**冲突 1: 修复优先级 vs 影响范围不一致**
- PRD 将 BUG-001 标记为 P0，但修复顺序建议中与 BUG-002 并列
- **问题**: BUG-002 是安全漏洞，应该优先于数据完整性问题
- **建议**: 修复顺序应为 BUG-002 → BUG-001 → BUG-003 → BUG-004

**冲突 2: 修复方案的复杂度评估缺失**
- PRD 提供了多个修复方案，但未评估实现成本和风险
- **问题**:
  - BUG-001 方案 1（文件锁）在 Windows 上可能不可用
  - BUG-003 方案 3（HTML 解析器）引入新依赖，增加攻击面
- **建议**: 为每个方案添加"实现成本"和"风险评估"

**冲突 3: 测试建议不充分**
- PRD 提到"添加单元测试"，但未指定测试覆盖率目标
- **问题**:
  - 安全漏洞需要 100% 覆盖率
  - 竞态条件需要压力测试（1000+ 并发写入）
  - ReDoS 需要模糊测试（随机生成恶意输入）
- **建议**: 添加具体的测试指标和通过标准

---

## 4. Missing Security Considerations (缺失的安全考虑)

### 🔴 Critical Omissions

**1. 审计日志缺失**
- PRD 未提及任何审计日志机制
- **风险**: 安全事件无法追溯
- **建议**:
  ```typescript
  // 所有敏感操作必须记录
  function auditLog(event: string, details: any) {
    const log = {
      timestamp: new Date().toISOString(),
      event,
      details,
      sessionId: getCurrentSessionId(),
    };
    fs.appendFileSync('.omc/audit.log', JSON.stringify(log) + '\n');
  }
  ```

**2. 输入长度限制不一致**
- BUG-003 建议限制为 10000 字符，但其他输入未限制
- **风险**: 其他输入点可能成为新的攻击面
- **建议**: 全局输入长度限制策略

**3. 错误信息泄露**
- PRD 中的错误处理可能泄露敏感信息（例如文件路径）
- **风险**: 攻击者可以通过错误信息推断系统结构
- **建议**:
  ```typescript
  } catch (error) {
    // 不要泄露详细错误信息
    console.error(`[hook-bridge] Internal error in ${hookType}`);
    // 详细错误仅记录到审计日志
    auditLog('hook-error', { hookType, error: error.message });
    return { continue: false, error: 'Internal error' };
  }
  ```

**4. 状态文件权限未验证**
- PRD 未提及 `.omc/state/` 目录的权限设置
- **风险**: 其他用户可能读取或修改状态文件
- **建议**:
  ```typescript
  // 创建状态目录时设置权限
  fs.mkdirSync('.omc/state', { recursive: true, mode: 0o700 });
  ```

---

## 5. Performance & Resource Concerns (性能与资源问题)

### 🟡 Medium Priority

**BUG-001 修复的性能影响**
- 原子写入（temp + rename）会增加磁盘 I/O
- **影响**: 高频写入场景（Team 模式 10+ agents）可能导致性能下降
- **建议**: 添加写入节流（throttle）机制

**BUG-004 清理逻辑的资源消耗**
- 启动时扫描所有状态文件可能很慢
- **影响**: 大量陈旧状态文件时启动延迟
- **建议**: 异步清理 + 后台任务

---

## Conclusion (结论)

### 评审结果: ⚠️ CONDITIONAL PASS

### Major Blockers (严重阻碍)

1. **BUG-002 修复方案不完整** - 必须添加原型污染防护和 Unicode 绕过检测
2. **审计日志缺失** - 所有安全相关操作必须记录
3. **错误信息泄露风险** - 必须清理错误消息中的敏感信息
4. **状态文件权限未验证** - 必须设置正确的文件权限

### Required Changes (必需修改)

1. **立即添加**:
   - 审计日志机制（所有敏感操作）
   - 原型污染防护（`Object.create(null)` 或白名单深拷贝）
   - 状态文件权限验证（0o700）
   - 错误信息清理（移除路径和详细堆栈）

2. **修复优先级调整**:
   ```
   第一阶段（本周）:
   1. BUG-002（安全漏洞 - 最高优先级）
   2. BUG-001（数据完整性）

   第二阶段（下周）:
   3. BUG-003（ReDoS）
   4. BUG-004（资源泄漏）

   第三阶段（下月）:
   5. BUG-005（用户体验）
   6. BUG-006（错误处理）
   ```

3. **测试覆盖率要求**:
   - BUG-002: 100% 覆盖率 + 模糊测试（1000+ 恶意输入）
   - BUG-001: 压力测试（1000+ 并发写入，持续 10 分钟）
   - BUG-003: ReDoS 测试套件（嵌套深度 1-10000）
   - BUG-004: 异常退出恢复测试（SIGTERM、SIGKILL、断电模拟）

### Approval Conditions (批准条件)

PRD 可以进入实施阶段，但必须满足以下条件：

1. ✅ 添加审计日志机制到所有修复方案
2. ✅ 补充原型污染和 Unicode 绕过防护
3. ✅ 添加状态文件权限验证
4. ✅ 清理错误信息中的敏感数据
5. ✅ 调整修复优先级（BUG-002 优先）
6. ✅ 添加具体的测试覆盖率指标

---

**评审签名**: The Critic
**下一步**: 修订 PRD 后重新提交评审，或直接进入实施（风险自负）
