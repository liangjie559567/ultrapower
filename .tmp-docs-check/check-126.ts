interface PipelineStage {
  agent: string;
  model?: string;
  input: string | PipelineOutput;  // 来自上一阶段的输出
  output?: PipelineOutput;
}
