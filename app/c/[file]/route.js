// קבצי העיצוב של האתר (בדיוק כמו במקור) — נשמרים בדפדפן לשנה
import { getCss } from '../../../lib/cssstore';
import { buildFromWp } from '../../../lib/wp';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { file } = await params;
  const h = String(file).replace(/\.css$/, '');
  let css = getCss(h);
  if (css === null) {
    // אחרי הפעלה מחדש של השרת: בונים מחדש את דף הבית (שמכיל את רוב קבצי העיצוב) ומנסים שוב
    try { await buildFromWp('/'); } catch {}
    css = getCss(h);
  }
  if (css === null) return new Response('/* not found */', { status: 404, headers: { 'content-type': 'text/css', 'cache-control': 'no-store' } });
  return new Response(css, { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable' } });
}
