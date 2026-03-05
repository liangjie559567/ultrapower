#!/usr/bin/env node
/**
 * Tool Name Migration Script
 *
 * Migrates legacy underscore tool names to ultrapower: prefix
 * Usage: node scripts/migrate-tool-names.js [directory]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const TOOL_MIGRATIONS = {
  'lsp_hover': 'ultrapower:lsp_hover',
  'lsp_goto_definition': 'ultrapower:lsp_goto_definition',
  'lsp_find_references': 'ultrapower:lsp_find_references',
  'lsp_document_symbols': 'ultrapower:lsp_document_symbols',
  'lsp_workspace_symbols': 'ultrapower:lsp_workspace_symbols',
  'lsp_diagnostics': 'ultrapower:lsp_diagnostics',
  'lsp_servers': 'ultrapower:lsp_servers',
  'lsp_prepare_rename': 'ultrapower:lsp_prepare_rename',
  'lsp_rename': 'ultrapower:lsp_rename',
  'lsp_code_actions': 'ultrapower:lsp_code_actions',
  'lsp_code_action_resolve': 'ultrapower:lsp_code_action_resolve',
  'lsp_diagnostics_directory': 'ultrapower:lsp_diagnostics_directory',
  'state_read': 'ultrapower:state_read',
  'state_write': 'ultrapower:state_write',
  'state_clear': 'ultrapower:state_clear',
  'state_list_active': 'ultrapower:state_list_active',
  'state_get_status': 'ultrapower:state_get_status',
  'notepad_read': 'ultrapower:notepad_read',
  'notepad_write_priority': 'ultrapower:notepad_write_priority',
  'notepad_write_working': 'ultrapower:notepad_write_working',
  'notepad_write_manual': 'ultrapower:notepad_write_manual',
  'notepad_prune': 'ultrapower:notepad_prune',
  'notepad_stats': 'ultrapower:notepad_stats',
  'project_memory_read': 'ultrapower:project_memory_read',
  'project_memory_write': 'ultrapower:project_memory_write',
  'project_memory_add_note': 'ultrapower:project_memory_add_note',
  'project_memory_add_directive': 'ultrapower:project_memory_add_directive',
  'ast_grep_search': 'ultrapower:ast_grep_search',
  'ast_grep_replace': 'ultrapower:ast_grep_replace',
  'python_repl': 'ultrapower:python_repl',
  'trace_timeline': 'ultrapower:trace_timeline',
  'trace_summary': 'ultrapower:trace_summary',
};

function migrateFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  let modified = content;
  let changeCount = 0;

  for (const [oldName, newName] of Object.entries(TOOL_MIGRATIONS)) {
    const patterns = [
      new RegExp(`(['"\`])${oldName}\\1`, 'g'),
      new RegExp(`name:\\s*(['"\`])${oldName}\\1`, 'g'),
    ];

    for (const pattern of patterns) {
      const matches = modified.match(pattern);
      if (matches) {
        modified = modified.replace(pattern, (match) => match.replace(oldName, newName));
        changeCount += matches.length;
      }
    }
  }

  if (changeCount > 0) {
    writeFileSync(filePath, modified, 'utf-8');
    console.log(`✓ ${filePath}: ${changeCount} changes`);
    return changeCount;
  }

  return 0;
}

function migrateDirectory(dir, extensions = ['.ts', '.js', '.json', '.md']) {
  let totalChanges = 0;
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        totalChanges += migrateDirectory(fullPath, extensions);
      }
    } else if (extensions.includes(extname(entry))) {
      totalChanges += migrateFile(fullPath);
    }
  }

  return totalChanges;
}

const targetDir = process.argv[2] || process.cwd();
console.log(`Migrating tool names in: ${targetDir}\n`);

const totalChanges = migrateDirectory(targetDir);
console.log(`\nMigration complete: ${totalChanges} total changes`);
