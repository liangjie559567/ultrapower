/**
 * Gemini MCP Server - In-process MCP server for Google Gemini CLI integration
 *
 * Exposes `ask_gemini` tool via the Claude Agent SDK's createSdkMcpServer helper.
 * Tools will be available as mcp__g__ask_gemini
 *
 * Note: The standalone version (gemini-standalone-server.ts) is used for the
 * external-process .mcp.json registration with proper stdio transport.
 */

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from 'zod';
import {
  GEMINI_DEFAULT_MODEL,
  GEMINI_RECOMMENDED_ROLES,
  handleAskGemini
} from './gemini-core.js';
import { GEMINI_MODEL_FALLBACKS } from '../features/model-routing/external-model-policy.js';
import { handleWaitForJob, handleCheckJobStatus, handleKillJob, handleListJobs } from './job-management.js';
import type { AskGeminiArgs, WaitForJobArgs, CheckJobStatusArgs, KillJobArgs, ListJobsArgs } from './tool-types.js';

// Define the ask_gemini tool using the SDK tool() helper
const askGeminiTool = tool(
  "ask_gemini",
  `Send a prompt to Google Gemini CLI for design/implementation tasks. Gemini excels at frontend design review and implementation with its 1M token context window. Recommended roles: ${GEMINI_RECOMMENDED_ROLES.join(', ')}. Any valid OMC agent role is accepted. Fallback chain: ${GEMINI_MODEL_FALLBACKS.join(' → ')}. Requires Gemini CLI (npm install -g @google/gemini-cli).`,
  {
    agent_role: z.string().describe(`Required. Agent perspective for Gemini. Recommended: ${GEMINI_RECOMMENDED_ROLES.join(', ')}. Any valid OMC agent role is accepted.`),
    prompt: z.string().optional().describe("Inline prompt string. Alternative to prompt_file -- the prompt is auto-persisted to a file for audit trail. When used, output_file is optional (auto-generated if omitted) and the response is returned inline in the MCP result. If both prompt and prompt_file are provided, prompt_file takes precedence."),
    prompt_file: z.string().optional().describe("Path to file containing the prompt. A defined (non-undefined) `prompt_file` value selects file mode; `prompt_file` must be a non-empty string when used. Passing null or non-string values triggers file-mode validation (not inline fallback)."),
    output_file: z.string().optional().describe("Required for file-based mode (prompt_file). Auto-generated in inline mode (prompt). Response content is returned inline only when using prompt parameter."),
    files: z.array(z.string()).optional().describe("File paths to include as context (contents will be prepended to prompt)"),
    model: z.string().optional().describe(`Gemini model to use (default: ${GEMINI_DEFAULT_MODEL}). Set OMC_GEMINI_DEFAULT_MODEL env var to change default. Auto-fallback chain: ${GEMINI_MODEL_FALLBACKS.join(' → ')}.`),
    background: z.boolean().optional().describe("Run in background (non-blocking). Returns immediately with job metadata and file paths. Check response file for completion. Not available with inline prompt."),
    working_directory: z.string().optional().describe("Working directory for path resolution and CLI execution. Defaults to process.cwd()."),
  },
  async (args: AskGeminiArgs) => {
    return handleAskGemini(args);
  }
);

const waitForJobTool = tool(
  "wait_for_job",
  "Block (poll) until a background job reaches a terminal state (completed, failed, or timeout). Uses exponential backoff. Returns the response preview on success.",
  {
    job_id: z.string().describe("The job ID returned when the background job was dispatched."),
    timeout_ms: z.number().optional().describe("Maximum time to wait in milliseconds (default: 3600000, max: 3600000)."),
  },
  async (args: WaitForJobArgs) => {
    return handleWaitForJob('gemini', args.job_id, args.timeout_ms);
  }
);

const checkJobStatusTool = tool(
  "check_job_status",
  "Non-blocking status check for a background job. Returns current status, metadata, and error information if available.",
  {
    job_id: z.string().describe("The job ID returned when the background job was dispatched."),
  },
  async (args: CheckJobStatusArgs) => {
    return handleCheckJobStatus('gemini', args.job_id);
  }
);

const killJobTool = tool(
  "kill_job",
  "Send a signal to a running background job. Marks the job as failed. Only works on jobs in spawned or running state.",
  {
    job_id: z.string().describe("The job ID of the running job to kill."),
    signal: z.enum(['SIGTERM', 'SIGINT']).optional().describe("The signal to send (default: SIGTERM). Only SIGTERM and SIGINT are allowed."),
  },
  async (args: KillJobArgs) => {
    return handleKillJob('gemini', args.job_id, (args.signal as NodeJS.Signals) || undefined);
  }
);

const listJobsTool = tool(
  "list_jobs",
  "List background jobs for this provider. Filter by status and limit results. Results sorted newest first.",
  {
    status_filter: z.enum(['active', 'completed', 'failed', 'all']).optional().describe("Filter jobs by status (default: active)."),
    limit: z.number().optional().describe("Maximum number of jobs to return (default: 50)."),
  },
  async (args: ListJobsArgs) => {
    return handleListJobs('gemini', args.status_filter, args.limit);
  }
);

/**
 * In-process MCP server exposing Gemini CLI integration
 *
 * Tools will be available as mcp__g__ask_gemini
 */
export const geminiMcpServer = createSdkMcpServer({
  name: "g",
  version: "1.0.0",
  tools: [askGeminiTool, waitForJobTool, checkJobStatusTool, killJobTool, listJobsTool]
});

/**
 * Tool names for allowedTools configuration
 */
export const geminiToolNames = ['ask_gemini', 'wait_for_job', 'check_job_status', 'kill_job', 'list_jobs'];
