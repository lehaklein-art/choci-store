// עמודי קטגוריה, חנות וחיפוש — נבנים כאן מנתונים גולמיים, באותו מבנה ועיצוב כמו האתר המקורי.
import { esc } from './chrome';

const HEART = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';

const GRID_SVG = '<svg class="kadence-svg-icon kadence-grid-svg" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><title>Grid</title><path d="M8 19.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5zM8 11.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5zM18 19.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5zM8 3.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5zM18 11.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5zM28 19.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5zM18 3.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5zM28 11.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5zM28 3.5v3c0 0.828-0.672 1.5-1.5 1.5h-5c-0.828 0-1.5-0.672-1.5-1.5v-3c0-0.828 0.672-1.5 1.5-1.5h5c0.828 0 1.5 0.672 1.5 1.5z"></path>\n\t\t\t\t</svg>';
const LIST_SVG = '<svg class="kadence-svg-icon kadence-list-svg" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><title>List</title><path d="M1 3h14v3h-14zM1 7h14v3h-14zM1 11h14v3h-14z"></path>\n\t\t\t\t</svg>';

const RIBBON = {
  start: '<path d="M8 96 C 44 36, 96 120, 132 52 S 208 8, 236 60" stroke="#EC6560"/><path d="M2 132 C 52 92, 88 156, 140 104 S 214 66, 248 108" stroke="#F6B3AE"/><path d="M22 44 C 60 10, 78 66, 118 26" stroke="#A98B7D"/>',
  end: '<path d="M248 52 C 208 112, 160 28, 120 96 S 44 140, 12 88" stroke="#EC6560"/><path d="M252 14 C 202 56, 166 0, 112 48 S 40 84, 6 44" stroke="#F6B3AE"/><path d="M232 120 C 196 152, 172 98, 134 134" stroke="#A98B7D"/>',
};
const ribbons = (w) => `<svg class="choci-ribbons r-${w}" viewBox="0 0 256 160" fill="none" aria-hidden="true" focusable="false"><g stroke-width="7" stroke-linecap="round">${RIBBON[w]}</g></svg>`;

/** תמונת מוצר בכרטיס — אותן תכונות כמו בוורדפרס (הראשונה נטענת מיד, השאר בעצלות) */
function cardImg(img, index) {
  if (!img) { return ''; }
  if (img.placeholder) {
    return `<img src="${esc(img.src)}" alt="${esc(img.alt)}" width="300" class="woocommerce-placeholder wp-post-image" height="300"${index ? ' loading="lazy"' : ''} />`;
  }
  const lazy = index > 0;
  const sizes = img.sizes ? (lazy ? `auto, ${img.sizes}` : img.sizes) : '';
  return `<img width="${img.width}" height="${img.height}" src="${esc(img.src)}" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail" alt="${esc(img.alt)}" decoding="async"${lazy ? ' loading="lazy"' : ''}${img.srcset ? ` srcset="${esc(img.srcset)}"` : ''}${sizes ? ` sizes="${esc(sizes)}"` : ''} />`;
}

function action(p) {
  if (!p.purchasable || !p.in_stock) { return ''; }
  if (p.type === 'variable' || p.type === 'grouped' || p.type === 'external') {
    return `<a class="cadd-link button" href="${esc(p.link)}">בחירת אפשרויות</a>`;
  }
  return `<div class="cadd" data-pid="${p.id}"><button type="button" class="cq cq-plus" aria-label="הוספה לסל">+</button><span class="cq-num" aria-live="polite">0</span><button type="button" class="cq cq-minus" aria-label="הפחתת כמות" disabled>&minus;</button></div>`;
}

function badge(b) {
  if (!b) { return ''; }
  return `<span class="${esc(b.cls)}">${esc(b.label)}</span>`;
}

