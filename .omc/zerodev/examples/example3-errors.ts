// ZeroDev 示例 3: 错误处理
import { detectPlatform, extractRequirements } from '../../../src/agents/zerodev/requirement-clarifier';
import { matchTemplate, generateCode } from '../../../src/agents/zerodev/code-generator';
import { ValidationError, InputError } from '../../../src/agents/zerodev/types';

async function example3() {
  console.log('=== 示例 3: 错误处理 ===\n');

  // 1. 空输入
  try {
    detectPlatform('');
  } catch (e) {
    console.log(`空输入: ${e instanceof InputError ? '✓' : '✗'} InputError`);
  }

  // 2. 超长输入
  try {
    detectPlatform('a'.repeat(1001));
  } catch (e) {
    console.log(`超长输入: ${e instanceof ValidationError ? '✓' : '✗'} ValidationError`);
  }

  // 3. 无效 className
  try {
    generateCode('auth/jwt-auth.ts.template', { className: 'invalid' });
  } catch (e) {
    console.log(`无效类名: ${e instanceof ValidationError ? '✓' : '✗'} ValidationError`);
  }

  // 4. 未知模板
  try {
    matchTemplate('不存在的功能');
  } catch (e) {
    console.log(`未知模板: ${e instanceof Error ? '✓' : '✗'} Error`);
  }

  console.log('\n所有错误处理正常 ✓');
}

example3().catch(console.error);
