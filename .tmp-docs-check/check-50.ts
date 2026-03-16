export async function processHook(
  hookType: HookType,
  rawInput: HookInput,
): Promise<HookOutput> {
  // 1. 环境变量终止开关
  if (process.env.DISABLE_OMC === "1" || process.env.DISABLE_OMC === "true") {
    return { continue: true };
  }

  // 2. 跳过指定 Hook
  const skipHooks = getSkipHooks(); // 从 OMC_SKIP_HOOKS 环境变量读取
  if (skipHooks.includes(hookType)) {
    return { continue: true };
  }

  // 3. 标准化输入（snake_case -> camelCase）
  const input = normalizeHookInput(rawInput, hookType);

  try {
    // 4. 尝试延迟加载的 handler
    const handler = await loadHandler(hookType);
    if (handler) {
      return await handler(input);
    }

    // 5. 尝试路由表
    const routeHandler = HOOK_ROUTES[hookType];
    if (routeHandler) {
      return await routeHandler(input);
    }

    // 6. 未知 Hook 类型，继续执行
    return { continue: true };
  } catch (error) {
    const severity = HOOK_SEVERITY[hookType];

    // CRITICAL hooks 必须阻塞
    if (severity === HookSeverity.CRITICAL) {
      return { continue: false, reason: `Critical hook ${hookType} failed` };
    }

    // HIGH severity hooks 默认阻塞（可配置）
    if (severity === HookSeverity.HIGH) {
      const config = loadConfig();
      const allowHighFailure = config?.hooks?.allowHighSeverityFailure ?? false;
      if (!allowHighFailure) {
        return { continue: false, reason: `High-severity hook ${hookType} failed` };
      }
    }

    // LOW severity hooks 继续执行
    return { continue: true };
  }
}
