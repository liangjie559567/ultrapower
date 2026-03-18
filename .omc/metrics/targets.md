# 性能改进目标

基于 baseline.json 的测量结果设定。

## 短期目标 (3 个月)
- [ ] 循环依赖: 0 (当前: 2)
- [ ] 构建时间: 减少 10%
- [ ] 包大小: 减少 5%
- [ ] 测试覆盖率: 提升至 75%

## 中期目标 (6 个月)
- [ ] TypeScript 编译时间: 减少 15%
- [ ] Barrel exports: 减少至 50 个 (当前: 101)
- [ ] 依赖数量: 减少 10%

## 验证方式
每月运行 `scripts/measure-baseline.sh` 并对比结果。

## 基线参考
运行 `cat .omc/metrics/baseline.json` 查看当前基线数据。
