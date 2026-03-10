/**
 * User-friendly error system
 */

export { ErrorCategory, type FriendlyError, type ErrorContext } from './types.js';
export { classifyError, createFriendlyError } from './classifier.js';
export { suggestSpellingCorrection } from './spelling.js';
