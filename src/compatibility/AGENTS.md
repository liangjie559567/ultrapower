<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/compatibility/

## Purpose
兼容性层模块。处理不同版本之间的 API 兼容性、跨平台差异（Windows/macOS/Linux）和旧版配置迁移。

## For AI Agents

### 修改此目录时
- 新增兼容性 shim 需在 `docs/COMPATIBILITY.md` 中记录
- 废弃的 API 需保留向后兼容包装器直到下一个主版本
- Windows 特定代码需标注 `// Windows only` 注释

## Dependencies

### Internal
- `docs/COMPATIBILITY.md` — 兼容性文档
- `docs/MIGRATION.md` — 迁移指南

<!-- MANUAL: -->
