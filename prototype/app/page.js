import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { getCategories, getProducts, WC_URL } from '../lib/woo';

export const revalidate = 600;

const HERO = `${WC_URL}/wp-content/uploads/2026/10/choci-slide-silicone-new.webp`;

export default async function Home() {
  const [cats, fresh, sale] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ perPage: 8, orderby: 'date', order: 'desc' }).catch(() => ({ products: [] })),
    getProducts({ perPage: 8, onSale: true }).catch(() => ({ products: [] })),
  ]);
  const top = cats.filter((c) => c.parent === 0 && c.count > 0 && c.image);
  const subs = cats.filter((c) => c.parent !== 0 && c.count > 8 && c.image).sort((a, b) => b.count - a.count).slice(0, 12);
  const molds = cats.find((c) => c.slug === 'תבניות-סיליקון-לקינוחים-ופטיפורים');
  const saleCat = cats.find((c) => c.slug === 'מבצעים');

  return (
    <>
      <section className="hero">
        <Link href={molds?.path || '/'}>
          <img src={HERO} alt="תבניות סיליקון חדשות עכשיו באתר — לכל המגוון" width="1600" height="444" fetchPriority="high" />
        </Link>
      </section>

      <section className="sec">
        <div className="wrap">
          <h2 className="h-sec">החנות</h2>
          <div className="cats">
            {top.map((c) => (
              <Link key={c.id} href={c.path} className="cat">
                <img src={c.image} alt="" width="300" height="300" loading="lazy" />
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {sale.products.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="h-row"><h2 className="h-sec">מבצעים</h2>{saleCat && <Link href={saleCat.path}>לכל המבצעים ←</Link>}</div>
            <div className="grid">{sale.products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}

      <section className="sec">
        <div className="wrap">
          <div className="club">
            <div><h2>הצטרפי למועדון הלקוחות</h2><p>10% הנחה על הרכישה הראשונה, רעיונות ומבצעים במייל</p></div>
            <a className="btn btn-light" href={`${WC_URL}/#club`}>להצטרפות</a>
          </div>
        </div>
      </section>

      {fresh.products.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <h2 className="h-sec">חדש באתר</h2>
            <div className="grid">{fresh.products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}

      <section className="sec">
        <div className="wrap">
          <h2 className="h-sec">קטגוריות פופולריות</h2>
          <div className="cats">
            {subs.map((c) => (
              <Link key={c.id} href={c.path} className="cat">
                <img src={c.image} alt="" width="300" height="300" loading="lazy" />
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
