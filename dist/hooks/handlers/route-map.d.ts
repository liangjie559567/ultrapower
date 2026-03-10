/**
 * Hook routing map - maps hook types to their handlers
 */
import type { HookType, HookInput, HookOutput } from "../bridge-types.js";
type HookHandler = (input: HookInput) => Promise<HookOutput>;
export declare const HOOK_ROUTES: Partial<Record<HookType, HookHandler>>;
export {};
//# sourceMappingURL=route-map.d.ts.map