export function productCard(p, index, columns) {
  const cls = [...p.classes];
  // first/last לפי המיקום בשורה, כמו בווקומרס
  const pos = index % columns;
  const pre = cls.indexOf('status-publish') + 1 || cls.length;
  if (pos === 0) { cls.splice(pre, 0, 'first'); }
  else if (pos === columns - 1) { cls.splice(pre, 0, 'last'); }
  const wcFlash = p.badge && p.badge.wc ? badge(p.badge) : '';
  const chociBadge = p.badge && !p.badge.wc ? badge(p.badge) : '';
  return `<li class="${cls.join(' ')}">
\t<button type="button" class="choci-wish" data-wish="${p.id}" aria-pressed="false" aria-label="הוספה למועדפים">${HEART}</button><a href="${esc(p.link)}" class="woocommerce-loop-image-link woocommerce-LoopProduct-link woocommerce-loop-product__link">${wcFlash}${cardImg(p.image, index)}${chociBadge}</a><div class="product-details content-bg entry-content-wrap"><h2 class="woocommerce-loop-product__title"><a href="${esc(p.link)}" class="woocommerce-LoopProduct-link-title woocommerce-loop-product__title_ink">${esc(p.name)}</a></h2>
\t<span class="price">${p.price_html}</span>
${p.short_html ? `<div class="product-excerpt">${p.short_html}</div>` : ''}<div class="product-action-wrap">${action(p)}</div></div></li>
`;
}

function subcatCard(c, index, columns) {
  const pos = index % columns;
  const fl = pos === 0 ? ' first' : pos === columns - 1 ? ' last' : '';
  const img = c.image && !c.image.placeholder
    ? `<img src="${esc(c.image.src)}" alt="${esc(c.name)}" width="${c.image.width}" height="${c.image.height}"${c.image.srcset ? ` srcset="${esc(c.image.srcset)}"` : ''}${c.image.sizes ? ` sizes="${esc(c.image.sizes)}"` : ''} />`
    : `<img src="${esc(c.image?.src || '')}" alt="${esc(c.name)}" width="300" height="300" />`;
  return `<li class="product-category product${fl} entry content-bg loop-entry">
\t<a aria-label="לעבור לקטגוריית המוצר ⁦${esc(c.name)}⁩" href="${esc(c.link)}">${img}<div class="product-details content-bg entry-content-wrap">\t\t<h2 class="woocommerce-loop-category__title">
\t\t\t${esc(c.name)} <mark class="count">(${c.count})</mark>\t\t</h2>
\t\t</div></a></li>
`;
}

function ordering(a) {
  const opts = Object.entries(a.catalog_orderby || {}).map(([v, label]) =>
    `\t\t\t\t\t<option value="${esc(v)}" ${v === a.orderby ? " selected='selected'" : ''}>${esc(label)}</option>`).join('\n');
  return `<form class="woocommerce-ordering" method="get">
\t\t<select
\t\tname="orderby"
\t\tclass="orderby"
\t\t\t\t\taria-label="מיון המוצרים"
\t\t\t>
${opts}
\t\t\t</select>
\t<input type="hidden" name="paged" value="1" />
\t${(a.hidden_query || []).map((h) => `<input type="hidden" name="${esc(h.name)}" value="${esc(h.value)}" />`).join('')}</form>`;
}

function topRow(a) {
  return `<div class="kadence-shop-top-row"><div class="kadence-shop-top-item kadence-woo-results-count"><p class="woocommerce-result-count" role="status" aria-relevant="all" >
\t${esc(a.result_count)}</p>
</div><div class="kadence-shop-top-item kadence-woo-ordering">${ordering(a)}
</div><div class="kadence-shop-top-item kadence-woo-toggle"><div class="kadence-product-toggle-container kadence-product-toggle-outer"><button title="Grid View" class="kadence-toggle-shop-layout kadence-toggle-grid toggle-active" data-archive-toggle="grid"><span class="kadence-svg-iconset">${GRID_SVG}</span></button><button title="List View" class="kadence-toggle-shop-layout kadence-toggle-list" data-archive-toggle="list"><span class="kadence-svg-iconset">${LIST_SVG}</span></button></div></div></div>`;
}

