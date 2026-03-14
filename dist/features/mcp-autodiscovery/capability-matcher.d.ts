import type { MCPServerDescriptor } from './types.js';
interface TaskRequirement {
    taskDescription: string;
    requiredCapabilities: string[];
}
interface Match {
    server: MCPServerDescriptor;
    confidence: number;
    matchedCapabilities: string[];
}
export declare class CapabilityMatcher {
    private registryClient;
    constructor();
    findMatches(requirement: TaskRequirement): Promise<Match[]>;
}
export {};
//# sourceMappingURL=capability-matcher.d.ts.map