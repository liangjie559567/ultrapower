// ZeroDev 示例 4: 所有模板
import { matchTemplate, generateCode } from '../../../src/agents/zerodev/code-generator';

async function example4() {
  console.log('=== 示例 4: 所有模板 ===\n');

  const templates = [
    { name: 'JWT 认证', className: 'AuthService' },
    { name: 'REST CRUD', className: 'UserController' },
    { name: '文件上传', className: 'UploadService' },
    { name: '支付接口', className: 'PaymentService' },
    { name: '邮件通知', className: 'NotificationService' }
  ];

  for (const { name, className } of templates) {
    const template = matchTemplate(name);
    const code = generateCode(template, { className });
    console.log(`${name}:`);
    console.log(`  模板: ${template}`);
    console.log(`  类名: ${className}`);
    console.log(`  代码长度: ${code.length} 字符\n`);
  }
}

example4().catch(console.error);
