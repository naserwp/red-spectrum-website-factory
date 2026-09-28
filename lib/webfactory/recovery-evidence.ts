import {customerBuildPath} from './build-paths.ts';

export const recoveryEvidenceVersion='reviewed-immutable-artifact-v1' as const;
export type RecoveryEvidenceClass='WORKER_MUTABLE'|'RECOVERY_EVIDENCE_ONLY'|'PRIVATE_DELIVERY_EVIDENCE'|'FORBIDDEN';

const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const unsafePart=/^(?:\.env(?:\..*)?|\.git|\.ssh|\.aws|\.npmrc|\.netrc|credentials?(?:\..*)?|secrets?(?:\..*)?)$/i;
function safeRelative(file:string){
 return Boolean(file)&&file.length<=240&&!file.includes('\\')&&!file.includes('%')&&!file.startsWith('/')&&!/^[a-zA-Z]:/.test(file)&&file.split('/').every(part=>part&&part!=='.'&&part!=='..'&&!unsafePart.test(part));
}
function customerPrefixes(slug:string){const parts=slug.split('-');return [...new Set([slug,parts.length>1?parts.slice(0,2).join('-'):slug])];}

// This is a read-only evidence taxonomy. It does not grant worker write access.
export function classifyRecoveryEvidence(slug:string,file:string):RecoveryEvidenceClass{
 if(!slugPattern.test(slug)||!safeRelative(file))return 'FORBIDDEN';
 if(file.startsWith(`customers/${slug}/delivery/`)||file.startsWith(`customers/${slug}/myndy/`))return 'PRIVATE_DELIVERY_EVIDENCE';
 if(customerBuildPath(slug,file))return 'WORKER_MUTABLE';
 const prefixes=customerPrefixes(slug).map(value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 if(file==='components/generated-site.tsx')return 'RECOVERY_EVIDENCE_ONLY';
 if(new RegExp(`^components/(?:${prefixes})[a-z0-9-]*\\.(?:tsx|css)$`).test(file))return 'RECOVERY_EVIDENCE_ONLY';
 if(new RegExp(`^scripts/(?:test|verify)-(?:${prefixes})[a-z0-9-]*\\.mjs$`).test(file))return 'RECOVERY_EVIDENCE_ONLY';
 if(new RegExp(`^outputs/(?:${prefixes})[a-z0-9-]*/[a-zA-Z0-9._-]+\\.(?:json|png)$`).test(file))return 'RECOVERY_EVIDENCE_ONLY';
 return 'FORBIDDEN';
}

export type RecoveryEvidenceRecord={
 version:typeof recoveryEvidenceVersion;readOnly:true;requestId:string;customerSlug:string;revisionId:string;
 commit:string;artifactFingerprint:string;branch:string;files:{path:string;classification:Exclude<RecoveryEvidenceClass,'FORBIDDEN'>;blobSha:string}[];
 provenance:{kind:'existing-reviewed-immutable-artifact';repository:string;verifiedAt:string;newGeneration:false};
};

export function validRecoveryEvidenceRecord(value:unknown,context:{requestId:string;slug:string;revisionId:string;commit:string;branch:string;changedFiles:unknown}):value is RecoveryEvidenceRecord{
 if(!value||typeof value!=='object')return false;
 const record=value as RecoveryEvidenceRecord;
 if(record.version!==recoveryEvidenceVersion||record.readOnly!==true||record.requestId!==context.requestId||record.customerSlug!==context.slug||record.revisionId!==context.revisionId||record.commit!==context.commit||record.branch!==context.branch)return false;
 if(!/^[a-f0-9]{64}$/.test(record.artifactFingerprint)||record.provenance?.kind!=='existing-reviewed-immutable-artifact'||record.provenance?.repository!=='naserwp/red-spectrum-website-factory'||record.provenance?.newGeneration!==false||!Number.isFinite(Date.parse(record.provenance?.verifiedAt)))return false;
 if(!Array.isArray(record.files)||!record.files.length||record.files.length>100||!Array.isArray(context.changedFiles))return false;
 const paths=record.files.map(file=>file.path);
 if(JSON.stringify(paths)!==JSON.stringify(context.changedFiles)||new Set(paths).size!==paths.length||JSON.stringify(paths)!==JSON.stringify([...paths].sort()))return false;
 return record.files.every(file=>file.classification===classifyRecoveryEvidence(context.slug,file.path)&&/^[a-f0-9]{40}$/.test(file.blobSha));
}
