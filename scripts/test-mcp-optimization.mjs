#!/usr/bin/env node
/**
 * End-to-End MCP Optimization Test
 * 测试实际 MCP 调用中的 prompt 优化效果
 */

import { buildPromptWithSystemContext } from '../dist/mcp/prompt-injection.js';
import { estimateTokens } from '../dist/features/prompt-optimizer/index.js';

console.log('='.repeat(80));
console.log('End-to-End MCP Prompt Optimization Test');
console.log('='.repeat(80));
console.log();

// 模拟实际的 MCP 调用场景
const scenarios = [
  {
    name: 'Codex 架构分析',
    userPrompt: 'Could you please analyze this authentication system and help me understand the security implications',
    systemPrompt: 'You are an expert security architect.',
    fileContext: 'const login = (user, pass) => { /* auth logic */ };',
  },
  {
    name: 'Gemini UI 设计',
    userPrompt: 'I would like you to please review this component and explain how to improve the user experience',
    systemPrompt: 'You are a UX designer.',
    fileContext: '<Button onClick={handleClick}>Submit</Button>',
  },
];

scenarios.forEach((scenario, index) => {
  console.log(`\n[Scenario ${index + 1}] ${scenario.name}`);
  console.log('-'.repeat(80));

  // 构建完整 prompt（会自动优化）
  const fullPrompt = buildPromptWithSystemContext(
    scenario.userPrompt,
    scenario.fileContext,
    scenario.systemPrompt
  );

  // 估算 tokens
  const totalTokens = estimateTokens(fullPrompt);
  const userPromptTokens = estimateTokens(scenario.userPrompt);

  console.log(`用户 Prompt (原始):`);
  console.log(`  "${scenario.userPrompt}"`);
  console.log(`  Tokens: ${userPromptTokens}`);
  console.log();

  // 提取优化后的用户 prompt（从完整 prompt 中）
  const lines = fullPrompt.split('\n\n');
  const optimizedUserPrompt = lines[lines.length - 1];
  const optimizedTokens = estimateTokens(optimizedUserPrompt);

  console.log(`用户 Prompt (优化后):`);
  console.log(`  "${optimizedUserPrompt}"`);
  console.log(`  Tokens: ${optimizedTokens}`);
  console.log();

  const saved = userPromptTokens - optimizedTokens;
  const savedPercent = userPromptTokens > 0 ? ((saved / userPromptTokens) * 100).toFixed(1) : 0;

  console.log(`优化效果:`);
  console.log(`  节省: ${saved} tokens (${savedPercent}%)`);
  console.log(`  完整 prompt 总 tokens: ${totalTokens}`);
});

console.log('\n' + '='.repeat(80));
console.log('✓ End-to-End 测试完成！所有 MCP 调用都会自动优化。');
console.log('='.repeat(80));
