// Read-only production audit. Provider output and connection strings never reach stdout.
import {readFile,unlink} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {command} from './build-worker/runtime.mjs';
const worker=parseEnv(await readFile('.env.worker.local','utf8'));
const file='.env.audit-build-'+randomUUID()+'.local';let client;
try{
 const linked=JSON.parse(await readFile('.vercel/project.json','utf8'));
 if(linked.projectId!=='prj_HV68RI67tT0LXTfEA1mguG6F3Ddo')throw Error('Wrong project');
 await command(process.execPath,[worker.VERCEL_CLI,'env','pull',file,'--environment=production','--yes'],process.cwd(),{},60000);
 const env=parseEnv(await readFile(file,'utf8'));
 const masked=k=>env[k]?.toLowerCase().includes('sensitive');
 const names=['WEBFACTORY_BUILD_EXECUTOR','WEBFACTORY_BUILD_WORKER_SECRET','VERCEL_TOKEN','LEADS_DATABASE_URL','WEBFACTORY_ADMIN_USER','WEBFACTORY_ADMIN_PASSWORD','WEBFACTORY_SESSION_SECRET'];
 console.log('Production variable presence: '+JSON.stringify(Object.fromEntries(names.map(k=>[k,Boolean(env[k])]))));
 console.log('Safety/configuration: '+JSON.stringify({executorMatches:env.WEBFACTORY_BUILD_EXECUTOR==='controlled-worker-v1',sharedSecretMatches:masked('WEBFACTORY_BUILD_WORKER_SECRET')?'masked':Boolean(env.WEBFACTORY_BUILD_WORKER_SECRET)&&env.WEBFACTORY_BUILD_WORKER_SECRET===worker.WEBFACTORY_BUILD_WORKER_SECRET,customerEmailsEnabled:env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED==='true',internalNotificationsEnabled:env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED==='true',adminSecretLengthValid:masked('WEBFACTORY_SESSION_SECRET')?'masked':(env.WEBFACTORY_SESSION_SECRET?.length||0)>=32}));
 if(masked('LEADS_DATABASE_URL')){console.log('Production migrations 0008/0009: UNVERIFIED (Vercel returns a sensitive-value placeholder, not a database credential).');process.exitCode=0;}else{
 if(!env.LEADS_DATABASE_URL)throw Error('Database unavailable');
 client=new pg.Client({connectionString:env.LEADS_DATABASE_URL,connectionTimeoutMillis:5000,query_timeout:10000});await client.connect();await client.query('BEGIN READ ONLY');
 const columns=(await client.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='webfactory' AND table_name IN ('website_build_jobs','website_build_job_events')")).rows;
 const cols=new Set(columns.filter(r=>r.table_name==='website_build_jobs').map(r=>r.column_name));
 const indexes=(await client.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='webfactory' AND tablename='website_build_jobs'")).rows;
 const constraints=(await client.query("SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid=to_regclass('webfactory.website_build_jobs')")).rows;
 const m8=['id','request_id','customer_slug','brief_id','approved_brief','submission_id','status','executor','changed_files','qa_result'].every(c=>cols.has(c))&&columns.some(c=>c.table_name==='website_build_job_events')&&indexes.some(i=>i.indexname==='website_build_request_history');
 const m9=['lease_hash','lease_expires_at','worker_id','cancel_requested','baseline_sha','result_sha','build_branch','provider_metadata'].every(c=>cols.has(c))&&['website_build_one_active_request','website_build_one_active_slug'].every(n=>indexes.some(i=>i.indexname===n&&i.indexdef.includes('claimed')))&&constraints.some(c=>c.definition.includes('claimed'));
 console.log('Production migration schema: '+JSON.stringify({migration0008:m8,migration0009:m9}));
 await client.query('ROLLBACK');
 }
}catch(error){console.error('Audit incomplete; safe category: '+(['ENOTFOUND','ECONNREFUSED','28P01','ERR_INVALID_URL'].includes(error?.code)?error.code:'configuration/access'));process.exitCode=1;}finally{await client?.end();await unlink(file).catch(()=>{});}
