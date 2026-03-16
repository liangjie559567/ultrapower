} catch (error) {
  console.error(`[hook-bridge] Error in ${hookType}:`, error);
  // ... 错误处理，但没有清理状态
  return { continue: true };
}
