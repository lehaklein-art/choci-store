// קובץ העיצוב המקורי, מקוצץ: נשארים רק הכללים שבאמת מופיעים בעמודי האתר.
// המראה לא משתנה — זה אותו עיצוב בדיוק, בלי מאות כללים של וורדפרס שאינם בשימוש.
import { createHash } from 'node:crypto';
import { PurgeCSS } from 'purgecss';
import { getSiteCss } from './wp';

// עמודים לדוגמה מכל סוג — כדי לא לפספס אף כלל עיצוב שבשימוש
const SAMPLE_PATHS = [
  '/',
  '/product-category/raw-materials/',
  '/product-category/raw-materials/%d7%90%d7%91%d7%a7%d7%95%d7%aa/',
  '/product-category/raw-materials/%d7%90%d7%91%d7%a7%d7%95%d7%aa/page/2/',
  '/product-category/%d7%9e%d7%91%d7%a6%d7%a2%d7%99%d7%9d/',
  '/product-category/baking-tools/',
  '/product/cmc-%D7%90%D7%91%D7%A7%D7%AA-%D7%99%D7%99%D7%91%D7%95%D7%A9-%D7%95%D7%94%D7%A7%D7%A9%D7%99%D7%94-%D7%9C%D7%91%D7%A6%D7%A7-%D7%A1%D7%95%D7%9B%D7%A8/',
  '/product/%d7%98%d7%95%d7%a4%d7%a8%d7%99%d7%9d-%d7%9c%d7%91%d7%91%d7%95%d7%aa-%d7%a2%d7%9c-%d7%9e%d7%a7%d7%9c-%d7%a1%d7%98-7-%d7%99%d7%97%d7%99%d7%93%d7%95%d7%aa/',
  '/product/%d7%a8%d7%95%d7%99%d7%90%d7%9c-%d7%90%d7%99%d7%99%d7%a1%d7%99%d7%a0%d7%92-%d7%aa%d7%9b%d7%9c%d7%aa/',
  '/recipes/',
  '/%d7%9e%d7%93%d7%a8%d7%99%d7%9a-%d7%94%d7%a6%d7%a0%d7%98%d7%a8%d7%99%d7%9d-%d7%9b%d7%9c-%d7%94%d7%a1%d7%93%d7%a8%d7%95%d7%aa-%d7%95%d7%9c%d7%9e%d7%94-%d7%9e%d7%a9%d7%aa%d7%9e%d7%a9%d7%99%d7%9d-%d7%91/',
  '/branches/', '/transfer/', '/wishlist/', '/contact/', '/about/', '/terms/', '/returns/', '/privacy-policy/', '/accessibility-statement/', '/shop/',
  '/?s=%D7%A9%D7%95%D7%A7%D7%95%D7%9C%D7%93&post_type=product',
  '/this-page-does-not-exist-404/',
];

// כללים שמופעלים רק אחרי לחיצה (חלונות נפתחים, מצבי נגישות, עגלה צדדית וכו') — נשמרים תמיד
const SAFELIST = {
  standard: [/^ca-/, /^is-/, /open/, /active/, /show/, /toggle/, /^ccart/, /^cmnav/, /^crail/, /^choci/, /^cc-/, /^cf-/, /^cq/, /^cw-/, /pswp/, /flex/, /zoom/, /^woocommerce/, /^wc-/, /^wp-/, /select2/, /^ui-/, /price_slider/, /^kadence/, /^kt-/, /current/, /^drawer/, /^menu/, /^sub-/, /^mega/, /^s-/, /^hdr/, /^ftr/, /hidden/, /^screen-reader/, /visible/, /loading/, /added/, /^blockUI/, /^select/, /^onsale/, /^star/, /^rtl/, /^has-/],
  greedy: [/data-ca/, /aria-/, /dir=/],
};

let state = { t: 0, css: '', hash: '', busy: null };

async function build() {
  const { buildFromWp } = await import('./wp');
  const [full, ...pages] = await Promise.all([
    getSiteCss(),
    ...SAMPLE_PATHS.map((p) => buildFromWp(p).then((x) => x.root.toString()).catch(() => '')),
  ]);
  if (!full) throw new Error('no css');
  const res = await new PurgeCSS().purge({
    content: pages.filter(Boolean).map((raw) => ({ raw, extension: 'html' })),
    css: [{ raw: full.replace(/@import\s+url\([^)]*\);?\s*/g, '') }],
    safelist: SAFELIST,
    fontFace: false,
    keyframes: false,
    variables: false,
  });
  const css = res.map((r) => r.css).join('\n');
  return { css, hash: createHash('sha1').update(css).digest('hex').slice(0, 10) };
}

/** מחזיר את העיצוב המקוצץ; נבנה פעם בשעה ברקע */
export async function getLeanCss() {
  const fresh = Date.now() - state.t < 3600e3;
  if (state.css && fresh) return state;
  if (!state.busy) {
    state.busy = build()
      .then((r) => { state = { t: Date.now(), css: r.css, hash: r.hash, busy: null }; })
      .catch(() => { state.busy = null; });
  }
  if (state.css) return state; // מגישים את הגרסה הקיימת, ומרעננים ברקע
  await state.busy;
  return state;
}
