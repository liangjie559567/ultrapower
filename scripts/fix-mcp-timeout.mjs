#!/usr/bin/env node
/**
 * Fix MCP Timeout Configuration
 *
 * 将 Codex/Gemini 超时从 25 秒增加到 120 秒
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const mcpConfigPath = join(process.cwd(), '.mcp.json');

try {
  const config = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));

  // 更新 Codex 超时
  if (config.mcpServers?.x?.env) {
    config.mcpServers.x.env.OMC_CODEX_TIMEOUT = '120000';
    console.log('✓ Codex timeout: 25s → 120s');
  }

  // 更新 Gemini 超时
  if (config.mcpServers?.g?.env) {
    config.mcpServers.g.env.OMC_GEMINI_TIMEOUT = '120000';
    console.log('✓ Gemini timeout: 25s → 120s');
  }

  writeFileSync(mcpConfigPath, JSON.stringify(config, null, 2));
  console.log('\n✅ MCP 超时配置已更新');
  console.log('重启 Claude Code 以应用更改');
} catch (error) {
  console.error('❌ 更新失败:', error.message);
  process.exit(1);
}
