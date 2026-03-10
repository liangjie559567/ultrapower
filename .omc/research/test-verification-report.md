# 测试验证报告

**生成时间**: 2026-03-10 14:07:54 UTC

## 测试套件总体统计

- **失败测试文件数**: 13
- **失败用例总数**: 89
- **测试状态**: ❌ 未通过

## 失败测试文件清单

### 1. src/team/__tests__/bridge-integration.test.ts
- 总用例: 17
- 失败用例: 2
- 执行时间: 438ms

### 2. src/__tests__/delegation-enforcement-levels.test.ts
- 总用例: 63
- 失败用例: 1
- 执行时间: 450ms

### 3. src/hooks/subagent-tracker/__tests__/boundary-conditions.test.ts
- 总用例: 10
- 失败用例: 3
- 执行时间: 83ms

### 4. src/features/state-manager/__tests__/encryption-integration.test.ts
- 总用例: 7
- 失败用例: 5
- 执行时间: 89ms

### 5. src/notifications/__tests__/notify-registry-integration.test.ts
- 总用例: 14
- 失败用例: 11
- 执行时间: 984ms

### 6. src/team/__tests__/team-status.test.ts
- 总用例: 5
- 失败用例: 2
- 执行时间: 140ms

### 7. src/notifications/__tests__/profiles.test.ts
- 总用例: 11
- 失败用例: 10
- 执行时间: 35ms

### 8. src/__tests__/task-continuation.test.ts
- 总用例: 93
- 失败用例: 25
- 执行时间: 119ms

### 9. src/tools/diagnostics/__tests__/tsc-runner.test.ts
- 总用例: 6
- 失败用例: 3
- 执行时间: 9ms

### 10. src/__tests__/plugin-registry.test.ts
- 总用例: 13
- 失败用例: 10
- 执行时间: 78ms

### 11. src/__tests__/version-helper.test.ts
- 总用例: 4
- 失败用例: 4
- 执行时间: 17ms

### 12. src/tools/lsp/__tests__/command-exists.test.ts
- 总用例: 8
- 失败用例: 5
- 执行时间: 572ms

### 13. src/__tests__/multi-model-mcp.test.ts
- 总用例: 14
- 失败用例: 8
- 执行时间: 791ms

## 通过率分析

- **失败率**: 显著失败
- **主要问题区域**:
  - 通知系统 (notify-registry, profiles)
  - 任务延续 (task-continuation)
  - 插件注册 (plugin-registry)
  - MCP 多模型 (multi-model-mcp)
  - LSP 命令检测 (command-exists)

## 建议

1. 优先修复高失败率文件 (失败用例 > 8)
2. 关注通知系统和任务延续模块
3. 检查版本助手和插件注册逻辑
4. 验证 MCP CLI 检测机制
