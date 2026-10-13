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

/* ---------- פוסט (מתכון) ---------- */
const ARROW_L = '<span class="kadence-svg-iconset svg-baseline"><svg aria-hidden="true" class="kadence-svg-icon kadence-arrow-left-alt-svg" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" width="29" height="28" viewBox="0 0 29 28"><title>Previous</title><path d="M28 12.5v3c0 0.281-0.219 0.5-0.5 0.5h-19.5v3.5c0 0.203-0.109 0.375-0.297 0.453s-0.391 0.047-0.547-0.078l-6-5.469c-0.094-0.094-0.156-0.219-0.156-0.359v0c0-0.141 0.063-0.281 0.156-0.375l6-5.531c0.156-0.141 0.359-0.172 0.547-0.094 0.172 0.078 0.297 0.25 0.297 0.453v3.5h19.5c0.281 0 0.5 0.219 0.5 0.5z"></path>\n\t\t\t\t</svg></span>';
const ARROW_R = '<span class="kadence-svg-iconset svg-baseline"><svg aria-hidden="true" class="kadence-svg-icon kadence-arrow-right-alt-svg" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" width="27" height="28" viewBox="0 0 27 28"><title>Continue</title><path d="M27 13.953c0 0.141-0.063 0.281-0.156 0.375l-6 5.531c-0.156 0.141-0.359 0.172-0.547 0.094-0.172-0.078-0.297-0.25-0.297-0.453v-3.5h-19.5c-0.281 0-0.5-0.219-0.5-0.5v-3c0-0.281 0.219-0.5 0.5-0.5h19.5v-3.5c0-0.203 0.109-0.375 0.297-0.453s0.391-0.047 0.547 0.078l6 5.469c0.094 0.094 0.156 0.219 0.156 0.359v0z"></path>\n\t\t\t\t</svg></span>';

function relatedCard(r) {
  const thumb = r.img ? `\t\t\t<a aria-hidden="true" tabindex="-1" role="presentation" class="post-thumbnail kadence-thumbnail-ratio-2-3" aria-label="${esc(r.title)}" href="${esc(r.link)}">
\t\t\t<div class="post-thumbnail-inner">
\t\t\t\t${img(r.img)}\t\t\t</div>
\t\t</a><!-- .post-thumbnail -->
` : '';
  const cats = r.cats.length ? `\t\t\t<div class="entry-taxonomies">
\t\t\t<span class="category-links term-links category-style-normal">
\t\t\t\t${r.cats.map((c) => `<a href="${esc(c.link)}" class="category-link-${esc(c.slug)}" rel="tag">${esc(c.name)}</a>`).join(' | ')}\t\t\t</span>
\t\t</div><!-- .entry-taxonomies -->
` : '';
  return `<li class="entry-list-item carousel-item splide__slide"><article class="${r.post_class.join(' ')}">
${thumb}\t\t\t<div class="entry-content-wrap">
\t\t<header class="entry-header">

${cats}\t\t<h3 class="entry-title"><a href="${esc(r.link)}" rel="bookmark">${esc(r.title)}</a></h3><div class="entry-meta entry-meta-divider-dot">
\t<span class="posted-by"><span class="meta-label">מאת</span><span class="author vcard"><a class="url fn n" href="${esc(r.author.link)}">${esc(r.author.name)}</a></span></span>\t\t\t\t\t<span class="posted-on">
\t\t\t\t\t\t<time class="entry-date published" datetime="${esc(r.pub_iso)}" itemprop="datePublished">${esc(r.pub_text)}</time><time class="updated" datetime="${esc(r.mod_iso)}" itemprop="dateModified">${esc(r.mod_text)}</time>\t\t\t\t\t</span>
\t\t\t\t\t</div><!-- .entry-meta -->
</header><!-- .entry-header -->
\t<div class="entry-summary">
\t\t${r.excerpt_html}\t</div><!-- .entry-summary -->
\t<footer class="entry-footer">
\t\t<div class="entry-actions">
\t\t<p class="more-link-wrap">
\t\t\t<a href="${esc(r.link)}" class="post-more-link">
\t\t\t\tRead More<span class="screen-reader-text"> ${esc(r.title)}</span>${ARROW_R}\t\t\t</a>
\t\t</p>
\t</div><!-- .entry-actions -->
\t</footer><!-- .entry-footer -->
\t</div>
</article>
</li>`;
}

