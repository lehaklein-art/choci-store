/* צ'וקי — התנהגות הרכיבים הקבועים בכל האתר.
   ההגדרות (מפתחות אבטחה, מונים) מגיעות מהעמוד: CHOCI_CART, CHOCI_WISH, __chociClubCfg, __chociFormsCfg, CHOCI_MNAV */

/* רציף: חזרה לראש הדף */
(function(){
 var top=document.querySelector('.choci-rail .crail-top');
 if(!top){ return; }
 var ticking=false;
 function upd(){
  top.classList.toggle('is-on', (window.pageYOffset||document.documentElement.scrollTop) > 200);
  ticking=false;
 }
 window.addEventListener('scroll', function(){
  if(!ticking){ ticking=true; window.requestAnimationFrame(upd); }
 }, {passive:true});
 top.addEventListener('click', function(){
  var soft = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({top:0, behavior: soft ? 'auto' : 'smooth'});
  var sk=document.querySelector('h1,#main,main'); if(sk){ sk.setAttribute('tabindex','-1'); sk.focus({preventScroll:true}); }
 });
 upd();
})();

/* רצועת המועדון */
(function(){function ck(n){return document.cookie.split("; ").some(function(c){return c.indexOf(n+"=")===0;});}var s=document.querySelector(".choci-strip");if(!s){return;}if(ck("choci_strip")||document.cookie.indexOf("choci_club=joined")>-1){return;}s.hidden=false;s.classList.add("is-on");document.body.classList.add("choci-has-strip");var x=s.querySelector(".choci-strip-x");if(x){x.addEventListener("click",function(){var d=new Date();d.setTime(d.getTime()+30*86400000);document.cookie="choci_strip=hidden;expires="+d.toUTCString()+";path=/;SameSite=Lax";s.classList.remove("is-on");s.hidden=true;document.body.classList.remove("choci-has-strip");document.body.style.paddingBottom="";});}})();

