/* Guvenlik agi: ana script herhangi bir nedenle hata verirse .rv bloklari
   opacity:0 kalmasin. Bagimsiz script blogu oldugu icin diger hatalardan etkilenmez. */
(function(){
 var t=null;
 function pass(m){
  var els=document.querySelectorAll('.rv:not(.in)'); if(!els.length){detach();return;}
  var lim=window.innerHeight*(m||0.95);
  for(var i=0;i<els.length;i++){ if(els[i].getBoundingClientRect().top<lim) els[i].classList.add('in'); }
 }
 function onScroll(){ if(t)return; t=requestAnimationFrame(function(){t=null;pass();}); }
 function detach(){ window.removeEventListener('scroll',onScroll); window.removeEventListener('resize',onScroll); }
 window.addEventListener('scroll',onScroll,{passive:true});
 window.addEventListener('resize',onScroll);
 window.addEventListener('load',function(){ setTimeout(function(){pass(1.15)},700); });
 document.addEventListener('visibilitychange',function(){ if(!document.hidden) setTimeout(function(){pass(1.15)},120); });
 if(document.readyState!=='loading') setTimeout(function(){pass(1.15)},700);
 /* son care: 4 sn sonra hala gizli kalan varsa hepsini ac */
 setTimeout(function(){ var e=document.querySelectorAll('.rv:not(.in)');
   for(var i=0;i<e.length;i++) e[i].classList.add('in'); }, 4000);
})();
