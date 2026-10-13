// עמודים לדוגמה וכללים שנשמרים תמיד — לקיצוץ קובץ העיצוב
export const SAMPLE_PATHS = [
  '/',
  '/product-category/raw-materials/',
  '/product-category/raw-materials/%d7%90%d7%91%d7%a7%d7%95%d7%aa/',
  '/product-category/raw-materials/%d7%90%d7%91%d7%a7%d7%95%d7%aa/page/2/',
  '/product-category/%d7%9e%d7%91%d7%a6%d7%a2%d7%99%d7%9d/',
  '/product-category/baking-tools/',
  '/product/cmc-%D7%90%D7%91%D7%A7%D7%AA-%D7%99%D7%99%D7%91%D7%95%D7%A9-%D7%95%D7%94%D7%A7%D7%A9%D7%99%D7%94-%D7%9C%D7%91%D7%A6%D7%A7-%D7%A1%D7%95%D7%9B%D7%A8/',
  '/product/%d7%98%d7%95%d7%a4%d7%a8%d7%99%d7%9d-%d7%9c%d7%91%d7%91%d7%95%d7%aa-%d7%a2%d7%9c-%d7%9e%d7%a7%d7%9c-%d7%a1%d7%98-7-%d7%99%d7%97%d7%99%d7%93%d7%95%d7%aa/',
  '/product/%d7%a8%d7%95%d7%99%d7%90%d7%9c-%d7%90%d7%99%d7%99%d7%a1%d7%99%d7%a0%d7%92-%d7%aa%d7%9b%d7%9c%d7%aa/',
  '/recipes/',
  '/%d7%9e%d7%93%d7%a8%d7%99%d7%9a-%d7%94%d7%a6%d7%a0%d7%98%d7%a8%d7%99%d7%9d-%d7%9b%d7%9c-%d7%94%d7%a1%d7%93%d7%a8%d7%95%d7%aa-%d7%95%d7%9c%d7%9e%d7%94-%d7%9e%d7%a9%d7%aa%d7%9e%d7%a9%d7%99%d7%9d-%d7%91/',
  '/branches/', '/transfer/', '/wishlist/', '/contact/', '/about/', '/terms/', '/returns/', '/privacy-policy/', '/accessibility-statement/', '/shop/',
  '/?s=%D7%A9%D7%95%D7%A7%D7%95%D7%9C%D7%93&post_type=product',
  '/this-page-does-not-exist-404/',
];

export const SAFELIST = {
  standard: [/^ca-/, /^is-/, /open/, /active/, /show/, /toggle/, /^ccart/, /^cmnav/, /^crail/, /^choci/, /^cc-/, /^cf-/, /^cq/, /^cw-/, /pswp/, /flex/, /zoom/, /^woocommerce/, /^wc-/, /^wp-/, /select2/, /^ui-/, /price_slider/, /^kadence/, /^kt-/, /current/, /^drawer/, /^menu/, /^sub-/, /^mega/, /^s-/, /^hdr/, /^ftr/, /hidden/, /^screen-reader/, /visible/, /loading/, /added/, /^blockUI/, /^select/, /^onsale/, /^star/, /^rtl/, /^has-/],
  greedy: [/data-ca/, /aria-/, /dir=/],
};
