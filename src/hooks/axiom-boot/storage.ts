/**
 * Axiom Boot Hook - Storage
 *
 * Reads and parses Axiom memory files from .omc/axiom/ directory.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { AxiomState, AxiomMemoryFiles } from './types.js';

const AXIOM_DIR = '.omc/axiom';

export function getAxiomDir(workingDirectory: string): string {
  return join(workingDirectory, AXIOM_DIR);
}

export function isAxiomEnabled(workingDirectory: string): boolean {
  return existsSync(getAxiomDir(workingDirectory));
}

export function getMemoryFilePaths(workingDirectory: string): AxiomMemoryFiles {
  const axiomDir = getAxiomDir(workingDirectory);
  return {
    activeContext: join(axiomDir, 'active_context.md'),
    projectDecisions: join(axiomDir, 'project_decisions.md'),
    userPreferences: join(axiomDir, 'user_preferences.md'),
    stateMachine: join(axiomDir, 'state_machine.md'),
  };
}

const MAX_AXIOM_FILE_CHARS = 8000;

function truncateAxiomFile(content: string, filePath: string): string {
  if (content.length <= MAX_AXIOM_FILE_CHARS) return content;
  return content.slice(0, MAX_AXIOM_FILE_CHARS) + `\n\n[截断，完整内容见: ${filePath}]`;
}

export function readActiveContext(workingDirectory: string): string | null {
  const paths = getMemoryFilePaths(workingDirectory);
  if (!existsSync(paths.activeContext)) return null;
  const raw = readFileSync(paths.activeContext, 'utf-8');
  return truncateAxiomFile(raw, paths.activeContext);
}

export function readActiveContextRaw(workingDirectory: string): string | null {
  const paths = getMemoryFilePaths(workingDirectory);
  if (!existsSync(paths.activeContext)) return null;
  return readFileSync(paths.activeContext, 'utf-8');
}

export function parseAxiomState(activeContextContent: string): AxiomState {
  const statusMatch = activeContextContent.match(/当前状态:\s*(IDLE|PLANNING|CONFIRMING|EXECUTING|AUTO_FIX|BLOCKED|ARCHIVING)/);
  const checkpointMatch = activeContextContent.match(/上次检查点:\s*(\S+)/);
  const taskMatch = activeContextContent.match(/活跃任务:\s*(\S+)/);

  return {
    status: (statusMatch?.[1] as AxiomState['status']) ?? 'IDLE',
    lastUpdated: new Date().toISOString(),
    lastCheckpoint: checkpointMatch?.[1] !== '无' ? checkpointMatch?.[1] : undefined,
    activeTaskId: taskMatch?.[1] !== '无' ? taskMatch?.[1] : undefined,
  };
}

export function readProjectDecisions(workingDirectory: string): string | null {
  const paths = getMemoryFilePaths(workingDirectory);
  if (!existsSync(paths.projectDecisions)) return null;
  return truncateAxiomFile(readFileSync(paths.projectDecisions, 'utf-8'), paths.projectDecisions);
}

export function readUserPreferences(workingDirectory: string): string | null {
  const paths = getMemoryFilePaths(workingDirectory);
  if (!existsSync(paths.userPreferences)) return null;
  return truncateAxiomFile(readFileSync(paths.userPreferences, 'utf-8'), paths.userPreferences);
}

const DEFAULT_CONSTITUTION_CONTENT = `# Axiom Constitution — 进化安全边界

> 本文件定义了进化引擎的不可逾越规则。任何自动修改必须通过 constitution-checker 验证。
> **本文件本身不可被自动修改。**

## 1. 不可修改文件
- constitution.md（本文件）
- src/hooks/bridge-normalize.ts
- src/lib/validateMode.ts
- package.json、tsconfig.json

## 2. 可修改范围
- Layer 2（自由修改）：.omc/axiom/evolution/*
- Layer 1（受审查修改）：agents/*.md、skills/*/SKILL.md（需用户确认）

## 3. 修改频率限制
- 每个 agent 提示词：最多每 7 天优化 1 次
- 冷启动保护：至少 10 个会话后才启用自动优化建议

## 4. 回滚要求
所有 Layer 1 修改必须通过 CI Gate：tsc --noEmit && npm run build && npm test
`;

export function ensureConstitution(workingDirectory: string): void {
  const axiomDir = getAxiomDir(workingDirectory);
  if (!existsSync(axiomDir)) return; // Axiom 未初始化，不创建

  const constitutionPath = join(axiomDir, 'constitution.md');
  if (existsSync(constitutionPath)) return; // 已存在，不覆盖

  try {
    writeFileSync(constitutionPath, DEFAULT_CONSTITUTION_CONTENT, 'utf-8');
  } catch {
    // 静默失败
  }
}
