// קובץ העיצוב המקורי של האתר — מקוצץ לכללים שבשימוש בלבד (או המלא, עד שהמקוצץ מוכן)
import { getSiteCss } from '../../lib/wp';
import { getLeanCss } from '../../lib/css';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const v = new URL(req.url).searchParams.get('v') || 'full';
  let css = '';
  if (v !== 'full') {
    const s = await getLeanCss();
    css = s.css;
  }
  if (!css) css = (await getSiteCss()).replace(/@import\s+url\([^)]*\);?\s*/g, '');
  if (!css) return new Response('/* css unavailable */', { status: 502, headers: { 'content-type': 'text/css' } });
  return new Response(css, {
    headers: {
      'content-type': 'text/css; charset=utf-8',
      'cache-control': v === 'full' ? 'public, max-age=300' : 'public, max-age=31536000, immutable',
    },
  });
}
