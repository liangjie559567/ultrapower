import type { HookInput, HookOutput, HookType } from "../bridge-types.js";
export type HookProcessor = (input: HookInput) => Promise<HookOutput>;
export declare class HookRegistry {
    private processors;
    register(hookType: HookType, processor: HookProcessor): void;
    get(hookType: HookType): HookProcessor | undefined;
    has(hookType: HookType): boolean;
}
export declare const registry: HookRegistry;
//# sourceMappingURL=HookRegistry.d.ts.map