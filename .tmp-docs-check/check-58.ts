export type AutopilotPhase =
  | 'expansion'    // 需求扩展
  | 'planning'     // 规划
  | 'execution'    // 执行
  | 'qa'           // QA 循环
  | 'validation'   // 验证
  | 'complete'     // 完成
  | 'failed';      // 失败

export interface AutopilotState {
  active: boolean;
  phase: AutopilotPhase;
  iteration: number;
  max_iterations: number;
  started_at: string;
  completed_at?: string;
  task_description: string;
  spec_path?: string;
  plan_path?: string;
  agent_count: number;
  expansion?: AutopilotExpansion;
  planning?: AutopilotPlanning;
  execution?: AutopilotExecution;
  qa?: AutopilotQA;
  validation?: AutopilotValidation;
}
