<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/constants/

## Purpose
全局常量定义模块。包含版本号、默认配置值、支持的模式列表、agent 名称枚举等在整个代码库中使用的常量。

## For AI Agents

### 修改此目录时
- 版本号在 `package.json` 中管理，不在此处硬编码
- 新增常量时检查是否已有类似常量避免重复
- 常量变更可能影响广泛，用 `lsp_find_references` 检查影响范围

## Dependencies

### Internal
- 被 `src/` 下所有模块引用

<!-- MANUAL: -->
