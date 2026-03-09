import { optimizePromptText, estimateTokens } from '../dist/features/prompt-optimizer/index.js';

const testCases = [
  "Could you please help me analyze this code and help me understand it?",
  "Please summarize the following documentation for the API endpoints.",
  "I would like you to review this pull request and provide feedback.",
  "Can you help me debug this function that's causing errors?",
  "Could you please refactor this component to use hooks?"
];

console.log('=== Prompt Optimizer Benchmark ===\n');

let totalOriginal = 0;
let totalOptimized = 0;

testCases.forEach((prompt, i) => {
  const original = estimateTokens(prompt);
  const { text: optimized } = optimizePromptText(prompt);
  const optimizedTokens = estimateTokens(optimized);
  const savings = ((original - optimizedTokens) / original * 100).toFixed(1);
  
  totalOriginal += original;
  totalOptimized += optimizedTokens;
  
  console.log(`Test ${i + 1}:`);
  console.log(`  Original:  "${prompt}"`);
  console.log(`  Optimized: "${optimized}"`);
  console.log(`  Tokens: ${original} → ${optimizedTokens} (${savings}% saved)\n`);
});

const totalSavings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
console.log(`Total: ${totalOriginal} → ${totalOptimized} tokens (${totalSavings}% saved)`);
