export function generationModel(env, fallback) {
  const model=env.WEBFACTORY_AI_MODEL || fallback;
  if(!/^[a-zA-Z0-9._-]{1,80}$/.test(model))throw Error('CONFIGURATION_MISSING');
  const effort=env.WEBFACTORY_AI_REASONING_EFFORT || 'high';
  if(!['low','medium','high','xhigh','max'].includes(effort))throw Error('CONFIGURATION_MISSING');
  return {model,...(/^gpt-6(?:[.-]|$)/.test(model)?{reasoning:{effort}}:{})};
}
