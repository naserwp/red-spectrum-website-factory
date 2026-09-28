// Executed in the browser. Exercise native lazy loading without changing loading attributes.
export async function settleImages(){
 const start=Date.now(),frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 await document.fonts?.ready;
 for(let y=0,steps=0;y<document.documentElement.scrollHeight&&steps<100&&Date.now()-start<12000;y+=Math.max(200,innerHeight*.75),steps++){
  scrollTo(0,y);await frame();
 }
 scrollTo(0,document.documentElement.scrollHeight);await frame();
 const deadline=Date.now()+10000;
 while([...document.images].some(i=>!i.complete)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));
 await Promise.race([Promise.all([...document.images].map(i=>i.complete&&i.naturalWidth?i.decode().catch(()=>{}):Promise.resolve())),new Promise(r=>setTimeout(r,1000))]);
 const failures=[...document.images].flatMap((i,index)=>{
  if(i.complete&&i.naturalWidth>0)return [];
  let asset='';try{const u=new URL(i.currentSrc||i.src,location.href);const p=u.pathname==='/_next/image'?u.searchParams.get('url'):u.pathname;if(/^\/customers\/[a-z0-9-]+\/[a-zA-Z0-9/_.-]+$/.test(p||''))asset=p;}catch{}
  return [{index,state:i.complete?'broken':'timeout',...(asset?{asset}: {})}];
 }).slice(0,20);
 scrollTo(0,0);await frame();return {failures};
}
