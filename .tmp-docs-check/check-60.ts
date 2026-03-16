type TeamPhase =
  | 'team-plan'      // 规划阶段
  | 'team-prd'       // PRD 阶段
  | 'team-exec'      // 执行阶段
  | 'team-verify'    // 验证阶段
  | 'team-fix'       // 修复阶段
  | 'complete'
  | 'failed'
  | 'cancelled';