/** עימוד — כמו paginate_links של וורדפרס (בעברית החיצים הפוכים) */
function pagination(a, basePath, search) {
  if (a.max_pages <= 1) { return ''; }
  const cur = a.paged, total = a.max_pages;
  const qs = search ? `?${search}` : '';
  const link = (n) => `${basePath}${n > 1 ? `page/${n}/` : ''}${qs}`;
  const items = [];
  if (cur > 1) { items.push(`<li><a class="prev page-numbers" href="${esc(link(cur - 1))}">&rarr;</a></li>`); }
  let dots = false;
  for (let n = 1; n <= total; n++) {
    const show = n === cur || n <= 1 || n > total - 1 || (n >= cur - 2 && n <= cur + 2);
    if (n === cur) { items.push(`<li><span aria-label="עמוד ${n}" aria-current="page" class="page-numbers current">${n}</span></li>`); dots = true; }
    else if (show) { items.push(`<li><a aria-label="עמוד ${n}" class="page-numbers" href="${esc(link(n))}">${n}</a></li>`); dots = true; }
    else if (dots) { items.push('<li><span class="page-numbers dots">&hellip;</span></li>'); dots = false; }
  }
  if (cur < total) { items.push(`<li><a class="next page-numbers" href="${esc(link(cur + 1))}">&larr;</a></li>`); }
  return `<nav class="woocommerce-pagination" aria-label="עימוד מוצר">
\t<ul class='page-numbers'>
\t${items.join('\n\t')}
</ul>
</nav>
`;
}

function seoText(t, paged) {
  if (!t || !t.description_html || paged > 1) { return ''; }
  return `<section class="choci-cat-seo" aria-label="על הקטגוריה"><div class="choci-cat-seo-inner" id="choci-cat-seo-text">${t.description_html}</div><button type="button" class="choci-cat-seo-more" aria-expanded="false" aria-controls="choci-cat-seo-text" onclick="var s=this.parentNode;var o=s.classList.toggle('open');this.setAttribute('aria-expanded',o);this.textContent=o?'הצג פחות':'קראו עוד';">קראו עוד</button></section>`;
}

function tipBanner(t) {
  if (!t || !t.tips || !t.tips.length) { return ''; }
  const tip = t.tips[Math.floor(Math.random() * t.tips.length)];
  if (!tip.img && !tip.text) { return ''; }
  let h = '<div class="choci-tip-banner">';
  if (tip.url) { h += `<a class="choci-tip-link" href="${esc(tip.url)}">`; }
  h += '<div class="choci-tip-wrap">';
  if (tip.img) { h += `<img class="choci-tip-bg" src="${esc(tip.img)}" alt="" loading="eager">`; }
  if (tip.text || tip.title) {
    h += '<div class="choci-tip-content">';
    if (tip.mascot) { h += `<img class="choci-tip-mascot" src="${esc(tip.mascot)}" alt="צ׳וקי">`; }
    h += '<div class="choci-tip-body"><span class="choci-tip-kicker">הטיפ של צ׳וקי</span>';
    if (tip.title) { h += `<h3 class="choci-tip-title">${esc(tip.title)}</h3>`; }
    if (tip.text) { h += `<p class="choci-tip-text">${esc(tip.text)}</p>`; }
    h += '</div></div>';
  }
  h += '</div>';
  if (tip.url) { h += '</a>'; }
  return h + '</div>';
}

function dealStrip(deal) {
  if (!deal) { return ''; }
  let h = '';
  if (deal.strip && deal.strip.cards.length) {
    h += `<div class="choci-deal-strip">${ribbons('start')}${ribbons('end')}<div class="choci-deal-head"><img class="choci-deal-mascot" src="${esc(deal.strip.mascot)}" alt="" loading="lazy" /><div><h2>בחרי את המבצע הרצוי!</h2><p class="choci-deal-lead">לחיצה על המבצע פותחת את כל המוצרים שמשתתפים בו. ההנחה נכנסת אוטומטית בעגלה.</p></div></div><div class="choci-deal-cards">`;
    for (const c of deal.strip.cards) {
      const alt = `${c.label} — כל ${c.qty} מוצרים מהקבוצה. לחצי לכל המוצרים במבצע`;
      h += `<a class="choci-deal-card" href="${esc(c.link)}">`;
      h += c.img ? `<img src="${esc(c.img)}" alt="${esc(alt)}" loading="lazy" />` : `<span class="d-title">${esc(c.label)}</span>`;
      h += `<span class="d-count">${c.count} מוצרים במבצע</span></a>`;
    }
    h += '</div></div>';
  }
  if (deal.banner) {
    h += `<div class="choci-deal-banner"><b>${esc(deal.banner.label)}</b> — בוחרים ${deal.banner.qty} מוצרים כלשהם מהעמוד הזה, גם שונים, ומשלמים ${deal.banner.price_html}. ההנחה מחושבת אוטומטית בעגלה.</div>`;
  }
  return h;
}

