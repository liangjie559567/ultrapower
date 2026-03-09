# Manifest: 方向3 Plugin 生态系统完善

**版本**: v1.0 | **日期**: 2026-03-02 | **状态**: EXECUTING

## Impact Scope

```
src/lib/plugin-security.ts          (CREATE)
src/lib/plugin-rollback.ts          (CREATE)
src/lib/plugin-deps.ts              (CREATE)
src/lib/plugin-marketplace.ts       (CREATE)
src/lib/__tests__/plugin-security.test.ts  (CREATE)
src/lib/__tests__/plugin-rollback.test.ts  (CREATE)
src/lib/__tests__/plugin-deps.test.ts      (CREATE)
src/cli/commands/plugin.ts          (CREATE)
src/cli/index.ts                    (MODIFY - register plugin command)
```

## Tasks

| ID | 名称 | 状态 | 依赖 |
| ---- | ------ | ------ | ------ |
| T-01 | 沙箱技术 POC 报告 | DONE | — |
| T-02 | 静态分析（AST 扫描危险 API） | PENDING | T-01 |
| T-03 | 运行时权限限制 | PENDING | T-01 |
| T-04 | 递归依赖树扫描 | PENDING | — |
| T-05 | 版本回滚机制 | PENDING | — |
| T-06 | 依赖解析增强 | PENDING | T-04 |
| T-07 | 单元测试 ≥15 cases | PENDING | T-02~T-06 |
| T-08 | Marketplace 条件触发门禁 | PENDING | — |

## 沙箱 POC 结论（T-01）

**选型决策**: Worker Threads（Node.js 内置）

理由：

* isolated-vm: 需要原生模块，Windows 编译复杂，性能最好但部署成本高

* Worker Threads: Node.js 内置，无额外依赖，可通过 `--experimental-permission` 限制 FS/Net 访问

* Deno: 需要独立运行时，与 Node.js 生态不兼容

**结论**: 使用 Worker Threads + 静态 AST 分析双重防护，不引入额外依赖。
