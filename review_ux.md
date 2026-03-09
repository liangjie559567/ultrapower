# UX 评审报告 — 用户插件部署自动更新版本流程

**评审人**: axiom-ux-director
**评审日期**: 2026-02-27
**PRD 版本**: Draft
**代码参考**: `src/features/auto-update.ts`（已读取实际实现）

---

## 优点

**1. 错误消息已包含操作指引**

现有代码（第 491 行）在 plugin 模式拒绝更新时，消息中已附带了下一步操作：

```
'Running as a Claude Code plugin. Use "/plugin install ultrapower" to update,
or pass --standalone to force npm update.'
```

这比单纯报错要好——用户至少知道该做什么。PRD 的 FR-03 在此基础上进一步区分模式，方向正确。

**2. 更新通知 UI 已有视觉层次**

`formatUpdateNotification()` 使用了 ASCII 边框 + 版本对比的双列布局，信息密度合理，不会让用户在通知中迷失。PRD 在此基础上增加模式感知，属于渐进增强，不破坏现有体验。

**3. 降级路径（`--standalone`）已存在**

`performUpdate()` 已支持 `options?.standalone` 标志，为高级用户提供了逃生通道。PRD 将其正式化为文档化路径，降低了高级用户的摸索成本。

---

## 差异点 / 风险

### [D-UX-01] `/update` 命令名称与实际行为存在根本性语义断裂（严重程度：HIGH）

**描述**：

用户对 `/update` 的心智模型是"执行后软件即更新完毕"。但 PRD 定义的 plugin 模式行为是：

1. 同步 marketplace clone（后台 git 操作，用户不可见）
2. 更新注册表版本号（内部状态，用户不可见）
3. 提示用户手动运行 `/plugin install ultrapower`

实际上 `/update` 在 plugin 模式下变成了一个"准备工作 + 提示"命令，**更新本身并未发生**。这与命令名称形成了严重的语义断裂。

PRD 第 4 节"成功指标"中的矛盾也印证了这一问题：

> "用户在 plugin 模式下执行 `/update` 后，版本自动更新，无需手动操作（注：实际上仍需用户手动运行 /plugin install）"

括号内的注释直接否定了括号外的声明。这不是措辞问题，而是功能定义问题。

**影响**：用户执行 `/update` 后看到"请运行 `/plugin install ultrapower`"，会认为更新失败或命令有 bug，产生困惑和不信任。

---

### [D-UX-02] 更新流程步骤数对新手用户不友好（严重程度：HIGH）

**描述**：

Plugin 模式下完成一次更新，用户实际需要执行的步骤：

1. 运行 `/update`（触发后台同步 + 获得提示）
2. 阅读并理解提示内容
3. 运行 `/plugin install ultrapower`（实际安装）
4. 等待安装完成
5. 重启 Claude Code session（现有 `interactiveUpdate()` 第 697 行已有此提示）

这是 **5 步流程**，而 npm 模式只需 1 步（`/update`）。两种安装模式的更新体验差距过大，会让 plugin 模式用户感到"二等公民"。

对比现有代码中 npm 模式的成功消息（第 696-697 行）：
```
✓ Successfully updated from X to Y
Please restart your Claude Code session to use the new version.
```

Plugin 模式没有等价的"成功完成"状态，流程在"请手动操作"处悬空。

---

### [D-UX-03] 错误消息与成功消息的视觉区分不足（严重程度：MEDIUM）

**描述**：

现有 `interactiveUpdate()` 使用 `✓` 和 `✗` 区分成功/失败，但 plugin 模式下的"需要手动操作"状态既不是成功也不是失败——它是一个**中间态**，当前没有对应的视觉语言。

用户看到的可能是：

* 无 `✓`（因为更新未完成）

* 无 `✗`（因为没有报错）

* 只有一段说明文字

这种"灰色状态"在 CLI 环境中极易被用户误判为命令静默失败。

---

### [D-UX-04] `syncPluginRegistry()` 的用户可见价值不明确（严重程度：MEDIUM）

**描述**：

FR-02 定义了 `syncPluginRegistry()` 函数，它更新 `installed_plugins.json` 中的版本号。但从用户视角看：

* 这个操作在 `/update` 执行时对用户**完全不可见**

* 用户不知道"注册表已同步"意味着什么

* 如果后续 `/plugin install` 失败，用户无法判断注册表同步是否有帮助

PRD 将其作为 FR-02 单独列出，但没有说明它对用户体验的具体改善点。这个功能更像是内部一致性修复，而非用户可感知的体验改善。

---

