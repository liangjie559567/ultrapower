export function assertValidMode(mode: unknown): ValidMode {
  if (!validateMode(mode)) {
    const raw = typeof mode === 'string' ? mode : String(mode);
    const display = raw.length > 50 ? `${raw.slice(0, 50)}...(truncated)` : raw;
    throw new Error(
      `Invalid mode: "${display}". Valid modes are: ${VALID_MODES.join(', ')}`
    );
  }
  return mode;
}
