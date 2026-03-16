// Mutual exclusion: team beats autopilot
if (types.includes('team') && types.includes('autopilot')) {
  types = types.filter(t => t !== 'autopilot');
}
