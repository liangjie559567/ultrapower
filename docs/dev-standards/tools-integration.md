# 工具集成规范

## 本地文件操作（最高优先级）

### desktop-commander
**核心能力**：
- 文件操作：read_file、write_file、edit_block
- 目录管理：list_directory、create_directory
- 搜索：start_search（流式返回）
- 进程管理：start_process、interact_with_process
- 数据分析：Python/Node.js REPL

**使用场景**：
- 所有本地文件操作
- CSV/JSON/数据分析
- 交互式 REPL 工作流

**绝对优先于 bash 命令**

## 编程文档检索

### context7（最高优先级）
**用途**：编程库/SDK/API 文档
**调用方式**：
1. resolve-library-id 获取库 ID
2. get-library-docs 获取文档

**优势**：官方文档、token 高效、最新版本

### firecrawl（通用后备）
**用途**：最新博客/文章/教程
**调用方式**：
- firecrawl_search：搜索并抓取
- firecrawl_scrape：单页抓取
- firecrawl_map：网站结构发现

## GitHub 集成

### github
**核心能力**：
- 代码搜索：search_code、search_repositories
- PR 管理：create_pull_request、merge_pull_request
- Issue 管理：create_issue、update_issue
- 代码审查：create_and_submit_pull_request_review

## 工具选择决策树

```
本地文件操作？
└─ desktop-commander（最高优先级）

编程相关信息？
├─ 官方文档 → context7
└─ 博客/教程 → firecrawl

操作 GitHub？
└─ github.search_code / github.create_*
```
