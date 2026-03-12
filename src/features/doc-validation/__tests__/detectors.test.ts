import { describe, it, expect } from 'vitest';
import { detectDependencies } from '../detectors.js';

describe('detectDependencies', () => {
  it('检测 npm 导入', () => {
    const code = `import React from 'react';\nimport { useState } from 'react';`;
    const deps = detectDependencies(code);
    expect(deps).toHaveLength(2);
    expect(deps[0]).toEqual({ type: 'npm', name: 'react' });
  });

  it('检测 API 调用', () => {
    const code = `fetch('https://api.example.com/users');\naxios('https://api.test.com/data');`;
    const deps = detectDependencies(code);
    expect(deps.length).toBeGreaterThanOrEqual(2);
    expect(deps[0].type).toBe('api');
    expect(deps[0].endpoint).toBeDefined();
  });

  it('检测数据库操作', () => {
    const code = `prisma.user.findMany();\nmongoose.Post.create();`;
    const deps = detectDependencies(code);
    expect(deps.length).toBeGreaterThanOrEqual(2);
    expect(deps[0].type).toBe('database');
    expect(deps[0].model).toBeDefined();
  });

  it('检测 GraphQL 查询', () => {
    const code = `gql\`query GetUser { user { id } }\``;
    const deps = detectDependencies(code);
    expect(deps.length).toBeGreaterThanOrEqual(1);
    expect(deps[0].type).toBe('graphql');
  });

  it('空代码返回空数组', () => {
    expect(detectDependencies('')).toEqual([]);
  });

  it('忽略相对路径导入', () => {
    const code = `import { foo } from './local';\nimport bar from '../parent';`;
    const deps = detectDependencies(code);
    expect(deps).toEqual([]);
  });
});
