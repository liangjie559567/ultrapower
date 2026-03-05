# 安装文档修复验证报告

**日期**: 2026-03-05
**版本**: v5.5.15

## ✅ 验证结果

### npm 包名检查
```bash
grep -r "npm install -g ultrapower[^@]" --include="*.md" docs/ | grep -v "INSTALL_FIX_SUMMARY"
```
**结果**: 无错误 ✅

所有 npm 安装命令都使用正确的 scoped 包名：`@liangjie559567/ultrapower`

### 插件安装命令检查
```bash
grep -r "/plugin install ultrapower[^@]" --include="*.md" docs/ | grep -v "INSTALL_FIX_SUMMARY"
```
**结果**: 无错误 ✅

所有插件安装命令都使用正确的格式：`/plugin install omc@ultrapower`

### 插件更新命令检查
```bash
grep -r "/plugin update ultrapower" --include="*.md" docs/
```
**结果**: 全部正确 ✅

所有更新命令都使用：`/plugin update omc@ultrapower`

## 修复的文档列表

1. ✅ README.md
2. ✅ docs/INSTALL.md
3. ✅ docs/LOCAL_INSTALL_VERIFICATION.md
4. ✅ docs/PLUGIN_MARKETPLACE_VERIFICATION.md
5. ✅ docs/UPGRADE_VERIFICATION.md

## 正确的命令格式

### 插件市场安装（推荐）
```bash
/plugin marketplace add https://github.com/liangjie559567/ultrapower
/plugin install omc@ultrapower
/ultrapower:omc-setup
```

### npm 全局安装
```bash
npm install -g @liangjie559567/ultrapower
```

### 更新
```bash
/plugin update omc@ultrapower
```

## 结论

所有安装文档已修复，用户不会再遇到 404 错误。
