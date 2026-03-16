# 开发最佳实践指南

本指南提供 ultrapower 开发的核心最佳实践，帮助团队提高效率和代码质量。

## 工作流最佳实践

### 1. 任务规划

**使用 Team 模式进行复杂任务**

```bash
# 多 agent 协调执行
/team "实现用户认证功能"
```

Team 会自动路由到：
- `explore` - 代码库探索
- `planner` - 任务分解
- `executor` - 代码实现
- `verifier` - 质量验证

**优势**
- 自动分阶段执行
- 并行处理独立任务
- 内置质量检查

### 2. 代码审查

**使用专业审查 agent**

```bash
# 代码质量审查
/code-review "src/hooks/handlers/post-tool-use.ts"

# 安全审查
/security-review "src/security/concurrency-control.ts"

# 性能审查
Task(subagent_type="ultrapower:performance-reviewer", prompt="...")
```

**审查清单**
- [ ] 逻辑正确性
- [ ] 安全漏洞
- [ ] 性能瓶颈
- [ ] 代码风格
- [ ] 测试覆盖

### 3. 错误处理

**统一的错误处理模式**

```typescript
// ✅ 好的做法
try {
  const result = await operation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new AppError('OPERATION_FAILED', 'User-friendly message', { cause: error });
}

// ❌ 避免
try {
  await operation();
} catch (e) {
  console.log('error'); // 不清晰
}
```

**错误分类**
- `ValidationError` - 输入验证失败
- `StateError` - 状态管理问题
- `TimeoutError` - 执行超时
- `PermissionError` - 权限不足

---

## 状态管理最佳实践

### 1. 状态初始化

**检查清单**

```bash
# 启动前验证状态
omc repair --validate-state --dry-run

# 确保没有污染状态
ls -la .omc/state/
```

### 2. 并发控制

**使用独立 worktree**

```bash
# 为每个并发任务创建独立 worktree
git worktree add ../work-feature-1 -b feature-1 dev
git worktree add ../work-feature-2 -b feature-2 dev

# 各自独立的 .omc/state/ 目录
```

**避免状态冲突**
- 不要在多个 worktree 中共享 `.omc/state/`
- 使用 `--working-directory` 指定工作目录
- 定期清理过期状态

### 3. 状态备份

```bash
# 重要操作前备份
cp -r .omc/state .omc/state.backup.$(date +%s)

# 恢复备份
cp -r .omc/state.backup.1234567890/* .omc/state/
```

---

## Agent 生命周期最佳实践

### 1. 启动 Agent

**使用合适的 agent 类型**

| 任务类型 | 推荐 Agent | 模型 |
|---------|-----------|------|
| 代码库探索 | `explore` | haiku |
| 需求分析 | `analyst` | opus |
| 代码实现 | `executor` | sonnet |
| 质量验证 | `verifier` | sonnet |
| 架构设计 | `architect` | opus |

### 2. 监控执行

```bash
# 检查后台任务状态
check_job_status <job-id>

# 等待任务完成（最多 1 小时）
wait_for_job <job-id>

# 列出所有活跃任务
list_jobs --status_filter=active
```

### 3. 正常关闭

```bash
# ✅ 推荐：使用 cancel 命令
/ultrapower:cancel

# ❌ 避免：直接 Ctrl+C
# 会导致状态污染和孤儿 agent
```

---

## 代码质量最佳实践

### 1. 类型安全

```typescript
// ✅ 使用严格类型
interface AgentConfig {
  mode: ExecutionMode;
  timeout: number;
  retries: number;
}

// ❌ 避免 any
const config: any = { mode: 'autopilot' };
```

### 2. 路径安全

```typescript
// ✅ 验证 mode 参数
import { assertValidMode } from './lib/validateMode';
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;

// ❌ 直接拼接路径
const path = `.omc/state/${mode}-state.json`;
```

### 3. 输入消毒

```typescript
// ✅ 使用白名单过滤
const sanitized = filterByWhitelist(input, ALLOWED_FIELDS);

// ❌ 直接使用用户输入
const config = JSON.parse(userInput);
```

---

## 测试最佳实践

### 1. 单元测试

```bash
# 运行单次测试（不是 watch 模式）
npm test -- --run

# 运行特定文件
npm test -- src/hooks/__tests__/bridge-routing.test.ts --run

# 生成覆盖率报告
npm test -- --coverage --run
```

### 2. 集成测试

```bash
# 测试 repair 命令
npm test -- src/cli/commands/repair.test.ts --run

# 测试状态管理
npm test -- src/state/__tests__/ --run
```

### 3. 测试覆盖率目标

- 核心库：> 90%
- 工具函数：> 85%
- 集成代码：> 70%

---

## 性能最佳实践

### 1. 并行化策略

```bash
# 使用 ultrawork 进行最大并行度
/ultrawork "并行执行多个独立任务"

# 使用 Team 进行阶段并行
/team "多阶段任务"
```

### 2. 资源监控

```bash
# 检查状态文件大小
du -sh .omc/state/

# 检查 agent 目录大小
du -sh .omc/agents/

# 定期清理
omc repair --fix-orphan-agents
```

### 3. 超时配置

```typescript
// 根据任务类型设置合理超时
const TIMEOUTS = {
  quick: 30_000,      // 30 秒
  standard: 300_000,  // 5 分钟
  long: 1_800_000,    // 30 分钟
};
```

---

## 调试最佳实践

### 1. 启用详细日志

```bash
# 设置日志级别
export OMC_LOG_LEVEL=debug

# 查看日志
tail -f .omc/logs/*.log
```

### 2. 状态检查

```bash
# 查看当前状态
cat .omc/state/autopilot-state.json | jq .

# 检查活跃 mode
ls -la .omc/state/
```

### 3. 逐步诊断

```bash
# 1. 验证状态完整性
omc repair --validate-state

# 2. 检查孤儿 agent
omc repair --fix-orphan-agents --dry-run

# 3. 清理污染状态
omc repair --fix-state-pollution --dry-run
```

---

## 提交和发布最佳实践

### 1. 提交规范

```bash
# 格式：type(scope): description
git commit -m "feat(repair): add state validation command"
git commit -m "fix(hooks): handle concurrent state writes"
git commit -m "docs(guide): add troubleshooting section"
```

### 2. PR 检查清单

- [ ] 代码通过 linter
- [ ] 所有测试通过
- [ ] 类型检查无错误
- [ ] 代码审查通过
- [ ] 文档已更新
- [ ] 向后兼容

### 3. 发布流程

```bash
# 1. 更新版本
npm version patch|minor|major

# 2. 构建
npm run build

# 3. 测试
npm test -- --run

# 4. 发布
npm publish
```

---

## 常见陷阱和解决方案

| 陷阱 | 症状 | 解决方案 |
|------|------|--------|
| 状态污染 | "State already exists" | `omc repair --fix-state-pollution` |
| 孤儿 agent | 资源泄漏 | `omc repair --fix-orphan-agents` |
| 并发冲突 | 随机失败 | 使用独立 worktree |
| 超时 | 任务中断 | 增加超时时间或分解任务 |
| 权限错误 | 无法写入状态 | 检查 `.omc/` 目录权限 |

---

## 参考资源

- [故障排除指南](./troubleshooting-guide.md)
- [开发标准](../dev-standards/dev-standards.md)
- [Hook 执行顺序](../standards/hook-execution-order.md)
- [状态机规范](../standards/state-machine.md)