/* חלון ההצטרפות למועדון */
(function(){
 var CFG = window.__chociClubCfg || {};
 var wrap = document.getElementById('choci-club');
 if(!wrap){return;}
 var box   = wrap.querySelector('.cc-box'),
     form  = wrap.querySelector('.cc-form'),
     fwrap = wrap.querySelector('.cc-form-wrap'),
     done  = wrap.querySelector('.cc-done'),
     errEl = wrap.querySelector('.cc-err'),
     go    = wrap.querySelector('.cc-go'),
     last  = null, shown = false;

 function setCookie(name,val,days){
  var d=new Date(); d.setTime(d.getTime()+days*86400000);
  document.cookie=name+'='+val+';expires='+d.toUTCString()+';path=/;SameSite=Lax';
 }
 function hasCookie(name){
  return document.cookie.split('; ').some(function(c){return c.indexOf(name+'=')===0;});
 }

 function seenLS(){try{var t=+localStorage.getItem('choci_club_seen');return t&&(Date.now()-t)<3*86400000;}catch(e){return false;}}
 function openPop(){
  if(shown||hasCookie(CFG.ck)||seenLS()){return;}
  shown=true;
  setCookie(CFG.ck,'seen',3);
  try{localStorage.setItem('choci_club_seen',String(Date.now()));}catch(e){}
  last=document.activeElement;
  wrap.hidden=false; wrap.classList.add('is-open');
  document.body.style.overflow='hidden';
  var f=wrap.querySelector('input');if(f){f.focus();}
 }
 function closePop(){
  wrap.classList.remove('is-open'); wrap.hidden=true;
  document.body.style.overflow='';
  if(document.cookie.indexOf(CFG.ck+'=joined')<0){ setCookie(CFG.ck,'dismissed',CFG.days); }
  if(last&&last.focus){last.focus();}
 }

 Array.prototype.forEach.call(wrap.querySelectorAll('[data-cc-close]'),function(b){
  b.addEventListener('click',closePop);
 });
 document.addEventListener('keydown',function(e){
  if(!wrap.classList.contains('is-open')){return;}
  if(e.key==='Escape'){closePop();return;}
  if(e.key==='Tab'){
   var f=box.querySelectorAll('a[href],button:not([disabled]),input');
   if(!f.length){return;}
   var first=f[0], lastEl=f[f.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastEl.focus();}
   else if(!e.shiftKey&&document.activeElement===lastEl){e.preventDefault();first.focus();}
  }
 });

 function bad(el,msg){
  el.classList.add('cc-bad'); errEl.textContent=msg; el.focus(); return false;
 }
 function valid(){
  errEl.textContent='';
  Array.prototype.forEach.call(form.querySelectorAll('input'),function(i){i.classList.remove('cc-bad');});
  var el=form.elements, n=el['name'], e=el['email'], p=el['phone'], c=el['consent'];
  if(!n.value.trim()||n.value.trim().length<2){return bad(n,'נשמח לדעת איך קוראים לכם');}
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e.value.trim())){return bad(e,'כתובת המייל לא נראית תקינה');}
  if(String(p.value).replace(/\D/g,'').length<9){return bad(p,'מספר טלפון לא תקין');}
  if(!c.checked){errEl.textContent='צריך לאשר את התקנון ומדיניות הפרטיות';c.focus();return false;}
  return true;
 }

 form.addEventListener('submit',function(e){
  e.preventDefault();
  if(!valid()){return;}
  go.disabled=true; go.textContent='רגע אחד...';
  var el2=form.elements;
  var body=new URLSearchParams();
  body.append('action','choci_club_signup');
  body.append('nonce',CFG.nonce);
  body.append('name',el2['name'].value.trim());
  body.append('email',el2['email'].value.trim());
  body.append('phone',el2['phone'].value.trim());
  body.append('marketing',el2['marketing'].checked?'1':'0');
  var tsi=form.querySelector('input[name=cf-turnstile-response]');
  body.append('cf-turnstile-response', tsi?tsi.value:'');
  var hpf=form.elements['website'];
  body.append('website', hpf?hpf.value:'');
  fetch(CFG.ajax,{method:'POST',credentials:'same-origin',body:body})
   .then(function(r){return r.json();})
   .then(function(res){
     if(res&&res.success&&res.data&&res.data.code){
       setCookie(CFG.ck,'joined',3650);
       fwrap.hidden=true; done.hidden=false;
       done.querySelector('code').textContent=res.data.code;
       var t=done.querySelector('h2'); if(t&&t.focus){t.focus();}
     } else {
       go.disabled=false; go.textContent='כן, רשמו אותי!';
       errEl.textContent=(res&&res.data&&res.data.msg)?res.data.msg:'משהו השתבש, אפשר לנסות שוב';
     }
   })
   .catch(function(){
     go.disabled=false; go.textContent='כן, רשמו אותי!';
     errEl.textContent='אין חיבור כרגע, אפשר לנסות שוב בעוד רגע';
   });
 });

 var copyBtn=wrap.querySelector('.cc-copy');
 if(copyBtn){
  copyBtn.addEventListener('click',function(){
   var t=wrap.querySelector('.cc-code code').textContent;
   if(navigator.clipboard){navigator.clipboard.writeText(t);}
   copyBtn.textContent='הועתק!';
   setTimeout(function(){copyBtn.textContent='העתקה';},1800);
  });
 }

 if(!hasCookie(CFG.ck)){ setTimeout(openPop, CFG.delay); }
})();

