export interface ErrorPattern {
    name: string;
    regex: RegExp;
    category: string;
    solution: string;
}
export declare class ErrorMatcher {
    private patterns;
    match(error: string): ErrorPattern | null;
    matchAll(error: string): ErrorPattern[];
}
//# sourceMappingURL=error-matcher.d.ts.map