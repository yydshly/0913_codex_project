import { formats, layout, contain, wrapText } from './studio-layout.mjs';
import { cases } from './studio-cases.mjs';

const $ = id => document.getElementById(id);
const form = $('brief');
const font = '"Microsoft YaHei", "PingFang SC", sans-serif';
const palettes = {
  ink: { paper: '#e9eff4', ink: '#183d59', muted: '#415b70', hill: '#d3dfe9', near: '#bdcedb', accent: '#245d86' },
  mineral: { paper: '#f1eee3', ink: '#254f45', muted: '#4f655b', hill: '#c9d6bd', near: '#aabfa9', accent: '#a34c35' },
  cinnabar: { paper: '#efe2ce', ink: '#743a2e', muted: '#76594a', hill: '#dbb897', near: '#c79776', accent: '#974430' },
};
let product = null;
let isDemo = true;
let activeCase = cases[0];
let assetRequest = 0;
let revision = 0;
let frame = 0;
const cards = formats.map(format => {
  const article = document.createElement('article');
  article.className = 'preview-card';
  article.innerHTML = `<div class="preview-top"><h3>${format.name}</h3><span>${format.width} × ${format.height}</span></div><canvas width="${format.width}" height="${format.height}" role="img" aria-label="${format.name}实时预览">${format.name}预览需要支持 Canvas 的浏览器。</canvas><div class="preview-actions"><a class="primary download" hidden>下载 PNG</a><a class="open" target="_blank" rel="noopener" hidden>打开成品</a></div><p class="quality" role="status"></p>`;
  $('previews').append(article);
  return { ...format, canvas: article.querySelector('canvas'), download: article.querySelector('.download'), open: article.querySelector('.open'), quality: article.querySelector('.quality'), url: null };
});

function background(ctx, w, h, p) {
  ctx.fillStyle = p.paper; ctx.fillRect(0, 0, w, h);
  // Quiet geometric landscape, intentionally distinct from generated mural imagery.
  for (const [height, color, shift] of ($('style').value === 'ink' ? [] : [[.68, p.hill, 0], [.84, p.near, .08]])) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(w * .33, h);
    ctx.bezierCurveTo(w * .48, h * (height + .2), w * .58, h * (height - .35), w * .72, h * (height + shift));
    ctx.bezierCurveTo(w * .84, h * (height + .16), w * .91, h * (height - .33), w, h * (height - .13));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = p.ink; ctx.globalAlpha = .16; ctx.lineWidth = Math.max(1, w / 850);
  ctx.strokeRect(w * .03, h * .045, w * .94, h * .91); ctx.globalAlpha = 1;
}

function textBlock(ctx, text, width, size, minSize, maxHeight, weight = 400) {
  let lines, lineHeight;
  do {
    ctx.font = `${weight} ${size}px ${font}`;
    lines = wrapText(text, width, value => ctx.measureText(value).width);
    lineHeight = size * 1.4;
    if (lines.length * lineHeight <= maxHeight && lines.every(line => ctx.measureText(line).width <= width)) break;
    size -= 1;
  } while (size >= minSize);
  return { lines, lineHeight, size, valid: size >= minSize };
}

function draw(card) {
  const ctx = card.canvas.getContext('2d');
  const w = card.width, h = card.height, plan = layout(w, h, $('layout-mode').value), p = palettes[$('style').value];
  const brand = $('brand').value.trim(), title = $('headline').value.trim(), sub = $('subtitle').value.trim();
  background(ctx, w, h, p);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const brandSize = Math.round(w * .022);
  ctx.fillStyle = p.ink; ctx.font = `600 ${brandSize}px ${font}`;
  if (ctx.measureText(brand).width > w - 2 * plan.margin) return '品牌名称太长，请缩短后导出。';
  ctx.fillText(brand, plan.margin, h * .083);
  const block = textBlock(ctx, title, plan.text.width, plan.titleSize, Math.round(plan.titleSize * .68), plan.text.height * .62, 600);
  if (!block.valid) return '标题排不下，请减少字数或换行。';
  block.lines.forEach((line, i) => ctx.fillText(line, plan.text.x, plan.text.y + i * block.lineHeight));
  const subY = plan.text.y + block.lines.length * block.lineHeight + h * .023;
  ctx.fillStyle = p.muted;
  const subtitle = textBlock(ctx, sub, plan.text.width, Math.round(w * .023), Math.round(w * .016), plan.text.y + plan.text.height - subY);
  if (!subtitle.valid) return '活动说明排不下，请减少字数或换行。';
  subtitle.lines.forEach((line, i) => ctx.fillText(line, plan.text.x, subY + i * subtitle.lineHeight));
  ctx.fillStyle = p.accent; ctx.fillRect(plan.margin, plan.text.y + plan.text.height + h * .012, w * .045, h * .005);
  if (!title) return '请填写活动标题后导出。';
  if (!product) return '请先选择商品图片。';
  const sourceW = product.naturalWidth || product.width, sourceH = product.naturalHeight || product.height;
  const box = contain(sourceW, sourceH, plan.product, Number($('scale').value) / 100);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(product, box.x, box.y, box.width, box.height);
  const cta = $('cta').value.trim();
  const ctaSize = Math.round(w * .021);
  ctx.font = `600 ${ctaSize}px ${font}`;
  const ctaWidth = ctx.measureText(cta).width + w * .032;
  if (ctaWidth > plan.text.width) return '引导语太长，请缩短后导出。';
  if (cta) {
    const ctaY = h * (w / h > 1.8 ? .82 : .867);
    ctx.fillStyle = p.ink; ctx.fillRect(plan.margin, ctaY, ctaWidth, ctaSize * 2);
    ctx.fillStyle = p.paper; ctx.fillText(cta, plan.margin + w * .016, ctaY + ctaSize * .45);
  }
  ctx.font = `${Math.round(w * .013)}px ${font}`; ctx.fillStyle = p.muted;
  ctx.fillText(isDemo ? activeCase.stamp : '模拟推广 · 用户提供图片', plan.margin, h * .953);
  card.lowResolution = box.width > sourceW || box.height > sourceH;
  return '';
}