function related(t) {
  if (!t || !t.related) { return ''; }
  const cards = t.related.items.map((p) => {
    const img = p.image && !p.image.placeholder
      ? `<img width="${p.image.width}" height="${p.image.height}" src="${esc(p.image.src)}" class="attachment-woocommerce_thumbnail size-woocommerce_thumbnail wp-post-image" alt="${esc(p.image.alt)}" decoding="async" loading="lazy"${p.image.srcset ? ` srcset="${esc(p.image.srcset)}"` : ''}${p.image.sizes ? ` sizes="auto, ${esc(p.image.sizes)}"` : ''} />`
      : `<img src="${esc(p.image?.src || '')}" alt="Placeholder" width="300" class="woocommerce-placeholder wp-post-image" height="300" />`;
    return `<a class="choci-cr-card" href="${esc(p.link)}"><span class="choci-cr-img">${img}</span><span class="choci-cr-name">${esc(p.name)}</span><span class="choci-cr-price">${p.price_html}</span></a>`;
  }).join('');
  return `<section class="choci-cat-related"><h2 class="choci-cr-title">${esc(t.related.title)}</h2><div class="choci-cr-grid">${cards}</div></section>`;
}

function sidebar(s, formAction, show) {
  if (!s || !show) { return ''; }
  let h = `<aside id="secondary" role="complementary" class="primary-sidebar widget-area sidebar-slug-sidebar-primary sidebar-link-style-normal">
\t<div class="sidebar-inner-wrap">
\t\t`;
  if (s.clear_link) { h += `<a class="choci-clear-filters" href="${esc(s.clear_link)}">נקה את כל הסינונים</a>`; }
  for (const w of s.widgets) {
    if (w.kind === 'layered_nav') {
      h += `<section id="${esc(w.id)}" class="widget woocommerce widget_layered_nav woocommerce-widget-layered-nav"><h2 class="widget-title">${esc(w.title)}</h2><ul class="woocommerce-widget-layered-nav-list">`;
      for (const it of w.items) {
        const cls = `woocommerce-widget-layered-nav-list__item wc-layered-nav-term ${it.chosen ? 'woocommerce-widget-layered-nav-list__item--chosen chosen' : ''}`;
        const inner = it.href ? `<a rel="nofollow" href="${esc(it.href)}">${esc(it.name)}</a>` : `<span>${esc(it.name)}</span>`;
        h += `<li class="${cls}">${inner} <span class="count">(${it.count})</span></li>`;
      }
      h += '</ul></section>';
    } else if (w.kind === 'price_filter') {
      const hidden = (w.hidden || []).map((x) => `<input type="hidden" name="${esc(x.name)}" value="${esc(x.value)}" />`).join('');
      h += `<section id="${esc(w.id)}" class="widget woocommerce widget_price_filter"><h2 class="widget-title">${esc(w.title)}</h2>
<form method="get" action="${esc(formAction)}">
\t<div class="price_slider_wrapper">
\t\t<div class="price_slider" style="display:none;"></div>
\t\t<div class="price_slider_amount" data-step="${w.step}">
\t\t\t<label class="screen-reader-text" for="min_price">מחיר מינימלי</label>
\t\t\t<input type="text" id="min_price" name="min_price" value="${w.cur_min}" data-min="${w.min}" placeholder="מחיר מינימלי" />
\t\t\t<label class="screen-reader-text" for="max_price">מחיר מקסימלי</label>
\t\t\t<input type="text" id="max_price" name="max_price" value="${w.cur_max}" data-max="${w.max}" placeholder="מחיר מקסימלי" />
\t\t\t\t\t\t<button type="submit" class="button">סנן</button>
\t\t\t<div class="price_label" style="display:none;">
\t\t\t\tמחיר: <span class="from"></span> &mdash; <span class="to"></span>
\t\t\t</div>
\t\t\t${hidden}\t\t\t<div class="clear"></div>
\t\t</div>
\t</div>
</form>

</section>`;
    }
  }
  h += `\t</div>
</aside><!-- #secondary -->
`;
  return h;
}

