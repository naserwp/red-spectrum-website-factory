import "server-only";
import {database} from "./server";
import {getCustomerSite} from "@/lib/customers/registry";
import {getLocalBuildReceipt} from "./build-receipts";
import {slugError,previewUrls} from "./slug-rules";
export class SlugError extends Error {}
export async function setRequestSlug(requestId:string,slug:string,save:boolean,session:string,expectedSlug:string|null){
  const validation=slugError(slug);if(validation)throw new SlugError(validation);
  const client=await database().connect();
  try{
    await client.query("BEGIN");
    await client.query("SELECT set_config('webfactory.actor',$1,true)",["session:"+session.slice(0,12)]);
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",["factory-slug:"+slug]);
    const r=(await client.query("SELECT customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE",[requestId])).rows[0];
    if(!r)throw new SlugError("Request not found.");
    const w=(await client.query("SELECT stage,preview_url FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE",[requestId])).rows[0];
    const receipt=getLocalBuildReceipt(requestId);
    const conflict=await client.query("SELECT id FROM webfactory.requests WHERE customer_slug=$1 AND id<>$2 LIMIT 1",[slug,requestId]);
    const occupied=Boolean(conflict.rowCount || (getCustomerSite(slug)&&receipt?.customerSlug!==slug));
    const locked=Boolean((receipt&&receipt.customerSlug!==slug) || (w?.preview_url && (r.customer_slug || new URL(w.preview_url).pathname.slice(1))!==slug));
    if(save){
      if(r.customer_slug!==expectedSlug)throw new SlugError("The saved slug changed. Refresh before saving.");
      if(occupied)throw new SlugError("This slug is already assigned to another request or customer.");
      if(locked)throw new SlugError("This website already has files or a preview. A route migration requires separate approval.");
      if(r.customer_slug!==slug){
        // A new pre-build address invalidates prior build approval, not the approved brief's history.
        if(!receipt && w?.stage==='build_approved'){
          await client.query("UPDATE webfactory.build_workflows SET stage='draft',updated_at=NOW() WHERE request_id=$1",[requestId]);
          await client.query("UPDATE webfactory.requests SET status='reviewing' WHERE id=$1",[requestId]);
        }
        await client.query("UPDATE webfactory.requests SET customer_slug=$2,slug_confirmed_at=NOW(),updated_at=NOW() WHERE id=$1",[requestId,slug]);
      }
    }else{
      await client.query("INSERT INTO webfactory.request_actions(request_id,actor,action,status_before,status_after,customer_slug,preview_url,notes) VALUES($1,$2,'slug_availability_checked',$3,$3,$4,$5,$6)",[requestId,"session:"+session.slice(0,12),w?.stage || 'draft',slug,previewUrls(slug).primary,occupied?"Unavailable: conflict.":locked?"Unavailable: built route locked.":"Available at check time; Save Slug reserves it."]);
    }
    await client.query("COMMIT");return {available:!occupied&&!locked,saved:save,slug,urls:previewUrls(slug)};
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}
export async function getRequestActions(requestId:string){
  return (await database().query<{id:string;actor:string;action:string;status_before:string|null;status_after:string|null;customer_slug:string|null;preview_url:string|null;notes:string;created_at:string}>("SELECT id,actor,action,status_before,status_after,customer_slug,preview_url,notes,created_at FROM webfactory.request_actions WHERE request_id=$1 ORDER BY created_at DESC,id DESC LIMIT 100",[requestId])).rows;
}
