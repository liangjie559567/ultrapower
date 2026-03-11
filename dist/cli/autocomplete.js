/**
 * CLI Autocomplete for Agent/Skill names
 * Provides Tab completion for ultrapower commands
 */
import { getAgentDefinitions } from '../agents/definitions.js';
/**
 * Get all available agent names
 */
export function getAgentNames() {
    return Object.keys(getAgentDefinitions());
}
/**
 * Get all available skill names (from CLAUDE.md skill catalog)
 */
export function getSkillNames() {
    return [
        'autopilot', 'ralph', 'ultrawork', 'swarm', 'ultrapilot', 'team', 'pipeline',
        'ultraqa', 'plan', 'ralplan', 'sciomc', 'external-context', 'deepinit',
        'next-step-router', 'analyze', 'deepsearch', 'tdd', 'build-fix', 'code-review',
        'security-review', 'frontend-ui-ux', 'git-master', 'review', 'cancel', 'note',
        'learner', 'omc-setup', 'mcp-setup', 'hud', 'omc-doctor', 'omc-help', 'trace',
        'release', 'project-session-manager', 'skill', 'writer-memory', 'ralph-init',
        'learn-about-omc', 'configure-discord', 'configure-telegram'
    ];
}
/**
 * Get completion suggestions for a partial input with fuzzy matching
 */
export function getCompletions(partial, type = 'all') {
    const lower = partial.toLowerCase();
    const candidates = [];
    if (type === 'agent' || type === 'all') {
        candidates.push(...getAgentNames());
    }
    if (type === 'skill' || type === 'all') {
        candidates.push(...getSkillNames());
    }
    // Fuzzy matching: prefix match first, then contains match
    const prefixMatches = candidates.filter(name => name.toLowerCase().startsWith(lower));
    const fuzzyMatches = candidates.filter(name => !name.toLowerCase().startsWith(lower) && name.toLowerCase().includes(lower));
    return [...prefixMatches, ...fuzzyMatches].sort();
}
/**
 * Generate shell completion script for bash
 */
export function generateBashCompletion() {
    return `# ultrapower bash completion
_ultrapower_completion() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local prev="\${COMP_WORDS[COMP_CWORD-1]}"

  case "$prev" in
    agent|--agent|-a)
      COMPREPLY=($(compgen -W "${getAgentNames().join(' ')}" -- "$cur"))
      return 0
      ;;
    skill|--skill|-s)
      COMPREPLY=($(compgen -W "${getSkillNames().join(' ')}" -- "$cur"))
      return 0
      ;;
  esac

  COMPREPLY=($(compgen -W "run init config setup agent skill" -- "$cur"))
}

complete -F _ultrapower_completion ultrapower
complete -F _ultrapower_completion omc
`;
}
/**
 * Generate shell completion script for zsh
 */
export function generateZshCompletion() {
    return `#compdef ultrapower omc

_ultrapower() {
  local -a agents skills commands

  agents=(${getAgentNames().join(' ')})
  skills=(${getSkillNames().join(' ')})
  commands=(run init config setup agent skill)

  case "$words[2]" in
    agent|--agent|-a)
      _describe 'agent' agents
      ;;
    skill|--skill|-s)
      _describe 'skill' skills
      ;;
    *)
      _describe 'command' commands
      ;;
  esac
}

_ultrapower "$@"
`;
}
//# sourceMappingURL=autocomplete.js.map