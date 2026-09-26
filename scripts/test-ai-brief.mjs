import assert from "node:assert/strict";
import { briefSchema, briefJsonSchema, codexBuildPrompt, requestSlug } from "../lib/webfactory/brief-schema.ts";
const slug = requestSlug("Synthetic QA ../ Admin", "14682968-cf0a-4d34-a807-e17068e98f61");
assert.match(slug,/^[a-z0-9-]+$/);
assert.notEqual(slug,requestSlug("Synthetic QA ../ Admin","24682968-cf0a-4d34-a807-e17068e98f61"));
const brief = {
  customerSlug: slug, businessSummary:"Draft QA", brandDirection:"Draft", colorDirection:"Draft", logoConcept:"Draft",
  pages:["Home","Services","About","Contact","Privacy"].map(name=>({name,purpose:"Draft",sections:["Draft"]})),
  services:["Confirm services"],seo:{title:"Draft",metaDescription:"Draft"},hero:{heading:"Draft",body:"Draft"},
  ctaCopy:["Request information"],myndy:{agentName:"Draft",avatarBrief:"Draft",greeting:"Draft",context:"Draft",faqs:[],qualificationFlow:[],escalationRules:["Human review"]},
  imagePrompts:["Draft"],customerEmailDraft:"Unsent; site not built.",smsDraft:"Unsent",missingInformation:["Verify all facts"],verificationNotes:["Customer-provided only"],
};
assert.equal(briefSchema.safeParse(brief).success,true);
assert.equal(briefSchema.safeParse({...brief,pages:brief.pages.slice(1)}).success,false);
assert.equal(briefSchema.safeParse({...brief,pages:Array(5).fill(brief.pages[0])}).success,false);
assert.equal(briefSchema.safeParse({...brief,customerSlug:"../../admin"}).success,false);
assert.equal(briefSchema.safeParse({...brief,publish:true}).success,false);
assert.deepEqual(briefJsonSchema(slug).properties.customerSlug.enum,[slug]);
assert.match(codexBuildPrompt(brief,false),/DRAFT ONLY/);
assert.match(codexBuildPrompt(brief,true),/ADMIN APPROVED FOR BUILD/);
assert.match(codexBuildPrompt(brief,true),/Do not deploy/);
assert.match(codexBuildPrompt(brief,true),/untrusted business data/);
console.log("AI brief schema, required pages, slug isolation and Codex approval safeguards PASS.");
