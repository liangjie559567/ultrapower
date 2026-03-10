# 状态管理迁移指南

## 概述

ultrapower v7.0.0 引入统一状态管理层，消除状态碎片化问题。本文档说明如何从旧版状态管理迁移到新系统。

## 架构变化

### 旧版架构
- 多个独立的状态文件实现
- 直接文件读写，无统一抽象
- 状态管理逻辑分散在各模式中

### 新版架构
- 统一的 StateManager 接口
- 支持文件系统和 SQLite 后端
- 集中的状态管理逻辑
- 会话隔离支持

## 迁移策略

### 阶段 1: 双写模式（向后兼容）
新代码同时写入旧版和新版状态文件，确保兼容性。

```typescript
import { createStateManager } from './state/index.js';

const manager = createStateManager({
  mode: 'autopilot',
  directory: process.cwd(),
  dualWrite: true // 启用双写
});

await manager.write({ active: true, iteration: 1 });
```

### 阶段 2: 迁移现有状态
使用迁移工具转换现有状态文件，内置完整性保障。

```typescript
import { migrateMode, backupBeforeMigration, verifyIntegrity } from './state/migration/index.js';

// 迁移到新格式（自动备份+回滚+验证）
const success = migrateMode('autopilot', process.cwd());

// 手动备份（可选）
const backup = backupBeforeMigration('autopilot', process.cwd());

// 验证完整性
const result = verifyIntegrity('autopilot', process.cwd());
console.log(result.valid ? '✅ 验证通过' : `❌ ${result.errors.join(', ')}`);
```

**完整性保障机制**:
- ✅ 迁移前自动创建备份
- ✅ 失败时自动回滚到备份
- ✅ 迁移后自动验证状态完整性

### 阶段 3: 切换到新系统
停用双写模式，完全使用新的状态管理层。

## API 使用

### 基本操作

```typescript
import { createStateManager } from './state/index.js';

const manager = createStateManager({
  mode: 'team',
  directory: process.cwd()
});

// 写入状态
await manager.write({ active: true, team_name: 'my-team' });

// 读取状态
const state = manager.read();

// 会话隔离
await manager.write({ active: true }, 'session-123');
const sessionState = manager.read('session-123');

// 清除状态
manager.clear();
```

## 兼容性

- ✅ 向后兼容现有状态文件格式
- ✅ 支持渐进迁移，无需一次性切换
- ✅ 保留现有 state-tools MCP 接口

## 注意事项

1. **备份优先**: 迁移前务必备份现有状态文件
2. **渐进迁移**: 建议逐个模式迁移，而非一次性全部迁移
3. **测试验证**: 迁移后运行完整测试套件验证功能
