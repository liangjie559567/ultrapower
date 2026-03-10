# Skills 参考

## 工作流 Skills

### autopilot
**用途**: 从想法到可运行代码的全自主执行

**触发词**: "autopilot", "build me", "I want a"

**示例**:
```bash
/ultrapower:autopilot "Build a REST API for todo management"
```

### ralph
**用途**: 带验证的自引用循环，持久执行直到完成

**触发词**: "ralph", "don't stop", "must complete"

**示例**:
```bash
/ultrapower:ralph "Fix all TypeScript errors in the project"
```

### team
**用途**: 多 agent 协调，分阶段流水线

**阶段**: plan → prd → exec → verify → fix

**示例**:
```bash
/ultrapower:team "Implement user authentication system"
```

### ultrawork
**用途**: 最大并行度的 agent 编排

**触发词**: "ulw", "ultrawork"

**示例**:
```bash
/ultrapower:ultrawork "Refactor all API endpoints"
```

## Agent 快捷 Skills

| Skill | 映射 Agent | 用途 |
|-------|-----------|------|
| `analyze` | debugger | 调试分析 |
| `deepsearch` | explore | 代码库搜索 |
| `tdd` | test-engineer | 测试驱动开发 |
| `build-fix` | build-fixer | 修复构建错误 |
| `code-review` | code-reviewer | 代码审查 |

## 规划 Skills

### plan
**用途**: 战略规划

**模式**:
- `--consensus`: 与多个 agents 迭代直至共识
- `--review`: 批判性审查

**示例**:
```bash
/ultrapower:plan "Design microservices architecture"
/ultrapower:plan --consensus "Refactor authentication layer"
```