/* מועדפים */
(function(){
 var C=window.CHOCI_WISH||{}, KEY='choci_wish';
 function read(){ try{ var v=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(v)?v.map(Number).filter(Boolean):[]; }catch(e){ return []; } }
 function write(a){ try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
 function url(a){ return C.ep.replace('%%endpoint%%', a); }
 function count(){
  var ids=read(), els=document.querySelectorAll('.cw-count');
  for(var i=0;i<els.length;i++){ els[i].textContent=ids.length; }
  var fab=document.querySelector('.choci-wish-fab');
  if(fab){ fab.classList.toggle('on', ids.length>0); }
 }
 function marks(){
  var ids=read(), b=document.querySelectorAll('[data-wish]');
  for(var i=0;i<b.length;i++){
   var on=ids.indexOf(Number(b[i].getAttribute('data-wish')))>-1;
   b[i].classList.toggle('on',on);
   b[i].setAttribute('aria-pressed',on?'true':'false');
   var svg=b[i].querySelector('svg'); if(svg){ svg.setAttribute('fill',on?'currentColor':'none'); }
   var lb=b[i].querySelector('.cw-label'); if(lb){ lb.textContent=on?'שמור במועדפים':'הוספה למועדפים'; }
   if(!b[i].querySelector('.cw-label')){ b[i].setAttribute('aria-label',on?'הסרה מהמועדפים':'הוספה למועדפים'); }
  }
 }
 function sync(){
  if(!C.user){ return; }
  var b=new URLSearchParams(); b.append('n',C.n);
  var ids=read(); for(var i=0;i<ids.length;i++){ b.append('ids[]',ids[i]); }
  fetch(url('choci_wish_sync'),{method:'POST',credentials:'same-origin',body:b}).catch(function(){});
 }
 if(C.user && C.saved && C.saved.length){
  var cur=read(), merged=cur.slice();
  for(var i=0;i<C.saved.length;i++){ if(merged.indexOf(Number(C.saved[i]))<0){ merged.push(Number(C.saved[i])); } }
  write(merged);
 }
 function toggle(id){
  var ids=read(), i=ids.indexOf(id);
  if(i>-1){ ids.splice(i,1); } else { ids.push(id); }
  write(ids); marks(); count(); sync();
  return i<0;
 }
 document.addEventListener('click',function(e){
  var t=e.target.closest?e.target.closest('[data-wish]'):null;
  if(t){ e.preventDefault(); toggle(Number(t.getAttribute('data-wish'))); return; }
  var rm=e.target.closest?e.target.closest('[data-wish-remove]'):null;
  if(rm){ e.preventDefault(); toggle(Number(rm.getAttribute('data-wish-remove'))); load(); return; }
 });
 function load(){
  var host=document.getElementById('choci-wish-page');
  if(!host){ return; }
  var b=new URLSearchParams(); var ids=read();
  for(var i=0;i<ids.length;i++){ b.append('ids[]',ids[i]); }
  fetch(url('choci_wish_items'),{method:'POST',credentials:'same-origin',body:b})
   .then(function(r){return r.json();})
   .then(function(j){ if(j&&j.success){ host.innerHTML=j.data.html; marks(); } })
   .catch(function(){ host.innerHTML='<p class="cw-empty">לא הצלחנו לטעון את המועדפים. נסי לרענן.</p>'; });
 }
 function boot(){ marks(); count(); load(); }
 if(document.readyState!=='loading'){ boot(); } else { document.addEventListener('DOMContentLoaded', boot); }
})();

/* טופסי המועדון בעמודים (רצועה ותוכן) */
(function(){
 var CFG=window.__chociFormsCfg||{};
 var forms=document.querySelectorAll('.club form.frm, .sticky-club form.frm, form.frm[data-choci-club]');
 if(!forms.length){return;}

 function setCookie(n,v,d){var t=new Date();t.setTime(t.getTime()+d*86400000);
  document.cookie=n+'='+v+';expires='+t.toUTCString()+';path=/;SameSite=Lax';}

 function consentBox(form){
  var host=form.parentNode;
  for(var i=0;i<3&&host;i++){
   var c=host.querySelector('.consent,.sticky-consent');
   if(c){return c;}
   host=host.parentNode;
  }
  return null;
 }

 Array.prototype.forEach.call(forms,function(form){
  var btn=form.querySelector('button,[type=submit]');
  var name=form.querySelector('[name=name]');
  var mail=form.querySelector('[name=email]');
  if(!btn||!name||!mail){return;}

  var err=document.createElement('p');
  err.className='choci-cf-err';
  err.setAttribute('role','alert');
  err.style.display='none';
  form.parentNode.insertBefore(err,form.nextSibling);

  if(CFG.ts){
   var tsd=document.createElement('div');
   tsd.setAttribute('data-choci-ts','');
   form.appendChild(tsd);
   var tsTry=setInterval(function(){ if(window.chociTsRender&&window.turnstile){ window.chociTsRender(); clearInterval(tsTry); } },300);
   setTimeout(function(){clearInterval(tsTry);},15000);
  }

  function fail(el,msg){
   if(el){el.classList.add('choci-cf-bad');el.focus();}
   err.textContent=msg;err.style.display='';
   return false;
  }

  function send(e){
   if(e){e.preventDefault();}
   err.style.display='none';err.textContent='';
   name.classList.remove('choci-cf-bad');mail.classList.remove('choci-cf-bad');

   if(!name.value.trim()||name.value.trim().length<2){return fail(name,'נשמח לדעת איך קוראים לכם');}
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(mail.value.trim())){return fail(mail,'כתובת המייל לא נראית תקינה');}

   var box=consentBox(form), mkt=true;
   if(box){
    var chks=box.querySelectorAll('input[type=checkbox]');
    if(chks.length&&!chks[0].checked){return fail(null,'צריך לאשר את התקנון ומדיניות הפרטיות');}
    if(chks.length>1){mkt=chks[1].checked;}
   }

   var label=btn.textContent;
   btn.disabled=true;btn.textContent='רגע...';

   var body=new URLSearchParams();
   body.append('action','choci_club_signup');
   body.append('nonce',CFG.nonce);
   body.append('name',name.value.trim());
   body.append('email',mail.value.trim());
   body.append('phone','');
   body.append('marketing',mkt?'1':'0');
   var tsi2=form.querySelector('input[name=cf-turnstile-response]');
   body.append('cf-turnstile-response', tsi2?tsi2.value:'');

   fetch(CFG.ajax,{method:'POST',credentials:'same-origin',body:body})
    .then(function(r){return r.json();})
    .then(function(res){
      if(res&&res.success&&res.data&&res.data.code){
        setCookie('choci_club','joined',3650);
        var d=document.createElement('div');
        d.className='choci-cf-msg';
        d.setAttribute('tabindex','-1');
        d.innerHTML='<b>ברוכים הבאים למועדון!</b>'
         +'<span>קוד ההנחה האישי שלכם, 10% על הרכישה הראשונה:</span>'
         +'<span class="choci-cf-code"><code></code>'
         +'<button type="button" class="choci-cf-copy">העתקה</button></span>'
         +'<p class="choci-cf-fine">אישי, לשימוש חד-פעמי, תקף ל-60 יום.</p>';
        d.querySelector('code').textContent=res.data.code;
        d.querySelector('.choci-cf-copy').addEventListener('click',function(){
          if(navigator.clipboard){navigator.clipboard.writeText(res.data.code);}
          this.textContent='הועתק!';
        });
        if(box){box.style.display='none';}
        err.style.display='none';
        form.parentNode.replaceChild(d,form);
        d.focus();
      } else {
        btn.disabled=false;btn.textContent=label;
        fail(null,(res&&res.data&&res.data.msg)?res.data.msg:'משהו השתבש, אפשר לנסות שוב');
      }
    })
    .catch(function(){
      btn.disabled=false;btn.textContent=label;
      fail(null,'אין חיבור כרגע, אפשר לנסות שוב בעוד רגע');
    });
   return false;
  }

  form.addEventListener('submit',send);
  btn.addEventListener('click',send);
  [name,mail].forEach(function(i){
   i.addEventListener('keydown',function(e){if(e.key==='Enter'){send(e);}});
  });
 });
})();

