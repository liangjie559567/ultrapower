export interface Suggestion {
    error: string;
    category: string;
    solution: string;
    steps: string[];
}
export declare class SolutionSuggester {
    private matcher;
    suggest(error: string): Suggestion | null;
    private getSteps;
}
//# sourceMappingURL=solution-suggester.d.ts.map