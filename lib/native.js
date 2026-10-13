// העמודים שנבנים בטכנולוגיה החדשה: נתונים גולמיים מהמחסן → עמוד שלם שנבנה כאן.
import { pageData, layoutData, Redirect } from './data';
import { documentHtml } from './document';
import { archiveBody, archiveHead } from './archive';
import { productBody, PSWP, PRODUCT_PARAMS, VARIATION_PARAMS } from './product';
import { singularBody, PAGE_HEAD } from './singular';

const PRICE_SLIDER = '<script>var woocommerce_price_slider_params = {"currency_format_num_decimals":"0","currency_format_symbol":"\\u20aa","currency_format_decimal_sep":".","currency_format_thousand_sep":",","currency_format":"%v\\u00a0%s"};</script>';

const EMOJI = '<script id="wp-emoji-settings" type="application/json">{"baseUrl":"https://s.w.org/images/core/emoji/17.0.2/72x72/","ext":".png","svgUrl":"https://s.w.org/images/core/emoji/17.0.2/svg/","svgExt":".svg","source":{"concatemoji":"' + (process.env.WC_URL || 'https://choci.kinsta.cloud') + '/wp-includes/js/wp-emoji-release.min.js?ver=7.1.3"}}</script>\n<script type="module" src="/site/wp-emoji-loader.js?v=1"></script>';

/** אילו כתובות כבר עברו לבנייה החדשה */
export function isNativePath(pathname, search) {
  if (/^\/product-category\//.test(pathname)) { return true; }
  if (/^\/product\/[^/]+\/?$/.test(pathname)) { return true; }
  if (/^\/shop\/?(page\/\d+\/?)?$/.test(pathname)) { return true; }
  if (pathname === '/' && new URLSearchParams(search).has('s')) { return true; }
  if (pathname === '/' && !search) { return true; }
  if (/^\/[^/.]+\/?$/.test(pathname)) { return true; } // עמודים ופוסטים בכתובת של רמה אחת
  return false;
}

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
  return null; // עוד לא עבר — העמוד יוגש בשיטה הקודמת
}