/* עגלת הקניות הצפה והסטפר על כרטיסי המוצר */
(function(){
 var C=window.CHOCI_CART||{}, dr=document.querySelector('.ccart'), ov=document.querySelector('.ccart-ov');
 if(!dr||!ov){return;}
 function url(a){return C.base.replace('%%endpoint%%',a);}
 var hideT, lastFocus=null;
 function open(takeFocus){
  clearTimeout(hideT); dr.hidden=false;
  requestAnimationFrame(function(){dr.classList.add('on');});
  if(takeFocus){ lastFocus=document.activeElement; var x=dr.querySelector('.ccart-x'); if(x){x.focus();} }
 }
 function close(){
  dr.classList.remove('on');
  hideT=setTimeout(function(){dr.hidden=true;},200);
  if(lastFocus&&lastFocus.focus){ try{lastFocus.focus();}catch(e){} lastFocus=null; }
 }
 function announce(d){
  var lv=document.querySelector('.ccart-live'); if(!lv){return;}
  lv.textContent = d.count ? ('העגלה עודכנה. ' + d.count + ' פריטים בסל.') : 'העגלה ריקה.';
 }
 function badge(n){var e=document.querySelectorAll('.ico-cart em, .choci-cart-count');for(var i=0;i<e.length;i++){e[i].textContent=n;}}
 function flash(t){var f=document.createElement('div');f.className='ccart-flash';f.textContent=t;document.body.appendChild(f);setTimeout(function(){f.remove();},2200);}
 function paint(d){
  var w=dr.querySelector('.ccart-wrap'); if(w){w.innerHTML=d.html;}
  var slot=document.getElementById('choci-bar-slot'); if(slot){slot.innerHTML=d.bar||'';}
  badge(d.count);
  announce(d);
  var st=document.querySelectorAll('.cadd');
  for(var i=0;i<st.length;i++){
   var pid=st[i].getAttribute('data-pid'), q=d.qty[pid]||0;
   st[i].querySelector('.cq-num').textContent=q;
   st[i].querySelector('.cq-minus').disabled=(q<1);
   st[i].classList.remove('is-busy');
  }
 }
 window.chociCartPaint=paint;
 window.chociCartAdd=function(pid,qty){return post('choci_cart_add',{pid:pid,qty:qty||1}).then(function(j){if(j&&j.success){open();}else{flash('לא הצלחנו להוסיף, נסו שוב');}return j;});};
 function post(action,data,box){
  if(box){box.classList.add('is-busy');}
  var b=new URLSearchParams(); for(var k in data){b.append(k,data[k]);}
  b.append('n',C.n||'');
  return fetch(url(action),{method:'POST',credentials:'same-origin',body:b})
   .then(function(r){return r.json();})
   .then(function(j){ if(j&&j.success){paint(j.data);} else if(j&&j.data&&j.data.reload){location.reload();} return j; })
   .catch(function(){ if(box){box.classList.remove('is-busy');} });
 }
 document.addEventListener('click',function(e){
  var t=e.target;
  var cart=t.closest?t.closest('.ico-cart'):null;
  if(cart){e.preventDefault();open(true);return;}
  var box=t.closest?t.closest('.cadd'):null;
  if(box){
   var pid=box.getAttribute('data-pid');
   if(t.classList.contains('cq-plus')){var first=(parseInt((box.querySelector('.cq-num')||{}).textContent,10)||0)===0;post('choci_cart_add',{pid:pid,qty:1},box).then(function(j){if(j&&j.success){if(first){open();}else{flash('נוסף לעגלה ✓');}}else{flash('לא הצלחנו להוסיף, נסו שוב');}});return;}
   if(t.classList.contains('cq-minus')){post('choci_cart_dec',{pid:pid},box);return;}
  }
  var item=t.closest?t.closest('.ccart-item'):null;
  if(item){
   var key=item.getAttribute('data-key');
   var n=parseInt(item.querySelector('.ck-num').textContent,10)||1;
   if(t.classList.contains('ck-plus')){post('choci_cart_set',{key:key,qty:n+1});return;}
   if(t.classList.contains('ck-minus')){post('choci_cart_set',{key:key,qty:n-1});return;}
   if(t.classList.contains('ccart-del')){post('choci_cart_set',{key:key,qty:0});return;}
  }
  if(t.classList.contains('ccart-x')||t.classList.contains('ccart-more')){close();return;}
  if(t.classList.contains('ccart-clear')){post('choci_cart_empty',{});return;}
 });
 document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!dr.hidden){close();} });
 function bindAll(){
  var bs=document.querySelectorAll('.cadd .cq');
  for(var i=0;i<bs.length;i++){(function(btn){
   if(btn.getAttribute('data-b')){return;} btn.setAttribute('data-b','1');
   btn.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();
    var box=btn.parentNode, pid=box.getAttribute('data-pid');
    if(btn.classList.contains('cq-plus')){var first=(parseInt((box.querySelector('.cq-num')||{}).textContent,10)||0)===0;post('choci_cart_add',{pid:pid,qty:1},box).then(function(j){if(j&&j.success){if(first){open();}else{flash('נוסף לעגלה ✓');}}else{flash('לא הצלחנו להוסיף, נסו שוב');}});}
    else if(!btn.disabled){post('choci_cart_dec',{pid:pid},box);}
   });
  })(bs[i]);}
  var ic=document.querySelectorAll('.ico-cart');
  for(var k=0;k<ic.length;k++){(function(el){
   if(el.getAttribute('data-b')){return;} el.setAttribute('data-b','1');
   el.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();open(true);});
  })(ic[k]);}
 }
 window.chociCartBind=bindAll;
 if(document.readyState!=='loading'){bindAll();}else{document.addEventListener('DOMContentLoaded',bindAll);}
 badge(C.count||0);
 /* העמודים נשמרים במטמון לכולם — מצב העגלה האישי נטען אחרי הטעינה, רק למי שכבר יש עגלה */
 if(/woocommerce_items_in_cart=1/.test(document.cookie)){
  fetch(url('choci_cart_get'),{method:'POST',credentials:'same-origin',body:new URLSearchParams({n:C.n||''})})
   .then(function(r){return r.json();}).then(function(j){ if(j&&j.success){paint(j.data);} }).catch(function(){});
 }
})();

