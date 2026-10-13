// העמודים שנבנים בטכנולוגיה החדשה: נתונים גולמיים מהמחסן → עמוד שלם שנבנה כאן.
import { pageData, layoutData, Redirect } from './data';
import { documentHtml } from './document';
import { archiveBody, archiveHead } from './archive';
import { productBody, PSWP, PRODUCT_PARAMS, VARIATION_PARAMS } from './product';
import { singularBody, PAGE_HEAD, postBody, postHead, postFoot, postsArchiveBody } from './singular';

const PRICE_SLIDER = '<script>var woocommerce_price_slider_params = {"currency_format_num_decimals":"0","currency_format_symbol":"\\u20aa","currency_format_decimal_sep":".","currency_format_thousand_sep":",","currency_format":"%v\\u00a0%s"};</script>';

const EMOJI = '<script id="wp-emoji-settings" type="application/json">{"baseUrl":"https://s.w.org/images/core/emoji/17.0.2/72x72/","ext":".png","svgUrl":"https://s.w.org/images/core/emoji/17.0.2/svg/","svgExt":".svg","source":{"concatemoji":"' + (process.env.WC_URL || 'https://choci.kinsta.cloud') + '/wp-includes/js/wp-emoji-release.min.js?ver=7.1.3"}}</script>\n<script type="module" src="/site/wp-emoji-loader.js?v=1"></script>';

/** אילו כתובות כבר עברו לבנייה החדשה */
/** כל עמוד עובר קודם לבנייה החדשה; מה שעוד לא נתמך (למשל ארכיון בלוג) חוזר לשיטה הקודמת */
export function isNativePath() {
  return true;
}

const NOT_FOUND = `<div id="wrapper" class="site wp-site-blocks">
\t\t\t<a class="skip-link screen-reader-text scroll-ignore" href="#main">דילוג לתוכן</a>
\t\t
\t<main id="inner-wrap" class="wrap kt-clear" role="main">
\t\t<div id="primary" class="content-area">
\t<div class="content-container site-container">
\t\t<div id="main" class="site-main">
\t\t\t<div class="woocommerce kadence-woo-messages-none-woo-pages woocommerce-notices-wrapper"></div>\t\t\t<div class="content-wrap">
\t\t\t\t<section class="error">

\t<div class="page-content entry content-bg">

\t\t<div class="entry-content-wrap">

\t\t\t\t<header class="page-header">
\t\t<h1 class="page-title">
\t\t\tאופס! העמוד הזה לא נמצא\t\t</h1>
\t</header><!-- .page-header -->
\t\t\t\t<p>
\t\t\t\tנראה שהעמוד זז או הוסר. אפשר לחפש מוצר כאן, או לחזור לדף הבית ולהמשיך משם.\t\t\t</p>

\t\t\t<form role="search" method="get" class="search-form" action="/">
\t\t\t\t<label>
\t\t\t\t\t<span class="screen-reader-text">חיפוש:</span>
\t\t\t\t\t<input type="search" class="search-field" placeholder="חיפוש &hellip;" value="" name="s" />
\t\t\t\t</label>
\t\t\t\t<input type="submit" class="search-submit" value="חיפוש" />
\t\t\t<div class="kadence-search-icon-wrap"><span class="kadence-svg-iconset"><svg aria-hidden="true" class="kadence-svg-icon kadence-search-svg" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" width="26" height="28" viewBox="0 0 26 28"><title>חיפוש</title><path d="M18 13c0-3.859-3.141-7-7-7s-7 3.141-7 7 3.141 7 7 7 7-3.141 7-7zM26 26c0 1.094-0.906 2-2 2-0.531 0-1.047-0.219-1.406-0.594l-5.359-5.344c-1.828 1.266-4.016 1.937-6.234 1.937-6.078 0-11-4.922-11-11s4.922-11 11-11 11 4.922 11 11c0 2.219-0.672 4.406-1.937 6.234l5.359 5.359c0.359 0.359 0.578 0.875 0.578 1.406z"></path>
\t\t\t\t</svg></span></div></form>\t\t</div>
\t</div><!-- .page-content -->
</section><!-- .error -->
\t\t\t</div>
\t\t\t\t\t</div><!-- #main -->
\t\t\t</div>
</div><!-- #primary -->
\t</main><!-- #inner-wrap -->
\t</div><!-- #wrapper -->
`;

