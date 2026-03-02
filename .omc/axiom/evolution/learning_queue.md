# Axiom 学习队列

## 队列格式
```
### LQ-[ID]: [标题]
- 优先级: [P0/P1/P2/P3]
- 来源类型: [session/error/manual/pattern]
- 状态: [pending/processing/done]
- 添加时间: [YYYY-MM-DD]
- 内容: [待学习的知识或经验]
- 元数据: [额外信息]
```

## 优先级说明
- P0: 紧急，影响系统稳定性
- P1: 高优先级，影响工作流效率
- P2: 中优先级，一般改进
- P3: 低优先级，可选优化

## 待处理队列

<!-- 新的学习素材将自动添加到此处 -->

### LQ-021: omc-doctor curl-install vs plugin-install 迁移路径
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: omc-doctor 诊断时，若 `~/.claude/plugins/cache/omc/ultrapower` 不存在但 `~/.claude/agents/` 和 `~/.claude/commands/` 存在 ultrapower 文件，说明是旧版 curl 安装。迁移路径：1) `npm install -g @liangjie559567/ultrapower@latest`，2) `omc install --force --skip-claude-check`，3) 备份旧目录到 `.bak`，4) 删除旧目录。插件安装后 agents/commands 由插件系统接管，旧目录可安全删除。
- 元数据: session=2026-02-27, files=~/.claude/agents, ~/.claude/commands
- 知识产出: k-053

### LQ-022: omc install 不支持 --refresh-hooks 参数
- 优先级: P2
- 来源类型: error
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: `omc install --force --skip-claude-check --refresh-hooks` 会报 `error: unknown option '--refresh-hooks'`。正确命令是 `omc install --force --skip-claude-check`（不带 --refresh-hooks）。omc-doctor skill 文档中的升级命令需要修正，去掉该参数。
- 元数据: session=2026-02-27, error=unknown option '--refresh-hooks'
- 知识产出: k-054

### LQ-023: 删除前备份到 .bak 目录约定
- 优先级: P3
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: 删除用户目录（如 ~/.claude/agents、~/.claude/commands）前，先 `cp -r src src.bak` 备份。用户选择"先备份再删除"时执行此约定。备份文件名格式：`<dirname>.bak`，位于同级目录。omc-doctor 的自动修复流程应默认提供此选项。
- 元数据: session=2026-02-27, dirs=agents.bak, commands.bak
- 知识产出: k-055

### LQ-024: deepinit 生成的 AGENTS.md 必须从 agent 定义加载器中排除
- 优先级: P1
- 来源类型: error
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: `deepinit` 在 `agents/` 目录下生成 `AGENTS.md` 作为目录文档（无 `name:` frontmatter）。`loadAgentDefinitions()` 读取所有 `.md` 文件时会包含此文件，导致 `should have unique agent names` 测试失败（`nameMatch` 为 null）。修复：在文件过滤条件中加入 `&& file !== 'AGENTS.md'`。根本原因：deepinit 生成的目录文档与 agent 定义文件共存于同一目录，加载器必须明确排除非 agent 文件。
- 元数据: file=src/__tests__/installer.test.ts:39, version=v5.2.4, tests_after=4663
- 知识产出: k-056, P-010

### LQ-025: Windows bash hook 路径 — %USERPROFILE% vs $USERPROFILE 不兼容
- 优先级: P1
- 来源类型: error
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: Claude Code 在 Windows 上通过 bash（Git Bash/WSL）运行 hooks，而非 cmd.exe。bash 不展开 `%USERPROFILE%`（cmd.exe 语法），只展开 `$USERPROFILE`（bash 语法）。`src/installer/hooks.ts` 的 `getHomeEnvVar()` 已修复为返回 `$USERPROFILE`，所有 hook 命令路径改用正斜杠。已安装用户的 `settings.json` 不会自动更新，需要 `omc-setup` 增加 hooks 路径格式检查步骤。
- 元数据: file=src/installer/hooks.ts, settings=~/.claude/settings.json, platform=win32
- 知识产出: k-057

### LQ-026: 插件缓存空目录 — copyTemplatesToCache() 必须处理空缓存基目录
- 优先级: P1
- 来源类型: error
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: `scripts/plugin-setup.mjs` 的 `copyTemplatesToCache()` 原实现假设 `pluginCacheBase` 下已有版本子目录，但 Claude Code 安装器在 postinstall 后才填充缓存，导致 `readdirSync` 返回空数组，整个复制逻辑被跳过。修复：当 `versions.length === 0` 时，读取 `package.json` 版本，创建版本目录后再复制。边界情况：缓存目录存在但为空。
- 元数据: file=scripts/plugin-setup.mjs, error=MODULE_NOT_FOUND, cache=~/.claude/plugins/cache/ultrapower/ultrapower/
- 知识产出: k-058

