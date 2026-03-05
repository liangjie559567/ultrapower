# ultrapower 故障排查指南

快速诊断和解决 ultrapower 常见问题。

---

## 1. 安装问题

### npm 安装失败

**症状**：`npm install` 或 `npm install -g @liangjie559567/ultrapower` 失败

**原因**：
- Node.js 版本过低（需要 18.0+）
- npm 缓存损坏
- 网络连接问题
- 权限不足

**解决方案**：

```bash
# 检查 Node.js 版本
node --version  # 应显示 v18.0.0 或更高

# 升级 Node.js（如需要）
# macOS: brew install node
# Windows: 从 https://nodejs.org 下载安装

# 清理 npm 缓存
npm cache clean --force

# 重新安装
npm install -g @liangjie559567/ultrapower

# 如果仍失败，尝试使用 --verbose 查看详细日志
npm install -g @liangjie559567/ultrapower --verbose
```

### 依赖冲突

**症状**：`npm ERR! peer dep missing` 或 `npm ERR! conflicting peer dependency`

**原因**：
- 全局安装的包与项目依赖版本不兼容
- 多个 ultrapower 版本共存

**解决方案**：

```bash
# 卸载所有旧版本
npm uninstall -g @liangjie559567/ultrapower
npm uninstall -g ultrapower
npm uninstall -g omc

# 清理缓存
npm cache clean --force

# 重新安装最新版本
npm install -g @liangjie559567/ultrapower@latest

# 验证安装
npm list -g @liangjie559567/ultrapower
```

### 权限错误

**症状**：`EACCES: permission denied` 或 `Error: EPERM: operation not permitted`

**原因**：
- npm 全局目录权限不足
- Windows 需要管理员权限

**解决方案**：

```bash
# macOS/Linux：修复 npm 权限
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# 添加到 ~/.bashrc 或 ~/.zshrc
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

# Windows：以管理员身份运行 PowerShell
# 右键点击 PowerShell → 以管理员身份运行
npm install -g @liangjie559567/ultrapower
```

---

## 2. 配置问题

### MCP 服务器配置错误

**症状**：MCP 工具不可用，`ask_codex` 或 `ask_gemini` 返回错误

**原因**：
- MCP 配置文件格式错误
- 服务器未启动
- 环境变量缺失

**解决方案**：

```bash
# 检查 MCP 配置文件位置
# 用户级配置
cat ~/.kiro/settings/mcp.json

# 工作区配置
cat .kiro/settings/mcp.json

# 验证 JSON 格式（使用 jq）
jq . ~/.kiro/settings/mcp.json

# 如果 JSON 无效，修复格式
# 示例正确格式：
cat > ~/.kiro/settings/mcp.json << 'EOF'
{
  "mcpServers": {
    "aws-docs": {
      "command": "uvx",
      "args": ["awslabs.aws-documentation-mcp-server@latest"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
EOF

# 重启 Claude Code 会话
```

### Hook 配置错误

**症状**：Hook 未触发，或触发时出错

**原因**：
- Hook 配置文件损坏
- 权限不足
- 状态文件路径错误

**解决方案**：

```bash
# 检查 Hook 配置
ls -la .omc/hooks/

# 验证状态文件权限
ls -la .omc/state/

# 重置 Hook 状态
rm -f .omc/state/*-state.json
rm -f .omc/state/subagent-tracking.json

# 重新初始化
/omc-setup

# 查看 Hook 日志
tail -f .omc/logs/audit.log
```

### 环境变量设置

**症状**：工具找不到依赖（Python、Git 等）

**原因**：
- 环境变量未设置
- PATH 配置错误

**解决方案**：

```bash
# 检查环境变量
echo $PATH
echo $PYTHON_PATH

# 验证依赖可用性
which python3
which git
which node

# 如果缺失，添加到 ~/.bashrc 或 ~/.zshrc
export PATH="/usr/local/bin:$PATH"
export PYTHON_PATH="/usr/local/bin/python3:$PYTHON_PATH"

# 重新加载配置
source ~/.bashrc  # 或 source ~/.zshrc
```

---

## 3. 运行时错误

### Agent 超时

**症状**：Agent 运行超过 5 分钟后显示警告，10 分钟后自动终止

**原因**：
- 任务过于复杂
- 网络延迟
- 系统资源不足

**解决方案**：

