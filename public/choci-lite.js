/* צ'וקי — רכיבי האתר בטכנולוגיה החדשה, בלי ספריות ישנות (jQuery).
   מתנהגים ונראים בדיוק כמו המקור: מיון, סרגל מחיר, גלריית מוצר עם זכוכית מגדלת, תצוגה מוגדלת. */
(function () {
  'use strict';
  var d = document;
  function ready(fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* ---------- מיון מוצרים ---------- */
  d.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('.woocommerce-ordering select.orderby')) t.form.submit();
  });

  /* ---------- סרגל מחיר (זהה לסרגל של ווקומרס) ---------- */
  function money(v) {
    var p = window.woocommerce_price_slider_params || {};
    var dec = parseInt(p.currency_format_num_decimals || 0, 10);
    var n = Number(v).toFixed(dec).split('.');
    n[0] = n[0].replace(/\B(?=(\d{3})+(?!\d))/g, p.currency_format_thousand_sep || ',');
    var num = n.join(p.currency_format_decimal_sep || '.');
    var sym = p.currency_format_symbol || '₪';
    return (p.currency_format || '%v %s').replace('%v', num).replace('%s', sym);
  }
  function priceSlider(wrap) {
    var slider = wrap.querySelector('.price_slider');
    var minIn = wrap.querySelector('#min_price'), maxIn = wrap.querySelector('#max_price');
    var label = wrap.querySelector('.price_label');
    if (!slider || !minIn || !maxIn) return;
    var step = parseFloat((wrap.querySelector('.price_slider_amount') || {}).getAttribute && wrap.querySelector('.price_slider_amount').getAttribute('data-step')) || 1;
    var min = parseFloat(minIn.getAttribute('data-min')), max = parseFloat(maxIn.getAttribute('data-max'));
    var cur = [parseFloat(minIn.value) || min, parseFloat(maxIn.value) || max];
    minIn.style.display = 'none'; maxIn.style.display = 'none';
    slider.style.display = ''; if (label) label.style.display = '';
    slider.className += ' ui-slider ui-corner-all ui-slider-horizontal ui-widget ui-widget-content';
    var range = d.createElement('div'); range.className = 'ui-slider-range ui-corner-all ui-widget-header';
    var h = [0, 1].map(function () { var s = d.createElement('span'); s.tabIndex = 0; s.className = 'ui-slider-handle ui-corner-all ui-state-default'; return s; });
    slider.appendChild(range); slider.appendChild(h[0]); slider.appendChild(h[1]);
    function pct(v) { return max > min ? ((v - min) / (max - min)) * 100 : 0; }
    function paint() {
      h[0].style.left = pct(cur[0]) + '%'; h[1].style.left = pct(cur[1]) + '%';
      range.style.left = pct(cur[0]) + '%'; range.style.width = (pct(cur[1]) - pct(cur[0])) + '%';
      minIn.value = cur[0]; maxIn.value = cur[1];
      if (label) { var f = label.querySelector('.from'), t = label.querySelector('.to'); if (f) f.textContent = money(cur[0]); if (t) t.textContent = money(cur[1]); }
    }
    function fromX(x) {
      var r = slider.getBoundingClientRect();
      var v = min + Math.min(1, Math.max(0, (x - r.left) / r.width)) * (max - min);
      return Math.round(v / step) * step;
    }
    var active = -1;
    function move(e) {
      if (active < 0) return;
      var v = fromX(e.clientX);
      if (active === 0) cur[0] = Math.min(v, cur[1]); else cur[1] = Math.max(v, cur[0]);
      paint(); e.preventDefault();
    }
    slider.addEventListener('pointerdown', function (e) {
      var v = fromX(e.clientX);
      active = Math.abs(v - cur[0]) <= Math.abs(v - cur[1]) ? 0 : 1;
      if (cur[0] === cur[1]) active = v < cur[0] ? 0 : 1;
      h[active].classList.add('ui-state-active'); h[active].focus();
      slider.setPointerCapture(e.pointerId); move(e);
    });
    slider.addEventListener('pointermove', move);
    slider.addEventListener('pointerup', function () { if (active >= 0) h[active].classList.remove('ui-state-active'); active = -1; });
    h.forEach(function (el, i) {
      el.addEventListener('keydown', function (e) {
        var k = e.key, dv = (k === 'ArrowRight' || k === 'ArrowUp') ? step : (k === 'ArrowLeft' || k === 'ArrowDown') ? -step : 0;
        if (!dv) return; e.preventDefault();
        if (i === 0) cur[0] = Math.max(min, Math.min(cur[1], cur[0] + dv)); else cur[1] = Math.min(max, Math.max(cur[0], cur[1] + dv));
        paint();
      });
    });
    slider.style.touchAction = 'none';
    paint();
  }

  /* ---------- גלריית מוצר: זכוכית מגדלת, תמונות נוספות, תצוגה מוגדלת ---------- */
  var P = window.wc_single_product_params || {};
  function zoom(box) {
    if (P.zoom_enabled === false || P.zoom_enabled === '0') return;
    var img = box.querySelector('img'); if (!img) return;
    var bigW = parseInt(img.getAttribute('data-large_image_width'), 10), bigH = parseInt(img.getAttribute('data-large_image_height'), 10);
    var src = img.getAttribute('data-large_image') || img.getAttribute('data-src') || img.src;
    if (!bigW || box.getBoundingClientRect().width >= bigW) return;
    var z = d.createElement('img');
    z.className = 'zoomImg'; z.alt = ''; z.setAttribute('aria-hidden', 'true'); z.src = src;
    z.style.cssText = 'position:absolute;top:0;left:0;opacity:0;width:' + bigW + 'px;height:' + bigH + 'px;border:none;max-width:none;max-height:none;transition:opacity .12s';
    box.style.position = 'relative'; box.style.overflow = 'hidden';
    box.appendChild(z);
    box.addEventListener('mouseenter', function () { z.style.opacity = 1; });
    box.addEventListener('mouseleave', function () { z.style.opacity = 0; });
    box.addEventListener('mousemove', function (e) {
      var r = box.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      z.style.left = (-x * (bigW - r.width)) + 'px'; z.style.top = (-y * (bigH - r.height)) + 'px';
    });
  }
  var pswpLoading = null;
  function loadPswp() {
    if (window.PhotoSwipe && window.PhotoSwipeUI_Default) return Promise.resolve();
    if (pswpLoading) return pswpLoading;
    var base = (window.CHOCI_WP || '') + '/wp-content/plugins/woocommerce/assets/js/photoswipe/';
    function load(f) { return new Promise(function (ok, bad) { var s = d.createElement('script'); s.src = base + f; s.onload = ok; s.onerror = bad; d.head.appendChild(s); }); }
    pswpLoading = load('photoswipe.min.js').then(function () { return load('photoswipe-ui-default.min.js'); });
    return pswpLoading;
  }
  function openPswp(gallery, index) {
    var el = d.querySelector('.pswp'); if (!el) return;
    var items = $$('.woocommerce-product-gallery__image img', gallery).map(function (img) {
      return { src: img.getAttribute('data-large_image') || img.src, w: +img.getAttribute('data-large_image_width') || img.naturalWidth, h: +img.getAttribute('data-large_image_height') || img.naturalHeight, title: img.getAttribute('data-caption') || img.title || '' };
    });
    loadPswp().then(function () {
      var opts = Object.assign({ index: index || 0, addCaptionHTMLFn: function (item, cap) { if (!item.title) { cap.children[0].textContent = ''; return false; } cap.children[0].textContent = item.title; return true; } }, P.photoswipe_options || {});
      opts.index = index || 0;
      new window.PhotoSwipe(el, window.PhotoSwipeUI_Default, items, opts).init();
    });
  }
  function slider(gallery, slides) {
    // תמונות נוספות: תמונות קטנות מתחת, חיצים, ומעבר בין התמונות — כמו במקור
    var wrapper = gallery.querySelector('.woocommerce-product-gallery__wrapper');
    var viewport = d.createElement('div'); viewport.className = 'flex-viewport';
    viewport.style.cssText = 'overflow:hidden;position:relative;';
    wrapper.parentNode.insertBefore(viewport, wrapper); viewport.appendChild(wrapper);
    var rtl = d.documentElement.dir === 'rtl';
    var cur = 0;
    var thumbs = d.createElement('ol'); thumbs.className = 'flex-control-nav flex-control-thumbs';
    slides.forEach(function (s, i) {
      var li = d.createElement('li'); var t = d.createElement('img');
      t.src = s.getAttribute('data-thumb'); t.alt = s.getAttribute('data-thumb-alt') || '';
      if (s.getAttribute('data-thumb-srcset')) { t.srcset = s.getAttribute('data-thumb-srcset'); t.sizes = s.getAttribute('data-thumb-sizes') || ''; }
      t.width = 100; t.height = 100; t.draggable = false;
      t.addEventListener('click', function () { go(i); });
      li.appendChild(t); thumbs.appendChild(li);
    });
    gallery.appendChild(thumbs);
    var F = P.flexslider || {};
    var loop = F.animationLoop !== false;
    var nav = null;
    if (F.directionNav) {
      nav = d.createElement('ul'); nav.className = 'flex-direction-nav';
      var pa = d.createElement('a'); pa.className = 'flex-prev'; pa.href = '#'; pa.textContent = F.prevText || 'Previous';
      var na = d.createElement('a'); na.className = 'flex-next'; na.href = '#'; na.textContent = F.nextText || 'Next';
      var pl = d.createElement('li'); pl.className = 'flex-nav-prev'; pl.appendChild(pa);
      var nl = d.createElement('li'); nl.className = 'flex-nav-next'; nl.appendChild(na);
      nav.appendChild(pl); nav.appendChild(nl);
      // כמו במקור: החיצים בסוף הגלריה, אחרי התמונות הקטנות
      gallery.appendChild(nav);
    }
    if (nav) {
      nav.querySelector('.flex-prev').addEventListener('click', function (e) { e.preventDefault(); go(cur - 1); });
      nav.querySelector('.flex-next').addEventListener('click', function (e) { e.preventDefault(); go(cur + 1); });
    }
    function size() {
      var w = viewport.getBoundingClientRect().width;
      wrapper.style.width = (slides.length * 100 + 100) + '%';
      wrapper.style.transitionDuration = '0s';
      slides.forEach(function (s) { s.style.width = w + 'px'; s.style.float = rtl ? 'right' : 'left'; s.style.display = 'block'; s.style.marginRight = '0'; });
      place(false);
    }
    function place(anim) {
      var w = viewport.getBoundingClientRect().width;
      wrapper.style.transitionDuration = anim ? '0.5s' : '0s';
      wrapper.style.transform = 'translate3d(' + ((rtl ? 1 : -1) * cur * w) + 'px,0,0)';
      var h = slides[cur].getBoundingClientRect().height; if (h) viewport.style.height = h + 'px';
    }
    function go(i) {
      if (!loop && (i < 0 || i >= slides.length)) return;
      cur = (i + slides.length) % slides.length;
      if (nav && !loop) {
        nav.querySelector('.flex-prev').classList.toggle('flex-disabled', cur === 0);
        nav.querySelector('.flex-next').classList.toggle('flex-disabled', cur === slides.length - 1);
      }
      slides.forEach(function (s, k) { s.classList.toggle('flex-active-slide', k === cur); });
      $$('img', thumbs).forEach(function (t, k) { t.classList.toggle('flex-active', k === cur); });
      place(true);
    }
    var sx = null;
    viewport.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 40) go(cur + ((dx < 0) !== rtl ? 1 : -1)); });
    wrapper.style.transitionProperty = 'transform';
    window.addEventListener('resize', size);
    slides.forEach(function (s) { var im = s.querySelector('img'); if (im && !im.complete) im.addEventListener('load', function () { place(false); }); });
    size(); go(0);
    return function () { return cur; };
  }
  function gallery(g) {
    var slides = $$('.woocommerce-product-gallery__image', g);
    if (!slides.length) { g.style.opacity = 1; return; }
    var current = function () { return 0; };
    if (slides.length > 1 && P.flexslider_enabled !== false && P.flexslider_enabled !== '0') current = slider(g, slides);
    slides.forEach(zoom);
    if (P.photoswipe_enabled !== false && P.photoswipe_enabled !== '0' && d.querySelector('.pswp')) {
      var t = d.createElement('a');
      t.href = '#'; t.setAttribute('role', 'button'); t.className = 'woocommerce-product-gallery__trigger';
      t.setAttribute('aria-haspopup', 'dialog'); t.setAttribute('aria-controls', 'photoswipe-fullscreen-dialog');
      t.setAttribute('aria-label', (P.i18n_product_gallery_trigger_text || 'להציג את גלריית התמונות על מסך מלא'));
      t.innerHTML = '<span aria-hidden="true">🔍</span>';
      g.insertBefore(t, g.firstChild);
      t.addEventListener('click', function (e) { e.preventDefault(); openPswp(g, current()); });
      slides.forEach(function (s, i) {
        var a = s.querySelector('a');
        if (a) a.addEventListener('click', function (e) { e.preventDefault(); openPswp(g, i); });
      });
    } else {
      slides.forEach(function (s) { var a = s.querySelector('a'); if (a) a.addEventListener('click', function (e) { e.preventDefault(); }); });
    }
    g.style.opacity = 1;
  }

  ready(function () {
    $$('.price_slider_wrapper').forEach(priceSlider);
    $$('.woocommerce-product-gallery').forEach(gallery);
    // ווקומרס מסמנת שהדפדפן תומך ב-JS
    d.body.classList.remove('woocommerce-no-js'); d.body.classList.add('woocommerce-js');
  });
})();
