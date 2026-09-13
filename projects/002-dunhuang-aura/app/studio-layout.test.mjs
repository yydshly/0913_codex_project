import test from 'node:test';
import assert from 'node:assert/strict';
import { formats, layout, contain, wrapText } from './studio-layout.mjs';

test('all export formats keep text and product areas separate and inside canvas', () => {
  for (const mode of ['product', 'screen']) for (const { width, height } of formats) {
    const { text, product } = layout(width, height, mode);
    for (const box of [text, product]) {
      assert.ok(box.x >= 0 && box.y >= 0);
      assert.ok(box.x + box.width <= width && box.y + box.height <= height);
    }
    assert.ok(text.x + text.width <= product.x || text.y + text.height + height * .02 <= product.y);
  }
});

test('wide, tall and square source products preserve aspect ratio without cropping', () => {
  for (const format of formats) for (const [sw, sh] of [[100, 2000], [2400, 100], [800, 800]]) for (const scale of [.55, .9, 1]) {
    const area = layout(format.width, format.height).product;
    const result = contain(sw, sh, area, scale);
    assert.ok(Math.abs(result.width / result.height - sw / sh) < .000001);
    assert.ok(result.x >= area.x - .000001 && result.y >= area.y - .000001);
    assert.ok(result.x + result.width <= area.x + area.width + .000001);
    assert.ok(result.y + result.height <= area.y + area.height + .000001);
  }
});

test('text wrapping preserves exact characters, explicit line breaks and emoji', () => {
  const measure = value => Array.from(value).length * 10;
  const input = '春日茶事🌿上新';
  const lines = wrapText(input, 30, measure);
  assert.equal(lines.join(''), input);
  assert.ok(lines.every(line => measure(line) <= 30));
  assert.deepEqual(wrapText('春茶\n\n上新', 100, measure), ['春茶', '', '上新']);
});
