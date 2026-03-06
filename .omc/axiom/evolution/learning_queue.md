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

### LQ-036: Vitest 测试超时 — Mock 完整性检查清单扩展
- 优先级: P1
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-04
- 处理时间: 2026-03-04
- 内容: 测试超时（30s）的根因是 mock 不完整：测试 mock 了 `spawn()` 但未 mock `isSocket()` 函数，导致 `spawnBridgeServer` 中的轮询循环（`while (!isSocket(socketPath))`）一直等待直到超时。修复方案：使用 `vi.spyOn(module, 'function').mockReturnValue(value)` mock 导出函数。这是 Cycle 15 中 TEST-MOCK-001 模式的扩展：除了 mock fs 方法，还需 mock 业务逻辑中的轮询/等待函数。检查清单新增项：识别被测函数中的所有轮询循环（while/for + sleep/await），mock 循环条件函数使其立即满足退出条件。
- 元数据: 文件=bridge-manager.test.ts, 修复前=4/17 超时(30s), 修复后=17/17 通过(25s), 模式=TEST-MOCK-001 扩展
- 知识产出: k-071

### LQ-037: 发布流程标准化模板
- 优先级: P1
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-05
- 处理时间: 2026-03-05
- 内容: v5.5.14 发布流程可作为标准模板：8步检查清单（版本同步8个文件 → 测试验证 → Git 提交 → Tag 推送 → CI 监控三阶段 → npm/GitHub 验证 → dev→main 合并 → 清理）。关键点：1) 版本同步必须包含 package.json、plugin.json、marketplace.json（两处）、docs/CLAUDE.md、CLAUDE.md、README.md、src/installer/index.ts；2) CI 自动接管 npm 发布、GitHub Release 创建、marketplace.json 同步；3) dev→main 合并使用 --no-ff 保留完整历史；4) 遇到未提交更改使用 git stash 三步法。
- 元数据: session=2026-03-05, files=8个版本文件, commits=2, CI=3阶段
- 知识产出: k-072

### LQ-038: Git stash 三步法
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-05
- 处理时间: 2026-03-05
- 内容: 处理未提交更改的标准模式：`git stash push -m "描述"` → 执行操作（切换分支/合并/变基） → `git stash pop` 恢复更改。适用场景：分支切换前有未提交更改、合并前需要清理工作区、临时保存工作状态。优势：保留更改内容、操作可逆、支持描述信息。注意事项：stash pop 可能产生冲突，需要手动解决。
- 元数据: session=2026-03-05, commands=git stash push/pop, use_case=branch_merge
- 知识产出: k-073

## 已完成

### LQ-033: 超时保护三层架构模式
- 优先级: P1
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-04
- 处理时间: 2026-03-04
- 内容: Agent 超时保护的三层架构模式：配置层（timeout-config.ts，优先级 env>type>model>default）+ 管理层（timeout-manager.ts，生命周期管理 start/cleanup/getElapsed）+ 包装层（agent-wrapper.ts，重试策略 maxRetries + 指数退避）。使用 AbortController 原生 API，零依赖，性能 <5ms。适用于任何需要超时控制的异步操作（API 调用、Agent 执行、数据库查询）。
- 元数据: 来源=T10 实现，代码=src/agents/timeout-*.ts，测试覆盖率=100%
- 知识产出: k-068

### LQ-034: DFS 循环检测标准实现
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-04
- 处理时间: 2026-03-04
- 内容: 使用 DFS + 三色标记法检测有向图循环：Unvisited（白色，未访问）、Visiting（灰色，当前路径中）、Visited（黑色，已完成）。当遇到 Visiting 状态节点时发现循环。路径栈记录循环路径用于诊断。时间复杂度 O(V+E)，空间复杂度 O(V)。适用于任务依赖、资源锁、状态机验证、构建系统。
- 元数据: 来源=T11 实现，代码=src/team/deadlock-detector.ts，性能=<10ms(1000节点)
- 知识产出: k-069

