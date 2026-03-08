/**
 * OMC HUD - Output Sanitizer
 *
 * Sanitizes HUD output to prevent terminal rendering corruption
 * when Claude Code's Ink renderer is concurrently updating the display.
 *
 * Issue #346: Terminal rendering corruption during AI generation with HUD enabled.
 *
 * Root cause: Multi-line output containing ANSI escape sequences and
 * variable-width Unicode characters (progress bar blocks) can interfere
 * with Claude Code's terminal cursor positioning during active rendering.
 *
 * This module provides:
 * - Terminal control sequence stripping (preserving color/style codes)
 * - Unicode block character replacement with ASCII equivalents
 * - Line count enforcement (collapse to single line if needed)
 */
// Cached compiled regexes
const CSI_NON_SGR_REGEX = /\x1b\[\??[0-9;]*[A-LN-Za-ln-z]/g;
const OSC_REGEX = /\x1b\][^\x07]*\x07/g;
const SIMPLE_ESC_REGEX = /\x1b[^[\]]/g;
const UNICODE_BLOCKS_REGEX = /[█░▓▒]/g;
const LEADING_TRAILING_NEWLINES_REGEX = /^\n+|\n+$/g;
/**
 * Strip terminal control ANSI sequences while preserving color/style (SGR) codes.
 *
 * SGR (Select Graphic Rendition) sequences end with 'm' and control text appearance:
 * - Colors: \x1b[32m (green), \x1b[31m (red), etc.
 * - Styles: \x1b[1m (bold), \x1b[0m (reset), etc.
 *
 * Other CSI sequences are stripped as they can interfere with terminal rendering:
 * - Cursor positioning: \x1b[H, \x1b[10;20H
 * - Erase commands: \x1b[2J (clear screen), \x1b[K (erase line)
 * - Cursor movement: \x1b[A (up), \x1b[B (down), etc.
 * - Cursor visibility: \x1b[?25l (hide), \x1b[?25h (show)
 */
export function stripAnsi(text) {
    return text
        .replace(CSI_NON_SGR_REGEX, '') // Strip non-SGR CSI sequences
        .replace(OSC_REGEX, '') // Strip OSC sequences
        .replace(SIMPLE_ESC_REGEX, ''); // Strip simple escape sequences
}
const UNICODE_MAP = {
    '█': '#',
    '░': '-',
    '▓': '=',
    '▒': '-'
};
/**
 * Replace variable-width Unicode block characters with fixed-width ASCII equivalents.
 * Targets characters commonly used in progress bars that have inconsistent
 * terminal width across different terminal emulators.
 */
export function replaceUnicodeBlocks(text) {
    return text.replace(UNICODE_BLOCKS_REGEX, (match) => UNICODE_MAP[match] || match);
}
/**
 * Sanitize HUD output for safe terminal rendering.
 *
 * Processing steps:
 * 1. Strips terminal control sequences while preserving color/style SGR codes
 * 2. Replaces Unicode block characters with ASCII (prevents width miscalculation)
 * 3. Preserves multi-line output (newlines are kept for proper HUD rendering)
 * 4. Trims excessive whitespace within lines
 *
 * Note: Multi-line output is preserved to maintain HUD tree structure display.
 * The original single-line collapse was too aggressive and broke readability.
 *
 * @param output - Raw HUD output (may contain ANSI codes and newlines)
 * @returns Sanitized output safe for concurrent terminal rendering
 */
export function sanitizeOutput(output) {
    // Step 1: Strip terminal control sequences (preserving color/style SGR codes)
    let sanitized = stripAnsi(output);
    // Step 2: Replace variable-width Unicode with ASCII
    sanitized = replaceUnicodeBlocks(sanitized);
    // Step 3: Preserve multi-line output, just trim each line
    // Do NOT collapse to single line - HUD needs proper line breaks for tree display
    const lines = sanitized.split('\n');
    const trimmedLines = [];
    for (let i = 0; i < lines.length; i++) {
        trimmedLines.push(lines[i].trimEnd());
    }
    // Step 4: Remove leading/trailing empty lines
    return trimmedLines.join('\n').replace(LEADING_TRAILING_NEWLINES_REGEX, '');
}
//# sourceMappingURL=sanitize.js.map