/* סינון ומיון בנייד */
(function(){
 function init(){
  if(window.innerWidth>768){return;}
  var side=document.getElementById('secondary'), list=document.querySelector('ul.products');
  if(!side||!list||side.classList.contains('cf-moved')){return;}
  var btn=document.createElement('button');btn.type='button';btn.className='cf-btn';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','secondary');btn.textContent='סינון ומיון';
  var anchor=document.querySelector('.kadence-shop-top-row')||list;
  anchor.parentNode.insertBefore(btn,anchor);
  btn.parentNode.insertBefore(side,btn.nextSibling);
  side.classList.add('cf-moved');
  var ord=document.querySelector('form.woocommerce-ordering');
  if(ord){var w=document.createElement('div');w.className='cf-order';var h=document.createElement('div');h.className='cf-order-title';h.textContent='מיון';w.appendChild(h);w.appendChild(ord.cloneNode(true));side.insertBefore(w,side.firstChild);
   var sel=w.querySelector('select');if(sel){sel.addEventListener('change',function(){sel.form.submit();});}}
  btn.addEventListener('click',function(){var on=!side.classList.contains('cf-open');side.classList.toggle('cf-open',on);btn.setAttribute('aria-expanded',on?'true':'false');});
 }
 if(window.CHOCI_ARCHIVE){
  if(document.readyState!=='loading'){init();}else{document.addEventListener('DOMContentLoaded',init);}
 }
})();

