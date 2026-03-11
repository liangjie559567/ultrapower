/**
 * Codex MCP Server - In-process MCP server for OpenAI Codex CLI integration
 *
 * Exposes `ask_codex` tool via the Claude Agent SDK's createSdkMcpServer helper.
 * Tools will be available as mcp__x__ask_codex
 *
 * Note: The standalone version (codex-standalone-server.ts) is used for the
 * external-process .mcp.json registration with proper stdio transport.
 */
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from 'zod';
import { handleAskCodex, CODEX_DEFAULT_MODEL, CODEX_RECOMMENDED_ROLES } from './codex-core.js';
import { handleWaitForJob, handleCheckJobStatus, handleKillJob, handleListJobs } from './job-management.js';
// Define the ask_codex tool using the SDK tool() helper
const askCodexTool = tool("ask_codex", `Send a prompt to OpenAI Codex CLI for analytical/planning tasks. Codex excels at architecture review, planning validation, critical analysis, and code/security review validation. Requires agent_role to specify the perspective. Recommended roles: ${CODEX_RECOMMENDED_ROLES.join(', ')}. Any valid OMC agent role is accepted. Requires Codex CLI (npm install -g @openai/codex).`, {
    agent_role: z.string().describe(`Required. Agent perspective for Codex. Recommended: ${CODEX_RECOMMENDED_ROLES.join(', ')}. Any valid OMC agent role is accepted.`),
    prompt: z.string().optional().describe("Inline prompt text. Alternative to prompt_file -- the tool auto-persists to a file for audit trail. Use for simpler invocations where file management is unnecessary. If both prompt and prompt_file are provided, prompt_file takes precedence."),
    prompt_file: z.string().optional().describe("Path to file containing the prompt. Required unless 'prompt' is provided inline. A defined (non-undefined) `prompt_file` value selects file mode; `prompt_file` must be a non-empty string when used. Passing null or non-string values triggers file-mode validation (not inline fallback)."),
    output_file: z.string().optional().describe("Required for file-based mode (prompt_file). Auto-generated in inline mode (prompt). Response content is returned inline only when using prompt parameter."),
    context_files: z.array(z.string()).optional().describe("File paths to include as context (contents will be prepended to prompt)"),
    model: z.string().optional().describe(`Codex model to use (default: ${CODEX_DEFAULT_MODEL}). Set OMC_CODEX_DEFAULT_MODEL env var to change default.`),
    reasoning_effort: z.string().optional().describe("Codex reasoning effort level: 'minimal', 'low', 'medium' (Codex CLI default), 'high', or 'xhigh' (model-dependent). Maps to Codex CLI -c model_reasoning_effort. If omitted, uses Codex CLI default from ~/.codex/config.toml."),
    background: z.boolean().optional().describe("Run in background (non-blocking). Returns immediately with job metadata and file paths. Check response file for completion. Not available with inline prompt."),
    working_directory: z.string().optional().describe("Working directory for path resolution and CLI execution. Defaults to process.cwd()."),
}, async (args) => {
    return handleAskCodex(args);
});
const waitForJobTool = tool("wait_for_job", "Block (poll) until a background job reaches a terminal state (completed, failed, or timeout). Uses exponential backoff. Returns the response preview on success.", {
    job_id: z.string().describe("The job ID returned when the background job was dispatched."),
    timeout_ms: z.number().optional().describe("Maximum time to wait in milliseconds (default: 3600000, max: 3600000)."),
}, async (args) => {
    return handleWaitForJob('codex', args.job_id, args.timeout_ms);
});
const checkJobStatusTool = tool("check_job_status", "Non-blocking status check for a background job. Returns current status, metadata, and error information if available.", {
    job_id: z.string().describe("The job ID returned when the background job was dispatched."),
}, async (args) => {
    return handleCheckJobStatus('codex', args.job_id);
});
const killJobTool = tool("kill_job", "Send a signal to a running background job. Marks the job as failed. Only works on jobs in spawned or running state.", {
    job_id: z.string().describe("The job ID of the running job to kill."),
    signal: z.enum(['SIGTERM', 'SIGINT']).optional().describe("The signal to send (default: SIGTERM). Only SIGTERM and SIGINT are allowed."),
}, async (args) => {
    return handleKillJob('codex', args.job_id, args.signal || undefined);
});
const listJobsTool = tool("list_jobs", "List background jobs for this provider. Filter by status and limit results. Results sorted newest first.", {
    status_filter: z.enum(['active', 'completed', 'failed', 'all']).optional().describe("Filter jobs by status (default: active)."),
    limit: z.number().optional().describe("Maximum number of jobs to return (default: 50)."),
}, async (args) => {
    return handleListJobs('codex', args.status_filter, args.limit);
});
/**
 * In-process MCP server exposing Codex CLI integration
 *
 * Tools will be available as mcp__x__ask_codex
 */
export const codexMcpServer = createSdkMcpServer({
    name: "x",
    version: "1.0.0",
    tools: [askCodexTool, waitForJobTool, checkJobStatusTool, killJobTool, listJobsTool]
});
/**
 * Tool names for allowedTools configuration
 */
export const codexToolNames = ['ask_codex', 'wait_for_job', 'check_job_status', 'kill_job', 'list_jobs'];
//# sourceMappingURL=codex-server.js.map