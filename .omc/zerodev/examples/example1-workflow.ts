// ZeroDev 示例 1: 完整工作流
import { detectPlatform, extractRequirements } from '../../../src/agents/zerodev/requirement-clarifier';
import { matchTemplate, generateCode, checkQuality } from '../../../src/agents/zerodev/code-generator';

async function example1() {
  console.log('=== 示例 1: 完整工作流 ===\n');

  // 步骤 1: 识别平台
  const requirement = '我想做一个网站，用户可以登录和注册';
  const platform = detectPlatform(requirement);
  console.log(`平台: ${platform}`); // 'web'

  // 步骤 2: 提取需求
  const reqs = extractRequirements(requirement);
  console.log(`功能需求: ${reqs.functional.join(', ')}`);

  // 步骤 3: 匹配模板
  const template = matchTemplate('JWT 认证');
  console.log(`模板: ${template}`);

  // 步骤 4: 生成代码
  const code = generateCode(template, {
    className: 'AuthService',
    secretKey: 'your-secret-key'
  });
  console.log(`\n生成的代码:\n${code}`);

  // 步骤 5: 质量检查
  const quality = await checkQuality(code);
  console.log(`\n质量分数: ${quality.score}`);
  console.log(`错误: ${quality.errors.length}`);
  console.log(`警告: ${quality.warnings.length}`);
}

example1().catch(console.error);
