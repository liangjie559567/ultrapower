const SENSITIVE_HOOKS = new Set([
  'permission-request',   // tool permission decisions — must not be tampered
  'setup-init',           // first-run initialization
  'setup-maintenance',    // ongoing maintenance ops
  'session-end',          // session teardown — requires sessionId + directory
]);
