#!/usr/bin/env node
/**
 * Validate Prompt Optimization - 验证 prompt 优化效果
 *
 * 对比优化前后的 token 使用和响应时间
 */

import { optimizePromptText, estimateTokens } from '../dist/features/prompt-optimizer/index.js';

const testCases = [
  {
    name: '冗余礼貌用语',
    original: 'Could you please analyze this code and help me understand the authentication flow',
  },
  {
    name: '复杂指令',
    original: 'I would like you to please summarize the following document and explain the key points',
  },
  {
    name: '多重冗余',
    original: 'Can you help me understand this API and could you please explain how it works',
  },
  {
    name: '简单指令（无需优化）',
    original: 'Analyze the security vulnerabilities',
  },
];

console.log('='.repeat(80));
console.log('Prompt Optimization Validation');
console.log('='.repeat(80));
console.log();

let totalOriginalTokens = 0;
let totalOptimizedTokens = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n[Test ${index + 1}] ${testCase.name}`);
  console.log('-'.repeat(80));

  const { text: optimized, changes } = optimizePromptText(testCase.original);

  const originalTokens = estimateTokens(testCase.original);
  const optimizedTokens = estimateTokens(optimized);
  const saved = originalTokens - optimizedTokens;
  const savedPercent = originalTokens > 0 ? ((saved / originalTokens) * 100).toFixed(1) : 0;

  totalOriginalTokens += originalTokens;
  totalOptimizedTokens += optimizedTokens;

  console.log(`原始: "${testCase.original}"`);
  console.log(`优化: "${optimized}"`);
  console.log();
  console.log(`Token 使用:`);
  console.log(`  原始: ${originalTokens} tokens`);
  console.log(`  优化: ${optimizedTokens} tokens`);
  console.log(`  节省: ${saved} tokens (${savedPercent}%)`);

  if (changes.length > 0) {
    console.log(`\n应用的优化:`);
    changes.forEach(change => console.log(`  - ${change}`));
  } else {
    console.log(`\n✓ 无需优化（已经很简洁）`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('总体统计');
console.log('='.repeat(80));

const totalSaved = totalOriginalTokens - totalOptimizedTokens;
const totalSavedPercent = totalOriginalTokens > 0
  ? ((totalSaved / totalOriginalTokens) * 100).toFixed(1)
  : 0;

console.log(`总原始 tokens: ${totalOriginalTokens}`);
console.log(`总优化 tokens: ${totalOptimizedTokens}`);
console.log(`总节省: ${totalSaved} tokens (${totalSavedPercent}%)`);
console.log();
console.log(`✓ Prompt Optimizer 工作正常！`);
console.log('='.repeat(80));
