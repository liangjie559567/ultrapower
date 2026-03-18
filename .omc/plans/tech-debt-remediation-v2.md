# ZeroDev 技术债务处理计划 v2

**创建时间**: 2026-03-18
**状态**: 待执行
**基线**: Sprint 0 完成，29/29 测试通过

---

## 执行摘要

处理代码审查遗留的 4 项技术债务，优先级从中到低。预计总工时 4-6 小时，分 2 个 Sprint 完成。

---

## 技术债务清单

### 债务 #1：输入验证不足
- **优先级**: P1（中）
- **当前状态**: matchTemplate 和 generateCode 有基础验证
- **问题**: 其他函数缺少验证，边界情况未覆盖
- **影响**: 运行时错误风险，用户体验差

### 债务 #2：checkQuality 评分不合理
- **优先级**: P1（中）
- **当前状态**: 简单启发式（检查关键词）
- **问题**: 无法检测真实类型错误
- **影响**: 质量门禁失效，低质量代码通过

### 债务 #3：测试覆盖不足
- **优先级**: P2（低）
- **当前状态**: 29 个测试，覆盖主要功能
- **问题**: 缺少边界情况和错误路径测试
- **影响**: 回归风险

### 债务 #4：测试代码重复
- **优先级**: P2（低）
- **当前状态**: 测试文件中有重复的设置代码
- **问题**: 维护成本高
- **影响**: 测试可维护性差

---

## 任务优先级排序

### Sprint 1（高优先级）
1. **Task #1**: 增强输入验证（债务 #1）
2. **Task #2**: 集成 LSP 诊断替代 checkQuality（债务 #2）

### Sprint 2（低优先级）
3. **Task #3**: 增加边界情况测试（债务 #3）
4. **Task #4**: 重构测试辅助函数（债务 #4）

---

## 任务详细计划

### Task #1: 增强输入验证

**优先级**: P1
**预估工时**: 1.5 小时
**依赖**: 无
**负责模块**: code-generator.ts, requirement-clarifier.ts

#### 具体步骤

1. **code-generator.ts 验证增强**（30 分钟）
   - 在 `matchTemplate` 中添加：
     - 最大长度检查（requirement.length <= 500）
     - 特殊字符过滤（防止注入）
   - 在 `generateCode` 中添加：
     - className 格式验证（PascalCase，字母开头）
     - vars 对象深度检查（防止原型污染）

2. **requirement-clarifier.ts 验证增强**（30 分钟）
   - `detectPlatform`: 添加输入长度限制
   - `extractRequirements`: 添加数组长度限制（防止 DoS）
   - `loadProjectMemory`: 添加 JSON 大小限制（< 1MB）

3. **错误处理统一**（30 分钟）
   - 创建自定义错误类：`ValidationError`, `InputError`
   - 统一错误消息格式
   - 添加错误日志记录

#### 验收标准

- [ ] 所有公共函数都有输入验证
- [ ] 验证失败抛出明确的错误消息
- [ ] 现有 29 个测试全部通过
- [ ] 新增 8 个验证测试用例

#### 测试用例

```typescript
// matchTemplate 验证测试
it('应该拒绝过长的需求', () => {
  const longReq = 'a'.repeat(501);
  expect(() => matchTemplate(longReq)).toThrow('Requirement too long');
});

// generateCode 验证测试
it('应该拒绝无效的 className', () => {
  expect(() => generateCode('auth/jwt-auth.ts.template', { className: '123Invalid' }))
    .toThrow('Invalid className format');
});
```

---

### Task #2: 集成 LSP 诊断替代 checkQuality

**优先级**: P1
**预估工时**: 2 小时
**依赖**: Task #1（可并行）
**负责模块**: code-generator.ts

#### 具体步骤

1. **创建 LSP 验证函数**（45 分钟）
   ```typescript
   import { lsp_diagnostics } from '@ultrapower/mcp';
   
   export async function validateCodeWithLSP(code: string, filePath: string): Promise<{
     score: number;
     errors: string[];
     warnings: string[];
   }> {
     // 写入临时文件
     // 调用 lsp_diagnostics
     // 计算分数：100 - (errors * 20) - (warnings * 5)
     // 清理临时文件
   }
   ```

2. **重构 checkQuality**（30 分钟）
   - 重命名为 `checkQualityLegacy`（保留向后兼容）
   - 创建新的 `checkQuality` 调用 `validateCodeWithLSP`
   - 添加降级机制（LSP 失败时回退到启发式）

3. **更新测试**（45 分钟）
   - 添加 LSP 集成测试（使用真实 TypeScript 代码）
   - 添加降级测试（模拟 LSP 失败）
   - 更新现有质量检查测试

#### 验收标准

- [ ] checkQuality 使用 LSP 进行真实类型检查
- [ ] 能检测出语法错误、类型错误
- [ ] LSP 失败时自动降级到启发式
- [ ] 所有测试通过（包括新增的 6 个测试）
- [ ] 性能：单次检查 < 500ms