/** גוף עמוד ארכיון שלם (מתחת להדר ומעל הפוטר) */
export function archiveBody(data, { pathname, search }) {
  const a = data.archive;
  const t = a.term;
  const cols = a.columns || 3;
  const sp = new URLSearchParams(search || '');
  sp.delete('paged');
  // הכתובת הבסיסית לעימוד: בלי /page/N/
  const basePath = pathname.replace(/page\/\d+\/?$/, '');
  const pageQs = sp.toString();
  a.hidden_query = [...sp.entries()].filter(([k2]) => !['orderby', 'paged', 'product-page'].includes(k2)).map(([name, value]) => ({ name, value }));

  let loop = '';
  const showSub = a.display_mode === 'subcategories' || a.display_mode === 'both';
  if (showSub || a.products.length) {
    loop += '<ul class="products content-wrap product-archive grid-cols grid-sm-col-2 grid-lg-col-3 woo-archive-action-visible woo-archive-btn-text woo-archive-loop  woo-archive-image-hover-none">';
    let i = 0;
    if (showSub) { for (const c of a.subcategories) { loop += subcatCard(c, i++, cols); } }
    if (a.display_mode !== 'subcategories') { for (const p of a.products) { loop += productCard(p, i++, cols); } }
    loop += '</ul>\n';
  }

  const notFound = !showSub && !a.products.length;
  const h1 = a.is_shop || t ? `<h1 class="choci-sr">${esc(a.is_shop ? a.page_title : t.name)}</h1>` : '';

  let main = `<header class="woocommerce-products-header">
\t
\t</header>
`;
  if (notFound) {
    main += `<div class="woocommerce-no-products-found">
\t
\t<div class="woocommerce-info" role="status">
\t\tלא נמצאו מוצרים התואמים את בחירתך.\t</div>
</div>
${seoText(t, a.paged)}`;
  } else {
    main += dealStrip(t && t.deal) + '<div class="woocommerce-notices-wrapper"></div>' + (showSub && a.display_mode === 'subcategories' ? '' : topRow(a)) + loop;
    if (a.display_mode !== 'subcategories') { main += pagination(a, basePath, pageQs); }
    main += seoText(t, a.paged);
  }
  main += related(t);

  return `<div id="wrapper" class="site wp-site-blocks">
\t\t\t<a class="skip-link screen-reader-text scroll-ignore" href="#main">דילוג לתוכן</a>
\t\t
\t<main id="inner-wrap" class="wrap kt-clear" role="main">
\t\t<div id="choci-bar-slot"></div>${tipBanner(t)}${h1}<div id="primary" class="content-area"><div class="content-container site-container"><main id="main" class="site-main" role="main">${main}</main>${sidebar(a.sidebar, pathname, Object.values(data.body_class || {}).includes('has-sidebar'))}</div></div>\t</main><!-- #inner-wrap -->
\t</div><!-- #wrapper -->
`;
}

/** תוספות לראש העמוד שתלויות בקטגוריה */
export function archiveHead(data) {
  const t = data.archive.term;
  let s = '';
  if (t && t.tips && t.tips.length) { s += '<style>.woocommerce-products-header,.page-header,.entry-hero{display:none !important}</style>'; }
  if (t && t.has_children) {
    s += '<style>.primary-sidebar,.widget-area,#secondary{display:none !important}.has-sidebar .content-container,.has-left-sidebar .content-container{display:block !important;grid-template-columns:1fr !important}.content-area,.primary-content{max-width:100% !important;width:100% !important}</style>';
  }
  return s;
}
