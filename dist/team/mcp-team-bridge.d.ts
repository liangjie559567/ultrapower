/**
 * MCP Team Bridge Daemon
 *
 * Core bridge process that runs in a tmux session alongside a Codex/Gemini CLI.
 * Polls task files, builds prompts, spawns CLI processes, reports results.
 */
import { ChildProcess } from 'child_process';
import type { BridgeConfig, TaskFile, InboxMessage } from './types.js';
/**
 * Diff two file snapshots to find newly changed/created files.
 * Returns paths that are in `after` but not in `before` (new or newly modified files).
 */
declare function diffSnapshots(before: Set<string>, after: Set<string>): string[];
/**
 * Sanitize user-controlled content to prevent prompt injection.
 * - Truncates to maxLength
 * - Escapes XML-like delimiter tags that could confuse the prompt structure
 * @internal
 */
export declare function sanitizePromptContent(content: string, maxLength: number): string;
/** Build prompt for CLI from task + inbox messages */
declare function buildTaskPrompt(task: TaskFile, messages: InboxMessage[], config: BridgeConfig): string;
/** Read output summary (first 500 chars) */
declare function readOutputSummary(outputFile: string): string;
/** Parse Codex JSONL output to extract text responses */
declare function parseCodexOutput(output: string): string;
/**
 * Spawn a CLI process and return both the child handle and a result promise.
 * This allows the bridge to kill the child on shutdown while still awaiting the result.
 */
declare function spawnCliProcess(provider: 'codex' | 'gemini', prompt: string, model: string | undefined, cwd: string, timeoutMs: number): {
    child: ChildProcess;
    result: Promise<string>;
};
/** Main bridge daemon entry point */
export declare function runBridge(config: BridgeConfig): Promise<void>;
export { parseCodexOutput, buildTaskPrompt, diffSnapshots, readOutputSummary, spawnCliProcess };
//# sourceMappingURL=mcp-team-bridge.d.ts.map