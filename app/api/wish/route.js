// נתוני המועדפים (מוצרים לפי מזהים) — מהמחסן כנתונים בלבד; הבנייה נעשית בדפדפן
import { ORIGIN } from '../../../lib/mirror';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').map((x) => parseInt(x, 10)).filter((x) => x > 0).slice(0, 100);
  if (!ids.length) { return Response.json({ items: [] }); }
  try {
    const r = await fetch(`${ORIGIN}/?choci_api=wish&ids=${ids.join(',')}`, { cache: 'no-store' });
    if (!r.ok) { throw new Error(String(r.status)); }
    const j = await r.json();
    return Response.json(j, { headers: { 'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' } });
  } catch {
    return Response.json({ error: 'unavailable' }, { status: 502, headers: { 'cache-control': 'no-store' } });
  }
}
