/**
 * OMC HUD - Axiom State Element
 *
 * Reads and renders Axiom system state from .omc/axiom/ directory.
 * Displays: current task status, learning queue, workflow metrics, knowledge base count.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { RESET } from '../colors.js';

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';

// ============================================================================
// Types
// ============================================================================

export interface AxiomState {
  /** Current state machine status: IDLE / EXECUTING / BLOCKED / PLANNING etc. */
  status: string;
  /** Current goal/task description */
  currentGoal: string | null;
  /** Number of pending items in learning queue */
  learningQueueCount: number;
  /** Highest priority in learning queue (P0/P1/P2/P3) */
  learningQueueTopPriority: string | null;
  /** Number of knowledge base entries */
  knowledgeBaseCount: number;
  /** Overall workflow success rate (0-100) */
  workflowSuccessRate: number | null;
  /** Number of in-progress tasks */
  inProgressCount: number;
  /** Number of pending tasks */
  pendingCount: number;
}

// ============================================================================
// Parsers
// ============================================================================

/**
 * Parse active_context.md to extract status and current goal.
 */
function parseActiveContext(content: string): Pick<AxiomState, 'status' | 'currentGoal' | 'inProgressCount' | 'pendingCount'> {
  let status = 'IDLE';
  let currentGoal: string | null = null;
  let inProgressCount = 0;
  let pendingCount = 0;

  // Extract status: "## Status: EXECUTING"
  const statusMatch = content.match(/^##\s+Status:\s*(\S+)/m);
  if (statusMatch) {
    status = statusMatch[1].trim();
  }

  // Extract current goal
  const goalMatch = content.match(/^##\s+Current Goal\s*\n([^\n#]+)/m);
  if (goalMatch) {
    const goal = goalMatch[1].trim();
    if (goal && goal !== '[填写当前目标]' && goal !== '') {
      currentGoal = goal;
    }
  }

  // Count in-progress tasks (lines starting with "- " under "### In Progress")
  const inProgressSection = content.match(/###\s+In Progress\s*\n([\s\S]*?)(?=###|\n##|$)/);
  if (inProgressSection) {
    const lines = inProgressSection[1].split('\n').filter(l => l.trim().startsWith('- ') && !l.includes('(none)'));
    inProgressCount = lines.length;
  }

  // Count pending tasks
  const pendingSection = content.match(/###\s+Pending\s*\n([\s\S]*?)(?=###|\n##|$)/);
  if (pendingSection) {
    const lines = pendingSection[1].split('\n').filter(l => l.trim().startsWith('- ') && !l.includes('(none)'));
    pendingCount = lines.length;
  }

  return { status, currentGoal, inProgressCount, pendingCount };
}

/**
 * Parse learning_queue.md to count pending items and find top priority.
 */
function parseLearningQueue(content: string): Pick<AxiomState, 'learningQueueCount' | 'learningQueueTopPriority'> {
  // Find all pending items (status: pending)
  const pendingMatches = content.match(/- 状态: pending/g);
  const learningQueueCount = pendingMatches ? pendingMatches.length : 0;

  // Find highest priority among pending items
  let topPriority: string | null = null;
  if (learningQueueCount > 0) {
    // Extract priority lines near "状态: pending" blocks
    const blocks = content.split(/###\s+LQ-/);
    const priorities: string[] = [];
    for (const block of blocks) {
      if (block.includes('状态: pending')) {
        const prioMatch = block.match(/- 优先级: (P\d)/);
        if (prioMatch) priorities.push(prioMatch[1]);
      }
    }
    // Sort P0 > P1 > P2 > P3
    priorities.sort();
    topPriority = priorities[0] || null;
  }

  return { learningQueueCount, learningQueueTopPriority: topPriority };
}

/**
 * Parse knowledge_base.md to count entries.
 */
function parseKnowledgeBase(content: string): Pick<AxiomState, 'knowledgeBaseCount'> {
  // Count entries starting with "### KB-" or "## " sections that are knowledge entries
  const kbMatches = content.match(/^###\s+KB-\d+/gm);
  if (kbMatches) {
    return { knowledgeBaseCount: kbMatches.length };
  }
  // Fallback: count h3 headers as entries
  const h3Matches = content.match(/^###\s+\S/gm);
  return { knowledgeBaseCount: h3Matches ? h3Matches.length : 0 };
}

/**
 * Parse workflow_metrics.md to compute overall success rate.
 */
function parseWorkflowMetrics(content: string): Pick<AxiomState, 'workflowSuccessRate'> {
  // Extract all "成功率: X%" values
  const rateMatches = content.match(/- 成功率: (\d+)%/g);
  if (!rateMatches || rateMatches.length === 0) {
    return { workflowSuccessRate: null };
  }

  const rates = rateMatches
    .map(m => parseInt(m.match(/(\d+)%/)?.[1] || '0', 10))
    .filter(r => r > 0);

  if (rates.length === 0) return { workflowSuccessRate: null };

  const avg = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  return { workflowSuccessRate: avg };
}

// ============================================================================
// Main Reader
// ============================================================================

/**
 * Read Axiom state from .omc/axiom/ directory.
 * Returns null if Axiom is not initialized.
 */
export function readAxiomStateForHud(directory: string): AxiomState | null {
  const axiomDir = join(directory, '.omc', 'axiom');
  if (!existsSync(axiomDir)) {
    return null;
  }

  let status = 'IDLE';
  let currentGoal: string | null = null;
  let inProgressCount = 0;
  let pendingCount = 0;
  let learningQueueCount = 0;
  let learningQueueTopPriority: string | null = null;
  let knowledgeBaseCount = 0;
  let workflowSuccessRate: number | null = null;

  // Parse active_context.md
  const contextFile = join(axiomDir, 'active_context.md');
  if (existsSync(contextFile)) {
    try {
      const content = readFileSync(contextFile, 'utf-8');
      const parsed = parseActiveContext(content);
      status = parsed.status;
      currentGoal = parsed.currentGoal;
      inProgressCount = parsed.inProgressCount;
      pendingCount = parsed.pendingCount;
    } catch { /* silent */ }
  }

  // Parse learning_queue.md
  const queueFile = join(axiomDir, 'evolution', 'learning_queue.md');
  if (existsSync(queueFile)) {
    try {
      const content = readFileSync(queueFile, 'utf-8');
      const parsed = parseLearningQueue(content);
      learningQueueCount = parsed.learningQueueCount;
      learningQueueTopPriority = parsed.learningQueueTopPriority;
    } catch { /* silent */ }
  }

  // Parse knowledge_base.md
  const kbFile = join(axiomDir, 'evolution', 'knowledge_base.md');
  if (existsSync(kbFile)) {
    try {
      const content = readFileSync(kbFile, 'utf-8');
      const parsed = parseKnowledgeBase(content);
      knowledgeBaseCount = parsed.knowledgeBaseCount;
    } catch { /* silent */ }
  }

  // Parse workflow_metrics.md
  const metricsFile = join(axiomDir, 'evolution', 'workflow_metrics.md');
  if (existsSync(metricsFile)) {
    try {
      const content = readFileSync(metricsFile, 'utf-8');
      const parsed = parseWorkflowMetrics(content);
      workflowSuccessRate = parsed.workflowSuccessRate;
    } catch { /* silent */ }
  }

  return {
    status,
    currentGoal,
    learningQueueCount,
    learningQueueTopPriority,
    knowledgeBaseCount,
    workflowSuccessRate,
    inProgressCount,
    pendingCount,
  };
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Get color for Axiom status.
 */
function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'EXECUTING': return CYAN;
    case 'PLANNING': return YELLOW;
    case 'BLOCKED': return RED;
    case 'IDLE': return GREEN;
    default: return DIM;
  }
}

/**
 * Get Chinese label for Axiom status.
 */
function getStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case 'EXECUTING': return '执行中';
    case 'PLANNING': return '规划中';
    case 'BLOCKED': return '已阻塞';
    case 'CONFIRMING': return '待确认';
    case 'ARCHIVING': return '归档中';
    case 'AUTO_FIX': return '自动修复';
    case 'IDLE': return '就绪';
    default: return status;
  }
}

/**
 * Get color for learning queue priority.
 */
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'P0': return RED;
    case 'P1': return YELLOW;
    case 'P2': return CYAN;
    default: return DIM;
  }
}

/**
 * Render Axiom state as a single status line.
 *
 * Format: Axiom:执行中 | 目标:HUD重设计 | 学习队列:3(P1) | 知识库:12条
 */
export function renderAxiom(axiom: AxiomState): string | null {
  const parts: string[] = [];

  // Status
  const statusColor = getStatusColor(axiom.status);
  const statusLabel = getStatusLabel(axiom.status);
  parts.push(`Axiom:${statusColor}${BOLD}${statusLabel}${RESET}`);

  // Current goal (truncated)
  if (axiom.currentGoal) {
    const truncated = axiom.currentGoal.length > 20
      ? axiom.currentGoal.slice(0, 18) + '…'
      : axiom.currentGoal;
    parts.push(`目标:${CYAN}${truncated}${RESET}`);
  }

  // Task counts (only if non-zero)
  if (axiom.inProgressCount > 0 || axiom.pendingCount > 0) {
    const taskStr = axiom.inProgressCount > 0
      ? `${CYAN}${axiom.inProgressCount}${RESET}进行/${DIM}${axiom.pendingCount}${RESET}待办`
      : `${DIM}${axiom.pendingCount}${RESET}待办`;
    parts.push(`任务:${taskStr}`);
  }

  // Learning queue
  if (axiom.learningQueueCount > 0) {
    const prioColor = axiom.learningQueueTopPriority
      ? getPriorityColor(axiom.learningQueueTopPriority)
      : DIM;
    const prioStr = axiom.learningQueueTopPriority
      ? `(${prioColor}${axiom.learningQueueTopPriority}${RESET})`
      : '';
    parts.push(`学习队列:${YELLOW}${axiom.learningQueueCount}${RESET}条${prioStr}`);
  }

  // Knowledge base count
  if (axiom.knowledgeBaseCount > 0) {
    parts.push(`知识库:${GREEN}${axiom.knowledgeBaseCount}${RESET}条`);
  }

  // Workflow success rate
  if (axiom.workflowSuccessRate !== null) {
    const rateColor = axiom.workflowSuccessRate >= 80 ? GREEN
      : axiom.workflowSuccessRate >= 60 ? YELLOW : RED;
    parts.push(`成功率:${rateColor}${axiom.workflowSuccessRate}%${RESET}`);
  }

  if (parts.length === 0) return null;
  return parts.join(` ${DIM}|${RESET} `);
}
