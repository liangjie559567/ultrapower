import { trace, Span, SpanStatusCode, context } from '@opentelemetry/api';
import { BasicTracerProvider, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { maskAttributes } from './masker.js';

const provider = new BasicTracerProvider({
  sampler: new TraceIdRatioBasedSampler(0.1)
});

trace.setGlobalTracerProvider(provider);

const tracer = trace.getTracer('ultrapower');

export function startSpan(name: string, attributes?: Record<string, string | number>): Span {
  const span = tracer.startSpan(name);
  if (attributes) {
    span.setAttributes(maskAttributes(attributes));
  }
  return span;
}

export function endSpan(span: Span, error?: Error): void {
  if (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  }
  span.end();
}

export function withSpan<T>(name: string, fn: (span: Span) => T, attributes?: Record<string, string | number>): T {
  const span = startSpan(name, attributes);
  try {
    const result = context.with(trace.setSpan(context.active(), span), () => fn(span));
    endSpan(span);
    return result;
  } catch (error) {
    endSpan(span, error as Error);
    throw error;
  }
}

export { trace, context };
