/**
 * Workflow Gate Hook
 *
 * Enforces superpowers workflow discipline by detecting when users
 * skip required steps and automatically injecting the correct skill.
 *
 * Workflow stages:
 * 1. brainstorming (required before any implementation)
 * 2. writing-plans (required after brainstorming)
 * 3. using-git-worktrees (recommended before execution)
 * 4. execution (subagent-driven-development or executing-plans)
 * 5. requesting-code-review (required before completion)
 * 6. verification-before-completion (required before merge)
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { validateAssumptions } from '../../features/assumption-validator/index.js';
import { extractAssumptionsFromPlan } from './assumption-extractor.js';
import { getChangedFiles } from './git-helper.js';
import { runQualityGateSync } from './quality-gate-sync.js';
const WORKFLOW_STATE_FILE = '.omc/workflow-state.json';
/**
 * Get workflow state file path
 */
export function getWorkflowStatePath(workingDir) {
    return join(workingDir, WORKFLOW_STATE_FILE);
}
/**
 * Read current workflow state
 */
export function readWorkflowState(workingDir) {
    const statePath = getWorkflowStatePath(workingDir);
    if (!existsSync(statePath)) {
        return null;
    }
    try {
        const content = readFileSync(statePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Write workflow state
 */
export function writeWorkflowState(workingDir, state) {
    const statePath = getWorkflowStatePath(workingDir);
    const dir = join(workingDir, '.omc');
    if (!existsSync(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
    }
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}
/**
 * Initialize workflow state
 */
export function initWorkflowState(workingDir) {
    const state = {
        brainstormingComplete: false,
        planWritten: false,
        worktreeCreated: false,
        testsWritten: false,
        executionStarted: false,
        reviewRequested: false,
        codeReviewComplete: false,
        securityReviewComplete: false,
        performanceReviewComplete: false,
        verificationComplete: false,
        assumptionsValidated: false,
        qualityGatePassed: false,
        lastStage: 'init',
        timestamp: Date.now()
    };
    writeWorkflowState(workingDir, state);
    return state;
}
/**
 * Detect implementation keywords that require brainstorming first
 */
export function detectImplementationIntent(prompt) {
    const implementationKeywords = [
        'implement', 'create', 'add', 'build', 'develop',
        'write code', 'make a', 'generate', 'construct',
        '实现', '创建', '添加', '构建', '开发', '编写代码', '生成'
    ];
    const lowerPrompt = prompt.toLowerCase();
    return implementationKeywords.some(kw => lowerPrompt.includes(kw));
}
/**
 * Detect plan execution keywords
 */
export function detectExecutionIntent(prompt) {
    const executionKeywords = [
        'execute', 'run', 'start', 'begin implementation',
        '执行', '运行', '开始实现'
    ];
    const lowerPrompt = prompt.toLowerCase();
    return executionKeywords.some(kw => lowerPrompt.includes(kw));
}
/**
 * Check if brainstorming skill was just completed
 */
export function detectBrainstormingComplete(prompt) {
    return prompt.includes('brainstorming') &&
        (prompt.includes('complete') || prompt.includes('完成'));
}
/**
 * Check if plan was just written
 */
export function detectPlanComplete(prompt) {
    return (prompt.includes('plan') || prompt.includes('writing-plans')) &&
        (prompt.includes('complete') || prompt.includes('written') || prompt.includes('完成'));
}
/**
 * Check if tests were just written
 */
export function detectTestsComplete(prompt) {
    return (prompt.includes('test') || prompt.includes('测试')) &&
        (prompt.includes('complete') || prompt.includes('written') || prompt.includes('完成'));
}
/**
 * Check if code review was completed
 */
export function detectCodeReviewComplete(prompt) {
    return (prompt.includes('code review') || prompt.includes('代码审查')) &&
        (prompt.includes('complete') || prompt.includes('完成'));
}
/**
 * Check if security review was completed
 */
export function detectSecurityReviewComplete(prompt) {
    return (prompt.includes('security review') || prompt.includes('安全审查')) &&
        (prompt.includes('complete') || prompt.includes('完成'));
}
/**
 * Check if performance review was completed
 */
export function detectPerformanceReviewComplete(prompt) {
    return (prompt.includes('performance review') || prompt.includes('性能审查')) &&
        (prompt.includes('complete') || prompt.includes('完成'));
}
/**
 * Detect if prompt contains security-sensitive keywords
 */
export function detectSecuritySensitive(prompt) {
    const securityKeywords = [
        'auth', 'password', 'token', 'jwt', 'session', 'crypto', 'encrypt',
        '认证', '密码', '加密', '令牌'
    ];
    const lowerPrompt = prompt.toLowerCase();
    return securityKeywords.some(kw => lowerPrompt.includes(kw) || prompt.includes(kw));
}
/**
 * Detect if prompt contains performance-sensitive keywords
 */
export function detectPerformanceSensitive(prompt) {
    const performanceKeywords = [
        'performance', 'optimize', 'cache', 'query', 'database', 'api',
        '性能', '优化', '缓存', '查询', '数据库'
    ];
    const lowerPrompt = prompt.toLowerCase();
    return performanceKeywords.some(kw => lowerPrompt.includes(kw) || prompt.includes(kw));
}
/**
 * Detect if user is trying to use executing-plans or subagent-driven-development
 */
export function detectPlanExecutionSkill(prompt) {
    return prompt.includes('executing-plans') ||
        prompt.includes('subagent-driven-development') ||
        prompt.includes('/ultrapower:executing-plans') ||
        prompt.includes('/ultrapower:subagent-driven-development');
}
/**
 * Detect if user is requesting verification
 */
export function detectVerificationIntent(prompt) {
    const verificationKeywords = [
        'verify', 'verification', 'validate', 'check complete',
        '验证', '检查完成'
    ];
    const lowerPrompt = prompt.toLowerCase();
    return verificationKeywords.some(kw => lowerPrompt.includes(kw) || prompt.includes(kw));
}
/**
 * Detect if user is asking a vague question that needs brainstorming
 */
export function detectVagueRequest(prompt) {
    const vaguePatterns = [
        'how to', 'what should', 'help me', 'i want to', 'i need',
        '如何', '怎么', '帮我', '我想', '我需要'
    ];
    // Check both original and lowercase for case-insensitive English matching
    const lowerPrompt = prompt.toLowerCase();
    const hasVaguePattern = vaguePatterns.some(pattern => lowerPrompt.includes(pattern.toLowerCase()) || prompt.includes(pattern));
    // Ignore if brainstorming already mentioned
    if (prompt.includes('brainstorm')) {
        return false;
    }
    // Require minimum length (count characters, not bytes)
    if (Array.from(prompt).length < 8) {
        return false;
    }
    return hasVaguePattern;
}
/**
 * Suggest next step based on current workflow state
 */
export function suggestNextStep(state) {
    if (!state.brainstormingComplete) {
        return 'brainstorming';
    }
    if (!state.planWritten) {
        return 'writing-plans';
    }
    if (!state.testsWritten && state.planWritten) {
        return 'test-driven-development';
    }
    if (!state.executionStarted && state.testsWritten) {
        return 'subagent-driven-development';
    }
    if (!state.reviewRequested && state.executionStarted) {
        return 'requesting-code-review';
    }
    if (!state.codeReviewComplete && state.reviewRequested) {
        return 'code-review';
    }
    if (!state.verificationComplete && state.codeReviewComplete) {
        return 'verification-before-completion';
    }
    if (!state.worktreeCreated && state.planWritten) {
        return 'using-git-worktrees';
    }
    return null;
}
/**
 * Process workflow gate check
 */
export function processWorkflowGate(input) {
    const { prompt, workingDirectory } = input;
    let state = readWorkflowState(workingDirectory);
    if (!state) {
        state = initWorkflowState(workingDirectory);
    }
    // Update state based on prompt
    if (detectBrainstormingComplete(prompt)) {
        state.brainstormingComplete = true;
        state.lastStage = 'brainstorming';
        state.timestamp = Date.now();
        writeWorkflowState(workingDirectory, state);
    }
    if (detectPlanComplete(prompt)) {
        state.planWritten = true;
        state.lastStage = 'planning';
        state.timestamp = Date.now();
        writeWorkflowState(workingDirectory, state);
    }
    if (detectTestsComplete(prompt)) {
        state.testsWritten = true;
        state.lastStage = 'testing';
        state.timestamp = Date.now();
        writeWorkflowState(workingDirectory, state);
    }
    if (detectCodeReviewComplete(prompt)) {
        state.codeReviewComplete = true;
        state.lastStage = 'code-review';
        state.timestamp = Date.now();
        writeWorkflowState(workingDirectory, state);
    }
    if (detectSecurityReviewComplete(prompt)) {
        state.securityReviewComplete = true;
        state.lastStage = 'security-review';
        state.timestamp = Date.now();
        writeWorkflowState(workingDirectory, state);
    }
    if (detectPerformanceReviewComplete(prompt)) {
        state.performanceReviewComplete = true;
        state.lastStage = 'performance-review';
        state.timestamp = Date.now();
        writeWorkflowState(workingDirectory, state);
    }
    // Gate 1: Implementation without brainstorming (highest priority)
    if (detectImplementationIntent(prompt) && !state.brainstormingComplete) {
        return {
            success: true,
            shouldBlock: true,
            injectedSkill: 'brainstorming',
            message: '⚠️ Workflow Gate: 在实现之前必须先进行头脑风暴。自动注入 brainstorming skill。'
        };
    }
    // Gate 2: Execution without plan
    if (detectExecutionIntent(prompt) && !state.planWritten) {
        return {
            success: true,
            shouldBlock: true,
            injectedSkill: 'writing-plans',
            message: '⚠️ Workflow Gate: 在执行之前必须先编写计划。自动注入 writing-plans skill。'
        };
    }
    // Gate 2.5: Execution without tests (TDD enforcement)
    if (detectExecutionIntent(prompt) && state.planWritten && !state.testsWritten) {
        return {
            success: true,
            shouldBlock: true,
            injectedSkill: 'test-driven-development',
            message: '⚠️ Workflow Gate: TDD 要求在实现前先编写测试。自动注入 test-driven-development skill。'
        };
    }
    // Gate 2.6: Execution without validating assumptions (NEW - Phase 2)
    if (detectExecutionIntent(prompt) && state.planWritten && !state.assumptionsValidated) {
        const assumptions = extractAssumptionsFromPlan(workingDirectory);
        if (assumptions.length > 0) {
            const result = validateAssumptions(assumptions);
            if (!result.valid && result.shouldStop) {
                state.assumptionsValidated = false;
                writeWorkflowState(workingDirectory, state);
                return {
                    success: true,
                    shouldBlock: true,
                    injectedSkill: 'assumption-validator',
                    message: `⚠️ Workflow Gate: 发现 ${result.failedAssumptions.length} 个未验证的假设，必须先验证。`
                };
            }
        }
        state.assumptionsValidated = true;
        writeWorkflowState(workingDirectory, state);
    }
    // Gate 3: Using executing-plans or subagent-driven-development without plan
    if (detectPlanExecutionSkill(prompt) && !state.planWritten) {
        return {
            success: true,
            shouldBlock: true,
            injectedSkill: 'writing-plans',
            message: '⚠️ Workflow Gate: 使用 executing-plans 或 subagent-driven-development 前必须先编写计划。自动注入 writing-plans skill。'
        };
    }
    // Gate 4: Verification without code review
    if (prompt.includes('verification') && state.executionStarted && !state.codeReviewComplete) {
        return {
            success: true,
            shouldBlock: true,
            injectedSkill: 'code-review',
            message: '⚠️ Workflow Gate: 验证前必须先完成代码审查。自动注入 code-review skill。'
        };
    }
    // Gate 4.5: Verification without quality gate (NEW - Phase 2)
    if (detectVerificationIntent(prompt) && state.codeReviewComplete && !state.qualityGatePassed) {
        const skipRequested = prompt.includes('skip quality') || prompt.includes('跳过质量');
        if (!skipRequested) {
            const changedFiles = getChangedFiles(workingDirectory);
            if (changedFiles.length > 0) {
                try {
                    const result = runQualityGateSync(changedFiles, workingDirectory, false);
                    if (!result.passed) {
                        return {
                            success: true,
                            shouldBlock: true,
                            message: `⚠️ Workflow Gate: 质量门禁未通过 (得分: ${result.score}/100)\n问题:\n${result.issues.slice(0, 5).map(i => `  - ${i}`).join('\n')}`
                        };
                    }
                    state.qualityGatePassed = true;
                    writeWorkflowState(workingDirectory, state);
                }
                catch (error) {
                    state.qualityGatePassed = true;
                    writeWorkflowState(workingDirectory, state);
                }
            }
            else {
                state.qualityGatePassed = true;
                writeWorkflowState(workingDirectory, state);
            }
        }
        else {
            state.qualityGatePassed = true;
            writeWorkflowState(workingDirectory, state);
        }
    }
    // Gate 5: Security review for sensitive code
    if (detectSecuritySensitive(prompt) && state.executionStarted && !state.securityReviewComplete) {
        return {
            success: true,
            shouldBlock: true,
            injectedSkill: 'security-review',
            message: '⚠️ Workflow Gate: 检测到安全敏感代码，必须进行安全审查。自动注入 security-review skill。'
        };
    }
    // Gate 6: Performance review for performance-sensitive code
    if (detectPerformanceSensitive(prompt) && state.executionStarted && !state.performanceReviewComplete) {
        return {
            success: true,
            shouldBlock: true,
            injectedSkill: 'performance-review',
            message: '⚠️ Workflow Gate: 检测到性能敏感代码，必须进行性能审查。自动注入 performance-review skill。'
        };
    }
    // Auto-trigger: Suggest brainstorming for vague requests (lower priority)
    // Only trigger if no implementation intent detected
    if (detectVagueRequest(prompt) && !state.brainstormingComplete && !detectImplementationIntent(prompt)) {
        return {
            success: true,
            shouldBlock: true,
            injectedSkill: 'brainstorming',
            message: '💡 自动触发: 检测到模糊需求，建议先进行头脑风暴以明确方向。'
        };
    }
    return {
        success: true,
        shouldBlock: false
    };
}
/**
 * Clear workflow state (for testing or manual reset)
 */
export function clearWorkflowState(workingDir) {
    const statePath = getWorkflowStatePath(workingDir);
    if (existsSync(statePath)) {
        require('fs').unlinkSync(statePath);
    }
}
//# sourceMappingURL=index.js.map