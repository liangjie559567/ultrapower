---
name: deepinit
description: 深度代码库初始化，生成层级化 AGENTS.md 文档
---

# Deep Init Skill

在整个代码库中创建全面的层级化 AGENTS.md 文档。

## 核心概念

AGENTS.md 文件作为 **AI 可读文档**，帮助 agent 理解：
- 每个目录包含什么
- 组件之间如何关联
- 在该区域工作的特殊说明
- 依赖关系

## 层级标签系统

每个 AGENTS.md（根目录除外）都包含父级引用标签：

```markdown
<!-- Parent: ../AGENTS.md -->
```

This creates a navigable hierarchy:
```
/AGENTS.md                          ← Root (no parent tag)
├── src/AGENTS.md                   ← <!-- Parent: ../AGENTS.md -->
│   ├── src/components/AGENTS.md    ← <!-- Parent: ../AGENTS.md -->
│   └── src/utils/AGENTS.md         ← <!-- Parent: ../AGENTS.md -->
└── docs/AGENTS.md                  ← <!-- Parent: ../AGENTS.md -->
```

## AGENTS.md 模板

```markdown
<!-- Parent: {relative_path_to_parent}/AGENTS.md -->
<!-- Generated: {timestamp} | Updated: {timestamp} -->

# {Directory Name}

## Purpose
{One-paragraph description of what this directory contains and its role}

## Key Files
{List each significant file with a one-line description}

| File | Description |
|------|-------------|
| `file.ts` | Brief description of purpose |

## Subdirectories
{List each subdirectory with brief purpose}

| Directory | Purpose |
|-----------|---------|
| `subdir/` | What it contains (see `subdir/AGENTS.md`) |

## For AI Agents

### Working In This Directory
{Special instructions for AI agents modifying files here}

### Testing Requirements
{How to test changes in this directory}

### Common Patterns
{Code patterns or conventions used here}

## Dependencies

### Internal
{References to other parts of the codebase this depends on}

### External
{Key external packages/libraries used}

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
```

## 执行工作流

### 步骤 1：映射目录结构

```
Task(subagent_type="explore", model="haiku",
  prompt="List all directories recursively. Exclude: node_modules, .git, dist, build, __pycache__, .venv, coverage, .next, .nuxt")
```

### 步骤 2：创建工作计划

为每个目录生成待办事项，按深度级别组织：

```
Level 0: / (root)
Level 1: /src, /docs, /tests
Level 2: /src/components, /src/utils, /docs/api
...
```

### 步骤 3：逐级生成

**重要**：先生成父级，再生成子级，确保父级引用有效。

对每个目录：
1. 读取目录中的所有文件
2. 分析用途和关系
3. 生成 AGENTS.md 内容
4. 写入文件并附上正确的父级引用

### 步骤 4：比较并更新（若已存在）

当 AGENTS.md 已存在时：

1. **读取现有内容**
2. **识别各节**：
   - 自动生成的节（可更新）
   - 手动节（`<!-- MANUAL -->` 保留）
3. **比较**：
   - 新增了文件？
   - 删除了文件？
   - 结构发生变化？
4. **合并**：
   - 更新自动生成的内容
   - 保留手动注释
   - 更新时间戳

### 步骤 5：验证层级

生成后，运行验证检查：

| 检查项 | 验证方式 | 纠正措施 |
|-------|--------------|-------------------|
| 父级引用可解析 | 读取每个 AGENTS.md，检查 `<!-- Parent: -->` 路径是否存在 | 修复路径或删除孤立文件 |
| 无孤立 AGENTS.md | 对比 AGENTS.md 位置与目录结构 | 删除孤立文件 |
| 完整性 | 列出所有目录，检查是否有 AGENTS.md | 生成缺失文件 |
| 时间戳最新 | 检查 `<!-- Generated: -->` 日期 | 重新生成过期文件 |

验证脚本模式：
```bash
# Find all AGENTS.md files
find . -name "AGENTS.md" -type f

# Check parent references
grep -r "<!-- Parent:" --include="AGENTS.md" .
```

## 智能委托