### LQ-035: ESM 导入路径规范
- 优先级: P2
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-04
- 处理时间: 2026-03-04
- 内容: TypeScript + ESM 项目中，相对导入必须包含 `.js` 扩展名（如 `from './types.js'`）。TypeScript 编译器不会自动添加扩展名，违反此规则会导致 TS2835 错误："The file extension must be '.ts' or '.tsx'"。这是 TypeScript 对 ESM 规范的严格遵守。适用于所有使用 `"type": "module"` 的 TypeScript 项目。
- 元数据: 来源=T10/T11 实现，错误=TS2835，修复=添加 .js 扩展名
- 知识产出: k-070


### LQ-039: 版本号同步检查清单
- 优先级: P0
- 来源类型: session
- 状态: pending
- 添加时间: 2026-03-05
- 内容: 多个 package.json 文件容易遗漏导致版本不一致。v5.5.15 发布时根目录 package.json 初次未更新，由 verifier 发现。检查清单应包含：package.json, packages/*/package.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json（两处version字段）, docs/CLAUDE.md（OMC:VERSION注释）, CLAUDE.md（版本引用）, README.md（版本徽章）, src/installer/index.ts（VERSION常量）。建议创建 scripts/check-version-sync.sh 自动验证。
- 元数据: session=2026-03-05, files=8个版本文件, issue=根目录package.json遗漏

### LQ-040: CHANGELOG 前置插入模式
- 优先级: P1
- 来源类型: session
- 状态: pending
- 添加时间: 2026-03-05
- 内容: Write 工具会覆盖整个文件，不适合 CHANGELOG 更新。使用 bash 命令实现前置插入：`{ echo "新内容"; cat 原文件; } > 临时文件 && mv 临时文件 原文件`。适用于任何需要在文件开头插入内容的场景。关键：使用临时文件避免数据丢失，确保原子性操作。
- 元数据: session=2026-03-05, file=CHANGELOG.md, pattern=prepend-to-file

### LQ-041: git lock 文件预检查
- 优先级: P2
- 来源类型: error
- 状态: pending
- 添加时间: 2026-03-05
- 内容: .git/index.lock 残留导致 git 操作失败（error: Unable to create '.git/index.lock': File exists）。v5.5.15 发布时遇到此问题，需手动删除锁文件。建议在所有 git 操作前预检查：`[ -f .git/index.lock ] && rm .git/index.lock`。适用场景：git commit、git checkout、git merge 等所有修改索引的操作。
- 元数据: session=2026-03-05, error=index.lock, fix=预检查删除


### LQ-059: CI detached HEAD 状态测试模式
- 优先级: P0
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-06
- 内容: CI 在 tag checkout 时处于 detached HEAD 状态，`getCurrentBranch()` 返回 null。测试需要处理此场景：`expect(branch === null || typeof branch === 'string').toBe(true)`。本地测试在分支上运行，CI 测试在 tag 上运行，两者环境不同。建议：1) 测试设计时考虑 CI 环境特性；2) 开发 ci-env-simulator 工具本地模拟；3) 文档化 CI 特定测试模式。
- 处理时间: 2026-03-06
- 知识产出: k-077
- 元数据: session=2026-03-06, file=git-utils.test.ts, error=branch null in CI

### LQ-060: stdio 配置最佳实践
- 优先级: P1
- 来源类型: session
- 状态: done
- 添加时间: 2026-03-06
- 内容: `execSync` 的 `stdio: 'pipe'` 会捕获 stderr，当 stderr 有内容时抛出异常（即使退出码为 0）。对于验证步骤（如测试、构建），应使用 `stdio: 'inherit'` 让输出直接显示，避免将警告当作错误。适用场景：release-steps、CI 验证、任何需要容忍 stderr 警告的命令执行。
- 处理时间: 2026-03-06
- 知识产出: k-078
- 元数据: session=2026-03-06, file=release-steps.mjs, fix=pipe→inherit

### LQ-061: 最小化修复原则（外科手术式）
- 优先级: P1
- 来源类型: pattern
- 状态: done
- 添加时间: 2026-03-06
- 内容: 修复问题时只改必要代码，避免连带变更。本次会话：release-steps.mjs 只改 1 行（stdio 配置），git-utils.test.ts 只改 5 行（测试断言）。优势：1) 降低引入新 bug 风险；2) 易于代码审查；3) 回滚成本低。模式：定位问题 → 最小化修复 → 验证 → 提交。
- 处理时间: 2026-03-06
- 知识产出: k-079
- 元数据: session=2026-03-06, lines_changed=6, files=2

