# CCG Workflow 故障排查指南

## 常见问题

### 工作流启动失败

**症状**: 运行 `/ccg-workflow` 后无响应或报错

**排查步骤**:

1. 检查项目类型检测
```bash

# 查看项目检测结果

cat .omc/ccg/project-detection.log
```

1. 检查文档目录权限
```bash

# 确保 .omc/ccg 目录存在且可写

ls -la .omc/ccg/
chmod 755 .omc/ccg/
```

1. 检查 Claude/Codex 连接
```bash

# 验证 API 密钥配置

echo $CLAUDE_API_KEY
echo $CODEX_API_KEY
```

**解决方案**:

* 确保 `.omc/ccg/` 目录存在

* 检查 API 密钥是否正确配置

* 查看错误日志：`.omc/ccg/error.log`

---

### 需求阶段卡住

**症状**: Claude 生成需求文档后长时间无响应

**排查步骤**:

1. 检查需求文档是否生成
```bash
ls -la .omc/ccg/requirements.md
```

1. 查看 Claude 的处理日志
```bash
tail -f .omc/ccg/claude.log
```

1. 检查网络连接
```bash
ping api.anthropic.com
```

**解决方案**:

* 如果需求文档已生成，手动确认后继续

* 如果网络超时，等待 30 秒后重试

* 如果持续失败，检查 API 配额

---

### 开发阶段代码质量差

**症状**: Codex 生成的代码有语法错误或逻辑错误

**排查步骤**:

1. 检查生成的代码
```bash

# 查看最新生成的代码文件

git diff HEAD~1
```

1. 运行编译检查
```bash
npm run build
```

1. 查看 Codex 的处理日志
```bash
tail -f .omc/ccg/codex.log
```

**解决方案**:

* 检查需求文档是否清晰

* 增加技术设计文档的细节

* 手动修复代码后，重新运行优化循环

---

### 优化循环无法收敛

**症状**: 优化清单中的问题反复出现，无法解决

**排查步骤**:

1. 查看优化清单
```bash
cat .omc/ccg/optimization-list.md
```

1. 分析阻断项
```bash

# 查看第 N 轮的阻断项

grep -A 5 "第 N 轮优化" .omc/ccg/optimization-list.md
```

1. 检查代码变更
```bash
git log --oneline -10
```

**解决方案**:

* 如果达到 5 轮限制，停止优化循环

* 手动审查阻断项，确认是否需要继续

* 考虑拆分为更小的功能模块

---

### 测试循环失败

**症状**: 测试报告中有失败的测试用例

**排查步骤**:

1. 查看测试报告
```bash
cat .omc/ccg/test-checklist.md
```

1. 运行本地测试
```bash
npm test
```

1. 查看失败的测试日志
```bash
npm test -- --verbose
```

**解决方案**:

* 根据失败原因修复代码

* 重新运行测试

* 如果测试通过，继续下一轮

---

### 微服务项目处理失败

**症状**: 微服务检测失败或生成的文档不完整

**排查步骤**:

1. 检查微服务检测结果
```bash
cat .omc/ccg/microservice-detection.log
```

1. 查看各服务的文档
```bash
ls -la .omc/ccg/services/
```

1. 检查服务依赖图
```bash
cat .omc/ccg/dependency-graph.md
```

**解决方案**:

* 确保每个服务都有独立的 `package.json`

* 检查服务间的依赖关系

* 手动编辑依赖图后重试

---

### API 不可用降级失败

**症状**: Codex API 不可用，系统未能降级到 Claude

**排查步骤**:

1. 检查 API 状态
```bash
cat .omc/ccg/api-status.log
```

1. 查看降级日志
```bash
grep "fallback" .omc/ccg/error.log
```

1. 检查 Claude API 连接
```bash
echo $CLAUDE_API_KEY | wc -c  # 应该 > 0
```

**解决方案**:

* 确保 Claude API 密钥正确配置

* 检查网络连接

* 手动触发降级：`/ccg-workflow fallback`

---

## 性能问题

### 工作流执行缓慢

**症状**: 工作流执行时间超过预期

**排查步骤**:

1. 查看性能指标
```bash
cat .omc/ccg/performance.log
```

1. 检查文件缓存
```bash
du -sh .omc/ccg/
```

1. 查看 API 调用次数
```bash
grep "API call" .omc/ccg/debug.log | wc -l
```

**解决方案**:

* 清理缓存：`rm -rf .omc/ccg/.cache`

* 减少文档大小

* 优化 API 调用频率

---

### 内存占用过高

**症状**: 工作流执行时内存占用不断增加

**排查步骤**:

1. 监控内存使用
```bash
top -p $(pgrep -f ccg-workflow)
```

1. 查看内存泄漏日志
```bash
cat .omc/ccg/memory.log
```

**解决方案**:

* 重启工作流进程

* 减少并发任务数

* 检查是否有无限循环

---

## 数据问题

### 文档损坏或丢失

**症状**: 文档文件无法读取或内容为空

**排查步骤**:

1. 检查文件完整性
```bash
file .omc/ccg/requirements.md
```

1. 查看文件大小
```bash
ls -lh .omc/ccg/*.md
```

1. 检查备份
```bash
ls -la .omc/ccg/.backup/
```

**解决方案**:

* 从备份恢复：`cp .omc/ccg/.backup/requirements.md .omc/ccg/`

* 重新生成文档

* 检查磁盘空间是否充足

---

### 文档版本冲突

**症状**: 多个版本的文档存在，不知道使用哪个

**排查步骤**:

1. 查看文档版本
```bash
grep "version:" .omc/ccg/*.md
```

1. 查看修改时间
```bash
ls -lt .omc/ccg/*.md
```

**解决方案**:

* 使用最新版本（修改时间最新）

* 删除旧版本：`rm .omc/ccg/*.md.bak`

* 查看 git 历史确认正确版本

---

## 安全问题

### 敏感信息泄露

**症状**: 文档中包含 API 密钥、密码等敏感信息

**排查步骤**:

1. 搜索敏感信息
```bash
grep -r "password\ | api_key\ | secret" .omc/ccg/
```

1. 查看文件权限
```bash
ls -la .omc/ccg/
```

**解决方案**:

* 立即删除敏感信息

* 更新 API 密钥

* 设置正确的文件权限：`chmod 600 .omc/ccg/*.md`

* 添加 `.omc/ccg/` 到 `.gitignore`

---

### 路径遍历攻击

**症状**: 工作流生成的文件出现在预期目录外

**排查步骤**:

1. 检查生成的文件位置
```bash
find . -name "*.md" -newer .omc/ccg/requirements.md
```

1. 查看工作流日志
```bash
grep "path" .omc/ccg/debug.log
```

**解决方案**:

* 确保所有文件都在 `.omc/ccg/` 目录内

* 检查输入验证逻辑

* 更新工作流版本

---

## 获取帮助

### 查看详细日志

```bash

# 查看所有日志

ls -la .omc/ccg/*.log

# 查看最新的错误

tail -20 .omc/ccg/error.log

# 查看完整的调试信息

cat .omc/ccg/debug.log | grep -A 5 "ERROR"
```

### 收集诊断信息

```bash

# 生成诊断报告

/ccg-workflow diagnose

# 输出会保存到

cat .omc/ccg/diagnostic-report.md
```

### 联系支持

如果问题无法解决，请收集以下信息：

1. 诊断报告：`.omc/ccg/diagnostic-report.md`
2. 错误日志：`.omc/ccg/error.log`
3. 工作流日志：`.omc/ccg/debug.log`
4. 项目信息：`package.json`、`tsconfig.json`

然后提交 issue 或联系技术支持。
