export function workerOptions(args) {
  let jobId;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--job-id') {
      if (jobId || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(args[i + 1] || '')) throw Error('Invalid job ID');
      jobId = args[++i];
    } else if (!['--once', '--check'].includes(args[i])) throw Error('Unknown worker option');
  }
  if (jobId && !args.includes('--once')) throw Error('Targeted recovery requires --once');
  return { jobId, once: args.includes('--once'), check: args.includes('--check') };
}

// Retry queue connectivity only; never replay generation, pushes or deployment.
export function pollDelay(failures, random = Math.random) {
  return Math.round(Math.min(60000, 1000 * 2 ** Math.min(failures, 6)) * (0.75 + random() * 0.25));
}
