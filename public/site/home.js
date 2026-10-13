/* דף הבית — טאבים וגלילה ברצועת המוצרים הנבחרים */
(function(){
 var sec=document.getElementById("choci-prods"); if(!sec){return;}
 var tabs=[].slice.call(sec.querySelectorAll(".tabs button"));
 var panels=[].slice.call(sec.querySelectorAll(".prods"));
 var prev=sec.querySelector(".r-prev"), next=sec.querySelector(".r-next");
 function active(){for(var i=0;i<panels.length;i++){if(!panels[i].hidden){return panels[i];}}return panels[0];}
 function per(p){
  var g=window.getComputedStyle(p).gridTemplateColumns||"";
  var n=g.split(" ").filter(function(x){return x&&x!=="none";}).length;
  return n>0?n:4;
 }
 function paint(){
  var p=active(); if(!p){return;}
  var cards=[].slice.call(p.children), n=per(p);
  var pages=Math.max(1,Math.ceil(cards.length/n));
  var pg=parseInt(p.getAttribute("data-page"),10)||0;
  if(pg>pages-1){pg=pages-1;} if(pg<0){pg=0;}
  p.setAttribute("data-page",pg);
  for(var i=0;i<cards.length;i++){
   var on=(i>=pg*n&&i<(pg+1)*n);
   cards[i].hidden=!on;
  }
  var one=(pages<2);
  if(prev){prev.disabled=one||pg<=0;}
  if(next){next.disabled=one||pg>=pages-1;}
 }
 function move(d){var p=active(); if(!p){return;} p.setAttribute("data-page",(parseInt(p.getAttribute("data-page"),10)||0)+d); paint();}
 if(prev){prev.addEventListener("click",function(e){e.preventDefault();move(-1);});}
 if(next){next.addEventListener("click",function(e){e.preventDefault();move(1);});}
 tabs.forEach(function(btn,i){
  btn.addEventListener("click",function(e){
   e.preventDefault();
   tabs.forEach(function(b,j){
    b.classList.toggle("is-on",j===i);
    b.setAttribute("aria-selected",j===i?"true":"false");
    b.setAttribute("tabindex",j===i?"0":"-1");
    if(panels[j]){panels[j].hidden=(j!==i);}
   });
   paint();
  });
  btn.addEventListener("keydown",function(e){
   var d=0;
   if(e.key==="ArrowLeft"){d=1;} else if(e.key==="ArrowRight"){d=-1;} else {return;}
   e.preventDefault();
   var t=tabs[(i+d+tabs.length)%tabs.length]; t.focus(); t.click();
  });
 });
 var rt; window.addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(paint,150);});
 paint();
})();
