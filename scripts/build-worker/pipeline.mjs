// Injectable orchestration: tests exercise every failure boundary without real sends/deploys.
export async function runPipeline(job,ops){
 const step=async(stage,fn)=>{await ops.check();await ops.progress(stage);return fn();};
 try{
  let repo,design,site,files;
  if(job.resumeQa){
   await ops.check();({repo,design,site,files}=await ops.resume(job));
  }else{
   repo=await step('planning',()=>ops.checkout(job));
   design=await step('generating',()=>ops.generate(job));
   site=await step('applying_changes',()=>ops.apply(repo,job,design));
   files=await step('validating',()=>ops.validate(repo,job));
   await step('building',()=>ops.build(repo));
   if(ops.checkpoint)await ops.checkpoint(repo,job,files,design.provider);
  }
  const qa=await step('qa_running',()=>ops.qa(repo,job,site));
  const deployment=await step('preview_deploying',()=>ops.deploy(repo,job,files));
  await step('preview_verifying',()=>ops.verify(deployment,job,site));
  await ops.check();await ops.complete({repo,files,qa,deployment,provider:design.provider});
  return 'ready_for_review';
 }catch(error){await ops.fail(error.message,error.results);return 'failed';}
}
