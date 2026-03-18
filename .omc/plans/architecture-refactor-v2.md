# 架构重构计划 v2.0

**创建时间**: 2026-03-19
**总工作量**: 15-25h
**原则**: 渐进式重构，解决具体痛点，避免过度设计

---

## Phase 1: 修复循环依赖 (2-4h, P0)

### 目标
消除 2 处实际循环依赖，达到零循环依赖状态。

### 具体任务

#### 1.1 修复 hooks/keyword-detector 内部循环 (1-2h)
**文件清单**:
- `src/hooks/keyword-detector/index.ts`
- `src/hooks/keyword-detector/conflict-resolver.ts`

**方案**:
```typescript
// 当前: index.ts → conflict-resolver.ts → index.ts
// 修复: 提取共享类型到 types.ts
src/hooks/keyword-detector/
  ├── types.ts          # 新增：共享类型定义
  ├── index.ts          # 导入 types.ts
  └── conflict-resolver.ts  # 导入 types.ts
```

**验收标准**:
- `madge --circular src/hooks/keyword-detector` 返回 0
- 现有测试通过
- 类型检查无错误

#### 1.2 修复 tools/index.ts 循环 (1-2h)
**文件清单**:
- `src/tools/index.ts`
- `src/tools/tool-prefix-migration.ts`

**方案**:
```typescript
// 当前: index.ts → tool-prefix-migration.ts → index.ts
// 修复: tool-prefix-migration.ts 直接导入具体工具文件
// 避免从 index.ts 重新导出

// 示例导入路径:
import { lspTools } from './lsp-tools';
import { astTools } from './ast-tools';
import { notepadTools } from './notepad-tools';
// 而非: import { lspTools, astTools } from './index';
```

**验收标准**:
- `madge --circular src/tools` 返回 0
- `npm run build` 成功
- 工具注册逻辑正常工作

### Phase 1 完成标准
```bash
# 必须全部通过
madge --circular src/                    # 输出: No circular dependencies found!
tsc --noEmit                             # 退出码: 0
npm test -- hooks/keyword-detector       # 全部通过
npm test -- tools/                       # 全部通过
```

### 回滚策略
```bash
git checkout src/hooks/keyword-detector/
git checkout src/tools/index.ts src/tools/tool-prefix-migration.ts
```

---

## Phase 2: 收敛 Barrel Exports (8-12h, P1)

### 目标
建立受控的公共 API 入口，减少不必要的 barrel exports。

### 具体任务

#### 2.1 分析现有 101 个 index.ts (2-3h)
**脚本**:
```bash
# 创建分析脚本
cat > scripts/analyze-barrels.sh << 'EOF'
#!/bin/bash
find src -name "index.ts" -print0 | while IFS= read -r -d '' f; do
  exports=$(grep -c "^export" "$f" 2>/dev/null || echo 0)
  imports=$(find src -name "*.ts" -exec grep -l "from.*$(basename $(dirname "$f"))" {} \; 2>/dev/null | wc -l)
  echo "$exports,$imports,$f"
done | sort -t, -k2 -rn > .omc/barrel-analysis.csv
EOF
chmod +x scripts/analyze-barrels.sh
./scripts/analyze-barrels.sh
```

**输出**: `.omc/barrel-analysis.csv` (格式: exports,imports,path)

**决策规则**:
- imports > 5: 保留（高频使用）
- imports 2-5: 评估是否必要
- imports 0-1: 候选删除

#### 2.2 创建受控公共 API (3-4h)
**文件清单**:
- `src/api/index.ts` (新增)
- `src/api/agents.ts` (新增)
- `src/api/hooks.ts` (新增)
- `src/api/tools.ts` (新增)
- `src/api/features.ts` (新增)

**结构**:
```typescript
// src/api/index.ts
export * from './agents';
export * from './hooks';
export * from './tools';
export * from './features';

// src/api/agents.ts
export { Task } from '../agents/agent-wrapper';
export type { AgentType, AgentConfig } from '../agents/definitions';
// 仅导出公共 API，不导出内部实现

// src/api/hooks.ts
export { registerHook } from '../hooks/registry/HookRegistry';
export type { HookEvent, HookHandler } from '../hooks/bridge-types';

// src/api/tools.ts
export { registerTool } from '../tools/index';
export type { ToolDefinition } from '../tools/index';

// src/api/features.ts
export { initializeFeatures } from '../features/index';
```

