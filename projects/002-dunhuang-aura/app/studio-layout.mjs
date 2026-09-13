export const formats = [
  { id: 'banner', name: '活动横幅', width: 1500, height: 600 },
  { id: 'portrait', name: '竖版海报', width: 1080, height: 1350 },
  { id: 'square', name: '方形主图', width: 1080, height: 1080 },
];

export function layout(width, height, mode = 'product') {
  const wide = width / height > 1.8;
  const margin = Math.round(width * .075);
  const plan = {
    margin,
    text: { x: margin, y: height * (wide ? .24 : .16), width: width * (wide ? .46 : .85), height: height * (wide ? .52 : .29) },
    product: wide
      ? { x: width * .60, y: height * .14, width: width * .31, height: height * .73 }
      : { x: width * .24, y: height * .49, width: width * .52, height: height * .42 },
    titleSize: Math.round(width * (wide ? .042 : .064)),
  };
  if (mode === 'screen') {
    plan.text.width = width * (wide ? .39 : .85);
    plan.text.height = height * (wide ? .46 : .29);
    plan.product = wide
      ? { x: width * .51, y: height * .23, width: width * .43, height: height * .62 }
      : { x: width * .075, y: height * .49, width: width * .85, height: height * .33 };
  }
  return plan;
}

export function contain(sourceWidth, sourceHeight, box, scale = 1) {
  const ratio = Math.min(box.width / sourceWidth, box.height / sourceHeight) * scale;
  const width = sourceWidth * ratio;
  const height = sourceHeight * ratio;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}

// Iterate Unicode code points so wrapping never splits a surrogate pair.
export function wrapText(text, maxWidth, measure) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const char of paragraph) {
      if (line && measure(line + char) > maxWidth) { lines.push(line); line = ''; }
      line += char;
    }
    lines.push(line);
  }
  return lines;
}
