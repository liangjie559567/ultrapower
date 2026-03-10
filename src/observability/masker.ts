const patterns = {
  token: /\b(bearer|token|jwt)\s+[a-zA-Z0-9_.-]+/gi,
  password: /(password|passwd|pwd)[\s:=]+\S+/gi,
  apiKey: /\b[a-zA-Z0-9_-]{20,}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  path: /[C-Z]:\\[\w\s\\.-]+|\/(?:home|Users)\/[\w.-]+/g
};

export function mask(text: string, customPatterns?: Record<string, RegExp>): string {
  let masked = text;
  const allPatterns = { ...patterns, ...customPatterns };

  for (const [type, pattern] of Object.entries(allPatterns)) {
    masked = masked.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
  }

  return masked;
}

export function maskAttributes(attrs: Record<string, string | number>): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(attrs)) {
    result[key] = typeof value === 'string' ? mask(value) : value;
  }

  return result;
}
