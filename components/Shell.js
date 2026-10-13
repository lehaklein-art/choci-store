import Link from 'next/link';
import { getCategories, WC_URL } from '../lib/woo';

const LOGO = `${WC_URL}/wp-content/uploads/2026/08/${encodeURIComponent('לוגו-שקוף')}.png`;

export async function Header() {
  let cats = [];
  try { cats = (await getCategories()).filter((c) => c.parent === 0 && c.count > 0); } catch {}
  const order = ['raw-materials', 'cake-decorations', 'molds-rings', 'packaging', 'baking-tools', 'חנוכה', 'סיטונאות'];
  const rank = (c) => { const i = order.indexOf(c.slug); return i < 0 ? 99 : i; };
  cats.sort((a, b) => rank(a) - rank(b));
  const sale = cats.find((c) => c.slug === 'מבצעים');
  return (
    <header className="hdr">
      <div className="wrap hdr-top">
        <Link href="/" className="hdr-logo" aria-label="צ'וקי — דף הבית"><img src={LOGO} alt="צ'וקי" width="120" height="44" /></Link>
        <form className="hdr-search" action="/search" role="search">
          <label className="sr" htmlFor="q">חיפוש מוצרים</label>
          <input id="q" name="q" type="search" placeholder="מה מחפשים היום?" autoComplete="off" />
          <button type="submit">חיפוש</button>
        </form>
        <a className="hdr-cart" href={`${WC_URL}/cart/`}>🛒 <span>עגלה</span></a>
      </div>
      <nav className="hdr-nav" aria-label="קטגוריות">
        <ul className="wrap">
          {cats.filter((c) => c.slug !== 'מבצעים').map((c) => (
            <li key={c.id}><Link href={c.path} prefetch>{c.name}</Link></li>
          ))}
          {sale && <li><Link href={sale.path} className="sale">מבצעים</Link></li>}
          <li><a href={`${WC_URL}/recipes/`}>מתכונים</a></li>
        </ul>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap ftr-in">
        <div>
          <h3>צ'וקי — מוצרי אפייה</h3>
          <p>חנות למוצרי אפייה איכותיים בכשרות בד"ץ העדה החרדית.</p>
          <a href="tel:035596886">03-5596886</a>
          <span>רבי עקיבא 90, בני ברק</span>
        </div>
        <div>
          <h3>שירות לקוחות</h3>
          <a href={`${WC_URL}/my-account/`}>החשבון שלי</a>
          <a href={`${WC_URL}/branches/`}>הסניפים שלנו</a>
          <a href={`${WC_URL}/transfer/`}>הדפסת תמונות אכילות</a>
        </div>
        <div>
          <h3>מידע</h3>
          <a href={`${WC_URL}/terms/`}>תקנון</a>
          <a href={`${WC_URL}/privacy-policy/`}>מדיניות פרטיות</a>
          <a href="https://courses.mecademypastryschool.com/" target="_blank" rel="noopener">מקדמיה — בית ספר לקונדיטוריה</a>
        </div>
      </div>
      <div className="ftr-bottom">© צ'וקי {new Date().getFullYear()}</div>
    </footer>
  );
}
