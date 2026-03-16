interface AutopilotState {
  active: boolean;
  phase: 'expansion' | 'planning' | 'execution' | 'qa' | 'validation';
  iteration: number;
  max_iterations: number;
  originalIdea: string;

  expansion: {
    analyst_complete: boolean;
    architect_complete: boolean;
    spec_path: string | null;
  };

  planning: {
    plan_path: string | null;
    approved: boolean;
  };

  execution: {
    ralph_iterations: number;
    tasks_completed: number;
  };

  qa: {
    ultraqa_cycles: number;
    build_status: 'pending' | 'pass' | 'fail';
  };

  validation: {
    architects_spawned: number;
    final_verdict: 'pass' | 'fail' | 'pending';
  };
}
