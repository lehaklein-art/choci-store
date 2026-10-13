// דף הבית ועמודי תוכן (אודות, סניפים, מתכונים, צור קשר...) — נבנים כאן.
// התוכן שכתוב בעורך של וורדפרס מגיע כתוכן; רצועות המוצרים והמתכונים בדף הבית נבנות כאן מנתונים.
import { esc } from './chrome';

const HEART = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';

function img(a) {
  if (!a) { return ''; }
  return `<img${Object.entries(a).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')} />`;
}

function homeCard(c) {
  let h = '<div class="card">';
  h += `<button type="button" class="fav choci-wish" data-wish="${c.id}" aria-pressed="false" aria-label="הוספה למועדפים">${HEART}</button>`;
  h += c.img
    ? `<a class="ph cp-has" href="${esc(c.link)}" tabindex="-1" aria-hidden="true">${img(c.img)}</a>`
    : `<a class="ph" href="${esc(c.link)}" tabindex="-1" aria-hidden="true"><span>אין תמונה</span></a>`;
  h += `<b><a class="cp-name" href="${esc(c.link)}">${esc(c.name)}</a></b>`;
  h += c.buy
    ? `<div class="cadd" data-pid="${c.id}"><button type="button" class="cq cq-plus" aria-label="הוספה לסל: ${esc(c.name)}">+</button><span class="cq-num" aria-live="polite">0</span><button type="button" class="cq cq-minus" aria-label="הפחתת כמות: ${esc(c.name)}" disabled>&minus;</button></div>`
    : '<div class="cp-oos">אזל מהמלאי</div>';
  h += `<div class="price">${c.price_html}</div></div>`;
  return h;
}

function prodsSection(r) {
  if (!r || !r.tabs || !r.tabs.length) { return ''; }
  const btns = r.tabs.map((t, i) => `<button type="button" role="tab" id="cp-tab-${t.slug}" aria-controls="cp-panel-${t.slug}" aria-selected="${i ? 'false' : 'true'}" tabindex="${i ? '-1' : '0'}" class="${i ? '' : 'is-on'}">${esc(t.label)}</button>`).join('');
  const panels = r.tabs.map((t, i) => `<div class="prods" id="cp-panel-${t.slug}" role="tabpanel" aria-labelledby="cp-tab-${t.slug}" data-page="0"${i ? ' hidden' : ''}>${t.cards.map(homeCard).join('')}</div>`).join('');
  return `<section class="sec bg-gray prods-sec" id="choci-prods"><div class="wrap"><h2 class="cp-sr">מוצרים נבחרים</h2><div class="tabs" role="tablist" aria-label="מוצרים נבחרים">${btns}</div><div class="prods-rail"><button type="button" class="r-nav r-prev" aria-label="הקודם">&#10095;</button>${panels}<button type="button" class="r-nav r-next" aria-label="הבא">&#10094;</button></div><a class="cp-all" href="${esc(r.shop)}">לכל המוצרים &raquo;</a></div></section>`;
}

function recipesSection(r) {
  if (!r || !r.recipes || !r.recipes.length) { return ''; }
  const cards = r.recipes.map((x) => `<article><a class="cr-img" href="${esc(x.link)}" tabindex="-1" aria-hidden="true">${img(x.img)}</a><div class="txt"><h3><a href="${esc(x.link)}">${esc(x.title)}</a></h3><p>${esc(x.excerpt)}</p><a class="more" href="${esc(x.link)}">קראו עוד &raquo;</a></div></article>`).join('');
  return `<section class="sec blog-sec" id="choci-recipes-home"><div class="wrap"><h2 class="h-sec h-tight">מתכונים</h2><a class="ul lnk-all" href="${esc(r.recipes_all)}">לכל המתכונים &raquo;</a><div class="blog">${cards}</div></div></section>`;
}

/** גוף עמוד תוכן או דף הבית */
export function singularBody(data) {
  const s = data.singular;
  let content = s.content_html || '';
  if (s.is_front_page) {
    content = content.replace('<!--CHX:prods-->', prodsSection(s.rails)).replace('<!--CHX:recipes-->', recipesSection(s.rails));
  }
  const pre = s.is_front_page
    ? '<a class="choci-skip" href="#choci-main">דילוג לתוכן המרכזי</a><h1 class="choci-sr">צ׳וקי — חנות מוצרי אפייה, קישוט וקונדיטוריה</h1>'
    : '';
  return `${pre}<div id="wrapper" class="site wp-site-blocks">
\t\t\t<a class="skip-link screen-reader-text scroll-ignore" href="#main">דילוג לתוכן</a>
\t\t
\t<main id="inner-wrap" class="wrap kt-clear" role="main">
\t\t<div id="primary" class="content-area">
\t<div class="content-container site-container">
\t\t<div id="main" class="site-main">
\t\t\t<div class="woocommerce kadence-woo-messages-none-woo-pages woocommerce-notices-wrapper"></div>\t\t\t<div class="content-wrap">
\t\t\t\t<article id="post-${s.id}" class="${s.post_class.join(' ')}">
\t<div class="entry-content-wrap">
\t\t
<div class="entry-content single-content">
\t${content}</div><!-- .entry-content -->
\t</div>
</article><!-- #post-${s.id} -->

\t\t\t</div>
\t\t\t\t\t</div><!-- #main -->
\t\t\t</div>
</div><!-- #primary -->
\t</main><!-- #inner-wrap -->
\t</div><!-- #wrapper -->
`;
}

export const PAGE_HEAD = '<style>body.page{background:#ffffff;}.entry-hero.page-hero-section .entry-header{min-height:200px;}</style>';
