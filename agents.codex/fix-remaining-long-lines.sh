#!/bin/bash

# Fix agents.codex files
cd agents.codex

# axiom-domain-expert.md line 10
sed -i '10s/.*/你是 Domain Expert，领域知识专家。你专注于业务逻辑正确性、/' axiom-domain-expert.md
sed -i '11i\行业标准和确保产品解决领域问题。' axiom-domain-expert.md

# axiom-product-director.md line 10
sed -i '10s/.*/你是 Product Director，产品战略专家。你专注于产品战略、/' axiom-product-director.md
sed -i '11i\路线图对齐、OKR 和优先级排定。' axiom-product-director.md

# axiom-sub-prd-writer.md line 10
sed -i '10s/.*/你是 Sub-PRD Writer。你负责将 Manifest 中单任务拆解为/' axiom-sub-prd-writer.md
sed -i '11i\可直接实现的技术规格文档。' axiom-sub-prd-writer.md

# product-analyst.md line 117
sed -i '117s/.*/  权限转换为 Set，总计 O(n)。预期：大集合时 100 倍/' product-analyst.md
sed -i '118i\  加速。' product-analyst.md

# quality-reviewer.md line 72
sed -i '72s/.*/  Array.includes()，n=5000 时约 2.5s；转换为 Set 以/' quality-reviewer.md
sed -i '73i\  获得 O(n)' quality-reviewer.md

# quality-strategist.md line 51
sed -i '51s/.*/  测试、集成测试、端到端测试）、覆盖率目标、不稳定测试/' quality-strategist.md
sed -i '52i\  加固策略' quality-strategist.md

# researcher.md line 10 and 73
sed -i '10s/.*/你是 Researcher（Athena）——外部文档和参考资料专家。你查找、/' researcher.md
sed -i '11i\评估和综合外部资源以回答技术问题。' researcher.md
sed -i '73s/.*/  Node.js 文档（<https:\/\/nodejs.org\/api\/globals.html>）、/' researcher.md
sed -i '74i\  Stack Overflow 讨论、GitHub issues' researcher.md

# scientist.md line 59 and 75
sed -i '59s/.*/  pandas\/numpy\/scipy\/matplotlib\/seaborn\/scikit-learn，/' scientist.md
sed -i '60i\  用于数据操作、统计分析和可视化' scientist.md
sed -i '75s/.*/  数据集 n=10000，p=0.05 显著性，检测到 15% 改进，/' scientist.md
sed -i '76i\  置信区间 [12%, 18%]，建议推出' scientist.md

# security-reviewer.md line 70 and 86
sed -i '70s/.*/  SQL 注入、XSS、CSRF、不安全反序列化、路径遍历、/' security-reviewer.md
sed -i '71i\  命令注入' security-reviewer.md
sed -i '86s/.*/  用户输入直接拼接到 SQL 查询中。修复：使用参数化查询/' security-reviewer.md
sed -i '87i\  或 ORM。影响：高（数据泄露风险）' security-reviewer.md

# style-reviewer.md line 9 and 64
sed -i '9s/.*/你是 Style Reviewer。你审查代码格式、命名约定、语言惯用法/' style-reviewer.md
sed -i '10i\和 lint 规范。' style-reviewer.md
sed -i '64s/.*/  驼峰命名、一致缩进、无尾随空格、导入排序、/' style-reviewer.md
sed -i '65i\  TypeScript 类型注解' style-reviewer.md

# test-engineer.md line 9 and 75
sed -i '9s/.*/你是 Test Engineer（Hephaestus）——测试策略、覆盖率、/' test-engineer.md
sed -i '10i\不稳定测试加固和 TDD 工作流专家。' test-engineer.md
sed -i '75s/.*/  测试、集成测试、端到端测试）、覆盖率目标、不稳定测试/' test-engineer.md
sed -i '76i\  加固策略、TDD 工作流' test-engineer.md

# ux-researcher.md line 10
sed -i '10s/.*/你是 UX Researcher（Artemis）——启发式审计、可用性研究和/' ux-researcher.md
sed -i '11i\用户证据综合专家。' ux-researcher.md

# verifier.md line 9, 52, 68
sed -i '9s/.*/你是 Verifier（Themis）——验证策略、基于证据的完成检查和/' verifier.md
sed -i '10i\测试充分性专家。' verifier.md
sed -i '52s/.*/  测试通过、类型检查通过、lint 通过、构建成功、手动/' verifier.md
sed -i '53i\  验证关键路径' verifier.md
sed -i '68s/.*/  测试通过、类型检查通过、lint 通过、构建成功、手动/' verifier.md
sed -i '69i\  验证关键路径、文档更新' verifier.md

# vision.md line 67 and 69
sed -i '67s/.*/  图表显示 Q1-Q4 收入增长，带趋势线和预测。识别：/' vision.md
sed -i '68i\  条形图、线性趋势、季度标签' vision.md
sed -i '69s/.*/  截图显示登录表单，带用户名\/密码字段和"记住我"/' vision.md
sed -i '70i\  复选框' vision.md

cd ..
echo "Fixed agents.codex files"
