// מעטפת העמוד: ראש העמוד (עיצוב, SEO), ההדר, התוכן, והפוטר.
import { ORIGIN } from './mirror';
import { putCss } from './cssstore';
import { headBoot, headerChrome, footerChrome } from './chrome';

const ALLOW_INDEX = process.env.ALLOW_INDEX === '1';
const KV = '1.5.2'; // גרסת קבצי העיצוב של התבנית
const k = (f) => `<link rel='stylesheet' id='${f === 'splide' ? 'kad-splide' : 'kadence-' + f}-css' href='${ORIGIN}/wp-content/themes/kadence/assets/css/${f === 'splide' ? 'kadence-splide' : f}.min.css?ver=${KV}' media='all' />`;

const SPECULATION = `<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/cart*","/checkout*","/my-account*","/wp-*","/*\\\\?*add-to-cart=*","/*\\\\?*wc-ajax=*","/*\\\\?*remove_item=*"]}},{"not":{"selector_matches":"[rel~=nofollow],[data-no-prefetch],[target=_blank]"}}]},"eagerness":"moderate"}]}</script>`;

const V = 2; // לשבירת מטמון קבצי העיצוב שלנו

function seoHead(html) {
  // תגית robots נקבעת כאן (לפני המעבר לדומיין — האתר החדש לא נסרק)
  let s = String(html || '').replace(/<meta name="robots"[^>]*>\s*/g, '');
  s = s.replace(/<!--[^]*?-->\s*/g, '');
  const robots = ALLOW_INDEX ? '' : '<meta name="robots" content="noindex, nofollow"/>\n';
  return robots + s;
}

const KAD_ARCHIVE = ['rtl', 'header', 'content', 'sidebar', 'woocommerce', 'footer', 'rankmath'];

export function documentHtml({ data, layout, body, extraHead = '', archive = false, kadence = KAD_ARCHIVE, preCss = '', header = true, footHtml = '' }) {
  const bodyClass = Object.values(data.body_class || {}).join(' ').replace('woocommerce-no-js', 'woocommerce-js');
  const customCss = layout.custom_css ? `<link rel="stylesheet" id="wp-custom-css" href="${putCss(layout.custom_css)}" media="all">` : '';
  return `<!doctype html>
<html dir="rtl" lang="he-IL" prefix="og: https://ogp.me/ns#" class="no-js" itemtype="https://schema.org/Blog" itemscope>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
<title>${data.doc_title || ''}</title>
${seoHead(data.seo_head)}
${headBoot()}
<link rel="preconnect" href="${ORIGIN}">
${preCss}<link rel="stylesheet" href="/site/wp-core.css?v=${V}" media="all">
${k('global')}
<link rel="stylesheet" href="/site/kadence-inline.css?v=${V}" media="all">
${kadence.map(k).join('\n')}
<link rel='stylesheet' id='kadence-fonts-gfonts-css' href='https://fonts.googleapis.com/css?family=Assistant:regular,700&#038;display=swap' media='all' />
<link rel="stylesheet" href="/site/choci-head.css?v=${V}" media="all">
${customCss}
<link rel="stylesheet" href="/site/brand.css?v=${V}" media="all">
<link rel="stylesheet" href="/site/chrome.css?v=${V}" media="all">
${extraHead}
${SPECULATION}
</head>
<body class="${bodyClass}">
${header ? headerChrome(layout) : ''}
${body}
${footerChrome(layout, { archive, strip: !(data.singular && String(data.singular.content_html || '').includes('sticky-club')) })}${footHtml}
</body>
</html>`;
}

export function htmlResponse(html, { status = 200, maxAge = 60 } = {}) {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': `public, max-age=${maxAge}, s-maxage=600, stale-while-revalidate=86400`,
    'x-choci-mode': 'native',
  });
  if (!ALLOW_INDEX) { headers.set('x-robots-tag', 'noindex, nofollow'); }
  return new Response(html, { status, headers });
}