/* סרגל הנגישות */
(function(){
 var H=document.documentElement,KEY='chociA11y';
 var btn=document.getElementById('ca-btn'),panel=document.getElementById('ca-panel');
 if(!btn||!panel){return;}
 var guide=document.getElementById('ca-guide'),mt=document.getElementById('ca-mt'),
     mb=document.getElementById('ca-mb'),lens=document.getElementById('ca-lens'),
     fsLbl=document.getElementById('ca-fs-lbl'),last=null;

 var FLAGS={gray:'ca-gray',links:'ca-links',heads:'ca-heads',font:'ca-font',cursor:'ca-cursor',
  noanim:'ca-noanim',guide:'ca-guide',mask:'ca-mask',kbd:'ca-kbd',magnify:'ca-magnify',tts:'ca-tts'};
 var FSN={'-1':'קטן','0':'רגיל','1':'גדול','2':'גדול יותר','3':'ענק','4':'מרבי'};
 var PROFILES={
  p_vision:{fs:3,con:1,links:true,kbd:true},
  p_color:{con:3,links:true},
  p_dys:{font:true,space:2,guide:true,align:1},
  p_motor:{kbd:true,cursor:true,noanim:true,fs:1},
  p_seiz:{noanim:true,gray:true},
  p_adhd:{mask:true,noanim:true,space:1}
 };

 var st={};
 try{st=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){st={};}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
 function attr(name,val){ if(val){H.setAttribute(name,val);} else {H.removeAttribute(name);} }

 function sizeMask(y){
  var band=110;
  mt.style.height=Math.max(0,y-band/2)+'px';
  mb.style.height=Math.max(0,window.innerHeight-y-band/2)+'px';
 }

 function apply(){
  for(var k in FLAGS){H.classList.toggle(FLAGS[k],!!st[k]);}
  attr('data-ca-fs',st.fs||0);
  attr('data-ca-con',st.con||0);
  attr('data-ca-space',st.space||0);
  attr('data-ca-align',st.align||0);
  if(fsLbl){fsLbl.textContent=FSN[String(st.fs||0)]||'רגיל';}

  Array.prototype.forEach.call(panel.querySelectorAll('[data-ca-flag]'),function(b){
   var on=!!st[b.getAttribute('data-ca-flag')];
   b.classList.toggle('on',on); b.setAttribute('aria-pressed',on?'true':'false');
  });
  Array.prototype.forEach.call(panel.querySelectorAll('[data-ca-level]'),function(b){
   var key=b.getAttribute('data-ca-level'), v=st[key]||0;
   b.classList.toggle('on',v>0); b.setAttribute('aria-pressed',v>0?'true':'false');
   var dots=b.querySelectorAll('.ca-dots i');
   for(var i=0;i<dots.length;i++){dots[i].className=(i<v)?'f':'';}
  });
  Array.prototype.forEach.call(panel.querySelectorAll('[data-ca-profile]'),function(b){
   var on=(st.profile===b.getAttribute('data-ca-profile'));
   b.classList.toggle('on',on); b.setAttribute('aria-pressed',on?'true':'false');
  });
  if(st.noanim){Array.prototype.forEach.call(document.querySelectorAll('video,audio'),function(m){try{m.pause();}catch(e){}});}
  if(!st.tts && window.speechSynthesis){try{speechSynthesis.cancel();}catch(e){}}
  if(!st.magnify && lens){lens.classList.remove('show');}
  if(st.mask){sizeMask(window.innerHeight/2);}
 }

 function openP(){panel.classList.add('is-open');btn.setAttribute('aria-expanded','true');last=document.activeElement;var f=panel.querySelector('button');if(f){f.focus();}}
 function closeP(){panel.classList.remove('is-open');btn.setAttribute('aria-expanded','false');btn.focus();}
 function isOpen(){return panel.classList.contains('is-open');}

 btn.addEventListener('click',function(e){e.stopPropagation();if(isOpen()){closeP();}else{openP();}});
 panel.querySelector('.ca-x').addEventListener('click',closeP);
 document.addEventListener('click',function(e){
  if(isOpen()&&!panel.contains(e.target)&&!btn.contains(e.target)){closeP();}
 });
 document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){ if(st.tts){st.tts=false;save();apply();} if(isOpen()){closeP();} }
  if(e.altKey&&e.shiftKey&&(e.code==='KeyA')){e.preventDefault();if(isOpen()){closeP();}else{openP();}}
 });

 Array.prototype.forEach.call(panel.querySelectorAll('[data-ca-flag]'),function(b){
  b.addEventListener('click',function(){
   var k=b.getAttribute('data-ca-flag'); st[k]=!st[k]; st.profile=null; save(); apply();
  });
 });
 Array.prototype.forEach.call(panel.querySelectorAll('[data-ca-level]'),function(b){
  b.addEventListener('click',function(){
   var k=b.getAttribute('data-ca-level'), max=parseInt(b.getAttribute('data-ca-max'),10)||3;
   st[k]=((st[k]||0)+1)%(max+1); st.profile=null; save(); apply();
  });
 });
 Array.prototype.forEach.call(panel.querySelectorAll('[data-ca-fs]'),function(b){
  b.addEventListener('click',function(){
   var d=b.getAttribute('data-ca-fs')==='up'?1:-1;
   st.fs=Math.max(-1,Math.min(4,(st.fs||0)+d)); st.profile=null; save(); apply();
  });
 });
 Array.prototype.forEach.call(panel.querySelectorAll('[data-ca-profile]'),function(b){
  b.addEventListener('click',function(){
   var name=b.getAttribute('data-ca-profile');
   if(st.profile===name){ st={}; save(); apply(); return; }
   var p=PROFILES[name]||{}; st={profile:name};
   for(var k in p){ st[k]=p[k]; }
   save(); apply();
  });
 });
 panel.querySelector('.ca-reset').addEventListener('click',function(){ st={}; save(); apply(); });

 function onMove(e){
  var y=(e.touches&&e.touches[0])?e.touches[0].clientY:e.clientY;
  var x=(e.touches&&e.touches[0])?e.touches[0].clientX:e.clientX;
  if(st.guide&&guide){guide.style.top=(y-7)+'px';}
  if(st.mask){sizeMask(y);}
  if(st.magnify&&lens){
   var el=document.elementFromPoint(x,y);
   if(el&&!panel.contains(el)&&el!==btn&&!btn.contains(el)){
    var t=(el.innerText||el.textContent||'').trim();
    if(t&&t.length<320){
     lens.textContent=t; lens.classList.add('show');
     var top=(y>window.innerHeight/2)?(y-lens.offsetHeight-24):(y+24);
     lens.style.top=Math.max(8,top)+'px';
     var left=Math.min(Math.max(8,x-lens.offsetWidth/2),window.innerWidth-lens.offsetWidth-8);
     lens.style.left=left+'px';
    } else { lens.classList.remove('show'); }
   } else { lens.classList.remove('show'); }
  }
 }
 document.addEventListener('mousemove',onMove,{passive:true});
 document.addEventListener('touchmove',onMove,{passive:true});
 window.addEventListener('resize',function(){ if(st.mask){sizeMask(window.innerHeight/2);} });

 var reading=null;
 document.addEventListener('click',function(e){
  if(!st.tts){return;}
  if(panel.contains(e.target)||btn.contains(e.target)){return;}
  if(!window.speechSynthesis){return;}
  if(e.target.closest&&e.target.closest('a,button,input,select,textarea,summary,[role=button],[role=link],[tabindex]')){return;}
  var el=e.target.closest?e.target.closest('p,li,h1,h2,h3,h4,h5,h6,span,td,th,figcaption,label'):null;
  if(!el){return;}
  var txt=(el.innerText||el.textContent||'').trim();
  if(!txt){return;}
  try{
   speechSynthesis.cancel();
   if(reading){reading.classList.remove('ca-reading');}
   reading=el; el.classList.add('ca-reading');
   var u=new SpeechSynthesisUtterance(txt);
   u.lang='he-IL'; u.rate=.95;
   var vs=speechSynthesis.getVoices()||[];
   for(var i=0;i<vs.length;i++){ if(vs[i].lang&&vs[i].lang.indexOf('he')===0){u.voice=vs[i];break;} }
   u.onend=function(){ if(reading){reading.classList.remove('ca-reading');reading=null;} };
   speechSynthesis.speak(u);
  }catch(err){}
 },true);

 apply();
})();