**验收标准**:
- `src/api/index.ts` 导出 < 50 个符号
- 所有导出都有 JSDoc 注释
- 类型检查通过

#### 2.3 标记旧入口为废弃 (1-2h)
**文件清单**:
- `src/index.ts`

**修改**:
```typescript
// src/index.ts
/**
 * @deprecated 使用 'ultrapower/api' 代替
 * 此入口将在 2026-09-19 后移除
 *
 * 迁移指南:
 * - import { Task } from 'ultrapower' → import { Task } from 'ultrapower/api'
 */
export * from './api';
```

**验收标准**:
- 添加 package.json exports 字段:
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./api": "./dist/api/index.js"
  }
}
```

#### 2.4 渐进式迁移内部导入 (2-3h)
**策略**: 不强制一次性迁移，按模块逐步进行

**优先级**:
1. 新代码必须使用 `ultrapower/api`
2. 修改现有文件时顺便迁移
3. 6 个月后评估是否移除旧入口

**验收标准**:
- 新增 ESLint 规则检测旧导入
- CI 中添加警告（非阻塞）

### Phase 2 完成标准
```bash
# 必须通过
npm run build                            # 成功
npm test                                 # 全部通过
npm run lint                             # 无错误（允许警告）

# 验证新 API
node -e "require('./dist/api/index.js')" # 无错误
```

### 回滚策略
```bash
git checkout src/api/
git checkout src/index.ts
git checkout package.json
```

---

## Phase 3: 建立基线指标 (4-6h, P1)

### 目标
测量当前性能，设定可验证的改进目标。

### 具体任务

#### 3.1 创建性能监控脚本 (2-3h)
**文件清单**:
- `scripts/measure-baseline.sh` (新增)
- `.omc/metrics/baseline.json` (新增)

**脚本内容**:
```bash
#!/bin/bash
set -e

METRICS_DIR=".omc/metrics"
mkdir -p "$METRICS_DIR"

echo "📊 测量基线指标..."

# 1. 构建时间
echo "⏱️  构建时间..."
BUILD_START=$(date +%s)
npm run build > /dev/null 2>&1
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

# 2. 包大小
echo "📦 包大小..."
BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
BUNDLE_BYTES=$(du -sb dist/ | cut -f1)

# 3. 循环依赖
echo "🔄 循环依赖..."
CIRCULAR_COUNT=$(madge --circular --json src/ | jq 'length')

# 4. 测试覆盖率
echo "🧪 测试覆盖率..."
npm test -- --coverage --silent > /dev/null 2>&1
COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)

# 5. TypeScript 编译时间
echo "⚡ TypeScript 编译..."
TSC_START=$(date +%s)
tsc --noEmit
TSC_END=$(date +%s)
TSC_TIME=$((TSC_END - TSC_START))

# 6. 依赖分析
echo "📚 依赖分析..."
TOTAL_DEPS=$(jq '.dependencies | length' package.json)
DEV_DEPS=$(jq '.devDependencies | length' package.json)

# 生成报告
cat > "$METRICS_DIR/baseline.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "git_commit": "$(git rev-parse HEAD)",
  "metrics": {
    "build_time_seconds": $BUILD_TIME,
    "bundle_size_human": "$BUNDLE_SIZE",
    "bundle_size_bytes": $BUNDLE_BYTES,
    "circular_dependencies": $CIRCULAR_COUNT,
    "test_coverage_percent": $COVERAGE,
    "tsc_time_seconds": $TSC_TIME,
    "total_dependencies": $TOTAL_DEPS,
    "dev_dependencies": $DEV_DEPS
  }
}
EOF

echo "✅ 基线指标已保存到 $METRICS_DIR/baseline.json"
cat "$METRICS_DIR/baseline.json" | jq .
```

**验收标准**:
- 脚本执行成功
- 生成 JSON 格式的基线报告
- 所有指标都有数值

#### 3.2 设定改进目标 (1-2h)
**文件清单**:
- `.omc/metrics/targets.md` (新增)

**目标设定**:
```markdown
# 性能改进目标

基于 baseline.json 的测量结果设定：

## 短期目标 (3 个月)
- [ ] 循环依赖: 0 (当前: 2)
- [ ] 构建时间: 减少 10%
- [ ] 包大小: 减少 5%
- [ ] 测试覆盖率: 提升至 75%

