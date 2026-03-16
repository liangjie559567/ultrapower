export interface RalphLoopState {
  active: boolean;
  iteration: number;
  max_iterations: number;
  started_at: string;
  task_description: string;
  prd_path?: string;
  progress_path?: string;
  current_story_id?: string;
  linked_ultrawork?: string;
  linked_team?: string;
}
