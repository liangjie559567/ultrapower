# Axiom Learning Queue

## 待处理学习素材

### ✅ Q-038: Ralplan共识流程
- 优先级: P1
- 来源类型: planning_session
- 状态: processed
- 添加时间: 2026-03-17
- 处理时间: 2026-03-17
- 内容: Architect/Critic并行评审提升计划质量，捕获数据不一致和架构缺陷
- 结果: 已提取到知识库 (K004)
- 置信度: 90%

### ✅ Q-039: 数据验证优先策略
- 优先级: P1
- 来源类型: planning_session
- 状态: processed
- 添加时间: 2026-03-17
- 处理时间: 2026-03-17
- 内容: 先运行grep/tsc验证实际数据，再制定工作量估算，避免基于过时审计报告
- 结果: 已提取到知识库 (K005)
- 置信度: 95%

### ✅ Q-040: TODO分类策略
- 优先级: P2
- 来源类型: refactoring_session
- 状态: processed
- 添加时间: 2026-03-17
- 处理时间: 2026-03-17
- 内容: 区分功能性关键词（TODO LIST系统）vs真实待办项，避免误删
- 结果: 已提取到知识库 (K006)
- 置信度: 85%

### ✅ Q-041: 防御性流操作模式
- 优先级: P2
- 来源类型: test_stability_fix
- 状态: processed
- 添加时间: 2026-03-18
- 处理时间: 2026-03-18
- 内容: 在写入 Node.js 流前检查 destroyed 状态，避免 EPIPE 错误
- 结果: 已提取到知识库 (K007)
- 置信度: 95%

### ✅ Q-042: 进程退出竞态条件处理
- 优先级: P2
- 来源类型: code_review_fix
- 状态: processed
- 添加时间: 2026-03-18
- 处理时间: 2026-03-18
- 内容: 注册 exit 事件监听器前检查进程是否已退出
- 结果: 已提取到知识库 (K008)
- 置信度: 90%

### ✅ Q-043: 会话过滤多维度策略
- 优先级: P2
- 来源类型: data_quality_fix
- 状态: processed
- 添加时间: 2026-03-18
- 处理时间: 2026-03-18
- 内容: 组合多个条件过滤空会话（agents/modes/duration/completed）
- 结果: 已提取到知识库 (K009)
- 置信度: 90%

### ✅ Q-044: 异常安全的资源清理
- 优先级: P2
- 来源类型: code_review_fix
- 状态: processed
- 添加时间: 2026-03-18
- 处理时间: 2026-03-18
- 内容: 使用 try-finally 确保资源清理即使在异常情况下也能执行
- 结果: 已提取到知识库 (K010)
- 置信度: 95%

### Q-037: 测试驱动修复策略
- 优先级: P1
- 来源类型: bug_fix_session
- 状态: pending
- 添加时间: 2026-03-17
- 内容: 先编写测试用例验证预期行为，再修正实现以通过测试

### Q-035: 快速验证策略
- 优先级: P1
- 来源类型: bug_fix_session
- 状态: pending
- 添加时间: 2026-03-17
- 内容: 先检查现有实现再动手修复，避免重复工作

### Q-036: 敏感hook验证模式
- 优先级: P1
- 来源类型: security_fix
- 状态: pending
- 添加时间: 2026-03-17
- 内容: 强制敏感hook使用完整Zod验证路径，跳过快速路径

## 已处理记录

### ✅ P1: 测试环境隔离模式
- **处理时间**: 2026-03-15
- **状态**: 已提取到知识库 (K001)
- **置信度**: 95%

### ✅ P1: Git Rebase工作流
- **处理时间**: 2026-03-15
- **状态**: 已提取到知识库 (K002)
- **置信度**: 90%

### ✅ P2: 跳过测试分类标准
- **处理时间**: 2026-03-15
- **状态**: 已提取到知识库 (K003)
- **置信度**: 85%

## 优先级
- P0: 紧急
- P1: 高
- P2: 中
- P3: 低

### ✅ 已处理: Q-001 到 Q-034 (批量)
- **处理时间**: 2026-03-17
- **状态**: 已合并为统计数据
- **结果**: 更新至 workflow_metrics.md
- **发现**: autopilot/ralph 在测试会话中交替使用模式

### Q-001: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-002: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-005: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-006: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-008: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-009: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-010: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-011: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-012: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-013: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-014: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-015: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-019: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-020: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-021: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-022: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-023: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-024: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-025: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-026: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-17
- 内容: mode used in session auto-test-ses

### Q-024: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-025: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-026: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-027: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-028: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-029: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-030: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-031: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-032: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-033: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-034: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-035: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-036: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-037: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-038: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-039: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-040: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-041: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-042: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-043: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-044: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-045: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-046: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-047: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-048: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-049: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-050: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-051: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-052: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-053: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-054: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-055: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-056: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-057: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-058: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-059: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-060: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-061: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-062: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-063: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-064: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-065: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-066: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-067: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-068: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-069: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-070: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-071: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-072: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-073: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-074: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-075: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-076: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-077: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-078: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-079: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-080: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-081: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-082: autopilot
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses

### Q-083: ralph
- 优先级: P3
- 来源类型: session_mode
- 状态: pending
- 添加时间: 2026-03-18
- 内容: mode used in session auto-test-ses
