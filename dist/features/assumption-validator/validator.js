export function validateAssumptions(assumptions) {
    const failed = assumptions.filter(a => !a.verified);
    return {
        valid: failed.length === 0,
        failedAssumptions: failed,
        shouldStop: failed.length > 0
    };
}
//# sourceMappingURL=validator.js.map