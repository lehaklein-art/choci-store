/* צ'וקי — עמוד מוצר: בחירת וריאציה (צבע/גודל) והוספה לסל, בלי jQuery.
   מתנהג כמו add-to-cart-variation של ווקומרס: אותו מבנה, אותן מחלקות, אותם טקסטים. */
(function () {
  var d = document;
  var P = window.wc_add_to_cart_variation_params || {};
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  function variationHtml(v) {
    return '\n\t<div class="woocommerce-variation-description">' + (v.variation_description || '') + '</div>\n\t<div class="woocommerce-variation-price">' + (v.price_html || '') + '</div>\n\t<div class="woocommerce-variation-availability">' + (v.availability_html || '') + '</div>\n';
  }
  var UNAVAILABLE = '\n\t<p role="alert">' + (P.i18n_unavailable_text || 'מוצר זה אינו זמין כרגע. נא לבחור שילוב אחר.') + '</p>\n';

  function matches(v, chosen) {
    for (var k in v.attributes) {
      var want = v.attributes[k], got = chosen[k];
      if (want !== '' && want !== undefined && got !== undefined && got !== '' && want !== got) { return false; }
    }
    return true;
  }

  function initForm(form) {
    var list = [];
    try { list = JSON.parse(form.getAttribute('data-product_variations') || '[]') || []; } catch (e) { list = []; }
    var selects = $$('.variations select', form);
    var wrap = form.querySelector('.single_variation_wrap');
    var single = form.querySelector('.single_variation');
    var addWrap = form.querySelector('.woocommerce-variation-add-to-cart');
    var button = form.querySelector('.single_add_to_cart_button');
    var vid = form.querySelector('input.variation_id');
    var reset = form.querySelector('.reset_variations');
    var qty = form.querySelector('input.qty');
    var gallery = d.querySelector('.woocommerce-product-gallery');
    var first = gallery && gallery.querySelector('.woocommerce-product-gallery__image');
    var firstImg = first && first.querySelector('img');
    var orig = firstImg ? {
      src: firstImg.getAttribute('src'), srcset: firstImg.getAttribute('srcset'), sizes: firstImg.getAttribute('sizes'),
      alt: firstImg.getAttribute('alt'), title: firstImg.getAttribute('title'), dsrc: firstImg.getAttribute('data-src'),
      large: firstImg.getAttribute('data-large_image'), lw: firstImg.getAttribute('data-large_image_width'), lh: firstImg.getAttribute('data-large_image_height'),
      href: (first.querySelector('a') || {}).getAttribute ? first.querySelector('a').getAttribute('href') : null,
      thumb: first.getAttribute('data-thumb')
    } : null;

    function setAttr(el, n, v) { if (!el) return; if (v === null || v === undefined || v === '') { el.removeAttribute(n); } else { el.setAttribute(n, v); } }
    function thumbImg() { var t = gallery && gallery.querySelector('.flex-control-nav li img'); return t; }

    function setImage(v) {
      if (!firstImg || !orig) return;
      var im = v && v.image && v.image.src && v.image.src.length > 1 ? v.image : null;
      var a = first.querySelector('a');
      if (im) {
        setAttr(firstImg, 'src', im.src); setAttr(firstImg, 'srcset', im.srcset); setAttr(firstImg, 'sizes', im.sizes);
        setAttr(firstImg, 'alt', im.alt); setAttr(firstImg, 'title', im.title); setAttr(firstImg, 'data-src', im.full_src);
        setAttr(firstImg, 'data-large_image', im.full_src); setAttr(firstImg, 'data-large_image_width', im.full_src_w); setAttr(firstImg, 'data-large_image_height', im.full_src_h);
        if (a) { a.setAttribute('href', im.full_src); }
        var t = thumbImg(); if (t && im.gallery_thumbnail_src) { t.setAttribute('src', im.gallery_thumbnail_src); t.removeAttribute('srcset'); }
      } else {
        setAttr(firstImg, 'src', orig.src); setAttr(firstImg, 'srcset', orig.srcset); setAttr(firstImg, 'sizes', orig.sizes);
        setAttr(firstImg, 'alt', orig.alt); setAttr(firstImg, 'title', orig.title); setAttr(firstImg, 'data-src', orig.dsrc);
        setAttr(firstImg, 'data-large_image', orig.large); setAttr(firstImg, 'data-large_image_width', orig.lw); setAttr(firstImg, 'data-large_image_height', orig.lh);
        if (a && orig.href) { a.setAttribute('href', orig.href); }
        var t2 = thumbImg(); if (t2 && orig.thumb) { t2.setAttribute('src', orig.thumb); }
      }
      var z = first.querySelector('.zoomImg'); if (z) { z.setAttribute('src', firstImg.getAttribute('data-large_image') || firstImg.getAttribute('src')); }
      if (gallery.__go) { gallery.__go(0); }
    }

    function chosenMap() {
      var m = {}, all = true, any = false;
      selects.forEach(function (s) {
        var n = s.getAttribute('data-attribute_name') || s.name;
        m[n] = s.value;
        if (!s.value) { all = false; } else { any = true; }
      });
      return { map: m, all: all, any: any };
    }

    /* אפשרויות שאין להן אף וריאציה זמינה מסומנות כלא זמינות — כמו בווקומרס */
    function updateOptions() {
      var c = chosenMap().map;
      selects.forEach(function (s) {
        var name = s.getAttribute('data-attribute_name') || s.name;
        var others = {}; for (var k in c) { if (k !== name) { others[k] = c[k]; } }
        $$('option', s).forEach(function (o) {
          if (!o.value) { return; }
          var ok = list.some(function (v) {
            if (!v.variation_is_active) { return false; }
            var want = v.attributes[name];
            if (want !== '' && want !== o.value) { return false; }
            return matches(v, others);
          });
          o.disabled = !ok;
          o.classList.toggle('enabled', ok);
          o.classList.toggle('attached', true);
        });
      });
    }

    function hideVariation() {
      single.style.display = 'none';
      single.innerHTML = '';
      if (vid) { vid.value = ''; }
      button.classList.add('disabled', 'wc-variation-selection-needed');
      button.classList.remove('wc-variation-is-unavailable');
      if (addWrap) { addWrap.classList.remove('woocommerce-variation-add-to-cart-enabled'); addWrap.classList.add('woocommerce-variation-add-to-cart-disabled'); }
    }

    function check(userAction) {
      var c = chosenMap();
      if (reset) { reset.style.visibility = c.any ? 'visible' : 'hidden'; }
      updateOptions();
      if (!c.all) {
        hideVariation();
        setImage(null);
        return;
      }
      var found = null;
      for (var i = 0; i < list.length; i++) { if (matches(list[i], c.map)) { found = list[i]; break; } }
      if (!found) {
        single.innerHTML = UNAVAILABLE; single.style.display = '';
        if (vid) { vid.value = ''; }
        button.classList.remove('wc-variation-selection-needed');
        button.classList.add('disabled', 'wc-variation-is-unavailable');
        setImage(null);
        if (userAction && P.i18n_no_matching_variations_text) { window.alert(P.i18n_no_matching_variations_text); }
        return;
      }
      if (vid) { vid.value = found.variation_id; }
      setImage(found);
      var html = variationHtml(found);
      var hasContent = (found.variation_description || found.price_html || found.availability_html);
      single.innerHTML = html;
      single.style.display = hasContent ? '' : 'none';
      if (qty) {
        if (found.min_qty !== '' && found.min_qty !== undefined) { qty.setAttribute('min', found.min_qty); }
        if (found.max_qty !== '' && found.max_qty !== undefined) { qty.setAttribute('max', found.max_qty); } else { qty.removeAttribute('max'); }
      }
      button.classList.remove('wc-variation-selection-needed');
      if (!found.is_purchasable || !found.is_in_stock || !found.variation_is_visible) {
        button.classList.add('disabled', 'wc-variation-is-unavailable');
        if (addWrap) { addWrap.classList.remove('woocommerce-variation-add-to-cart-enabled'); addWrap.classList.add('woocommerce-variation-add-to-cart-disabled'); }
      } else {
        button.classList.remove('disabled', 'wc-variation-is-unavailable');
        if (addWrap) { addWrap.classList.remove('woocommerce-variation-add-to-cart-disabled'); addWrap.classList.add('woocommerce-variation-add-to-cart-enabled'); }
      }
    }

    selects.forEach(function (s) { s.addEventListener('change', function () { check(true); }); });
    if (reset) {
      reset.addEventListener('click', function (e) {
        e.preventDefault();
        selects.forEach(function (s) { s.value = ''; });
        var al = form.querySelector('.reset_variations_alert');
        if (al) { al.textContent = P.i18n_reset_alert_text || ''; }
        check(false);
      });
    }
    button.addEventListener('click', function (e) {
      if (!button.classList.contains('disabled')) { return; }
      e.preventDefault();
      if (button.classList.contains('wc-variation-is-unavailable')) { window.alert(P.i18n_unavailable_text); }
      else if (button.classList.contains('wc-variation-selection-needed')) { window.alert(P.i18n_make_a_selection_text); }
    });
    check(false);
  }

  /* הוספה לסל: נשארים בעמוד, והעגלה הצפה נפתחת */
  function bindCartForm(form) {
    form.addEventListener('submit', function (e) {
      if (!window.chociCartAdd) { return; } // בלי הסקריפט — שליחה רגילה
      e.preventDefault();
      var btn = form.querySelector('.single_add_to_cart_button');
      if (btn && btn.classList.contains('disabled')) { return; }
      var vid = form.querySelector('input.variation_id');
      var pid = (vid && Number(vid.value)) || Number((form.querySelector('[name=add-to-cart]') || {}).value) || 0;
      var q = Math.max(1, parseInt((form.querySelector('input.qty') || {}).value, 10) || 1);
      if (!pid) { return; }
      if (btn) { btn.classList.add('loading'); }
      window.chociCartAdd(pid, q).then(function () { if (btn) { btn.classList.remove('loading'); btn.classList.add('added'); } });
    });
  }

  function boot() {
    $$('form.variations_form').forEach(initForm);
    $$('form.cart').forEach(bindCartForm);
  }
  if (d.readyState !== 'loading') { boot(); } else { d.addEventListener('DOMContentLoaded', boot); }
})();
