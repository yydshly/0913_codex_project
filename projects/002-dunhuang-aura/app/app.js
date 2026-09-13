'use strict';

const form = document.querySelector('#brief-form');
const useCase = document.querySelector('#use-case');
const subject = document.querySelector('#subject');
const headline = document.querySelector('#headline');
const density = document.querySelector('#density');
const output = document.querySelector('#prompt-output');
const feedback = document.querySelector('#feedback');

function renderPrompt() {
  const mode = useCase.value;
  const product = subject.value.trim() || '一只茶叶罐';
  const title = headline.value.trim() || '一盏茶，千年色';
  const hasText = mode === 'editorial';
  const ratio = mode === 'product' ? '4:5' : '5:2';
  const purpose = { panorama: '无文字商业横幅', product: '无文字单品广告', editorial: '带准确标题的文章封面' }[mode];
  document.querySelector('#title-field').hidden = !hasText;
  document.querySelector('#mode-badge').textContent = `${ratio} / ${hasText ? '准确标题' : '无文字'}`;
  document.querySelector('#simple-brief').textContent = `用敦煌风为${product}制作一张${ratio}${purpose}${hasText ? `，标题是“${title}”` : ''}。`;
  const composition = {
    panorama: '构图：左侧一只大型陶瓷瓶与两块错落壁画面板；右侧为产品主体。两侧均有明确视觉重点，中间保留水面或洞窟通道。不要预留标题空白。前景产品、中景壁画、背景洞窟形成三层景深。',
    product: '构图：仅展示一个产品主体，位于画面偏右约三分之二处，完整轮廓可见；放置在真实石台上，底部有接触阴影。中景是一块矿物壁画面板，背景洞窟保持安静。不设置标题区。',
    editorial: '构图：左侧约44%作为安静的标题区，保留低对比度壁面纹理；产品主体和壁画集中在右侧。前景、中景、背景有清晰层次。文字和产品保留安全边距。'
  }[mode];
  const textRule = hasText
    ? `准确文字（原文）：${JSON.stringify(title)}。只出现一次，尽量不超过两行，使用清晰的中文无衬线字体。禁止额外副标题、作者名或装饰性小字；生成后逐字核对，必要时用排版工具后加文字。`
    : '文字状态：无文字。禁止字母、数字、标签、标识、logo、二维码、水印和屏幕小字；产品、壁画和边角都不得出现可读或伪文字。';
  const ornament = density.value === 'rich'
    ? '装饰密度：相对丰富。在上述构图与主体数量范围内，丰富壁画纹理，用一条连续的朱砂、石绿、石青飘带加强层次；仍只保留一组莲花，不遮挡产品轮廓。'
    : '装饰密度：克制。只保留一条有方向的飘带和至多一组莲花；扩大完整材质表面，让产品成为视觉中心。';
  output.value = [
    `用途与比例：${purpose}，画幅${ratio}。`,
    `主要需求：为${product}制作当代敦煌矿物美学商业视觉。`,
    '场景：炭黑岩壁构成的洞窟画廊，沙色矿物壁画、远处山形和有反射的深色石地面。',
    composition,
    '配色与材质：炭黑、沙白、朱砂、石绿、石青，以少量赭金点缀。岩石粗糙低光泽，壁画有矿物肌理，陶瓷有柔和高光；产品材质按实际参考确定。',
    '光线：一个主要暖光源，产品边缘有受控高光；阴影、反射与光源方向一致，洞窟暗部仍可辨认。',
    ornament,
    textRule,
    `保留项：若提供产品参考图，保持产品轮廓、包装比例与材质${hasText ? '；品牌文字仅在明确要求时保留' : '；原图标签文字仍按无文字要求移除'}。严格保真时使用原图编辑或合成。`,
    '禁止项：产品变形、悬浮、重复产品、飘带穿过主体、整幅泛金、随机装饰、未经要求的佛像或飞天等宗教人物。',
    `交付检查：实际尺寸符合${ratio}；核对文字状态、主体位置、产品形状和接触阴影。发现问题时一次只修正一个主要问题。`
  ].join('\n\n');
  feedback.textContent = '';
}

form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', renderPrompt);
form.addEventListener('change', renderPrompt);
document.querySelector('#copy-prompt').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    feedback.textContent = '已复制，可以交给绘图工具使用。';
  } catch {
    output.focus();
    output.select();
    feedback.textContent = '浏览器未允许复制。文字已选中，请手动复制。';
  }
});
document.querySelector('#download-prompt').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([output.value], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `dunhuang-${useCase.value}-prompt.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback.textContent = '已请求下载；若浏览器未保存，请使用复制提示词。';
});
renderPrompt();
