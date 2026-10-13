// כלי בדיקה פנימי: מציג את העמוד המקורי מוורדפרס בדיוק כמו שהוא, דרך הכתובת הזו —
// כדי שאפשר יהיה להשוות אוטומטית בין המקור לאתר החדש באותו דפדפן. לא מופיע בגוגל.
import { ORIGIN } from '../../../lib/mirror';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/orig-check/, '') || '/';
  const res = await fetch(ORIGIN + path + url.search, { headers: { accept: 'text/html' }, cache: 'no-store' });
  let html = await res.text();
  // משאירים את כל הקבצים מהשרת המקורי, רק מוסיפים <base> כדי שקישורים יחסיים ייטענו משם
  html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${ORIGIN}/"><meta name="robots" content="noindex">`);
  return new Response(html, { status: res.status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}