### [D-UX-05] Project-scoped plugin 场景的提示语缺失（严重程度：MEDIUM）

**描述**：

PRD 执行流程中提到：

> `isProjectScopedPlugin() === true` → 跳过注册表同步，提示用户在项目目录运行 `/plugin install`

但 PRD 没有定义这个提示的具体文案。Project-scoped plugin 用户需要知道：
1. 他们需要 `cd` 到哪个目录
2. 为什么不能在当前位置更新
3. 更新后是否需要重启

这个场景的用户（通常是在特定项目中使用 ultrapower 的开发者）比全局安装用户更有技术背景，但也更容易因为"需要切换目录"这个隐含要求而感到困惑。

---

### [D-UX-06] `omc-doctor` 版本一致性检查的结果呈现未定义（严重程度：LOW）

**描述**：

FR-04 定义了 `checkVersionConsistency(): ConsistencyReport`，但 PRD 没有说明：

* 检测到漂移时显示什么

* 用户如何修复检测到的漂移

* 是否自动修复还是仅报告

`omc-doctor` 的用户通常是在排查问题，他们需要的不只是"发现问题"，还需要"知道怎么修"。

---

### [D-UX-07] 更新通知中两个命令并列造成选择困难（严重程度：LOW）

**描述**：

现有 `formatUpdateNotification()` 已经同时显示两个命令（第 614-615 行）：

```
To update, run: /update
Or reinstall via: /plugin install ultrapower
```

PRD FR-03 的改进方案是根据模式显示不同指令，这是正确方向。但当前实现对 plugin 模式用户同时展示两个选项，会产生"哪个更好？有什么区别？"的认知负担。

---

## 建议

**针对 D-UX-01（语义断裂）**：

将 plugin 模式下的命令重命名或增加子命令。两个可选方案：

* 方案 A：`/update` 在 plugin 模式下显示明确的"准备阶段"标识：
  ```
  [1/2] Syncing marketplace... done
  [2/2] Action required: run /plugin install ultrapower to complete update
  ```
  让用户清楚知道这是两步流程，`/update` 完成了第一步。

* 方案 B：在 plugin 模式下，`/update` 直接输出一条简洁的操作指令，不做任何后台操作（因为后台操作对用户不可见，做了也像没做）：
  ```
  Plugin mode detected. To update ultrapower, run:
    /plugin install ultrapower
  ```
  诚实地告知用户 `/update` 在此模式下无法自动完成更新。

**针对 D-UX-02（步骤数）**：

在 `/update` 的 plugin 模式输出中，明确标注"步骤 X/Y"，让用户知道流程进度。同时在 `/plugin install` 完成后，增加一条确认消息（如果技术上可行）。

**针对 D-UX-03（中间态）**：

为"需要手动操作"状态定义专用视觉符号，例如 `⚡` 或 `→`，与 `✓`（成功）和 `✗`（失败）区分：

```
→ Marketplace synced. Manual step required:
  Run: /plugin install ultrapower
```

**针对 D-UX-04（注册表同步可见性）**：

如果 `syncPluginRegistry()` 对用户体验有实质改善（例如防止 hook 路径漂移），应在 verbose 模式下输出一行确认：

```
✓ Plugin registry synced (v5.2.1)
```

如果它只是内部一致性修复，不需要在 PRD 中作为独立 FR 列出，合并到 FR-01 的实现细节中即可。

**针对 D-UX-05（project-scoped 提示）**：

在 PRD 中补充 project-scoped plugin 场景的完整提示文案，例如：

```
Project-scoped plugin detected.
To update, navigate to your project directory and run:
  /plugin install ultrapower
```

**针对 D-UX-06（omc-doctor 修复指引）**：

`ConsistencyReport` 的数据结构应包含 `fixCommand` 字段，`omc-doctor` 在报告漂移时同时输出修复命令：

```
[WARN] Version drift detected:
  installed_plugins.json: v5.1.0
  package.json:           v5.2.1
  Fix: run /update --sync-registry
```

**针对 D-UX-07（双命令并列）**：

FR-03 的实现应完全替换当前的双命令展示，而非在其基础上叠加。Plugin 模式只显示 `/plugin install ultrapower`，npm 模式只显示 `/update`，不并列展示。

---

## 总结

PRD 识别了真实的技术痛点（P1-P4），但在将技术修复转化为用户体验改善时存在明显缺口。最核心的问题是：**`/update` 命令在 plugin 模式下无法真正完成更新这一事实，需要在 UX 层面被诚实地呈现，而不是被"准备工作"所掩盖**。建议在进入实现前，先明确 plugin 模式下 `/update` 的用户承诺边界。
