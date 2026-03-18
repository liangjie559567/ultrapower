export interface ZeroDevAgentCapabilities {
    multiRoundDialogue?: boolean;
    contextMemory?: boolean;
    platformDetection?: boolean;
    contextAwareGeneration?: boolean;
    astManipulation?: boolean;
    codeQualityCheck?: boolean;
    techStackScoring?: boolean;
    dependencyAnalysis?: boolean;
    multiPlatformDeploy?: boolean;
    cicdIntegration?: boolean;
    monitoringSetup?: boolean;
    repoAnalysis?: boolean;
    architectureMapping?: boolean;
    componentExtraction?: boolean;
}
export interface ZeroDevAgentState {
    agentType: string;
    sessionId: string;
    createdAt: string;
    updatedAt: string;
    status: 'idle' | 'processing' | 'completed' | 'failed';
}
export interface RequirementClarifierState extends ZeroDevAgentState {
    conversationHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
    }>;
    platformType?: 'web' | 'mobile' | 'api' | 'plugin' | 'desktop';
    requirements: {
        functional: string[];
        nonFunctional: string[];
    };
    clarificationRound: number;
    maxRounds: number;
}
export interface CodeGeneratorState extends ZeroDevAgentState {
    targetPlatform: string;
    techStack: string[];
    generatedFiles: Array<{
        path: string;
        content: string;
        qualityScore: number;
    }>;
    templateUsed: string[];
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class InputError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=types.d.ts.map