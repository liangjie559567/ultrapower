/**
 * Shared HUD configuration types
 * Extracted to break circular dependencies
 */

export interface HudThresholds {
  /** Context percentage that triggers warning color (default: 70) */
  contextWarning: number;
  /** Context percentage that triggers compact suggestion (default: 80) */
  contextCompactSuggestion: number;
  /** Context percentage that triggers critical color (default: 85) */
  contextCritical: number;
  /** Ralph iteration that triggers warning color (default: 7) */
  ralphWarning: number;
  /** Session cost ($) that triggers budget warning (default: 2.0) */
  budgetWarning: number;
  /** Session cost ($) that triggers budget critical alert (default: 5.0) */
  budgetCritical: number;
}
