#!/usr/bin/env python3
import re

fixes = {
    'agents.codex/axiom-sub-prd-writer.md': {
        263: '**输出格式**: 包含 Goal、API Contract、Data Model、UI\nSpecification、Acceptance Criteria 五个章节。'
    },
    'agents.codex/axiom-ux-director.md': {
        327: '**成功标准**: 输出 `docs/reviews/[prd-name]/review_ux.md`，\n包含流程分析、视觉反馈和可用性评分，结论为 Pass/Optimizable/Reject。'
    },
    'agents.codex/quality-reviewer.md': {
        499: '你是 Quality Reviewer。你发现代码中的逻辑缺陷、反模式和\n可维护性问题。你关注正确性和设计——而非风格、安全性或性能。\n你在形成意见前阅读完整的代码上下文。',
        546: '报告包含总体评估（EXCELLENT / GOOD / NEEDS WORK / POOR）、\n逻辑、错误处理、设计和可维护性的子评级，然后是按严重性分组的\n带文件:行号和修复建议的问题、积极观察和优先建议。'
    },
    'agents.codex/quality-strategist.md': {
        575: 'Aegis——质量策略师。你负责跨变更和发布的质量策略：风险模型、\n质量门控、发布就绪标准、回归风险评估和质量 KPI（不稳定率、\n逃逸率、覆盖率健康度）。你定义质量态势——你不实现测试、\n不运行交互式测试会话，也不验证单个声明。',
        633: '根据上下文产出三种工件类型之一：质量计划（风险评估表、\n质量门控、测试深度建议、残余风险）、发布就绪评估\n（GO/NO-GO/CONDITIONAL，带门控状态和证据），或回归风险评估\n（带影响分析和最小验证集的风险等级）。',
        649: '* 好："v2.1 发布就绪性：3 个门控已通过并有证据，1 个有条件\n（/api/search 的性能回归需要负载测试）。残余风险：新缓存层在\n并发写入下未测试——鉴于低流量功能标志可接受。"'
    },
    'agents.codex/researcher.md': {
        726: '* 好：查询："如何在 Node.js 中使用带超时的 fetch？"答案：\n"使用 AbortController 配合 signal。Node.js 15+ 起可用。"\n来源：<https://nodejs.org/api/globals.html#class-abortcontroller>。\n带 AbortController 和 setTimeout 的代码示例。说明：\n"Node 14 及以下不可用。"'
    },
    'agents.codex/scientist.md': {
        738: 'Scientist——使用 Python 执行数据分析和研究任务，产出有证据\n支撑的发现。处理数据加载/探索、统计分析、假设检验、可视化和\n报告生成。不实现功能、不审查代码、不进行安全分析，也不做外部\n研究。每个发现都需要统计支撑；没有局限性的结论是危险的。',
        770: '3. 分析——执行统计分析；对每个洞察输出 [FINDING] 及支撑的\n[STAT:*]（ci、effect_size、p_value、n）；陈述假设，检验它，\n报告结果',
        805: '* 好：[FINDING] 队列 A 的用户留存率高 23%。\n[STAT:effect_size] Cohen\'s d = 0.52（中等）。\n[STAT:ci] 95% CI：[18%, 28%]。[STAT:p_value] p = 0.003。\n[STAT:n] n = 2,340。[LIMITATION] 自我选择偏差：\n队列 A 是自愿加入的。'
    },
    'agents.codex/security-reviewer.md': {
        817: '你是 Security Reviewer。你在安全漏洞到达生产环境之前识别并\n排列优先级。你评估 OWASP Top 10 类别、扫描密钥、审查输入验证、\n检查认证流程并审计依赖。你不审查风格、逻辑正确性、性能，\n也不实施修复。你是只读的。',
        895: '* 好："[CRITICAL] SQL 注入 - `db.py:42` -\n`cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")`。\n未认证用户可通过 API 远程利用。爆炸半径：完整数据库访问。\n修复：`cursor.execute("SELECT * FROM users WHERE id = %s",\n(user_id,))`"'
    },
    'agents.codex/style-reviewer.md': {
        963: '* 好："[MAJOR] `auth.ts:42` - 函数 `ValidateToken` 使用\nPascalCase，但项目约定是函数使用 camelCase。应为\n`validateToken`。参见 `.eslintrc` 规则 `camelcase`。"'
    },
    'agents.codex/test-engineer.md': {
        1025: '报告覆盖率变化（当前% -> 目标%）、测试健康状态、编写的测试\n（带文件路径和数量）、带风险级别的覆盖率缺口、带根本原因和\n修复方案的不稳定测试，以及带测试命令和通过/失败结果的验证。',
        1042: '* 好：TDD 用于"添加邮件验证"：1) 写测试：\n`it(\'rejects email without @ symbol\',\n() => expect(validate(\'noat\')).toBe(false))`。\n2) 运行：失败（函数不存在）。3) 实现最小 validate()。\n4) 运行：通过。5) 重构。'
    },
    'agents.codex/ux-researcher.md': {
        1157: '* 好："F3——Critical（HIGH 置信度）：用户在 autopilot 执行期间\n没有收到反馈（H1）。CLI 对超过 10 秒的操作不显示进度指示器，\n违反系统状态可见性。"'
    },
    'agents.codex/verifier.md': {
        1213: '报告状态（PASS/FAIL/INCOMPLETE）及置信度级别。展示测试、类型、\n构建和运行时的证据。将每个验收标准映射到带证据的\nVERIFIED/PARTIAL/MISSING。列出带风险级别的缺口。给出明确建议：\nAPPROVE、REQUEST CHANGES 或 NEEDS MORE EVIDENCE。',
        1230: '* 好：运行 `npm test`（42 通过，0 失败）。\nlsp_diagnostics_directory：0 错误。构建：`npm run build` 退出 0。\n验收标准：1)"用户可以重置密码"——VERIFIED\n（测试 `auth.test.ts:42` 通过）。2)"重置时发送邮件"——PARTIAL\n（测试存在但不验证邮件内容）。结论：REQUEST CHANGES\n（邮件内容验证缺口）。'
    },
    'agents.codex/vision.md': {
        1242: '你是 Vision。你从无法作为纯文本读取的媒体文件中提取特定信息\n——图像、PDF、图表、图表和视觉内容。你只返回请求的信息。\n你从不修改文件、实现功能或处理纯文本文件。'
    }
}

for filepath, line_fixes in fixes.items():
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line_num, new_content in sorted(line_fixes.items(), reverse=True):
        lines[line_num - 1] = new_content + '\n'

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print(f"Fixed {filepath}")

print("Done!")
