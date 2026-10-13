// קבלת נתונים גולמיים מוורדפרס (המחסן). וורדפרס לא בונה כאן שום עמוד — רק מחזיר נתונים.
import { ORIGIN } from './mirror';

export const REVALIDATE = Number(process.env.REVALIDATE || 600);

export class Redirect extends Error {
  constructor(status, location) { super('redirect'); this.status = status; this.location = location; }
}
export class NoData extends Error {}

const strip = (u) => {
  // הכתובת שוורדפרס מפנה אליה, בלי פרמטר הנתונים ובלי הדומיין של המחסן
  const url = new URL(u, ORIGIN);
  url.searchParams.delete('choci_api');
  const out = (url.origin === new URL(ORIGIN).origin ? '' : url.origin) + url.pathname + (url.search || '');
  return out;
};

/** נתוני כתובת מסוימת באתר (קטגוריה, חיפוש, מוצר...) */
export async function pageData(pathname, search = '') {
  const qs = new URLSearchParams(search);
  qs.set('choci_api', '1');
  const res = await fetch(`${ORIGIN}${pathname}?${qs}`, {
    headers: { accept: 'application/json' },
    redirect: 'manual',
    next: { revalidate: REVALIDATE, tags: ['data'] },
  });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (loc) { throw new Redirect(res.status, strip(loc)); }
  }
  const ct = res.headers.get('content-type') || '';
  if (!/json/.test(ct)) { throw new NoData(String(res.status)); }
  const j = await res.json();
  if (!j || j.error || !j.type) { throw new NoData(j?.error || 'empty'); }
  return j;
}

let layoutCache = null;
/** נתונים משותפים לכל העמודים: ההדר מעמוד הבית, הפוטר, העיצוב מהמערכת, מפתחות אבטחה */
export async function layoutData() {
  const now = Date.now();
  if (layoutCache && now - layoutCache.t < 5 * 60e3) { return layoutCache.v; }
  const res = await fetch(`${ORIGIN}/?choci_api=layout`, { headers: { accept: 'application/json' }, next: { revalidate: 300, tags: ['layout'] } });
  const v = await res.json();
  layoutCache = { t: now, v };
  return v;
}
