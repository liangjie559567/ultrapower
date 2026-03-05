# ultrapower v5.5.14 Release Notes

**发布日期**: 2026-03-05
**类型**: Bug Fix + Verification

---

## 🎯 核心改进

### 插件安装和升级流程修复

修复了 6 个影响用户升级体验的关键问题：

1. **npm-cache 版本锁定** - 用户点击 "Update now" 后停留在旧版本
2. **plugin.json 缺失** - npm 剥离隐藏目录导致插件无法加载
3. **Windows 嵌套目录** - 无限嵌套导致 Claude Code 无法启动
4. **templates/hooks/ 缺失** - Hook 执行时报错找不到模块
5. **marketplace 名称迁移** - 从 `ultrapower` 到 `omc` 的自动迁移
6. **npm-cache plugin.json 损坏** - 旧版本遗留的无效字段

所有修复通过 `scripts/plugin-setup.mjs` 的 postinstall 自动执行。

---

## 🔒 安全加固

- **路径遍历防护增强**: `assertValidMode()` 添加字符串截断保护
- 所有状态文件操作强制通过安全校验

---

## ✅ 完整验证

本次发布经过全面验证：

### 构建验证
- 3524 个文件成功打包
- TypeScript 编译无错误
- 所有 bridge 服务器已打包

### 组件完整性
- 50 个 agents
- 71 个 skills
- 14 个 hook 事件类型
- 17 个 hook 实现文件

### 安装测试
- ✅ npm 全局安装
- ✅ 插件市场安装
- ✅ 本地 tarball 安装
- ✅ postinstall 自动修复
- ✅ HUD 配置
- ✅ CLI 命令可用

---

## 📦 升级方式

### 推荐：插件市场
```
/plugin update ultrapower
```

### 备选：npm 全局
```bash
npm install -g @liangjie559567/ultrapower@latest
```

---

## 🐛 已知问题修复

| 问题 | 影响 | 修复 |
|------|------|------|
| npm-cache 版本锁定 | 升级跳过下载 | `fixNpmCacheVersion()` |
| plugin.json 缺失 | 插件无法加载 | `fixMissingPluginJson()` |
| Windows 嵌套目录 | 启动失败 | `fixNestedCacheDir()` |
| templates/hooks/ 缺失 | Hook 执行失败 | `copyTemplatesToCache()` |

---

## 📄 验证文档

完整验证报告：
- `docs/UPGRADE_VERIFICATION.md` - 升级指南
- `docs/PLUGIN_MARKETPLACE_VERIFICATION.md` - 插件市场验证
- `docs/LOCAL_INSTALL_VERIFICATION.md` - 本地安装验证
- `docs/VERIFICATION_SUMMARY.md` - 总结报告
- `scripts/verify-all.sh` - 自动化验证脚本

---

## 🔗 相关链接

- [完整 CHANGELOG](../CHANGELOG.md)
- [升级指南](./UPGRADE_VERIFICATION.md)
- [GitHub Issues](https://github.com/liangjie559567/ultrapower/issues)
