const handlerMap = {
    "keyword-detector": async () => (await import("./keyword-detector.js")).processKeywordDetector,
    "stop-continuation": async () => (await import("./stop-continuation.js")).processStopContinuation,
    "ralph": async () => (await import("./ralph.js")).processRalph,
    "persistent-mode": async () => (await import("./persistent-mode.js")).processPersistentMode,
    "session-start": async () => (await import("./session-start.js")).processSessionStart,
    "pre-tool-use": async () => (await import("./pre-tool-use.js")).processPreToolUse,
    "post-tool-use": async () => (await import("./post-tool-use.js")).processPostToolUse,
    "autopilot": async () => (await import("./autopilot.js")).processAutopilot,
};
export async function loadHandler(hookType) {
    const loader = handlerMap[hookType];
    if (!loader) {
        return null;
    }
    return await loader();
}
//# sourceMappingURL=index.js.map