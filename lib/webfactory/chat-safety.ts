export function redactChatText(text: string, secretValues: string[]) {
  let safe = text;
  for (const secret of secretValues.filter(x=>x.length >= 6).sort((a,b)=>b.length-a.length)) safe=safe.split(secret).join("[REDACTED]");
  return safe.replace(/postgres(?:ql)?:\/\/[^\s"'<>]+/gi,"[REDACTED DATABASE URL]")
    .replace(/\b(?:sk-|SG\.)[A-Za-z0-9_.-]{12,}/g,"[REDACTED KEY]")
    .replace(/\b[A-Z][A-Z0-9_]*(?:API_KEY|SECRET|PASSWORD|DATABASE_URL)\b/g,"[REDACTED CONFIG NAME]");
}
export function requestsProtectedInformation(text: string) {
  return /(?:reveal|print|show|repeat|dump|expose|what|give|list)[\s\S]{0,80}(?:system[\s\S]{0,12}(?:prompt|instruction)|hidden[\s\S]{0,12}(?:prompt|instruction)|api.?key|password|secret|environment variable|database[\s\S]{0,5}(?:url|credential))/i.test(text);
}
