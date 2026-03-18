import { describe, it, expect } from 'vitest';
import { selectTechStack } from '../../../src/agents/zerodev/tech-selector';
import { InputError, ValidationError } from '../../../src/agents/zerodev/types';

describe('tech-selector Agent', () => {
  describe('技术栈选择', () => {
    it('应该为 web 平台选择 React 技术栈', () => {
      const stack = selectTechStack('我想用 React 做网站', 'web');
      expect(stack.frontend).toContain('React');
      expect(stack.frontend).toContain('TypeScript');
    });

    it('应该为 mobile 平台选择 React Native', () => {
      const stack = selectTechStack('做个手机应用', 'mobile');
      expect(stack.frontend).toContain('React Native');
    });

    it('应该根据关键词选择后端技术', () => {
      const stack1 = selectTechStack('用 Node.js 做后端', 'api');
      expect(stack1.backend).toContain('Node.js');

      const stack2 = selectTechStack('用 Python 做后端', 'api');
      expect(stack2.backend).toContain('Python');
    });

    it('应该根据关键词选择数据库', () => {
      const stack1 = selectTechStack('用 MongoDB 存储', 'web');
      expect(stack1.database).toContain('MongoDB');

      const stack2 = selectTechStack('用 PostgreSQL', 'web');
      expect(stack2.database).toContain('PostgreSQL');
    });

    it('应该拒绝空输入', () => {
      expect(() => selectTechStack('', 'web')).toThrow(InputError);
    });

    it('应该拒绝超长输入', () => {
      expect(() => selectTechStack('a'.repeat(1001), 'web')).toThrow(ValidationError);
    });
  });
});