function relatedBlock(list) {
  if (!list || !list.length) { return ''; }
  return `\t\t<div class="entry-related alignfull entry-related-style-wide">
\t\t\t<div class="entry-related-inner content-container site-container">
\t\t\t\t<div class="entry-related-inner-content alignwide">
\t\t\t\t\t<h2 class="entry-related-title" id="related-posts-title">Similar Posts</h2>\t\t\t\t\t<div class="entry-related-carousel kadence-slide-init splide" aria-labelledby="related-posts-title" data-columns-xxl="3" data-columns-xl="3" data-columns-md="3" data-columns-sm="2" data-columns-xs="2" data-columns-ss="1" data-slider-anim-speed="400" data-slider-scroll="1" data-slider-dots="true" data-slider-arrows="true" data-slider-hover-pause="false" data-slider-auto="false" data-slider-speed="7000" data-slider-gutter="40" data-slider-loop="true" data-slider-next-label="Next" data-slider-slide-label="Posts" data-slider-prev-label="Previous">
\t\t\t\t\t\t<div class="splide__track">
\t\t\t\t\t\t\t<ul class="splide__list kadence-posts-list grid-cols grid-sm-col-2 grid-lg-col-3">
\t\t\t\t\t\t\t\t${list.map(relatedCard).join('')}\t\t\t\t\t\t\t</ul>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div><!-- .entry-author -->
`;
}

function commentsBlock(s, pathname) {
  if (!s.comments_open) { return ''; }
  return `\t\t<div id="comments" class="comments-area">
\t\t<div id="respond" class="comment-respond">
\t\t<h3 id="reply-title" class="comment-reply-title">כתיבת תגובה <small><a rel="nofollow" id="cancel-comment-reply-link" href="${esc(pathname)}#respond" style="display:none;">לבטל</a></small></h3><form action="/wp-comments-post.php" method="post" id="commentform" class="comment-form"><p class="comment-notes"><span id="email-notes">האימייל לא יוצג באתר.</span> <span class="required-field-message">שדות החובה מסומנים <span class="required">*</span></span></p><p class="comment-form-comment comment-form-float-label"><textarea id="comment" name="comment" placeholder="Leave a comment..." cols="45" rows="8" maxlength="65525" aria-required="true" required="required"></textarea><label class="float-label" for="comment">Comment <span class="required">*</span></label></p><div class="comment-input-wrap has-url-field"><p class="comment-form-author"><input aria-label="Name" id="author" name="author" type="text" placeholder="John Doe" value="" size="30" maxlength="245" aria-required='true' required='required' /><label class="float-label" for="author">Name <span class="required">*</span></label></p>
<p class="comment-form-email"><input aria-label="Email" id="email" name="email" type="email" placeholder="john@example.com" value="" size="30" maxlength="100" aria-describedby="email-notes" aria-required='true' required='required' /><label class="float-label" for="email">Email <span class="required">*</span></label></p>
<p class="comment-form-url"><input aria-label="Website" id="url" name="url" type="url" placeholder="https://www.example.com" value="" size="30" maxlength="200" /><label class="float-label" for="url">Website</label></p></div>
<p class="comment-form-cookies-consent"><input id="wp-comment-cookies-consent" name="wp-comment-cookies-consent" type="checkbox" value="yes" /> <label for="wp-comment-cookies-consent">שמור בדפדפן זה את השם, האימייל והאתר שלי לפעם הבאה שאגיב.</label></p>
<p class="form-submit"><input name="submit" type="submit" id="submit" class="submit" value="להגיב" /> <input type='hidden' name='comment_post_ID' value='${s.id}' id='comment_post_ID' />
<input type='hidden' name='comment_parent' id='comment_parent' value='0' />
</p></form>\t</div><!-- #respond -->
\t</div><!-- #comments -->
`;
}

