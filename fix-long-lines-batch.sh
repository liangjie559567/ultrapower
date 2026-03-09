#!/bin/bash
cd agents.codex

# Fix each file with sed, splitting long lines
sed -i '10{s/你是 Domain Expert，领域知识专家。你专注于业务逻辑正确性、行业标准和确保产品解决领域问题。/你是 Domain Expert，领域知识专家。你专注于业务逻辑正确性、\n行业标准和确保产品解决领域问题。/}' axiom-domain-expert.md

sed -i '10{s/你是 Product Director，产品战略专家。你专注于产品战略、路线图对齐、OKR 和优先级排定。/你是 Product Director，产品战略专家。你专注于产品战略、\n路线图对齐、OKR 和优先级排定。/}' axiom-product-director.md

sed -i '10{s/你是 Sub-PRD Writer。你负责将 Manifest 中单任务拆解为可直接实现的技术规格文档。/你是 Sub-PRD Writer。你负责将 Manifest 中单任务拆解为\n可直接实现的技术规格文档。/}' axiom-sub-prd-writer.md

sed -i '117{s/  权限转换为 Set，总计 O(n)。预期：大集合时 100 倍加速。/  权限转换为 Set，总计 O(n)。预期：大集合时 100 倍\n  加速。/}' product-analyst.md

sed -i '72{s/  Array.includes()，n=5000 时约 2.5s；转换为 Set 以获得 O(n)/  Array.includes()，n=5000 时约 2.5s；转换为 Set 以\n  获得 O(n)/}' quality-reviewer.md

sed -i '51{s/  测试、集成测试、端到端测试）、覆盖率目标、不稳定测试加固策略/  测试、集成测试、端到端测试）、覆盖率目标、不稳定测试\n  加固策略/}' quality-strategist.md

sed -i '10{s/你是 Researcher（Athena）——外部文档和参考资料专家。你查找、评估和综合外部资源以回答技术问题。/你是 Researcher（Athena）——外部文档和参考资料专家。你查找、\n评估和综合外部资源以回答技术问题。/}' researcher.md

sed -i '73{s|  Node.js 文档（https://nodejs.org/api/globals.html）、Stack Overflow 讨论、GitHub issues|  Node.js 文档（<https://nodejs.org/api/globals.html>）、\n  Stack Overflow 讨论、GitHub issues|}' researcher.md

sed -i '59{s/  pandas\/numpy\/scipy\/matplotlib\/seaborn\/scikit-learn，用于数据操作、统计分析和可视化/  pandas\/numpy\/scipy\/matplotlib\/seaborn\/scikit-learn，\n  用于数据操作、统计分析和可视化/}' scientist.md

sed -i '75{s/  数据集 n=10000，p=0.05 显著性，检测到 15% 改进，置信区间 \[12%, 18%\]，建议推出/  数据集 n=10000，p=0.05 显著性，检测到 15% 改进，\n  置信区间 [12%, 18%]，建议推出/}' scientist.md

sed -i '70{s/  SQL 注入、XSS、CSRF、不安全反序列化、路径遍历、命令注入/  SQL 注入、XSS、CSRF、不安全反序列化、路径遍历、\n  命令注入/}' security-reviewer.md

sed -i '86{s/  用户输入直接拼接到 SQL 查询中。修复：使用参数化查询或 ORM。影响：高（数据泄露风险）/  用户输入直接拼接到 SQL 查询中。修复：使用参数化查询\n  或 ORM。影响：高（数据泄露风险）/}' security-reviewer.md

sed -i '9{s/你是 Style Reviewer。你审查代码格式、命名约定、语言惯用法和 lint 规范。/你是 Style Reviewer。你审查代码格式、命名约定、语言惯用法\n和 lint 规范。/}' style-reviewer.md

sed -i '64{s/  驼峰命名、一致缩进、无尾随空格、导入排序、TypeScript 类型注解/  驼峰命名、一致缩进、无尾随空格、导入排序、\n  TypeScript 类型注解/}' style-reviewer.md

sed -i '9{s/你是 Test Engineer（Hephaestus）——测试策略、覆盖率、不稳定测试加固和 TDD 工作流专家。/你是 Test Engineer（Hephaestus）——测试策略、覆盖率、\n不稳定测试加固和 TDD 工作流专家。/}' test-engineer.md

sed -i '75{s/  测试、集成测试、端到端测试）、覆盖率目标、不稳定测试加固策略、TDD 工作流/  测试、集成测试、端到端测试）、覆盖率目标、不稳定测试\n  加固策略、TDD 工作流/}' test-engineer.md

sed -i '10{s/你是 UX Researcher（Artemis）——启发式审计、可用性研究和用户证据综合专家。/你是 UX Researcher（Artemis）——启发式审计、可用性研究和\n用户证据综合专家。/}' ux-researcher.md

sed -i '9{s/你是 Verifier（Themis）——验证策略、基于证据的完成检查和测试充分性专家。/你是 Verifier（Themis）——验证策略、基于证据的完成检查和\n测试充分性专家。/}' verifier.md

sed -i '52{s/  测试通过、类型检查通过、lint 通过、构建成功、手动验证关键路径/  测试通过、类型检查通过、lint 通过、构建成功、手动\n  验证关键路径/}' verifier.md

sed -i '68{s/  测试通过、类型检查通过、lint 通过、构建成功、手动验证关键路径、文档更新/  测试通过、类型检查通过、lint 通过、构建成功、手动\n  验证关键路径、文档更新/}' verifier.md

sed -i '67{s/  图表显示 Q1-Q4 收入增长，带趋势线和预测。识别：条形图、线性趋势、季度标签/  图表显示 Q1-Q4 收入增长，带趋势线和预测。识别：\n  条形图、线性趋势、季度标签/}' vision.md

sed -i '69{s/  截图显示登录表单，带用户名\/密码字段和"记住我"复选框/  截图显示登录表单，带用户名\/密码字段和"记住我"\n  复选框/}' vision.md

echo "Fixed all long lines in agents.codex/"