### LQ-027: TypeScript 测试文件 import `.mjs` ESM 模块需要 @ts-ignore
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: TypeScript 无法直接解析 .ts 测试文件中对 ESM .mjs 模块的动态 import。`tsc --noEmit` 报错"无法解析模块"。解决方案：在每个 `import('../../scripts/xxx.mjs')` 前加 `// @ts-ignore` 注释。这是 TypeScript + ESM 混用的已知限制，不修改 tsconfig.json 的前提下唯一可行方案。Sub-PRD 中应提前标注此限制。
- 元数据: files=src/__tests__/release-steps.test.ts+release-local.test.ts, commit=3a53e44
- 知识产出: k-059

### LQ-028: GitHub Actions 4-job 依赖图模式
- 优先级: P3
- 来源类型: pattern
- 状态: done
- 添加时间: 2026-02-27
- 处理时间: 2026-02-27
- 内容: `build-test → publish → (github-release ∥ marketplace-sync)` 四 job 依赖图。publish 串行依赖 build-test（确保验证通过才发布），github-release 和 marketplace-sync 并行依赖 publish（两者互相独立）。secrets 需求：NPM_TOKEN（手动配置到 repo Settings）、GITHUB_TOKEN（Actions 内置，无需手动配置）。CLI 入口：`node scripts/release-steps.mjs <step>` 直接调用，不经过 release-local.mjs 的 parseArgs 层。
- 元数据: file=.github/workflows/release.yml, commit=e9f9225
- 知识产出: k-060

### LQ-029: execSync 不支持 windowsHide 选项
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-28
- 处理时间: 2026-02-28
- 内容: `child_process.execSync` 不支持 `windowsHide` 选项（该选项仅适用于 `spawn`/`fork`/`exec`）。在 execSync 调用中传入 `windowsHide: true` 会被静默忽略但引入 `as any` 类型断言。正确做法：移除 `windowsHide`，使用 `shell: process.platform === 'win32'` 实现平台感知。
- 元数据: file=src/features/auto-update.ts, version=v5.2.7
- 知识产出: k-061

### LQ-030: getRuntimePackageVersion() 返回 'unknown' 需显式 guard
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-02-28
- 处理时间: 2026-02-28
- 内容: `getRuntimePackageVersion()` 在读取失败时返回字符串 `'unknown'`（truthy），调用方若只做 truthy 检查会误将 `'unknown'` 写入 VERSION_FILE。正确 guard：`runtimeVersion && runtimeVersion !== 'unknown'`。应在函数文档中标注此边界情况。
- 元数据: file=src/features/auto-update.ts, version=v5.2.7
- 知识产出: k-062

### LQ-031: actions/setup-node@v4 + registry-url 的 NODE_AUTH_TOKEN 覆盖行为
- 优先级: P1
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-02
- 处理时间: 2026-01-21
- 内容: `actions/setup-node@v4` 配置 `registry-url` 后，会为所有后续步骤注入 `NODE_AUTH_TOKEN=github.token`（显示为 masked）。若 publish 步骤显式覆盖 `env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`，而 NPM_TOKEN secret 未设置，会导致真实 token 被空字符串覆盖（npm publish 静默失败）。解法：必须确保 GitHub Secrets 中存在 `NPM_TOKEN`（读取方式：`cat ~/.npmrc | grep "_authToken=" | cut -d= -f2 | gh secret set NPM_TOKEN -R owner/repo`）。
- 元数据: file=.github/workflows/release.yml, version=v5.5.8
- 知识产出: k-066

### LQ-032: GitHub Actions 默认 GITHUB_TOKEN 无 contents:write 权限
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-02
- 处理时间: 2026-01-21
- 内容: GitHub Actions 默认 `GITHUB_TOKEN` 无 `contents: write` 权限。`gh release create`（创建 release）和 `git push` 推送新分支均需要此权限，否则返回 HTTP 403。解法：在需要的 job 级声明 `permissions: contents: write`。PR 创建还需额外声明 `permissions: pull-requests: write`。遵循最小权限原则，在 job 级而非 workflow 级声明。
- 元数据: file=.github/workflows/release.yml, version=v5.5.8
- 知识产出: k-067

## 处理中

## 已完成
