export async function providerError(response){
 let code;
 try{code=(await response.json()).error?.code;}catch{/* Never expose raw provider responses. */}
 return new Error(['credit_balance_exhausted','insufficient_quota'].includes(code)?'PROVIDER_QUOTA_EXHAUSTED':'PROVIDER_FAILED');
}