```bash
# 检查 Agent 状态
cat .omc/state/subagent-tracking.json | jq '.agents[] | {agent_id, status, elapsed_minutes}'

# 手动终止超时 Agent
# 在 Claude Code 中运行
/ultrapower:cancel

# 查看 Agent 日志
tail -100 .omc/logs/audit.log | grep -i timeout

# 分解任务为更小的步骤
# 使用 /plan 命令规划任务
/plan this feature
```

### Worker 启动失败

**症状**：`Worker process failed to start` 或 `Bridge connection timeout`

**原因**：
- 端口被占用
- 进程权限不足
- 系统资源不足

**解决方案**：

```bash
# 检查端口占用
lsof -i :3000  # 检查 3000 端口
netstat -an | grep LISTEN

# 杀死占用进程
kill -9 <PID>

# 检查系统资源
free -h  # Linux
vm_stat  # macOS
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10  # Windows

# 清理临时文件
rm -rf .omc/state/*.tmp
rm -rf .omc/checkpoints/*

# 重启 Claude Code 会话
```

### 状态文件损坏

**症状**：`JSON parse error` 或 `Invalid state file`

**原因**：
- 进程异常终止
- 磁盘空间不足
- 并发写入冲突

**解决方案**：

```bash
# 检查状态文件
ls -lh .omc/state/

# 验证 JSON 格式
jq . .omc/state/autopilot-state.json

# 如果损坏，备份并删除
cp .omc/state/autopilot-state.json .omc/state/autopilot-state.json.bak
rm .omc/state/autopilot-state.json

# 清理所有状态文件（谨慎操作）
rm -f .omc/state/*-state.json

# 重新初始化
/omc-setup

# 检查磁盘空间
df -h  # Linux/macOS
Get-Volume  # Windows
```

---

## 4. 性能问题

### 构建缓慢

**症状**：`npm run build` 耗时过长（>30 秒）

**原因**：
- TypeScript 编译缓存失效
- 磁盘 I/O 瓶颈
- 并行构建配置不优

**解决方案**：

```bash
# 清理构建缓存
rm -rf dist/
rm -rf .tsc-cache/
rm -rf node_modules/.cache/

# 使用增量编译
npm run build

# 检查构建时间
time npm run build

# 并行构建（如支持）
npm run build -- --parallel

# 检查磁盘 I/O
iostat -x 1 5  # Linux
```

### 内存占用高

**症状**：Claude Code 进程占用 >1GB 内存

**原因**：
- Agent 状态文件过大
- 日志文件未清理
- 缓存堆积

**解决方案**：

```bash
# 检查内存占用
ps aux | grep node
ps aux | grep claude

# 检查状态文件大小
du -sh .omc/state/
du -sh .omc/logs/

# 清理旧日志（>7 天）
find .omc/logs -type f -mtime +7 -delete

# 清理旧 checkpoints
find .omc/checkpoints -type f -mtime +1 -delete

# 清理 Agent 记录（保留最近 100 个）
# 编辑 .omc/state/subagent-tracking.json，删除旧记录

# 重启 Claude Code
```

### LSP 响应慢

**症状**：代码补全、悬停提示延迟 >2 秒

**原因**：
- LSP 服务器未启动
- 项目文件过多
- 网络延迟

**解决方案**：

```bash
# 检查 LSP 服务器状态
# 在 Claude Code 中运行
/lsp_servers

# 重启 LSP 服务器
# 关闭并重新打开 Claude Code

# 检查项目大小
find . -type f \( -name "*.ts" -o -name "*.js" \) | wc -l

# 排除大型目录
# 编辑 .claude/settings.json，添加 excludePatterns

# 检查网络延迟
ping -c 5 8.8.8.8
```

---

## 5. 日志分析

### 启用调试日志

**症状**：需要详细日志进行诊断

**解决方案**：

```bash
# 设置调试环境变量
export DEBUG=ultrapower:*
export LOG_LEVEL=debug

# 运行命令
/omc-setup

# 查看日志输出
tail -f .omc/logs/audit.log

# 保存日志到文件
/omc-setup > debug.log 2>&1
```

### 日志位置

| 日志文件 | 位置 | 内容 |
|---------|------|------|
| 审计日志 | `.omc/logs/audit.log` | 所有 Hook 和 Agent 事件 |
| 错误日志 | `.omc/state/last-tool-error.json` | 最后一个工具错误 |
| Agent 记录 | `.omc/state/subagent-tracking.json` | Agent 状态和指标 |
| 会话日志 | `.omc/state/sessions/{sessionId}/` | 会话级状态 |
| 构建日志 | `.omc/p1-4/build-time.log` | 构建性能数据 |

