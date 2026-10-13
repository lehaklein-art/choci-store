import Link from 'next/link';
import { formatPrice, addToCartUrl } from '../lib/woo';

export default function ProductCard({ p, priority = false }) {
  const sale = p.onSale && p.regular && p.price < p.regular;
  return (
    <div className="card">
      {sale && <span className="badge">מבצע</span>}
      <Link href={p.path} className="card-img" prefetch={false}>
        {p.image ? (
          <img src={p.image.thumb || p.image.src} srcSet={p.image.srcset} sizes="(max-width:760px) 50vw, 240px"
            alt={p.image.alt} width="300" height="300" loading={priority ? 'eager' : 'lazy'} decoding="async" />
        ) : null}
      </Link>
      <div className="card-b">
        <Link href={p.path} className="card-t" prefetch={false}>{p.name}</Link>
        <div className="price">
          {formatPrice(p.price)}
          {sale && <del>{formatPrice(p.regular)}</del>}
        </div>
        {p.inStock && p.purchasable && p.type === 'simple'
          ? <a className="btn" href={addToCartUrl(p.id)} rel="nofollow">הוספה לעגלה</a>
          : <Link className="btn btn-light" href={p.path}>{p.inStock ? 'לבחירת אפשרויות' : 'אזל מהמלאי'}</Link>}
      </div>
    </div>
  );
}
