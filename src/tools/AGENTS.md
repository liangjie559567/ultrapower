<!-- Generated: 2026-01-28 | Updated: 2026-03-05 -->

# src/tools/ - 工具系统

**用途：** 35 个自定义工具的实现。包括 LSP、AST、诊断和其他工具。

**版本：** 5.5.14

## 关键文件

| 文件 | 描述 |
|------|------|
| `index.ts` | 工具导出和注册 |
| `lsp/` | LSP 工具（10+） |
| `diagnostics/` | 诊断工具 |
| `ast/` | AST 工具 |

## 工具分类

| 分类 | 数量 | 工具 |
|------|------|------|
| LSP 工具 | 10+ | hover, goto-definition, find-references, document-symbols, workspace-symbols, diagnostics, rename, code-actions |
| AST 工具 | 2 | ast-grep-search, ast-grep-replace |
| 诊断工具 | 3+ | diagnostics, diagnostics-directory, lsp-servers |
| 其他工具 | 20+ | python-repl, state-read, state-write, notepad-read, notepad-write 等 |

## 子目录结构

```
src/tools/
├── lsp/                    # LSP 工具
│   ├── hover.ts
│   ├── goto-definition.ts
│   ├── find-references.ts
│   ├── document-symbols.ts
│   ├── workspace-symbols.ts
│   ├── diagnostics.ts
│   ├── rename.ts
│   ├── code-actions.ts
│   └── ...
├── diagnostics/            # 诊断工具
│   ├── index.ts
│   └── ...
├── ast/                    # AST 工具
│   ├── grep-search.ts
│   ├── grep-replace.ts
│   └── ...
├── index.ts               # 工具导出
└── __tests__/             # 测试
```

## 面向 AI 智能体

### 在此目录中工作

1. **使用 LSP 工具进行代码分析**
   - `lsp_hover` - 获取符号类型信息
   - `lsp_goto_definition` - 跳转到定义
   - `lsp_find_references` - 查找所有引用
   - `lsp_workspace_symbols` - 跨文件搜索符号

2. **使用 AST 工具进行结构化搜索**
   - `ast_grep_search` - 使用模式搜索代码
   - `ast_grep_replace` - 结构化代码转换

3. **使用诊断工具进行类型检查**
   - `lsp_diagnostics` - 单文件诊断
   - `lsp_diagnostics_directory` - 项目级诊断

### 修改检查清单

| 修改位置 | 验证步骤 |
|---------|---------|
| 新工具 | 在 `index.ts` 中导出 |
| LSP 工具 | 运行 `npm test` |
| AST 工具 | 测试模式匹配 |
| 工具数量 | 更新 `/AGENTS.md` 根文件 |