#### 测试用例

```typescript
it('应该检测出类型错误', async () => {
  const code = `export class Test {
    method(): string { return 123; } // 类型错误
  }`;
  const result = await checkQuality(code);
  expect(result.score).toBeLessThan(80);
  expect(result.errors).toContain('Type');
});
```

---

### Task #3: 增加边界情况测试

**优先级**: P2
**预估工时**: 1 小时
**依赖**: Task #1, Task #2
**负责模块**: tests/agents/zerodev/

#### 具体步骤

1. **requirement-clarifier 边界测试**（30 分钟）
   - 空字符串、null、undefined 输入
   - 超长输入（> 10000 字符）
   - 特殊字符和 Unicode
   - 项目记忆文件损坏/缺失

2. **code-generator 边界测试**（30 分钟）
   - 模板不存在的情况
   - vars 包含特殊字符
   - 生成的代码超长
   - 并发调用测试

#### 验收标准

- [ ] 新增 12 个边界情况测试
- [ ] 测试覆盖率 > 90%
- [ ] 所有边界情况都有明确的错误处理

---

### Task #4: 重构测试辅助函数

**优先级**: P2
**预估工时**: 1 小时
**依赖**: Task #3
**负责模块**: tests/agents/zerodev/

#### 具体步骤

1. **创建测试辅助文件**（30 分钟）
   ```typescript
   // tests/agents/zerodev/test-helpers.ts
   export function createMockState(overrides?: Partial<RequirementClarifierState>) {
     return { /* 默认状态 */ ...overrides };
   }
   
   export function createTestSession(id: string = 'test-session') {
     return new ZeroDevStateManager();
   }
   ```

2. **重构现有测试**（30 分钟）
   - 替换重复的 beforeEach 代码
   - 使用辅助函数创建测试数据
   - 统一断言风格

#### 验收标准

- [ ] 测试代码减少 30% 重复
- [ ] 所有测试通过
- [ ] 测试可读性提升

---

## 依赖关系图

```
Task #1 (输入验证) ─┬─> Task #3 (边界测试)
                    │
Task #2 (LSP 集成) ─┘    └─> Task #4 (测试重构)
```

**并行执行**: Task #1 和 Task #2 可并行
**顺序执行**: Task #3 依赖 Task #1 和 #2，Task #4 依赖 Task #3

---

## 工时预估

| 任务 | 预估工时 | 优先级 | Sprint |
|------|----------|--------|--------|
| Task #1: 输入验证 | 1.5h | P1 | Sprint 1 |
| Task #2: LSP 集成 | 2h | P1 | Sprint 1 |
| Task #3: 边界测试 | 1h | P2 | Sprint 2 |
| Task #4: 测试重构 | 1h | P2 | Sprint 2 |
| **总计** | **5.5h** | - | - |

---

## 风险评估

### 高风险
- **LSP 集成复杂度**: LSP 可能不稳定或性能差
  - **缓解**: 实现降级机制，保留启发式方法

### 中风险
- **测试覆盖率目标**: 90% 可能难以达到
  - **缓解**: 优先覆盖关键路径，边界情况次之

### 低风险
- **向后兼容性**: 新验证可能破坏现有功能
  - **缓解**: 保留旧函数，渐进式迁移

---

## 成功标准

### Sprint 1 完成标准
- [ ] 所有公共函数有输入验证
- [ ] checkQuality 使用 LSP 进行真实检查
- [ ] 测试套件扩展到 43+ 个测试
- [ ] 所有测试通过
- [ ] 无性能回归（< 500ms/检查）

### Sprint 2 完成标准
- [ ] 测试覆盖率 > 90%
- [ ] 测试代码重复减少 30%
- [ ] 所有边界情况有明确处理
- [ ] 文档更新完成

---

## 验证清单

### 功能验证
- [ ] 运行完整测试套件：`npm test`
- [ ] 类型检查：`tsc --noEmit`
- [ ] Lint 检查：`npm run lint`

### 性能验证
- [ ] checkQuality 性能 < 500ms
- [ ] 内存使用无泄漏
- [ ] 并发测试通过

### 安全验证
- [ ] 输入验证防止注入
- [ ] 原型污染防护
- [ ] DoS 防护（输入大小限制）

---

## 回滚计划

如果任务失败或引入严重问题：

1. **立即回滚**: `git revert <commit>`
2. **恢复基线**: 回到 Sprint 0 完成状态（29/29 测试通过）
3. **问题分析**: 记录失败原因到 `.omc/plans/open-questions.md`
4. **重新规划**: 调整任务范围或优先级

---

## 下一步行动

1. **用户确认**: 审查此计划，确认优先级和范围
2. **开始执行**: 运行 `/ultrapower:start-work tech-debt-remediation-v2`
3. **进度跟踪**: 使用 TaskUpdate 更新任务状态

---

**计划创建者**: Planner (Prometheus)
**计划版本**: v2.0
**最后更新**: 2026-03-18