export function postBody(data, pathname) {
  const s = data.singular;
  const thumb = s.thumb ? `\t\t\t\t\t<div class="post-thumbnail article-post-thumbnail kadence-thumbnail-position-behind alignwide kadence-thumbnail-ratio-2-3">
\t\t<div class="post-thumbnail-inner">
\t\t\t${img(s.thumb)}\t\t</div>
\t</div><!-- .post-thumbnail -->
` : '';
  const cats = s.cats.length ? `\t\t\t<div class="entry-taxonomies">
\t\t\t<span class="category-links term-links category-style-normal">
\t\t\t\t${s.cats.map((c) => `<a href="${esc(c.link)}" rel="tag">${esc(c.name)}</a>`).join(' | ')}\t\t\t</span>
\t\t</div><!-- .entry-taxonomies -->
` : '';
  const nav = (s.prev || s.next) ? `\t<nav class="navigation post-navigation" aria-label="פוסטים">
\t\t<h2 class="screen-reader-text">ניווט</h2>
\t\t<div class="nav-links">${s.prev ? `<div class="nav-previous"><a href="${esc(s.prev.link)}" rel="prev"><div class="post-navigation-sub"><small>${ARROW_L}Previous</small></div>${esc(s.prev.title)}</a></div>` : ''}${s.next ? `<div class="nav-next"><a href="${esc(s.next.link)}" rel="next"><div class="post-navigation-sub"><small>Next${ARROW_R}</small></div>${esc(s.next.title)}</a></div>` : ''}</div>
\t</nav>` : '';
  return `<div id="wrapper" class="site wp-site-blocks">
\t\t\t<a class="skip-link screen-reader-text scroll-ignore" href="#main">דילוג לתוכן</a>
\t\t
\t<main id="inner-wrap" class="wrap kt-clear" role="main">
\t\t<div id="primary" class="content-area">
\t<div class="content-container site-container">
\t\t<div id="main" class="site-main">
\t\t\t<div class="woocommerce kadence-woo-messages-none-woo-pages woocommerce-notices-wrapper"></div>\t\t\t<div class="content-wrap">
${thumb}\t\t\t<article id="post-${s.id}" class="${s.post_class.join(' ')}">
\t<div class="entry-content-wrap">
\t\t<header class="entry-header post-title title-align-inherit title-tablet-align-inherit title-mobile-align-inherit">
${cats}\t\t<h1 class="entry-title">${esc(s.title)}</h1><div class="entry-meta entry-meta-divider-dot">
\t<span class="posted-by"><span class="meta-label">מאת</span><span class="author vcard"><a class="url fn n" href="${esc(s.author.link)}">${esc(s.author.name)}</a></span></span>\t\t\t\t\t<span class="posted-on">
\t\t\t\t\t\t<time class="entry-date published updated" datetime="${esc(s.date_iso)}" itemprop="dateModified">${esc(s.mod_text || s.date_text)}</time>\t\t\t\t\t</span>
\t\t\t\t\t</div><!-- .entry-meta -->
</header><!-- .entry-header -->

<div class="entry-content single-content">
\t${s.content_html}</div><!-- .entry-content -->
<footer class="entry-footer">
\t</footer><!-- .entry-footer -->
\t</div>
</article><!-- #post-${s.id} -->


${nav}${relatedBlock(s.related)}${commentsBlock(s, pathname)}\t\t\t</div>
\t\t\t\t\t</div><!-- #main -->
\t\t\t</div>
</div><!-- #primary -->
\t</main><!-- #inner-wrap -->
\t</div><!-- #wrapper -->
`;
}

export function postHead(data) {
  const s = data.singular;
  let h = '<style>.entry-hero.post-hero-section .entry-header{min-height:200px;}</style>';
  if ((s.cat_ids || []).map(Number).includes(318)) { h += '<link rel="stylesheet" href="/site/recipe.css?v=1" media="all">'; }
  for (const j of s.jsonld_raw || []) { h += `\n<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`; }
  return h;
}

export function postFoot(origin) {
  return `<script src="${origin}/wp-includes/js/comment-reply.min.js?ver=7.1.3" async></script>
<script src="${origin}/wp-content/themes/kadence/assets/js/splide.min.js?ver=1.5.2" defer></script>
<script>var kadenceSlideConfig = {"of":"of","to":"to","slide":"Slide","next":"Next","prev":"Previous"};</script>
<script src="${origin}/wp-content/themes/kadence/assets/js/splide-init.min.js?ver=1.5.2" defer></script>`;
}
