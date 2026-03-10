/**
 * CLI Autocomplete for Agent/Skill names
 * Provides Tab completion for ultrapower commands
 */
/**
 * Get all available agent names
 */
export declare function getAgentNames(): string[];
/**
 * Get all available skill names (from CLAUDE.md skill catalog)
 */
export declare function getSkillNames(): string[];
/**
 * Get completion suggestions for a partial input with fuzzy matching
 */
export declare function getCompletions(partial: string, type?: 'agent' | 'skill' | 'all'): string[];
/**
 * Generate shell completion script for bash
 */
export declare function generateBashCompletion(): string;
/**
 * Generate shell completion script for zsh
 */
export declare function generateZshCompletion(): string;
//# sourceMappingURL=autocomplete.d.ts.map