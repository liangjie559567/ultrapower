# 上下文收集规范

## 编码前强制检索清单（7项必查）

### 1. 文件名搜索（必须）
```bash
desktop-commander.start_search searchType="files" pattern="关键词"
```
目标：找到5-10个候选文件

### 2. 内容搜索（必须）
```bash
desktop-commander.start_search searchType="content" pattern="函数名|类名"
```
目标：找到关键实现位置

### 3. 阅读相似实现（必须≥3个）
```bash
Read file_path
```
关注：实现模式、可复用组件、注意事项

### 4. 开源实现搜索（通用功能必做）
```bash
github.search_code query="具体功能" language:"语言"
```
目标：学习最佳实践

### 5. 官方文档查询（涉及库/框架必做）
```bash
context7 resolve-library-id libraryName="库名"
context7 get-library-docs context7CompatibleLibraryID="库ID"
```
目标：避免错误用法

### 6. 测试代码分析（必须）
```bash
desktop-commander.start_search pattern="describe|it|test"
```
目标：理解测试策略

### 7. 模式提取（必须）
使用 sequential-thinking 分析检索结果
