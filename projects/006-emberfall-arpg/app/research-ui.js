const normalize = value => value.trim().toLocaleLowerCase();
document.querySelector('.print')?.addEventListener('click', () => window.print());
const docInput = document.querySelector('#doc-search');
const docs = [...document.querySelectorAll('.doc-card')];
docInput?.addEventListener('input', () => {
  const query = normalize(docInput.value);
  let count = 0;
  for (const card of docs) {
    card.hidden = !normalize(card.dataset.search).includes(query);
    if (!card.hidden) count++;
  }
  document.querySelector('#doc-count').textContent = count ? `显示 ${count} / ${docs.length} 份记录` : '没有匹配的记录，请换一个关键词。';
});
const sourceInput = document.querySelector('#source-search');
const sources = [...document.querySelectorAll('.source-card')];
let category = '全部';
function filterSources() {
  const query = normalize(sourceInput.value);
  let count = 0;
  for (const card of sources) {
    card.hidden = !((category === '全部' || card.dataset.category === category) && normalize(card.dataset.search).includes(query));
    if (!card.hidden) count++;
  }
  document.querySelector('#source-count').textContent = count ? `显示 ${count} / ${sources.length} 个来源` : '没有匹配的来源，请更换关键词或选择“全部”。';
}
sourceInput?.addEventListener('input', filterSources);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  filterSources();
}));
