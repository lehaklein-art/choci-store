// קובץ העיצוב המקורי של האתר (צבעים, גופנים, הדר, כפתורים וכו') — מועתק מוורדפרס כמו שהוא
import { ORIGIN } from '../../lib/mirror';

export const dynamic = 'force-dynamic';

export async function GET() {
  const res = await fetch(`${ORIGIN}/wp-content/uploads/choci-export/site.css`, { next: { revalidate: 3600 } });
  if (!res.ok) return new Response('/* css unavailable */', { status: 502, headers: { 'content-type': 'text/css' } });
  const css = (await res.text()).replace(/@import\s+url\([^)]*\);?\s*/g, '');
  return new Response(css, {
    headers: {
      'content-type': 'text/css; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