/* תפריט נייד */
(function(){
 var C=window.CHOCI_MNAV||{};
 function badge(){
  var ic=document.querySelectorAll('.ico-cart');
  for(var i=0;i<ic.length;i++){
   if(!ic[i].getAttribute('href')){ic[i].setAttribute('href',C.cart);}
   if(C.fixBadge){var e=ic[i].querySelector('em');if(e){e.textContent=C.count;}}
  }
 }
 var panel=null,ov=null,last=null;
 function el(t,c,txt){var e=document.createElement(t);if(c){e.className=c;}if(txt!=null){e.textContent=txt;}return e;}
 function build(){
  var nav=document.querySelector('.hdr-nav');
  ov=el('div','cmnav-ov');ov.hidden=true;
  panel=el('aside','cmnav');panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','תפריט ראשי');panel.id='cmnav';
  var head=el('div','cmnav-head');head.appendChild(el('b',null,'תפריט'));
  var x=el('button','cmnav-x');x.type='button';x.setAttribute('aria-label','סגירת התפריט');x.innerHTML='&times;';head.appendChild(x);
  var body=el('div','cmnav-body');var top=el('ul','cmnav-top');
  var lis=nav?nav.querySelectorAll(':scope > ul > li'):[];
  for(var i=0;i<lis.length;i++){
   var li=lis[i],a=li.querySelector(':scope > a');if(!a){continue;}
   var item=el('li'),row=el('div','cmnav-row');
   var link=el('a',null,a.textContent.trim());link.href=a.href;row.appendChild(link);item.appendChild(row);
   var subs=li.querySelectorAll('.mega-cols a');
   if(subs.length){
    var sid='cmnav-s'+i,tg=el('button','cmnav-tg');tg.type='button';tg.setAttribute('aria-expanded','false');tg.setAttribute('aria-controls',sid);tg.setAttribute('aria-label','פתיחת '+a.textContent.trim());tg.innerHTML='<span aria-hidden="true">&#8964;</span>';row.appendChild(tg);
    var ul=el('ul','cmnav-sub');ul.id=sid;
    var all=el('a','cmnav-all','כל '+a.textContent.trim());all.href=a.href;var l0=el('li');l0.appendChild(all);ul.appendChild(l0);
    for(var k=0;k<subs.length;k++){var l=el('li'),s=el('a',null,subs[k].textContent.trim());s.href=subs[k].href;l.appendChild(s);ul.appendChild(l);}
    item.appendChild(ul);
   }
   top.appendChild(item);
  }
  body.appendChild(top);
  var ex=el('div','cmnav-extra');
  (C.extra||[]).forEach(function(o){var a=el('a',null,o.t);a.href=o.u;ex.appendChild(a);});
  if(C.tel){var t=el('a','cmnav-tel','חייגו אלינו '+C.telTxt);t.href='tel:'+C.tel;ex.appendChild(t);}
  body.appendChild(ex);
  panel.appendChild(head);panel.appendChild(body);
  document.body.appendChild(ov);document.body.appendChild(panel);
  x.addEventListener('click',close);ov.addEventListener('click',close);
  panel.addEventListener('click',function(e){var b=e.target.closest('.cmnav-tg');if(!b){return;}
   var s=document.getElementById(b.getAttribute('aria-controls')),on=b.getAttribute('aria-expanded')!=='true';
   b.setAttribute('aria-expanded',on?'true':'false');s.classList.toggle('on',on);});
 }
 function open(btn){
  if(!panel){build();}
  last=btn||document.activeElement;
  ov.hidden=false;panel.hidden=false;document.body.classList.add('cmnav-lock');
  void panel.offsetWidth;ov.classList.add('on');panel.classList.add('on');
  var bs=document.querySelectorAll('.ico-burger');for(var i=0;i<bs.length;i++){bs[i].setAttribute('aria-expanded','true');}
  var f=panel.querySelector('.cmnav-x');if(f){f.focus();}
 }
 function close(){
  if(!panel||panel.hidden){return;}
  ov.classList.remove('on');panel.classList.remove('on');document.body.classList.remove('cmnav-lock');
  setTimeout(function(){ov.hidden=true;panel.hidden=true;},220);
  var bs=document.querySelectorAll('.ico-burger');for(var i=0;i<bs.length;i++){bs[i].setAttribute('aria-expanded','false');}
  if(last&&last.focus){try{last.focus();}catch(e){}}
 }
 function init(){
  badge();
  var bs=document.querySelectorAll('.ico-burger');
  for(var i=0;i<bs.length;i++){
   bs[i].type='button';bs[i].setAttribute('aria-expanded','false');bs[i].setAttribute('aria-controls','cmnav');
   bs[i].addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open(this);});
  }
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){close();}});
 }
 if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