function clearExport(card) {
  card.download.hidden = true; card.open.hidden = true;
  card.download.removeAttribute('href'); card.open.removeAttribute('href');
  if (card.url) URL.revokeObjectURL(card.url);
  card.url = null;
}

function render() {
  frame = 0;
  const current = ++revision;
  $('scale-value').textContent = `${$('scale').value}%`;
  $('export-status').textContent = '';
  let errors = 0, completed = 0;
  $('render-status').textContent = '正在更新成品…';
  for (const card of cards) {
    clearExport(card);
    const error = draw(card);
    card.quality.classList.toggle('error', Boolean(error));
    card.quality.textContent = error || (card.lowResolution ? '商品正在放大，建议换用更清晰的原图。' : '等比保留商品 · 固定尺寸导出');
    if (error) { errors++; completed++; continue; }
    card.canvas.toBlob(blob => {
      if (current !== revision) return;
      completed++;
      if (!blob) { errors++; card.quality.textContent = '图片导出失败，请修改后重试。'; card.quality.classList.add('error'); }
      else {
        card.url = URL.createObjectURL(blob);
        card.download.href = card.url; card.download.download = `模拟-${activeCase.id}-${card.width}x${card.height}.png`; card.download.hidden = false;
        card.open.href = card.url; card.open.hidden = false;
      }
      if (completed === cards.length) $('render-status').textContent = errors ? `${errors} 张需要调整` : '三张成品已更新';
    }, 'image/png');
  }
  if (completed === cards.length) $('render-status').textContent = `${errors} 张需要调整`;
}

function scheduleRender() {
  // Invalidate previous downloads immediately, before the next animation frame.
  revision++; cards.forEach(clearExport);
  if (!frame) frame = requestAnimationFrame(render);
}

form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', event => { if (event.target.id !== 'product') scheduleRender(); });
async function selectCase(item) {
  const request = ++assetRequest;
  activeCase = item; isDemo = true; product = null;
  for (const id of ['brand', 'headline', 'subtitle', 'cta', 'style']) $(id).value = item[id];
  history.replaceState(null, '', '#' + item.id);
  $('scale').value = '100'; $('layout-mode').value = 'screen'; $('product').value = '';
  $('case-scenario').textContent = item.scenario;
  $('case-evidence').textContent = item.evidence;
  $('case-lesson').textContent = item.lesson;
  $('case-source').href = item.url; $('case-source').textContent = item.sourceLabel;
  for (const button of document.querySelectorAll('[data-case]')) button.setAttribute('aria-pressed', String(button.dataset.case === item.id));
  $('asset-status').textContent = '正在载入 ' + item.name + '…'; scheduleRender();
  try {
    const img = new Image(); img.src = new URL(item.asset, import.meta.url).href; await img.decode();
    if (request !== assetRequest) return;
    product = img;
    $('asset-status').textContent = `${item.name} · ${img.naturalWidth} × ${img.naturalHeight} · 原始画面`;
  } catch {
    if (request === assetRequest) $('asset-status').textContent = '案例图片未载入，请点击恢复当前案例资料重试。';
  } finally { if (request === assetRequest) scheduleRender(); }
}

for (const item of cases) {
  const button = document.createElement('button'); button.type = 'button'; button.dataset.case = item.id;
  button.setAttribute('aria-pressed', 'false');
  const thumbnail = document.createElement('img'); thumbnail.src = new URL(item.asset, import.meta.url).href; thumbnail.alt = item.alt; thumbnail.width = 240; thumbnail.height = 135;
  const label = document.createElement('strong'); label.textContent = item.name;
  const meta = document.createElement('span'); meta.textContent = item.category;
  button.append(thumbnail, label, meta); button.addEventListener('click', () => selectCase(item)); $('case-list').append(button);
}
$('demo').addEventListener('click', () => selectCase(activeCase));
$('product').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  const request = ++assetRequest;
  $('asset-status').textContent = '正在读取商品图片…';
  product = null; scheduleRender();
  let url;
  try {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('请选择 PNG、JPG 或 WebP 图片。');
    if (file.size > 15 * 1024 * 1024) throw new Error('图片超过 15 MB，请压缩后重试。');
    url = URL.createObjectURL(file);
    const img = new Image(); img.src = url; await img.decode();
    if (request !== assetRequest) return;
    if (img.naturalWidth * img.naturalHeight > 40_000_000) throw new Error('图片超过 4000 万像素，请缩小后重试。');
    product = img; isDemo = false;
    $('case-evidence').textContent = '素材已替换为你上传的图片；当前文案仍为可编辑的模拟推广。';
    $('asset-status').textContent = `${file.name} · ${img.naturalWidth} × ${img.naturalHeight} · 仅在本机使用`;
  } catch (error) {
    if (request === assetRequest) { product = null; $('asset-status').textContent = `未载入：${error.message}`; event.target.value = ''; }
  } finally {
    if (url) URL.revokeObjectURL(url);
    if (request === assetRequest) scheduleRender();
  }
});
for (const card of cards) card.download.addEventListener('click', () => {
  $('export-status').textContent = '已请求下载 PNG。若浏览器没有保存，请选择「打开成品」后保存图片。';
});

await document.fonts.ready;
await selectCase(cases.find(item => item.id === location.hash.slice(1)) || cases[0]);
