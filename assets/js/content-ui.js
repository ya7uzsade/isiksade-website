var hmb=document.getElementById('hmb'), menu=document.getElementById('menu');
hmb.addEventListener('click',function(){menu.classList.toggle('open');hmb.classList.toggle('x');});
menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open');hmb.classList.remove('x');});});
window.addEventListener('scroll',function(){
  document.getElementById('hd').classList.toggle('solid',window.scrollY>40);
  var h=document.documentElement.scrollHeight-window.innerHeight;
  document.getElementById('progress').style.width=(h>0?(window.scrollY/h)*100:0)+'%';
},{passive:true});
document.querySelectorAll('.faq-q').forEach(function(b){
  b.addEventListener('click',function(){
    var it=b.closest('.faq-item'), a=it.querySelector('.faq-a'), open=it.classList.toggle('open');
    b.setAttribute('aria-expanded',open); a.style.maxHeight=open?a.scrollHeight+'px':'0px';
  });
});
var tocN=document.getElementById('tocNav'), tocH=document.getElementById('tocH');
if(tocN&&tocH){
  tocH.addEventListener('click',function(){ if(window.innerWidth<=900) tocN.classList.toggle('open'); });
  document.querySelectorAll('.toc a').forEach(function(a){a.addEventListener('click',function(){ if(window.innerWidth<=900) tocN.classList.remove('open'); });});
  var links=[].slice.call(document.querySelectorAll('.toc a'));
  var obs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l.classList.toggle('active',l.getAttribute('href')==='#'+e.target.id);});}});},{rootMargin:'-90px 0px -70% 0px'});
  document.querySelectorAll('.art h2[id]').forEach(function(h){obs.observe(h);});
}
var rvObs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rvObs.unobserve(e.target);}});},{threshold:.06,rootMargin:'0px 0px -4% 0px'});
document.querySelectorAll('.rv').forEach(function(el){rvObs.observe(el);});
