<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/shared/

## Purpose
跨模块共享的类型定义和常量。提供整个 src/ 目录使用的公共接口定义，避免循环依赖。

## Key Files

| 文件 | 描述 |
|------|------|
| `index.ts` | 共享模块导出入口 |
| `types.ts` | 全局类型定义（Agent 类型、Hook 类型、状态类型等） |

## For AI Agents

### 修改此目录时
- 类型变更可能影响整个代码库，修改前用 `lsp_find_references` 检查影响范围
- 新增类型优先放在最接近使用场景的模块中，只有真正跨模块的类型才放这里
- 运行 `npm run build` 验证类型兼容性

## Dependencies

### Internal
- 被 `src/` 下所有模块引用

<!-- MANUAL: -->
