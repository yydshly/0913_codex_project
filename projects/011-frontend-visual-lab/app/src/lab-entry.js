export function readLabEntry(search, effects, interactions) {
  const query = new URLSearchParams(search);
  const effect = Object.hasOwn(effects, query.get('effect')) ? query.get('effect') : 'glyphrain';
  const interaction = Object.hasOwn(interactions, query.get('interaction')) ? query.get('interaction') : 'nebula';
  const rawStage = query.get('stage');
  const stage = rawStage !== null && /^[0-3]$/.test(rawStage) ? Number(rawStage) : query.has('effect') && Object.hasOwn(effects, query.get('effect')) ? 3 : 2;
  return { stage, effect, interaction, effectGroup: effects[effect].group, scope: query.has('interaction') ? 'all' : 'latest' };
}
