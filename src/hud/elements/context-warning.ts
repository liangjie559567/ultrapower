/**
 * OMC HUD - Context Limit Warning Element
 *
 * Renders a status indicator when context usage exceeds the configured threshold.
 * Monitoring only — no compact suggestions or autoCompact triggers.
 */

import { RESET } from '../colors.js';

const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';

/**
 * Render a context usage status indicator.
 *
 * Returns a warning string when contextPercent >= threshold, null otherwise.
 *
 * @param contextPercent - Current context usage (0-100)
 * @param threshold - Configured threshold to trigger indicator (default 80)
 */
export function renderContextLimitWarning(
  contextPercent: number,
  threshold: number,
  _autoCompact?: boolean,
  _suppressedByCompact?: boolean
): string | null {
  const safePercent = Math.min(100, Math.max(0, Math.round(contextPercent)));

  if (safePercent < threshold) {
    return null;
  }

  const isCritical = safePercent >= 90;
  const color = isCritical ? RED : YELLOW;
  const icon = isCritical ? '!!' : '!';

  return `${color}${BOLD}[${icon}] ctx ${safePercent}%${RESET}`;
}
