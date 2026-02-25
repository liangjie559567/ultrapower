# CJK IME 输入已知问题

本文档描述 Claude Code CLI 中 CJK（中文、日文、韩文）IME 输入的已知问题，并为受影响用户提供解决方案。

## 目录

- [概述](#overview)
- [受影响用户](#affected-users)
- [已知问题](#known-issues)
- [根本原因](#root-cause)
- [解决方案](#workarounds)
- [相关问题](#related-issues)
- [状态](#status)

## 概述

Claude Code CLI 使用 React Ink 进行终端 UI 渲染。由于终端 raw mode 处理 IME（输入法编辑器）组合事件的方式存在限制，CJK 用户会遇到各种输入问题，从字符不可见到组合文字位置错误不等。

## 受影响用户

| 语言 | 输入法 | 是否受影响 |
|----------|--------------|----------|
| 韩语 (한국어) | macOS 韩语 IME | ✅ 是 |
| 韩语 (한국어) | Windows 韩语 IME | ✅ 是 |
| 韩语 (한국어) | Gureumkim (구름) | ✅ 是 |
| 日语 (日本語) | macOS 日语 IME | ✅ 是 |
| 日语 (日本語) | Windows 日语 IME | ✅ 是 |
| 中文 (中文) | macOS 拼音 | ✅ 是 |
| 中文 (中文) | Windows 拼音 | ✅ 是 |
| 越南语 | Telex | ✅ 是 |

## 已知问题

### 1. 组合过程中字符不可见（严重）

**症状**：输入 CJK 字符时，IME 组合过程中输入框中不显示任何内容。字符仅在按下 Enter 后才出现。

**平台**：macOS、Linux

**示例（韩语）**：
- 输入 `ㅎ` → 无显示
- 输入 `ㅎ` + `ㅏ` → 无显示
- 输入 `ㅎ` + `ㅏ` + `ㄴ` → 无显示
- 按 Enter → `한` 出现在输出中

### 2. 组合字符位置错误

**症状**：正在组合的字符出现在错误位置（例如下一行开头），而非光标处。

**平台**：Windows、部分 macOS 终端

### 3. 性能问题和重复候选词

**症状**：IME 输入导致卡顿、重复转换候选词或内存占用过高。

**平台**：所有平台

## 根本原因

该问题源于三个相互关联的技术限制：

### 1. 终端 Raw Mode 限制

当 Node.js 在 raw mode（`process.stdin.setRawMode(true)`）下运行时，它仅提供字节级 STDIN 访问，不支持：
- 组合事件回调（`compositionstart`、`compositionupdate`、`compositionend`）
- IME 预编辑缓冲区信息
- 组合过程中的光标位置反馈

### 2. React Ink 的 TextInput 组件

React Ink 的 TextInput 逐个处理按键，不理解多阶段字符组合：
- 无 `isComposing` 状态追踪
- 无独立的组合缓冲区
- 逐字符处理破坏了 CJK 算法组合

### 3. CJK 字符的复杂性

CJK 语言使用算法组合，多次按键组合成单个字符：

**韩语 Hangul**：
```
ㄱ + ㅏ → 가
가 + ㄴ → 간
간 + ㅇ → (新音节)
```

**日语平假名**：
```
k + a → か
か + n → かn (等待下一个)
かn + a → かな
```

这需要实时显示组合过程，而终端 raw mode 无法提供此功能。

## 解决方案

### 方案 1：外部编辑器 + 粘贴（推荐）

在能正确处理 IME 的外部编辑器中编写文字，然后粘贴到 Claude Code。

1. 打开任意文本编辑器（VS Code、Notes、TextEdit、Notepad）
2. 在那里输入 CJK 文字
3. 复制（`Cmd+C` / `Ctrl+C`）
4. 粘贴到 Claude Code（`Cmd+V` / `Ctrl+V`）

**优点**：100% 可靠
**缺点**：打断工作流，需要切换应用程序

### 方案 2：使用英文提示词并包含 CJK 上下文

在可能的情况下，使用英文编写提示词，但在文件内容或引用中包含 CJK 文字。

```
# 不直接输入韩语：
# "한국어로 인사말 작성해줘"

# 使用英文提示词：
# "Write a greeting message in Korean language"
```

### 方案 3：基于剪贴板的输入脚本

创建一个从剪贴板读取并发送到 Claude Code 的脚本：

```bash
# macOS
pbpaste | claude --stdin

# Linux（需要 xclip）
xclip -selection clipboard -o | claude --stdin
```

### 方案 4：使用 IDE 集成

通过 IDE 集成（VS Code 扩展）使用 Claude Code，其 IME 处理可能优于原始终端。

## 相关问题

### ultrapower
- [#344](https://github.com/liangjie559567/ultrapower/issues/344) - 韩语 IME 输入在输入框中不可见

### anthropics/claude-code
- [#22732](https://github.com/anthropics/claude-code/issues/22732) - 韩语 IME：组合过程中字符完全不可见
- [#18291](https://github.com/anthropics/claude-code/issues/18291) - 韩语 IME 组合：音节完成前字母不显示
- [#16322](https://github.com/anthropics/claude-code/issues/16322) - [严重] 韩语 IME：组合字符显示在错误位置
- [#15705](https://github.com/anthropics/claude-code/issues/15705) - 韩语输入字符在 iOS 移动 SSH 上消失
- [#1547](https://github.com/anthropics/claude-code/issues/1547) - IME 输入导致性能问题
- [#3045](https://github.com/anthropics/claude-code/issues/3045) - 调查：通过修补 React Ink 修复 IME 问题

### 上游（React Ink）
- React Ink 的 TextInput 不支持 IME 组合状态
- 最小复现：https://github.com/takeru/react-ink-ime-bug

### 其他项目中的类似问题
- [Google Gemini CLI #3014](https://github.com/google-gemini/gemini-cli/issues/3014) - 同样的问题影响 Gemini CLI

## 状态

| 修复领域 | 状态 | 备注 |
|----------|--------|-------|
| 光标定位 | ✅ 部分修复 | 2025 年 8 月版本改善了组合窗口位置 |
| 字符可见性 | ❌ 未修复 | 组合过程中字符仍不可见 |
| 性能 | ⚠️ 持续改进 | 内存问题正在调查中 |
| 根本修复 | 🔄 进行中 | 需要修补 React Ink 或使用替代输入方法 |

## 贡献

如果您有其他解决方案或找到了修复方法，请：

1. 提交 PR 更新本文档
2. 在相关 GitHub 问题上评论
3. 与社区分享您的发现

## 参考资料

- [Terminal-friendly application with Node.js - User Inputs](https://blog.soulserv.net/terminal-friendly-application-with-node-js-part-iii-user-inputs/)
- [React IME Composition Events Issue #8683](https://github.com/facebook/react/issues/8683)
- [Node.js Readline Documentation](https://nodejs.org/api/readline.html)