export async function renderNative(pathname, search) {
  let data;
  try {
    data = await pageData(pathname, search);
  } catch (e) {
    if (e instanceof Redirect) { return { redirect: e.location, status: e.status }; }
    throw e;
  }
  const layout = await layoutData();
  if (data.type === 'archive') {
    const body = archiveBody(data, { pathname, search })
      + PRICE_SLIDER
      + `<script>window.CHOCI_WP=${JSON.stringify(process.env.WC_URL || 'https://choci.kinsta.cloud')}</script><script src="/choci-lite.js?v=4" defer></script>`
      + EMOJI;
    const html = documentHtml({ data, layout, body, extraHead: archiveHead(data), archive: true });
    return { html, status: data.status || 200 };
  }
  if (data.type === 'product' && data.product) {
    const lite = `<script>window.CHOCI_WP=${JSON.stringify(process.env.WC_URL || 'https://choci.kinsta.cloud')}</script>`;
    const body = productBody(data, layout)
      + PRODUCT_PARAMS + lite + '<script src="/choci-lite.js?v=4" defer></script>'
      + (data.product.type === 'variable' ? VARIATION_PARAMS : '')
      + '<script src="/site/product.js?v=1" defer></script>'
      + PSWP + EMOJI;
    const WCA = `${process.env.WC_URL || 'https://choci.kinsta.cloud'}/wp-content/plugins/woocommerce/assets/css/photoswipe`;
    const preCss = `<link rel='stylesheet' id='photoswipe-css' href='${WCA}/photoswipe.min.css?ver=11.1.0' media='all' />\n<link rel='stylesheet' id='photoswipe-default-skin-css' href='${WCA}/default-skin/default-skin.min.css?ver=11.1.0' media='all' />\n`;
    const html = documentHtml({ data, layout, body, preCss, kadence: ['rtl', 'header', 'content', 'comments', 'related-posts', 'splide', 'woocommerce', 'footer', 'rankmath'] });
    return { html, status: data.status || 200 };
  }
  if (data.type === 'singular' && data.singular && data.singular.post_type === 'page') {
    const front = data.singular.is_front_page;
    const body = singularBody(data) + EMOJI;
    const html = documentHtml({
      data, layout, body,
      header: !front,
      extraHead: PAGE_HEAD + (front ? '<link rel="stylesheet" href="/site/home.css?v=1" media="all">' : ''),
      kadence: ['rtl', 'header', 'content', 'woocommerce', 'footer', 'rankmath'],
      footHtml: front ? '<script src="/site/home.js?v=1" defer></script>' : '',
    });
    return { html, status: data.status || 200 };
  }
  if (data.type === 'singular' && data.singular && data.singular.post_type === 'post' && !data.singular.comment_count) {
    const origin = process.env.WC_URL || 'https://choci.kinsta.cloud';
    const body = postBody(data, pathname) + EMOJI;
    const html = documentHtml({
      data, layout, body,
      extraHead: postHead(data),
      kadence: ['rtl', 'header', 'content', 'comments', 'related-posts', 'splide', 'woocommerce', 'footer', 'rankmath'],
      footHtml: postFoot(origin),
    });
    return { html, status: data.status || 200 };
  }
  if (data.type === 'posts' && data.posts) {
    const html = documentHtml({ data, layout, body: postsArchiveBody(data, pathname) + EMOJI, kadence: ['rtl', 'header', 'content', 'woocommerce', 'footer', 'rankmath'] });
    return { html, status: data.status || 200 };
  }
  if (data.status === 404) {
    const html = documentHtml({ data, layout, body: NOT_FOUND + EMOJI, kadence: ['rtl', 'header', 'content', 'woocommerce', 'footer', 'rankmath'] });
    return { html, status: 404 };
  }
  return null; // עוד לא עבר — העמוד יוגש בשיטה הקודמת
}
