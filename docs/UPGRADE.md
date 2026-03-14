# ultrapower 升级流程完整指南

## 升级方式

### 1. CLI 命令升级（推荐）

```bash
omc update
# 或
ultrapower update
```

**流程**：
1. 自动检测安装方式（npm global / local / marketplace）
2. 清理所有缓存
3. 重新编译/安装
4. 更新元数据
5. 提示重启 Claude Code

### 2. npm 全局升级

```bash
npm update -g @liangjie559567/ultrapower
```

### 3. 本地开发升级

```bash
cd /path/to/ultrapower
git pull
npm run build
npm install -g .
```

### 4. 插件市场升级

在 Claude Code 插件管理器中点击更新按钮

## 升级检查清单

升级完成后验证以下组件：

- [ ] `package.json` 版本号
- [ ] `dist/` 编译文件时间戳
- [ ] `bridge/*.cjs` 文件时间戳
- [ ] `~/.claude/.omc-version.json` 版本
- [ ] `~/.claude/plugins/installed_plugins.json` 版本
- [ ] 缓存已清理
- [ ] HUD 显示正确版本

## 自动清理的缓存

- `~/.claude/plugins/cache/omc/`
- `~/.claude/plugins/cache/liangjie559567/`
- `~/.claude/plugins/npm-cache/`
- `.tsbuildinfo`

## 故障排查

### HUD 仍显示旧版本

```bash
# 手动清理并重建
rm -rf ~/.claude/plugins/cache/omc
rm -f .tsbuildinfo
npm run build
npm install -g .
```

### 元数据不一致

```bash
# 手动更新版本文件
echo '{"version":"7.3.0","installedAt":"'$(date -Iseconds)'","installMethod":"manual"}' > ~/.claude/.omc-version.json
```

## 验证命令

```bash
# 检查运行时版本
node -e "import('./dist/lib/version.js').then(m => console.log(m.getRuntimePackageVersion()))"

# 检查全局安装
npm list -g @liangjie559567/ultrapower

# 检查编译时间
ls -la dist/lib/version.js bridge/*.cjs
```
