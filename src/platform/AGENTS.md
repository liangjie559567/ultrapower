<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/platform/

## Purpose
平台抽象层。封装操作系统特定的功能（文件系统操作、进程管理、路径格式等），提供统一的跨平台接口。

## For AI Agents

### 平台检测
```typescript
import { platform } from './platform';
if (platform.isWindows) { /* Windows 特定逻辑 */ }
```

### 修改此目录时
- 所有平台特定代码必须通过此模块抽象
- 新增平台功能需在 Windows、macOS、Linux 三个平台测试
- 路径分隔符统一使用 `/`（Node.js 会自动处理）

## Dependencies

### Internal
- `src/utils/paths.ts` — 路径工具（使用平台抽象）

<!-- MANUAL: -->
