import test from 'node:test';
import assert from 'node:assert/strict';
import { readLabEntry } from '../src/lab-entry.js';
const effects = { glyphrain: { group: 'latest' }, clouds: { group: 'atmosphere' } };
const interactions = { nebula: {}, flip: {} };
test('guide links select an effect and its visible group', () => {
  assert.deepEqual(readLabEntry('?effect=clouds', effects, interactions), { stage: 3, effect: 'clouds', effectGroup: 'atmosphere', interaction: 'nebula', scope: 'latest' });
});
test('basic stage zero and full interaction catalogue can be directly opened', () => {
  assert.equal(readLabEntry('?stage=0', effects, interactions).stage, 0);
  assert.equal(readLabEntry('?interaction=flip', effects, interactions).scope, 'all');
  assert.equal(readLabEntry('?interaction=flip', effects, interactions).interaction, 'flip');
});
test('unknown values and prototype names fall back to available content', () => {
  assert.equal(readLabEntry('?effect=__proto__&stage=8', effects, interactions).effect, 'glyphrain');
  assert.equal(readLabEntry('?stage=&interaction=unknown', effects, interactions).stage, 2);
});
