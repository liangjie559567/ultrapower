import { trace, Span, context } from '@opentelemetry/api';
export declare function startSpan(name: string, attributes?: Record<string, string | number>): Span;
export declare function endSpan(span: Span, error?: Error): void;
export declare function withSpan<T>(name: string, fn: (span: Span) => T, attributes?: Record<string, string | number>): T;
export { trace, context };
//# sourceMappingURL=tracer.d.ts.map