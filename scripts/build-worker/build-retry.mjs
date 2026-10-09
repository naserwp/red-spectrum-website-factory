const recoverable=new Set(['exit_nonzero','permission_denied','terminated']);
// Only repeat a local compilation, never generation, pushes or deployment requests.
export async function compileWithRetry(build,check,{delay=ms=>new Promise(r=>setTimeout(r,ms)),onRetry=()=>{}}={}){
 for(let attempt=0;attempt<2;attempt++){
  await check();
  try{return await build();}catch(error){
   if(attempt===1||error.commandFailure?.category!=='build'||!recoverable.has(error.commandFailure.summary))throw error;
   onRetry(error.commandFailure.summary);
   await delay(2000);
  }
 }
}
