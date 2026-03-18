// ZeroDev 示例 5: 并发调用
import { generateCode } from '../../../src/agents/zerodev/code-generator';

async function example5() {
  console.log('=== 示例 5: 并发调用 ===\n');

  // 并发生成 10 个不同的类
  const promises = Array.from({ length: 10 }, (_, i) =>
    generateCode('auth/jwt-auth.ts.template', {
      className: `AuthService${i}`
    })
  );

  const start = Date.now();
  const results = await Promise.all(promises);
  const duration = Date.now() - start;

  console.log(`并发生成 ${results.length} 个类`);
  console.log(`总耗时: ${duration}ms`);
  console.log(`平均耗时: ${(duration / results.length).toFixed(2)}ms/个`);

  // 验证每个结果都包含正确的类名
  results.forEach((code, i) => {
    const hasClassName = code.includes(`AuthService${i}`);
    console.log(`  AuthService${i}: ${hasClassName ? '✓' : '✗'}`);
  });
}

example5().catch(console.error);
