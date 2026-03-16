// 后台执行
const job = await ask_codex({
  agent_role: 'architect',
  prompt: '...',
  background: true
});

// 检查状态
const status = await check_job_status({ job_id: job.job_id });

// 等待完成
const result = await wait_for_job({ 
  job_id: job.job_id,
  timeout_ms: 300000 
});
