import { describe, it, expect } from 'vitest';
import { generateDeploymentConfig } from '../../../src/agents/zerodev/deployment-manager';
import { InputError } from '../../../src/agents/zerodev/types';

describe('deployment-manager Agent', () => {
  describe('部署配置生成', () => {
    it('应该为 Node.js 生成 Docker 配置', () => {
      const config = generateDeploymentConfig('api', ['Node.js', 'Express']);
      expect(config.type).toBe('docker');
      expect(config.config.image).toContain('node');
    });

    it('应该为 Python 生成 Docker 配置', () => {
      const config = generateDeploymentConfig('api', ['Python', 'FastAPI']);
      expect(config.type).toBe('docker');
      expect(config.config.image).toContain('python');
    });

    it('应该为非 API 平台生成 Serverless 配置', () => {
      const config = generateDeploymentConfig('mobile', ['React Native']);
      expect(config.type).toBe('serverless');
    });

    it('应该拒绝空平台', () => {
      expect(() => generateDeploymentConfig('', [])).toThrow(InputError);
    });
  });
});
