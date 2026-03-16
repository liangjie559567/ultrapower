// Safe pattern — required in all path construction
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;

// Unsafe — never do this
const path = `.omc/state/${mode}-state.json`;  // path traversal risk
