/**
 * OMC HUD - Smart Suggestions Element
 *
 * Generates context-aware next-step suggestions based on current system state.
 * Analyzes: context usage, Axiom state, active agents, session health.
 */
import { RESET } from '../colors.js';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
// ============================================================================
// Suggestion Generator
// ============================================================================
/**
 * Generate smart suggestions based on current HUD state.
 * Returns up to 2 most relevant suggestions.
 */
export function generateSuggestions(params) {
    const suggestions = [];
    const { contextPercent, axiom, sessionHealth, activeAgentCount, contextWarningThreshold } = params;
    // --- 上下文相关建议 ---
    if (contextPercent >= 90) {
        suggestions.push({
            command: '/compact',
            reason: `上下文已用 ${Math.round(contextPercent)}%，接近上限`,
            priority: 'high',
        });
    }
    else if (contextPercent >= contextWarningThreshold) {
        suggestions.push({
            command: '/compact',
            reason: `上下文已用 ${Math.round(contextPercent)}%，建议压缩`,
            priority: 'medium',
        });
    }
    // --- Axiom 状态相关建议 ---
    if (axiom) {
        const status = axiom.status.toUpperCase();
        if (status === 'BLOCKED') {
            suggestions.push({
                command: '/ax-analyze-error',
                reason: '任务已阻塞，需要错误分析',
                priority: 'high',
            });
        }
        if (status === 'IDLE' && axiom.learningQueueCount > 0) {
            const prio = axiom.learningQueueTopPriority;
            const isUrgent = prio === 'P0' || prio === 'P1';
            suggestions.push({
                command: '/ax-evolve',
                reason: `学习队列有 ${axiom.learningQueueCount} 条待处理${isUrgent ? `（${prio} 优先）` : ''}`,
                priority: isUrgent ? 'high' : 'medium',
            });
        }
        if (status === 'EXECUTING' && activeAgentCount === 0) {
            suggestions.push({
                command: '/ax-status',
                reason: '任务执行中但无活跃 Agent，检查状态',
                priority: 'medium',
            });
        }
        if (status === 'IDLE' && axiom.inProgressCount === 0 && axiom.pendingCount > 0) {
            suggestions.push({
                command: '/ax-implement',
                reason: `有 ${axiom.pendingCount} 个待办任务可执行`,
                priority: 'medium',
            });
        }
        // 任务完成后建议反思
        if (status === 'IDLE' && axiom.inProgressCount === 0 && axiom.pendingCount === 0 && axiom.currentGoal) {
            suggestions.push({
                command: '/ax-reflect',
                reason: '任务已完成，建议反思总结',
                priority: 'low',
            });
        }
    }
    // --- 会话健康相关建议 ---
    if (sessionHealth) {
        if (sessionHealth.health === 'critical' && sessionHealth.durationMinutes > 120) {
            suggestions.push({
                command: '/ax-suspend',
                reason: `会话已持续 ${sessionHealth.durationMinutes} 分钟，建议保存状态`,
                priority: 'medium',
            });
        }
        if (sessionHealth.sessionCost !== undefined && sessionHealth.sessionCost > 4.0) {
            suggestions.push({
                command: '/ax-suspend',
                reason: `费用已达 $${sessionHealth.sessionCost.toFixed(2)}，建议保存并新开会话`,
                priority: 'high',
            });
        }
    }
    // 按优先级排序，取前2条
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return suggestions.slice(0, 2);
}
// ============================================================================
// Renderer
// ============================================================================
/**
 * Render smart suggestions line.
 *
 * Format: 💡 建议: /ax-evolve（学习队列有3条待处理）
 */
export function renderSuggestions(suggestions) {
    if (suggestions.length === 0)
        return null;
    const parts = suggestions.map(s => {
        const cmdColor = s.priority === 'high' ? YELLOW : CYAN;
        return `${cmdColor}${BOLD}${s.command}${RESET}${DIM}（${s.reason}）${RESET}`;
    });
    return `💡 建议: ${parts.join(`  ${DIM}|${RESET}  `)}`;
}
//# sourceMappingURL=suggestions.js.map