import { trace, SpanStatusCode, context } from '@opentelemetry/api';
import { BasicTracerProvider, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { maskAttributes } from './masker.js';
const provider = new BasicTracerProvider({
    sampler: new TraceIdRatioBasedSampler(0.1)
});
trace.setGlobalTracerProvider(provider);
const tracer = trace.getTracer('ultrapower');
export function startSpan(name, attributes) {
    const span = tracer.startSpan(name);
    if (attributes) {
        span.setAttributes(maskAttributes(attributes));
    }
    return span;
}
export function endSpan(span, error) {
    if (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    }
    span.end();
}
export function withSpan(name, fn, attributes) {
    const span = startSpan(name, attributes);
    try {
        const result = context.with(trace.setSpan(context.active(), span), () => fn(span));
        endSpan(span);
        return result;
    }
    catch (error) {
        endSpan(span, error);
        throw error;
    }
}
export { trace, context };
//# sourceMappingURL=tracer.js.map