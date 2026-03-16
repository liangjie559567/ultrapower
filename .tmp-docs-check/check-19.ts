function resolveSessionStatePath(
  mode: string,
  sessionId: string,
  directory: string
): string {
  return `${directory}/.omc/state/sessions/${sessionId}/${mode}-state.json`;
}
