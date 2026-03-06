# MCP 工具名称长度修复总结

## 问题
用户升级到 v5.5.29 后，`/ultrapower:swarm` 报错：
```
API Error: 400 工具名称过长: mcp__plugin_ultrapower_t__ultrapower_parallel_opportunity_detector
```

## 根本原因
1. MCP 服务器使用 `registerToolWithBothNames()` 注册工具，添加了 `ultrapower:` 前缀
2. MCP 前缀 `mcp__plugin_ultrapower_t__` + `ultrapower_` + 工具名 = 67 字符
3. 超过 Anthropic API 的 64 字符限制

## 解决方案
1. 新增 `mcpServerTools` 导出，仅包含原始工具名称（不带 `ultrapower:` 前缀）
2. 缩短过长的工具名称：
   - `parallel_opportunity_detector` → `parallel_detector`
   - `lsp_diagnostics_directory` → `lsp_diag_dir`
   - `lsp_code_action_resolve` → `lsp_action_resolve`
   - `notepad_write_*` → `notepad_*`
   - `load_omc_skills_*` → `load_skills_*`
   - `list_omc_skills` → `list_skills`

## 验证结果
- ✅ 所有工具名称 ≤ 64 字符（最长 47 字符）
- ✅ 所有 360 个测试文件通过（6266 个测试）
- ✅ 编译成功，无错误

## 影响范围
- MCP 服务器工具注册逻辑
- 工具名称迁移映射
- 相关测试用例