| 任务 | Agent |
|------|-------|
| 目录映射 | `explore` |
| 文件分析 | `architect-low` |
| 内容生成 | `writer` |
| AGENTS.md 写入 | `writer` |

## 空目录处理

遇到空目录或近空目录时：

| 条件 | 操作 |
|-----------|--------|
| 无文件，无子目录 | **跳过** —— 不创建 AGENTS.md |
| 无文件，有子目录 | 创建仅含子目录列表的最小 AGENTS.md |
| 仅有生成文件（*.min.js、*.map） | 跳过或创建最小 AGENTS.md |
| 仅有配置文件 | 创建描述配置用途的 AGENTS.md |

仅含目录的容器的最小 AGENTS.md 示例：
```markdown
<!-- Parent: ../AGENTS.md -->
# {Directory Name}

## Purpose
Container directory for organizing related modules.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `subdir/` | Description (see `subdir/AGENTS.md`) |
```

## 并行化规则

1. **同级目录**：并行处理
2. **不同级别**：顺序处理（父级优先）
3. **大型目录**：为每个目录派生专用 agent
4. **小型目录**：将多个目录批量交给一个 agent

## 质量标准

### 必须包含
- [ ] 准确的文件描述
- [ ] 正确的父级引用
- [ ] 子目录链接
- [ ] AI agent 说明

### 必须避免
- [ ] 通用样板内容
- [ ] 错误的文件名
- [ ] 损坏的父级引用
- [ ] 遗漏重要文件

## 示例输出

### 根目录 AGENTS.md
```markdown
<!-- Generated: 2024-01-15 | Updated: 2024-01-15 -->

# my-project

## Purpose
A web application for managing user tasks with real-time collaboration features.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | Project dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `.env.example` | Environment variable template |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/` | Application source code (see `src/AGENTS.md`) |
| `docs/` | Documentation (see `docs/AGENTS.md`) |
| `tests/` | Test suites (see `tests/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Always install dependencies after modifying the project manifest
- Use TypeScript strict mode
- Follow ESLint rules

### Testing Requirements
- Run tests before committing
- Ensure >80% coverage

### Common Patterns
- Use barrel exports (index.ts)
- Prefer functional components

## Dependencies

### External
- React 18.x - UI framework
- TypeScript 5.x - Type safety
- Vite - Build tool

<!-- MANUAL: Custom project notes can be added below -->
```

### 嵌套 AGENTS.md
```markdown
<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2024-01-15 | Updated: 2024-01-15 -->

# components

## Purpose
Reusable React components organized by feature and complexity.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | Barrel export for all components |
| `Button.tsx` | Primary button component |
| `Modal.tsx` | Modal dialog component |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `forms/` | Form-related components (see `forms/AGENTS.md`) |
| `layout/` | Layout components (see `layout/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Each component has its own file
- Use CSS modules for styling
- Export via index.ts

### Testing Requirements
- Unit tests in `__tests__/` subdirectory
- Use React Testing Library

### Common Patterns
- Props interfaces defined above component
- Use forwardRef for DOM-exposing components

## Dependencies

### Internal
- `src/hooks/` - Custom hooks used by components
- `src/utils/` - Utility functions

### External
- `clsx` - Conditional class names
- `lucide-react` - Icons

<!-- MANUAL: -->
```

## 触发更新模式

在已有 AGENTS.md 文件的代码库上运行时：

1. 先检测现有文件
2. 读取并解析现有内容
3. 分析当前目录状态
4. 生成现有内容与当前状态的差异
5. 应用更新，同时保留手动节

## 性能注意事项

- **缓存目录列表** —— 不重复扫描相同目录
- **批量处理小目录** —— 一次处理多个
- **跳过未变更的** —— 若目录未变化，跳过重新生成
- **并行写入** —— 多个 agent 同时写入不同文件

## 路由触发

层级化 AGENTS.md 文档生成完成后调用 `next-step-router`：
- current_skill: "deepinit"
- stage: "agents_md_generated"
- output_summary: 生成的 AGENTS.md 文件数、覆盖的目录层级数
