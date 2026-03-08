/**
 * Axiom Boot Hook - Main Entry
 *
 * Injects Axiom memory context at session start when .omc/axiom/ exists.
 */
import { isAxiomEnabled, readActiveContext, readActiveContextRaw, parseAxiomState, readProjectDecisions, readUserPreferences, ensureConstitution, } from './storage.js';
import { collectSessionData } from '../../features/reflection/data-collector.js';
import { generateReflectionReport } from '../../features/reflection/report-generator.js';
export * from './types.js';
export * from './storage.js';
export function processAxiomBoot(input) {
    const { workingDirectory } = input;
    if (!isAxiomEnabled(workingDirectory)) {
        return { contextInjected: false, state: null };
    }
    ensureConstitution(workingDirectory);
    const rawContent = readActiveContextRaw(workingDirectory);
    if (!rawContent) {
        return { contextInjected: false, state: null };
    }
    const state = parseAxiomState(rawContent);
    let message;
    switch (state.status) {
        case 'IDLE':
            message = 'Axiom 系统就绪，请输入需求。';
            break;
        case 'EXECUTING':
            message = `检测到中断的任务 ${state.activeTaskId ?? ''}，是否继续？`;
            break;
        case 'BLOCKED':
            message = '上次任务遇到问题，需要人工介入。运行 /ax-status 查看详情。';
            break;
        default:
            message = `Axiom 状态: ${state.status}`;
    }
    return { contextInjected: true, state, message };
}
export function buildAxiomBootContext(workingDirectory) {
    const decisions = readProjectDecisions(workingDirectory);
    const preferences = readUserPreferences(workingDirectory);
    const activeContext = readActiveContext(workingDirectory);
    const parts = ['## Axiom 上下文'];
    if (activeContext)
        parts.push(`### 当前状态\n${activeContext}`);
    if (decisions)
        parts.push(`### 架构决策\n${decisions}`);
    if (preferences)
        parts.push(`### 用户偏好\n${preferences}`);
    return parts.join('\n\n');
}
export function generateSessionReflection(workingDirectory) {
    const sessionData = collectSessionData(workingDirectory);
    if (!sessionData)
        return null;
    try {
        return generateReflectionReport(sessionData, workingDirectory);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=index.js.map