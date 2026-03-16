import {
  checkPermission,
  grantPermission,
  denyPermission,
  clearPermissionCache,
  addSafePattern,
  getSafePatterns,
  shouldDelegate,
  getDelegationTarget,
  integrateWithPermissionSystem,
  processExternalToolPermission
} from './compatibility';

// 检查工具是否被允许
const check = checkPermission('my-tool:dangerous-op');
if (check.allowed) {
  console.log('Allowed:', check.reason);
} else if (check.askUser) {
  console.log('Ask user:', check.reason);
}

// 缓存用户决策
grantPermission('custom:tool', { mode: 'aggressive' });
denyPermission('risky:tool');
clearPermissionCache();

// 管理安全模式
const patterns = getSafePatterns();
addSafePattern({
  tool: 'my-safe-tool',
  pattern: /^\/safe\/path/,
  description: 'Only allows /safe/path',
  source: 'myapp'
});

// 检查工具是否应被委派
if (shouldDelegate('external:tool')) {
  const target = getDelegationTarget('external:tool');
  console.log(`Delegate to: ${target.type}/${target.target}`);
}

// 启动时与权限系统集成
integrateWithPermissionSystem();
