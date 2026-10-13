// העמודים שנבנים בטכנולוגיה החדשה: נתונים גולמיים מהמחסן → עמוד שלם שנבנה כאן.
import { pageData, layoutData, Redirect } from './data';
import { documentHtml } from './document';
import { archiveBody, archiveHead } from './archive';

const PRICE_SLIDER = '<script>var woocommerce_price_slider_params = {"currency_format_num_decimals":"0","currency_format_symbol":"\\u20aa","currency_format_decimal_sep":".","currency_format_thousand_sep":",","currency_format":"%v\\u00a0%s"};</script>';

const EMOJI = '<script id="wp-emoji-settings" type="application/json">{"baseUrl":"https://s.w.org/images/core/emoji/17.0.2/72x72/","ext":".png","svgUrl":"https://s.w.org/images/core/emoji/17.0.2/svg/","svgExt":".svg","source":{"concatemoji":"' + (process.env.WC_URL || 'https://choci.kinsta.cloud') + '/wp-includes/js/wp-emoji-release.min.js?ver=7.1.3"}}</script>\n<script type="module" src="/site/wp-emoji-loader.js?v=1"></script>';

/** אילו כתובות כבר עברו לבנייה החדשה */
export function isNativePath(pathname, search) {
  if (/^\/product-category\//.test(pathname)) { return true; }
  if (/^\/shop\/?(page\/\d+\/?)?$/.test(pathname)) { return true; }
  if (pathname === '/' && new URLSearchParams(search).has('s')) { return true; }
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
      + `<script>window.CHOCI_WP=${JSON.stringify(process.env.WC_URL || 'https://choci.kinsta.cloud')}</script><script src="/choci-lite.js?v=3" defer></script>`
      + EMOJI;
    const html = documentHtml({ data, layout, body, extraHead: archiveHead(data), archive: true });
    return { html, status: data.status || 200 };
  }
  return null; // עוד לא עבר — העמוד יוגש בשיטה הקודמת
}
