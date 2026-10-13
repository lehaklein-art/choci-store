// עמוד מוצר — נבנה כאן מנתונים גולמיים, באותו מבנה ועיצוב כמו האתר המקורי.
import { esc, priceHtml } from './chrome';

const HEART = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';

const ICONS = {
  truck: '<path d="M3 17V7h11v10"/><path d="M14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  store: '<path d="M4 10v9h16v-9"/><path d="M3 6h18l-1.2 4H4.2z"/><path d="M10 19v-5h4v5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  chat: '<path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

/** כמו choci_pd_esc: מפענח ישויות ומשאיר רק הדגשות ושבירת שורה */
function pdEsc(s) {
  const dec = String(s ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return dec
    .replace(/&/g, '&amp;')
    .replace(/<(?!\/?(strong|b|em|i|br)\b)[^>]*>/gi, '')
    .replace(/<(\/?)(strong|b|em|i|br)\b[^>]*>/gi, '<$1$2>');
}

/** כמו wp_kses_post על מחיר: בלי bdi ובלי translate */
const ksesPrice = (h) => String(h || '').replace(/<\/?bdi>/g, '').replace(/ translate="no"/g, '');

function attrs(o, skip = []) {
  return Object.entries(o).filter(([k]) => !skip.includes(k)).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
}

function galleryHtml(p) {
  const g = p.gallery || [];
  const many = g.length > 1;
  const cls = `woocommerce-product-gallery woocommerce-product-gallery--${g.length || p.placeholder ? 'with-images' : 'without-images'} woocommerce-product-gallery--columns-4 images${many ? ' gallery-has-thumbnails' : ''}`;
  let inner = '';
  if (!g.length) {
    inner = `<div class="woocommerce-product-gallery__image--placeholder"><img src="${esc(p.placeholder)}" alt="ממתין לתמונת המוצר" class="wp-post-image" /></div>`;
  }
  g.forEach((it, i) => {
    const w = it.wrap || {};
    const img = { ...it.img };
    if (i === 0) {
      // התמונה הראשית נטענת מיד, כמו בוורדפרס
      delete img.loading;
      if (img.sizes) { img.sizes = img.sizes.replace(/^auto,\s*/, ''); }
    }
    const order = ['width', 'height', 'src', 'class', 'alt', 'data-caption', 'data-src', 'data-large_image', 'data-large_image_width', 'data-large_image_height', 'decoding', 'loading', 'srcset', 'sizes'];
    const ordered = {};
    for (const k of order) { if (k in img) { ordered[k] = img[k]; } }
    for (const k of Object.keys(img)) { if (!(k in ordered)) { ordered[k] = img[k]; } }
    inner += `<div data-thumb="${esc(w['data-thumb'] || '')}" data-thumb-alt="${esc(w['data-thumb-alt'] || '')}" data-thumb-srcset="${esc(w['data-thumb-srcset'] || '')}"  data-thumb-sizes="${esc(w['data-thumb-sizes'] || '')}" class="${esc(w.class || 'woocommerce-product-gallery__image')}"><a href="${esc(it.href)}"><img${attrs(ordered)} /></a></div>`;
  });
  return `<div class="${cls}" data-columns="4" style="opacity: 0; transition: opacity .25s ease-in-out;">
\t<div class="woocommerce-product-gallery__wrapper">
\t\t${inner}\t</div>
</div>
`;
}

function breadcrumbs(b) {
  if (!b || !b.items) { return ''; }
  const parts = b.items.map((it, i) => `<span><a href="${esc(it.url)}" itemprop="url" ${i === 0 ? 'class="kadence-bc-home" ' : ''}><span>${esc(it.name)}</span></a></span>`);
  parts.push(`<span class="kadence-bread-current">${esc(b.current)}</span>`);
  return `<div class="product-title product-above"><nav id="kadence-breadcrumbs" aria-label="Breadcrumbs"  class="kadence-breadcrumbs"><div class="kadence-breadcrumb-container">${parts.join(' <span class="bc-delimiter">/</span> ')}</div></nav></div>`;
}

let qtySeq = 0;
function quantity(p) {
  const q = p.qty || {};
  if (p.sold_individually || (q.max_value > 0 && q.min_value === q.max_value)) {
    return `<div class="quantity">
\t\t<label class="screen-reader-text" for="quantity_x">כמות של ${esc(p.title)}</label>
\t<input type="hidden" id="quantity_x" class="qty" name="quantity" value="${q.min_value || 1}" />
\t</div>
`;
  }
  const id = 'quantity_' + (Date.now().toString(16) + (qtySeq++).toString(16)).slice(-13);
  return `<div class="quantity">
\t\t<label class="screen-reader-text" for="${id}">כמות של ${esc(p.title)}</label>
\t<input
\t\ttype="number"
\t\t\t\tid="${id}"
\t\tclass="input-text qty text"
\t\tname="quantity"
\t\tvalue="${q.input_value || 1}"
\t\taria-label="כמות המוצר"
\t\t\t\tmin="${q.min_value || 1}"
\t\t\t\t${q.max_value > 0 ? `max="${q.max_value}"` : ''}
\t\t\t\tstep="${q.step || 1}"
\t\t\tplaceholder=""
\t\t\tinputmode="numeric"
\t\t\tautocomplete="off"
\t\t\t/>
\t</div>
`;
}

function addToCart(p) {
  if (p.type === 'variable') {
    const rows = p.attributes.map((a) => {
      const opts = a.options.map((o) => `<option value="${esc(o.value)}" ${o.value === a.selected ? 'selected=\'selected\'' : ''}>${esc(o.label)}</option>`).join('');
      return `\t\t\t\t\t\t\t\t\t<tr>
\t\t\t\t\t\t<th class="label"><label for="${esc(a.id)}">${esc(a.label)}</label></th>
\t\t\t\t\t\t<td class="value">
\t\t\t\t\t\t\t<select id="${esc(a.id)}" class="" name="attribute_${esc(a.name)}" data-attribute_name="attribute_${esc(a.name)}" data-show_option_none="yes"><option value="">בחירת אפשרות</option>${opts}</select>${a === p.attributes[p.attributes.length - 1] ? '<a class="reset_variations" href="#" aria-label="לנקות את אפשרויות">נקה</a>' : ''}\t\t\t\t\t\t</td>
\t\t\t\t\t</tr>`;
    }).join('\n');
    const varsJson = p.variations === false ? 'false' : JSON.stringify(p.variations || []);
    return `<form class="variations_form cart" action="${esc(p.link)}" method="post" enctype='multipart/form-data' data-product_id="${p.id}" data-product_variations="${esc(varsJson)}">
\t
\t\t\t<table class="variations" cellspacing="0" role="presentation">
\t\t\t<tbody>
${rows}
\t\t\t\t\t\t\t</tbody>
\t\t</table>
\t\t<div class="reset_variations_alert screen-reader-text" role="alert" aria-live="polite" aria-relevant="all"></div>
\t\t
\t\t<div class="single_variation_wrap">
\t\t\t<div class="woocommerce-variation single_variation" role="alert" aria-relevant="additions"></div><div class="woocommerce-variation-add-to-cart variations_button">
\t
\t${quantity(p)}
\t<button type="submit" class="single_add_to_cart_button button alt">${esc(p.add_to_cart_text)}</button>

\t
\t<input type="hidden" name="add-to-cart" value="${p.id}" />
\t<input type="hidden" name="product_id" value="${p.id}" />
\t<input type="hidden" name="variation_id" class="variation_id" value="0" />
</div>
\t\t</div>
\t
\t</form>
`;
  }
  if (!p.purchasable || !p.in_stock) { return p.stock_html || ''; }
  return `${p.stock_html || ''}
\t
\t<form class="cart" action="${esc(p.link)}" method="post" enctype='multipart/form-data'>
\t\t
\t\t${quantity(p)}
\t\t<button type="submit" name="add-to-cart" value="${p.id}" class="single_add_to_cart_button button alt">${esc(p.add_to_cart_text)}</button>

\t\t\t</form>

\t
`;
}

function productMeta(p) {
  const sku = p.sku ? `\n\t\t<span class="sku_wrapper">${esc(p.sku_label)} <span class="sku">${esc(p.sku)}</span></span>\n\n\t` : '';
  const cats = p.cats.length ? `\n\t<span class="posted_in">${esc(p.cats_label)} ${p.cats.map((c) => `<a href="${esc(c.link)}" rel="tag">${esc(c.name)}</a>`).join(', ')}</span>` : '';
  const tags = p.tags.length ? `\n\t<span class="tagged_as">${esc(p.tags_label)} ${p.tags.map((c) => `<a href="${esc(c.link)}" rel="tag">${esc(c.name)}</a>`).join(', ')}</span>` : '';
  return `<div class="product_meta">

\t
\t${sku}${cats}${tags}
\t
\t
</div>
`;
}

function summary(p, layout) {
  const c = p.choci;
  let s = '';
  if (c.kosher && c.kosher.length) {
    s += `<div class="choci-pd-badges">${c.kosher.map((b) => `<span class="choci-pd-badge choci-pd-badge-${esc(b.k)}">${pdEsc(b.t)}</span>`).join('')}</div>`;
  }
  s += `<h1 class="product_title entry-title">${esc(p.title)}</h1><p class="price">${p.price_html}</p>\n`;
  if (c.deal) {
    s += `<div class="choci-deal-note"><strong>${esc(c.deal.label)}</strong> — אפשר לערבב: כל ${c.deal.qty} מוצרים מהקבוצה ב-${c.deal.price_html}. <a href="${esc(c.deal.link)}">לכל המוצרים במבצע</a></div>`;
  }
  if (layout.free_ship_min > 0) {
    s += `<p class="choci-freeship-hint">משלוח חינם בקנייה מעל ${priceHtml(layout.free_ship_min)}</p>`;
  }
  if (c.unit) { s += `<div class="choci-pd-unit" data-ci="meta:_choci_unit_price">${pdEsc(c.unit)}</div>`; }
  if (p.short_html) {
    s += `<div class="woocommerce-product-details__short-description">\n\t${p.short_html}</div>\n`;
  }
  s += `\n\t${addToCart(p)}`;
  s += `<div class="choci-pd-trust">${[['truck', 'משלוח עד הבית'], ['store', 'איסוף עצמי בבני ברק'], ['lock', 'תשלום מאובטח'], ['chat', 'ייעוץ מקצועי בוואטסאפ']].map(([i, t]) => `<div class="choci-pd-trust-item">${icon(i)}<span>${t}</span></div>`).join('')}</div>`;
  s += `<button type="button" class="choci-wish choci-wish-single" data-wish="${p.id}" aria-pressed="false">${HEART}<span class="cw-label">הוספה למועדפים</span></button>`;
  s += productMeta(p);
  return `<div class="summary entry-summary">\n\t\t${s}\t</div>\n`;
}

const RB_CSS = `<style>
  .choci-rb{position:relative;display:flex;align-items:center;gap:18px;margin:30px 0 26px;padding:52px 22px 22px;background:linear-gradient(135deg,#FFF6F1,#FFEEE7);border:2px solid #EC6560;border-top:none;border-radius:0 0 18px 18px;clear:both}
  .choci-rb-drip{position:absolute;left:-2px;right:-2px;top:-1px;height:46px;background:url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27140%27%20height%3D%2746%27%20viewBox%3D%270%200%20140%2046%27%3E%3Cpath%20fill%3D%27%23EC6560%27%20d%3D%27M0%2C0%20H140%20V12%20C133%2C12%20129%2C41%20118%2C41%20C107%2C41%20104%2C12%2095%2C12%20C86%2C12%2082%2C31%2073%2C31%20C64%2C31%2061%2C12%2051%2C12%20C42%2C12%2037%2C46%2028%2C46%20C19%2C46%2015%2C12%207%2C12%20C4%2C12%202%2C12%200%2C12%20Z%27%2F%3E%3C%2Fsvg%3E") repeat-x top left;background-size:140px 46px;pointer-events:none}
  .choci-rb-photo{width:132px;height:132px;object-fit:cover;border-radius:14px;flex:0 0 132px;box-shadow:0 6px 16px rgba(236,101,96,.28)}
  .choci-rb-body{display:flex;flex-direction:column;gap:6px;flex:1}
  .choci-rb-kicker{font-size:13px;font-weight:700;color:#EC6560;letter-spacing:.02em}
  .choci-rb-title{font-size:22px;font-weight:800;color:#573D2F;line-height:1.25}
  .choci-rb-meta{font-size:14px;color:#8A7268}
  .choci-rb-cta{align-self:flex-start;margin-top:8px;background:#EC6560;color:#fff!important;font-weight:700;font-size:15px;padding:11px 26px;border-radius:999px;text-decoration:none;box-shadow:0 4px 12px rgba(236,101,96,.35)}
  .choci-rb-cta:hover{background:#d94f4a}
  .choci-rb-mascot{width:78px;height:auto;flex:0 0 78px;align-self:flex-end}
  @media(max-width:600px){.choci-rb{flex-wrap:wrap;justify-content:center;text-align:center}.choci-rb-body{flex:1 1 100%;align-items:center}.choci-rb-cta{align-self:center}.choci-rb-mascot{position:absolute;bottom:8px;left:8px;width:56px}}
  </style>`;

function afterSummary(p) {
  const c = p.choci;
  let s = '';
  if (c.tip) {
    s += `<div class="choci-pd-tip">${c.mascot ? `<img class="choci-pd-tip-mascot" src="${esc(c.mascot)}" alt="" loading="lazy">` : ''}<div class="choci-pd-tip-bubble"><span class="choci-pd-tip-title">טיפ צ׳וקי</span><span class="choci-pd-tip-text" data-ci="meta:_choci_tip">${pdEsc(c.tip)}</span></div></div>`;
  }
  if (c.recipe) {
    const r = c.recipe;
    s += RB_CSS + `<div class="choci-rb"><span class="choci-rb-drip"></span>${r.img ? `<img class="choci-rb-photo" src="${esc(r.img)}" alt="" loading="lazy">` : ''}<div class="choci-rb-body"><span class="choci-rb-kicker">מתכון מומלץ למוצר</span><span class="choci-rb-title">${pdEsc(r.title)}</span>${r.meta ? `<span class="choci-rb-meta">${pdEsc(r.meta)}</span>` : ''}${r.url ? `<a class="choci-rb-cta" href="${esc(r.url)}">למתכון המלא ←</a>` : ''}</div>${c.mascot ? `<img class="choci-rb-mascot" src="${esc(c.mascot)}" alt="" loading="lazy">` : ''}</div>`;
  }
  if ((c.spec && c.spec.length) || p.description_html) {
    s += '<div class="choci-pd-acc">';
    if (p.description_html) {
      s += `<details class="choci-pd-item" open><summary>שימושים ורעיונות</summary><div class="choci-pd-body" data-ci="post:content">${p.description_html}</div></details>`;
    }
    if (c.spec && c.spec.length) {
      const rows = c.spec.map(([k, v]) => (k === '' ? `<tr><td colspan="2">${pdEsc(v)}</td></tr>` : `<tr><th>${pdEsc(k)}</th><td>${pdEsc(v)}</td></tr>`)).join('');
      s += `<details class="choci-pd-item" open><summary>מפרט מקצועי</summary><div class="choci-pd-body"><table class="choci-pd-spec" data-ci="spec"><tbody>${rows}</tbody></table></div></details>`;
    }
    s += '</div>';
  }
  const faq = (c.faq || []).filter((f) => f && f.q && f.a);
  if (faq.length) {
    s += `<div class="choci-pd-acc"><details class="choci-pd-item"><summary>שאלות נפוצות</summary><div class="choci-pd-body" data-ci="faq">${faq.map((f) => `<div class="choci-pd-qa"><p class="choci-pd-q">${pdEsc(f.q)}</p><p class="choci-pd-a">${pdEsc(f.a)}</p></div>`).join('')}</div></details></div>`;
  }
  if (c.complements && c.complements.length) {
    s += `<section class="choci-pd-complements"><h2 class="choci-pd-h">משלימים את המוצר</h2><div class="choci-pd-cards">${c.complements.map((x) => `<a class="choci-pd-card" href="${esc(x.link)}"><span class="choci-pd-card-img"><img src="${esc(x.img)}" alt="" loading="lazy"></span><span class="choci-pd-card-name">${pdEsc(x.name)}</span><span class="choci-pd-card-price">${ksesPrice(x.price_html)}</span></a>`).join('')}</div></section>`;
  }
  return s;
}

export const PSWP = `<div id="photoswipe-fullscreen-dialog" class="pswp" tabindex="-1" role="dialog" aria-modal="true" aria-hidden="true" aria-label="תמונה במסך מלא">
\t<div class="pswp__bg"></div>
\t<div class="pswp__scroll-wrap">
\t\t<div class="pswp__container">
\t\t\t<div class="pswp__item"></div>
\t\t\t<div class="pswp__item"></div>
\t\t\t<div class="pswp__item"></div>
\t\t</div>
\t\t<div class="pswp__ui pswp__ui--hidden">
\t\t\t<div class="pswp__top-bar">
\t\t\t\t<div class="pswp__counter"></div>
\t\t\t\t<button class="pswp__button pswp__button--zoom" aria-label="הגדל/הקטן"></button>
\t\t\t\t<button class="pswp__button pswp__button--fs" aria-label="מסך מלא"></button>
\t\t\t\t<button class="pswp__button pswp__button--share" aria-label="שתף"></button>
\t\t\t\t<button class="pswp__button pswp__button--close" aria-label="סגור (Esc)"></button>
\t\t\t\t<div class="pswp__preloader">
\t\t\t\t\t<div class="pswp__preloader__icn">
\t\t\t\t\t\t<div class="pswp__preloader__cut">
\t\t\t\t\t\t\t<div class="pswp__preloader__donut"></div>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t\t<div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
\t\t\t\t<div class="pswp__share-tooltip"></div>
\t\t\t</div>
\t\t\t<button class="pswp__button pswp__button--arrow--left" aria-label="לעמוד הקודם (חץ ימינה)"></button>
\t\t\t<button class="pswp__button pswp__button--arrow--right" aria-label="לעמוד הבא (חץ שמאלה)"></button>
\t\t\t<div class="pswp__caption">
\t\t\t\t<div class="pswp__caption__center"></div>
\t\t\t</div>
\t\t</div>
\t</div>
</div>
`;

export const PRODUCT_PARAMS = '<script>var wc_single_product_params = {"i18n_required_rating_text":"\\u05d1\\u05d7\\u05e8 \\u05d3\\u05d9\\u05e8\\u05d5\\u05d2","i18n_product_gallery_trigger_text":"\\u05dc\\u05d4\\u05e6\\u05d9\\u05d2 \\u05d0\\u05ea \\u05d2\\u05dc\\u05e8\\u05d9\\u05d9\\u05ea \\u05d4\\u05ea\\u05de\\u05d5\\u05e0\\u05d5\\u05ea \\u05e2\\u05dc \\u05de\\u05e1\\u05da \\u05de\\u05dc\\u05d0","review_rating_required":"yes","flexslider":{"rtl":true,"animation":"slide","smoothHeight":true,"directionNav":true,"controlNav":"thumbnails","slideshow":false,"animationSpeed":500,"animationLoop":false,"allowOneSlide":false,"prevText":"\\u203a","nextText":"\\u2039"},"zoom_enabled":"1","zoom_options":[],"photoswipe_enabled":"1","photoswipe_options":{"shareEl":false,"closeOnScroll":false,"history":false,"hideAnimationDuration":0,"showAnimationDuration":0},"flexslider_enabled":"1"};</script>';

export const VARIATION_PARAMS = '<script>var wc_add_to_cart_variation_params = {"i18n_no_matching_variations_text":"\\u05dc\\u05d0 \\u05e0\\u05de\\u05e6\\u05d0\\u05d5 \\u05de\\u05d5\\u05e6\\u05e8\\u05d9\\u05dd \\u05d4\\u05e2\\u05d5\\u05e0\\u05d9\\u05dd \\u05e2\\u05dc \\u05d4\\u05d1\\u05d7\\u05d9\\u05e8\\u05d4 \\u05e9\\u05dc\\u05da. \\u05e0\\u05d0 \\u05dc\\u05d1\\u05d7\\u05d5\\u05e8 \\u05e7\\u05d5\\u05de\\u05d1\\u05d9\\u05e0\\u05e6\\u05d9\\u05d4 \\u05d0\\u05d7\\u05e8\\u05ea.","i18n_make_a_selection_text":"\\u05d1\\u05d7\\u05e8 \\u05d0\\u05ea \\u05d0\\u05e4\\u05e9\\u05e8\\u05d5\\u05ea \\u05d4\\u05de\\u05d5\\u05e6\\u05e8 \\u05d4\\u05de\\u05ea\\u05d0\\u05d9\\u05de\\u05d4 \\u05dc\\u05e4\\u05e0\\u05d9 \\u05d4\\u05d4\\u05d5\\u05e1\\u05e4\\u05d4 \\u05dc\\u05e1\\u05dc \\u05d4\\u05e7\\u05e0\\u05d9\\u05d5\\u05ea","i18n_unavailable_text":"\\u05de\\u05d5\\u05e6\\u05e8 \\u05d6\\u05d4 \\u05d0\\u05d9\\u05e0\\u05d5 \\u05d6\\u05de\\u05d9\\u05df \\u05db\\u05e8\\u05d2\\u05e2. \\u05e0\\u05d0 \\u05dc\\u05d1\\u05d7\\u05d5\\u05e8 \\u05e9\\u05d9\\u05dc\\u05d5\\u05d1 \\u05d0\\u05d7\\u05e8.","i18n_reset_alert_text":"\\u05d4\\u05d1\\u05d7\\u05d9\\u05e8\\u05d4 \\u05e9\\u05dc\\u05da \\u05d0\\u05d5\\u05e4\\u05e1\\u05d4. \\u05d9\\u05e9 \\u05dc\\u05d1\\u05d7\\u05d5\\u05e8 \\u05d0\\u05ea \\u05d0\\u05e4\\u05e9\\u05e8\\u05d5\\u05d9\\u05d5\\u05ea \\u05d4\\u05de\\u05d5\\u05e6\\u05e8 \\u05d4\\u05de\\u05ea\\u05d0\\u05d9\\u05de\\u05d5\\u05ea \\u05dc\\u05e4\\u05e0\\u05d9 \\u05d4\\u05d4\\u05d5\\u05e1\\u05e4\\u05d4 \\u05dc\\u05e1\\u05dc \\u05d4\\u05e7\\u05e0\\u05d9\\u05d5\\u05ea."};</script>';

function badge(b) {
  return b ? `<span class="${esc(b.cls)}">${esc(b.label)}</span>` : '';
}

/** גוף עמוד מוצר שלם */
export function productBody(data, layout) {
  const p = data.product;
  const classes = [...p.classes];
  if (!p.gallery.length) { /* בלי תמונה — אותן מחלקות */ }
  return `<div id="wrapper" class="site wp-site-blocks">
\t\t\t<a class="skip-link screen-reader-text scroll-ignore" href="#main">דילוג לתוכן</a>
\t\t
\t<main id="inner-wrap" class="wrap kt-clear" role="main">
\t\t
\t<div id="choci-bar-slot"></div><div id="primary" class="content-area"><div class="content-container site-container"><main id="main" class="site-main" role="main">
\t\t\t\t\t
\t\t\t<div class="woocommerce-notices-wrapper"></div>${breadcrumbs(p.breadcrumbs)}<div id="product-${p.id}" class="${classes.join(' ')}">

\t${p.badge && p.badge.wc ? badge(p.badge) : ''}${p.badge && !p.badge.wc ? badge(p.badge) : ''}${galleryHtml(p)}
\t${summary(p, layout)}
\t${afterSummary(p)}</div>


\t\t
\t</main></div></div>
\t
\t</main><!-- #inner-wrap -->
\t</div><!-- #wrapper -->
`;
}
