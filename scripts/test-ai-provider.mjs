import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { z } from "zod";
import * as schema from "../lib/webfactory/brief-schema.ts";

// Isolated provider tests: transpile the real server module, stub network only in this test process.
const source = await readFile(new URL("../lib/webfactory/ai-provider.ts", import.meta.url),"utf8");
const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const testModule = { exports: {} };
new Function("require","module","exports",code)(name=>{
  if(name==="server-only") return {};
  if(name==="zod") return {z};
  if(name==="./brief-schema") return schema;
  throw new Error("Unexpected import");
},testModule,testModule.exports);
const generate = testModule.exports.generateStructuredBrief;
delete process.env.OPENAI_API_KEY;
let calls=0;
globalThis.fetch=async()=>{calls++;throw Error("Unexpected call");};
await assert.rejects(()=>generate({business:"QA",industry:"QA",website:"",details:"QA"},"qa"),/unavailable/);
assert.equal(calls,0);
process.env.OPENAI_API_KEY="synthetic-test-key-not-real";
globalThis.fetch=async(_url,options)=>{
  calls++;
  const body=JSON.parse(options.body);
  assert.equal(body.store,false);
  assert.equal(body.text.format.strict,true);
  assert.equal(body.text.format.type,"json_schema");
  return new Response(JSON.stringify({status:"completed",output:[{type:"message",content:[{type:"output_text",text:"{}"}]}]}),{status:200});
};
await assert.rejects(()=>generate({business:"QA",industry:"QA",website:"",details:"QA"},"qa"));
globalThis.fetch=async()=>new Response("",{status:429});
await assert.rejects(()=>generate({business:"QA",industry:"QA",website:"",details:"QA"},"qa"),/rate_limited/);
globalThis.fetch=async()=>new Response(JSON.stringify({status:"incomplete",output:[]}),{status:200});
await assert.rejects(()=>generate({business:"QA",industry:"QA",website:"",details:"QA"},"qa"),/incomplete/);
console.log("Provider missing-key, strict schema, invalid output, rate-limit and incomplete-response tests PASS; no external calls.");
