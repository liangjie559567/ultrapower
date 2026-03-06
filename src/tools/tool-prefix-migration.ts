/**
 * Tool Prefix Migration System
 *
 * Handles migration from legacy underscore names to ultrapower: prefix
 * Provides deprecation warnings and dual registration
 */

import { GenericToolDefinition } from './index.js';

export interface DeprecationInfo {
  oldName: string;
  newName: string;
  deprecatedSince: string;
  removalVersion: string;
}

const DEPRECATION_MAP: Record<string, DeprecationInfo> = {
  // LSP Tools
  'lsp_hover': { oldName: 'lsp_hover', newName: 'ultrapower:lsp_hover', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_goto_definition': { oldName: 'lsp_goto_definition', newName: 'ultrapower:lsp_goto_definition', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_find_references': { oldName: 'lsp_find_references', newName: 'ultrapower:lsp_find_references', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_document_symbols': { oldName: 'lsp_document_symbols', newName: 'ultrapower:lsp_document_symbols', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_workspace_symbols': { oldName: 'lsp_workspace_symbols', newName: 'ultrapower:lsp_workspace_symbols', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_diagnostics': { oldName: 'lsp_diagnostics', newName: 'ultrapower:lsp_diagnostics', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_servers': { oldName: 'lsp_servers', newName: 'ultrapower:lsp_servers', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_prepare_rename': { oldName: 'lsp_prepare_rename', newName: 'ultrapower:lsp_prepare_rename', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_rename': { oldName: 'lsp_rename', newName: 'ultrapower:lsp_rename', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_code_actions': { oldName: 'lsp_code_actions', newName: 'ultrapower:lsp_code_actions', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_code_action_resolve': { oldName: 'lsp_code_action_resolve', newName: 'ultrapower:lsp_action_resolve', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_diagnostics_directory': { oldName: 'lsp_diagnostics_directory', newName: 'ultrapower:lsp_diag_dir', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },

  // State Tools
  'state_read': { oldName: 'state_read', newName: 'ultrapower:state_read', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'state_write': { oldName: 'state_write', newName: 'ultrapower:state_write', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'state_clear': { oldName: 'state_clear', newName: 'ultrapower:state_clear', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'state_list_active': { oldName: 'state_list_active', newName: 'ultrapower:state_list_active', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'state_get_status': { oldName: 'state_get_status', newName: 'ultrapower:state_get_status', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },

  // Notepad Tools
  'notepad_read': { oldName: 'notepad_read', newName: 'ultrapower:notepad_read', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'notepad_write_priority': { oldName: 'notepad_write_priority', newName: 'ultrapower:notepad_priority', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'notepad_write_working': { oldName: 'notepad_write_working', newName: 'ultrapower:notepad_working', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'notepad_write_manual': { oldName: 'notepad_write_manual', newName: 'ultrapower:notepad_manual', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'notepad_prune': { oldName: 'notepad_prune', newName: 'ultrapower:notepad_prune', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'notepad_stats': { oldName: 'notepad_stats', newName: 'ultrapower:notepad_stats', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },

  // Memory Tools
  'project_memory_read': { oldName: 'project_memory_read', newName: 'ultrapower:project_memory_read', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'project_memory_write': { oldName: 'project_memory_write', newName: 'ultrapower:project_memory_write', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'project_memory_add_note': { oldName: 'project_memory_add_note', newName: 'ultrapower:project_memory_add_note', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'project_memory_add_directive': { oldName: 'project_memory_add_directive', newName: 'ultrapower:project_memory_add_directive', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },

  // AST Tools
  'ast_grep_search': { oldName: 'ast_grep_search', newName: 'ultrapower:ast_grep_search', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'ast_grep_replace': { oldName: 'ast_grep_replace', newName: 'ultrapower:ast_grep_replace', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },

  // Python REPL
  'python_repl': { oldName: 'python_repl', newName: 'ultrapower:python_repl', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },

  // Trace Tools
  'trace_timeline': { oldName: 'trace_timeline', newName: 'ultrapower:trace_timeline', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'trace_summary': { oldName: 'trace_summary', newName: 'ultrapower:trace_summary', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },

  // New shortened names (5.5.28+)
  'lsp_action_resolve': { oldName: 'lsp_action_resolve', newName: 'ultrapower:lsp_action_resolve', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'lsp_diag_dir': { oldName: 'lsp_diag_dir', newName: 'ultrapower:lsp_diag_dir', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'notepad_priority': { oldName: 'notepad_priority', newName: 'ultrapower:notepad_priority', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'notepad_working': { oldName: 'notepad_working', newName: 'ultrapower:notepad_working', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'notepad_manual': { oldName: 'notepad_manual', newName: 'ultrapower:notepad_manual', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'parallel_detector': { oldName: 'parallel_detector', newName: 'ultrapower:parallel_detector', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'load_skills_local': { oldName: 'load_skills_local', newName: 'ultrapower:load_skills_local', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'load_skills_global': { oldName: 'load_skills_global', newName: 'ultrapower:load_skills_global', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
  'list_skills': { oldName: 'list_skills', newName: 'ultrapower:list_skills', deprecatedSince: '5.6.0', removalVersion: '6.0.0' },
};

export function createDeprecationWarning(info: DeprecationInfo): string {
  return `⚠️  DEPRECATED: Tool '${info.oldName}' is deprecated since v${info.deprecatedSince} and will be removed in v${info.removalVersion}.\n` +
         `Please use '${info.newName}' instead.\n\n`;
}

export function wrapWithDeprecation<T extends GenericToolDefinition>(tool: T): T {
  const deprecationInfo = DEPRECATION_MAP[tool.name];
  if (!deprecationInfo) return tool;

  const originalHandler = tool.handler;
  return {
    ...tool,
    handler: async (args: unknown) => {
      const result = await originalHandler(args);
      const warning = createDeprecationWarning(deprecationInfo);

      if (result.content && result.content[0]) {
        result.content[0].text = warning + result.content[0].text;
      }

      return result;
    }
  };
}

export function createPrefixedTool<T extends GenericToolDefinition>(tool: T): T {
  return {
    ...tool,
    name: `ultrapower:${tool.name}`
  };
}

export function registerToolWithBothNames<T extends GenericToolDefinition>(tool: T): T[] {
  const prefixedTool = createPrefixedTool(tool);
  const deprecatedTool = wrapWithDeprecation(tool);
  return [prefixedTool, deprecatedTool];
}
