// Injectable orchestration: tests exercise every failure boundary without real sends/deploys.
export async function runPipeline(job,ops){
 const step=async(stage,fn)=>{await ops.check();await ops.progress(stage);return fn();};
 try{
  const repo=await step('planning',()=>ops.checkout(job));
  const design=await step('generating',()=>ops.generate(job));
  const site=await step('applying_changes',()=>ops.apply(repo,job,design));
  const files=await step('validating',()=>ops.validate(repo,job));
  await step('building',()=>ops.build(repo));
  const qa=await step('qa_running',()=>ops.qa(repo,job,site));
  const deployment=await step('preview_deploying',()=>ops.deploy(repo,job,files));
  await step('preview_verifying',()=>ops.verify(deployment,job,site));
  await ops.check();await ops.complete({repo,files,qa,deployment,provider:design.provider});
  return 'ready_for_review';
 }catch(error){await ops.fail(error.message);return 'failed';}
}