### 常见错误模式

**错误**：`ENOENT: no such file or directory`

```bash
# 原因：文件或目录不存在
# 解决：检查路径是否正确
ls -la <path>

# 创建缺失目录
mkdir -p .omc/state
mkdir -p .omc/logs
```

**错误**：`EACCES: permission denied`

```bash
# 原因：权限不足
# 解决：修改文件权限
chmod 600 .omc/state/*.json
chmod 755 .omc/

# 或使用 sudo（不推荐）
sudo chown -R $USER .omc/
```

**错误**：`JSON.parse error`

```bash
# 原因：状态文件损坏
# 解决：验证并修复
jq . .omc/state/autopilot-state.json

# 如果无法修复，删除并重新初始化
rm .omc/state/autopilot-state.json
/omc-setup
```

**错误**：`Agent timeout after 10 minutes`

```bash
# 原因：Agent 运行超过 10 分钟
# 解决：
# 1. 检查任务复杂度
# 2. 分解为更小的任务
# 3. 增加超时阈值（如需要）

# 查看 Agent 状态
cat .omc/state/subagent-tracking.json | jq '.agents[] | select(.status=="RUNNING")'
```

---

## 6. 平台特定问题

### Windows 路径问题

**症状**：`Invalid path` 或路径分隔符错误

**原因**：
- 使用反斜杠而非正斜杠
- 路径包含空格

**解决方案**：

```bash
# 使用正斜杠（Git Bash）
cd /c/Users/username/project

# 或使用双反斜杠（PowerShell）
cd C:\\Users\\username\\project

# 路径包含空格时使用引号
cd "C:/Users/My Documents/project"
```

### macOS 权限问题

**症状**：`Operation not permitted` 或 `Cannot access`

**原因**：
- 文件系统权限限制
- Gatekeeper 阻止

**解决方案**：

```bash
# 检查文件权限
ls -la .omc/

# 修改权限
chmod -R 755 .omc/

# 允许应用运行（如被 Gatekeeper 阻止）
xattr -d com.apple.quarantine /path/to/app
```

### Linux 权限问题

**症状**：`Permission denied` 或 `Operation not permitted`

**原因**：
- 用户权限不足
- SELinux 限制

**解决方案**：

```bash
# 检查 SELinux 状态
getenforce

# 临时禁用 SELinux
sudo setenforce 0

# 修改文件权限
chmod -R 755 .omc/

# 修改所有者
sudo chown -R $USER .omc/
```

---

## 7. CJK IME 输入问题

**症状**：中文、日文、韩文输入时字符不显示或位置错误

**原因**：
- React Ink 终端 UI 对 IME 支持有限
- 终端 raw mode 处理不当

**解决方案**：

```bash
# 使用 Web 界面而非 CLI
# 在 Claude Code 中使用 GUI 而非终端

# 或切换输入法
# macOS：System Preferences → Keyboard → Input Sources
# Windows：Settings → Time & Language → Language

# 临时禁用 IME
# 输入英文命令，使用 GUI 输入中文内容
```

---

## 8. 快速诊断清单

运行以下命令快速诊断系统状态：

```bash
# 1. 检查环境
node --version
npm --version
git --version

# 2. 检查安装
npm list -g @liangjie559567/ultrapower

# 3. 检查配置
ls -la ~/.kiro/settings/
ls -la .kiro/settings/

# 4. 检查状态
ls -la .omc/state/
du -sh .omc/

# 5. 检查日志
tail -20 .omc/logs/audit.log
cat .omc/state/last-tool-error.json

# 6. 检查资源
free -h  # 或 vm_stat / Get-Process
df -h    # 或 Get-Volume

# 7. 验证功能
/omc-setup
/plan this feature
```

---

## 9. 获取帮助

如果问题未解决：

1. **收集诊断信息**
   ```bash
   # 导出诊断包
   tar -czf ultrapower-diagnostics.tar.gz .omc/ package.json
   ```

2. **查看相关文档**
   - [安装指南](./INSTALL.md)
   - [架构文档](./ARCHITECTURE.md)
   - [运行时防护规范](./standards/runtime-protection.md)
   - [Agent 生命周期规范](./standards/agent-lifecycle.md)

3. **提交 Issue**
   - GitHub: https://github.com/liangjie559567/ultrapower/issues
   - 包含诊断信息和错误日志

---

**最后更新**：2026-03-05
**版本**：5.5.18
