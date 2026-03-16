// 互斥规则
if (types.includes('cancel')) return ['cancel'];  // cancel 压制一切

if (types.includes('team') && types.includes('autopilot')) {
  types = types.filter(t => t !== 'autopilot');  // team 优先于 autopilot
}

// ultrapilot/swarm 自动激活 team
if (type === 'ultrapilot' || type === 'swarm') {
  detected.push({ type: 'team', ... });
}
