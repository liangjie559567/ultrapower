import { describe, it, expect } from 'vitest';
import { matchTemplate, generateCode, checkQuality } from '../../../src/agents/zerodev/code-generator';
import { ValidationError, InputError } from '../../../src/agents/zerodev/types';
import { expectInputError, expectValidationError, expectCodeContains, expectValidClassName, expectTemplate, expectQualityScore } from './test-helpers';

describe('code-generator Agent', () => {
  describe('模板匹配引擎', () => {
    it('应该根据需求匹配正确的模板', () => expectTemplate('JWT 认证', 'auth/jwt-auth.ts.template'));
    it('应该支持模糊匹配', () => expect(matchTemplate('用户登录功能')).toContain('auth'));
    it('应该匹配 upload 模板', () => expectTemplate('文件上传功能', 'upload/s3-upload.ts.template'));
    it('应该匹配 payment 模板', () => expectTemplate('支付接口', 'payment/stripe-payment.ts.template'));
    it('应该匹配 notification 模板', () => expectTemplate('邮件通知', 'notification/email-notification.ts.template'));
    it('应该拒绝空需求', () => expectInputError(() => matchTemplate('')));
    it('应该拒绝未知需求', () => expect(() => matchTemplate('未知功能')).toThrow('No template found'));
    it('应该拒绝过长需求（>500字符）', () => expectValidationError(() => matchTemplate('a'.repeat(501))));
    it('应该过滤特殊字符', () => expectTemplate('JWT <script>alert(1)</script> 认证', 'auth/jwt-auth.ts.template'));
  });

  describe('代码生成', () => {
    it('应该生成可编译的 TypeScript 代码', () => {
      expectCodeContains('auth/jwt-auth.ts.template', { className: 'AuthService' }, 'export class AuthService', 'import');
    });

    it('应该替换模板变量', () => {
      expectCodeContains('auth/jwt-auth.ts.template', { className: 'MyAuth', secretKey: 'test-key' }, 'MyAuth', 'test-key');
    });

    it('应该生成 upload 代码', () => {
      expectCodeContains('upload/s3-upload.ts.template', { className: 'UploadService' }, 'UploadService', 'upload');
    });

    it('应该生成 payment 代码', () => {
      expectCodeContains('payment/stripe-payment.ts.template', { className: 'PaymentService' }, 'PaymentService', 'charge');
    });

    it('应该生成 notification 代码', () => {
      expectCodeContains('notification/email-notification.ts.template', { className: 'NotificationService' }, 'NotificationService', 'send');
    });

    it('应该拒绝空模板', () => {
      expectInputError(() => generateCode('', { className: 'Test' }));
    });

    it('应该拒绝缺少 className', () => {
      expectInputError(() => generateCode('auth/jwt-auth.ts.template', {}));
    });

    it('应该拒绝无效的 className 格式', () => {
      expectValidationError(() => generateCode('auth/jwt-auth.ts.template', { className: 'invalid' }));
      expectValidationError(() => generateCode('auth/jwt-auth.ts.template', { className: '123Invalid' }));
      expectValidationError(() => generateCode('auth/jwt-auth.ts.template', { className: 'invalid_name' }));
    });

    it('应该接受有效的 PascalCase className', () => {
      expectValidClassName('auth/jwt-auth.ts.template', 'ValidClassName');
    });

    it('应该拒绝过大的 vars 对象', () => {
      expectValidationError(() => generateCode('auth/jwt-auth.ts.template', { className: 'Test', data: 'x'.repeat(10001) }));
    });
  });

  describe('质量检查', () => {
    it('应该返回质量分数', async () => expectQualityScore('export class Test {}', 0));
    it('质量分数低于85应该触发警告', async () => expectQualityScore('var x=1;', 0, 84));

    it('应该使用 LSP 检测类型错误', async () => {
      await expectQualityScore(`
        export class Test {
          method(): string {
            return 123; // 类型错误
          }
        }
      `, 0, 99);
    });

    it('应该使用 LSP 检测语法错误', async () => {
      await expectQualityScore('export class Test { method() { return } }', 0, 99);
    });

    it('LSP 失败时应该降级到 legacy 检查', async () => {
      const originalLSP = (globalThis as any).mcp__plugin_ultrapower_t__lsp_diagnostics;
      (globalThis as any).mcp__plugin_ultrapower_t__lsp_diagnostics = undefined;
      await expectQualityScore('export class Test {}', 0);
      (globalThis as any).mcp__plugin_ultrapower_t__lsp_diagnostics = originalLSP;
    });

    it('质量检查性能应该小于 500ms', async () => {
      const start = Date.now();
      await checkQuality('export class Test { method() { return "ok"; } }');
      expect(Date.now() - start).toBeLessThan(500);
    });
  });

  describe('边界情况', () => {
    it('应该拒绝模板不存在的情况', () => {
      expect(() => matchTemplate('不存在的功能xyz123')).toThrow();
    });

    it('应该处理 vars 包含特殊字符', () => {
      expect(() => generateCode('auth/jwt-auth.ts.template', {
        className: 'TestClass',
        specialData: '<script>alert(1)</script>',
        unicode: '测试数据😀'
      })).not.toThrow();
    });

    it('应该拒绝生成的代码超长（vars 过大）', () => {
      expectValidationError(() => generateCode('auth/jwt-auth.ts.template', {
        className: 'TestClass',
        largeData: 'x'.repeat(50000)
      }));
    });

    it('应该处理并发调用', async () => {
      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => generateCode('auth/jwt-auth.ts.template', { className: `Test${i}` }))
      );
      expect(results).toHaveLength(10);
      results.forEach((code, i) => expect(code).toContain(`Test${i}`));
    });

    it('应该处理质量检查的空代码', async () => expectQualityScore('', 0, 50));
    it('应该处理质量检查的超长代码', async () => {
      await expectQualityScore('export class Test {\n' + '  method() {}\n'.repeat(1000) + '}', 0);
    });
  });
});