## 中期目标 (6 个月)
- [ ] TypeScript 编译时间: 减少 15%
- [ ] Barrel exports: 减少至 50 个
- [ ] 依赖数量: 减少 10%

## 验证方式
每月运行 `scripts/measure-baseline.sh` 并对比结果。
```

#### 3.3 集成到 CI (1h)
**文件清单**:
- `.github/workflows/metrics.yml` (新增)

**内容**:
```yaml
name: Performance Metrics

on:
  push:
    branches: [dev, main]
  pull_request:

jobs:
  metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - name: Install jq
        run: sudo apt-get update && sudo apt-get install -y jq
      - run: chmod +x scripts/measure-baseline.sh
      - run: ./scripts/measure-baseline.sh
      - name: Upload metrics
        uses: actions/upload-artifact@v3
        with:
          name: metrics
          path: .omc/metrics/baseline.json
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const metrics = JSON.parse(fs.readFileSync('.omc/metrics/baseline.json'));
            const body = `## 📊 性能指标

            - 构建时间: ${metrics.metrics.build_time_seconds}s
            - 包大小: ${metrics.metrics.bundle_size_human}
            - 循环依赖: ${metrics.metrics.circular_dependencies}
            - 测试覆盖率: ${metrics.metrics.test_coverage_percent}%
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

**验收标准**:
- CI 工作流成功运行
- PR 中自动评论性能指标
- 指标数据可下载

### Phase 3 完成标准
```bash
# 必须通过
./scripts/measure-baseline.sh            # 成功生成报告
test -f .omc/metrics/baseline.json       # 文件存在
jq . .omc/metrics/baseline.json          # JSON 格式正确
```

### 回滚策略
```bash
rm -rf scripts/measure-baseline.sh
rm -rf .omc/metrics/
git checkout .github/workflows/
```

---

## 总体验收标准

### 必须全部通过
```bash
# 1. 零循环依赖
madge --circular src/ | grep "No circular"

# 2. 构建成功
npm run build

# 3. 测试通过
npm test

# 4. 类型检查
tsc --noEmit

# 5. 新 API 可用
node -e "require('./dist/api/index.js')"

# 6. 基线指标存在
test -f .omc/metrics/baseline.json
```

### 性能不退化
- 构建时间不增加 > 5%
- 包大小不增加 > 2%
- 测试覆盖率不降低

---

## 风险与缓解

### 风险 1: 破坏现有导入
**概率**: 中
**影响**: 高
**缓解**:
- Phase 2 保留旧入口 6 个月
- 添加 @deprecated 警告
- 渐进式迁移，不强制一次性完成

### 风险 2: CI 时间增加
**概率**: 低
**影响**: 中
**缓解**:
- 性能监控作为独立 workflow
- 仅在 dev/main 分支运行完整测量
- PR 中使用缓存加速

### 风险 3: 工作量超出预期
**概率**: 中
**影响**: 低
**缓解**:
- 每个 Phase 独立可交付
- Phase 2/3 可延后执行
- Phase 1 是唯一 P0 任务

---

## 执行时间表

| Phase | 工作量 | 开始日期 | 完成日期 | 负责人 |
|-------|--------|----------|----------|--------|
| Phase 1 | 2-4h | 2026-03-19 | 2026-03-20 | TBD |
| Phase 2 | 8-12h | 2026-03-21 | 2026-03-25 | TBD |
| Phase 3 | 4-6h | 2026-03-26 | 2026-03-27 | TBD |

**总计**: 15-25h，预计 1.5 周完成

---

## 成功标准

### 技术指标
- ✅ 循环依赖: 2 → 0
- ✅ 公共 API 入口: 建立
- ✅ 性能基线: 建立

### 流程指标
- ✅ 回滚策略: 每个 Phase 可独立回滚
- ✅ 文档更新: 同步更新 CLAUDE.md
- ✅ CI 集成: 自动化验证

### 可维护性
- ✅ 新代码使用 `ultrapower/api`
- ✅ 性能监控自动化
- ✅ 改进目标可追踪

---

## 后续优化方向

完成 v2.0 后，根据基线指标评估：

1. **如果构建时间 > 60s**: 考虑增量构建优化
2. **如果包大小 > 50MB**: 考虑代码分割
3. **如果测试覆盖率 < 70%**: 补充关键路径测试
4. **如果 barrel exports > 80**: 继续收敛导出

**原则**: 先测量，再优化，避免过早优化。
