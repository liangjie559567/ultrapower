import type { HookInput, HookOutput } from "../bridge-types.js";
export declare function dispatchAskUserQuestionNotification(sessionId: string, directory: string, toolInput: unknown): void;
export declare const _notify: {
    askUserQuestion: typeof dispatchAskUserQuestionNotification;
};
export declare function processPreToolUse(input: HookInput): Promise<HookOutput>;
//# sourceMappingURL=pre-tool-use.d.ts.map