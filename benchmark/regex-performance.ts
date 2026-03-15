import { sanitizeForKeywordDetection } from '../src/hooks/keyword-detector/index.js';

function benchmark() {
  const testCases = [
    { name: '10K chars', input: 'a'.repeat(10000) },
    { name: '50K chars', input: 'x'.repeat(50000) },
    { name: 'Nested 1K', input: '('.repeat(1000) + 'content' + ')'.repeat(1000) },
    { name: 'Nested 10K', input: '('.repeat(10000) + 'content' + ')'.repeat(10000) }
  ];

  console.log('ReDoS Protection Performance:');

  for (const { name, input } of testCases) {
    const start = Date.now();
    sanitizeForKeywordDetection(input);
    const duration = Date.now() - start;

    console.log(`  ${name}: ${duration}ms ${duration < 100 ? '✅' : '❌'}`);
  }

  console.log(`  Target: <100ms per operation`);
}

benchmark();
