const CFG = window.VOID_CONFIG;
const I18N = window.VOID_I18N;

let lang = localStorage.getItem('void-lang');
if (!lang) lang = (navigator.language || 'en').toLowerCase().startsWith('it') ? 'it' : 'en';
if (!['it', 'en'].includes(lang)) lang = 'en';

const t = k => I18N[lang][k] ?? I18N.en[k] ?? k;
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let products = null;

const tgUser = () => CFG.telegram.replace(/^@/, '');
const tgLink = msg => `https://t.me/${tgUser()}?text=${encodeURIComponent(msg)}`;

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('.lang-btn').forEach(a => {
    a.classList.toggle('active', a.dataset.lang === lang);
  });
  if (products) renderProducts();
}

function renderProducts() {
  document.getElementById('productList').innerHTML = products.cats.map((cat, i) => {
    const rows = products.models.filter(m => (m.cat || 'pixel') === cat)
      .flatMap(m => m.variants.map(v => `
        <div class="prod">
          <span class="prod-name">${esc(m.name)} · ${esc(v.storage)}</span>
          <span class="prod-price">€${v.price}</span>
          <a class="buy" href="${tgLink(`${t('tg_msg')} ${m.name} ${v.storage} (€${v.price})`)}" target="_blank" rel="noopener">${t('buy')}</a>
        </div>`)).join('');
    return rows ? `${i ? '<hr>' : ''}<h2>${t('cat_' + cat + '_h')}</h2><p class="small">${t('cat_' + cat + '_note')}</p>${rows}` : '';
  }).join('');
}

applyLang();

(async () => {
  const list = document.getElementById('productList');
  if (list) {
    products = await (await fetch('/products.json')).json();
    renderProducts();
  }

  document.querySelectorAll('.lang-btn').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    lang = a.dataset.lang;
    localStorage.setItem('void-lang', lang);
    applyLang();
  }));

  document.querySelectorAll('a[data-cfg-href]').forEach(a => {
    const v = CFG[a.dataset.cfgHref];
    if (v) a.href = v;
  });

  const tg = document.getElementById('cfgTelegram');
  if (tg) {
    tg.textContent = '@' + tgUser();
    tg.href = tgLink(t('tg_msg') + ' ');
  }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('cfgSignal', CFG.signal);
  set('cfgSession', CFG.session);
  set('cfgPgp', CFG.pgpFingerprint);
})();
