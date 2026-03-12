import type { HookInput, HookOutput, HookType } from "../bridge-types.js";
type HandlerFunction = (input: HookInput) => Promise<HookOutput>;
export declare function loadHandler(hookType: HookType): Promise<HandlerFunction | null>;
export {};
//# sourceMappingURL=index.d.ts.map