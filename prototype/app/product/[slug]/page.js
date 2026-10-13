import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import { getProductBySlug, getRelated, formatPrice, addToCartUrl, WC_URL } from '../../../lib/woo';

export const revalidate = 600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; } // נבנה בפעם הראשונה שמישהו נכנס, ונשמר

const strip = (h = '') => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const desc = strip(p.short || p.description).slice(0, 160) || `${p.name} בצ'וקי — מוצרי אפייה בכשרות בד"ץ.`;
  return {
    title: p.name,
    description: desc,
    alternates: { canonical: p.path },
    openGraph: { title: p.name, description: desc, images: p.image ? [p.image.src] : [], type: 'website' },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const related = await getRelated(p.id);
  const sale = p.onSale && p.regular && p.price < p.regular;
  const cat = p.categories[p.categories.length - 1];

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku || undefined,
    image: p.images.map((i) => i.src), description: strip(p.short || p.description).slice(0, 500),
    offers: { '@type': 'Offer', priceCurrency: 'ILS', price: p.price, availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: p.path },
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="crumbs" aria-label="פירורי לחם">
        <Link href="/">דף הבית</Link>{cat && <> › <Link href={cat.path}>{cat.name}</Link></>}
      </nav>
      <div className="pd">
        <div className="pd-gal">
          {p.images[0] && <img src={p.images[0].src} srcSet={p.images[0].srcset} sizes="(max-width:760px) 100vw, 600px" alt={p.images[0].alt || p.name} width="600" height="600" fetchPriority="high" />}
          {p.images.length > 1 && (
            <div className="pd-thumbs">{p.images.slice(1, 8).map((im, i) => <img key={i} src={im.src} alt={im.alt || ''} loading="lazy" />)}</div>
          )}
        </div>
        <div>
          <h1>{p.name}</h1>
          <div className="price">{formatPrice(p.price)}{sale && <del>{formatPrice(p.regular)}</del>}</div>
          {p.short && <div className="pd-short" dangerouslySetInnerHTML={{ __html: p.short }} />}
          {p.attributes.length > 0 && (
            <dl className="pd-attrs">
              {p.attributes.map((a) => <Fragment key={a.name}><dt>{a.name}</dt><dd>{a.values.join(', ')}</dd></Fragment>)}
            </dl>
          )}
          <div className="pd-buy">
            {p.inStock && p.purchasable
              ? (p.type === 'simple'
                ? <a className="btn" href={addToCartUrl(p.id)} rel="nofollow">הוספה לעגלה</a>
                : <a className="btn" href={`${WC_URL}${p.path}`}>לבחירת אפשרויות</a>)
              : <span className="oos">אזל מהמלאי כרגע</span>}
          </div>
          <div className="ship-note">🚚 משלוח חינם בהזמנה מעל 450 ₪ · איסוף עצמי מרבי עקיבא 90, בני ברק</div>
          <div className="pd-meta">
            {p.sku && <div>מק"ט: {p.sku}</div>}
            {p.categories.length > 0 && <div>קטגוריות: {p.categories.map((c, i) => <span key={c.id}>{i > 0 && ', '}<Link href={c.path}>{c.name}</Link></span>)}</div>}
          </div>
        </div>
      </div>
      {p.description && (
        <section className="pd-desc"><h2>תיאור המוצר</h2><div dangerouslySetInnerHTML={{ __html: p.description }} /></section>
      )}
      {related.length > 0 && (
        <section className="sec">
          <h2 className="h-sec">אולי יתאים לך גם</h2>
          <div className="grid">{related.slice(0, 8).map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
