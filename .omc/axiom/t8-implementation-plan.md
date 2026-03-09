# T8 实施计划：Hooks 系统测试覆盖 70%+

**任务概览：**

* 优先级：P1

* 预计工时：2 周

* 当前状态：规划阶段

* 目标：将 hooks 测试覆盖率从 40% 提升到 70%+

## 现状分析

* **Hooks 总数：** 40+ 个子目录

* **现有测试文件：** 57 个 .test.ts 文件

* **覆盖率工具：** 需要安装 @vitest/coverage-v8

## 实施策略

### 阶段 1：环境准备（1 天）

1. 安装覆盖率工具：`npm install -D @vitest/coverage-v8`
2. 运行基线覆盖率检查：`npm run test:coverage -- src/hooks`
3. 识别覆盖率最低的 hooks 模块

### 阶段 2：优先级分组（按使用频率和重要性）

**P0 核心 Hooks（必须 >80% 覆盖）：**

* autopilot

* ralph

* ultrawork

* team-pipeline

* bridge-normalize（安全关键）

* permission-handler（安全关键）

**P1 常用 Hooks（目标 70% 覆盖）：**

* auto-slash-command

* magic-keywords

* rules-injector

* session-end

* setup

**P2 辅助 Hooks（目标 60% 覆盖）：**

* agent-usage-reminder

* think-mode

* recovery

* 其他辅助模块

### 阶段 3：测试编写模板

每个 hook 至少包含 3 类测试：
1. **正常流程测试：** 验证核心功能正常工作
2. **错误处理测试：** 验证异常情况的处理
3. **边界情况测试：** 验证极端输入和状态

### 阶段 4：分批实施（10 天）

**批次 1（2 天）：** P0 核心 Hooks（6 个）
**批次 2（3 天）：** P1 常用 Hooks（5 个）
**批次 3（3 天）：** P2 辅助 Hooks（剩余）
**批次 4（2 天）：** 覆盖率验证和补充

### 阶段 5：CI 集成（1 天）

* 配置 CI 覆盖率门禁

* 确保所有测试在 CI 环境通过

## 验收标准

* [ ] 每个 hook 类型至少 3 个测试用例

* [ ] 覆盖正常流程、错误处理、边界情况

* [ ] 总体覆盖率从 40% 提升到 70%+

* [ ] CI 集成测试通过

## 下一步行动

1. 安装覆盖率工具
2. 运行基线覆盖率检查
3. 开始批次 1 实施
