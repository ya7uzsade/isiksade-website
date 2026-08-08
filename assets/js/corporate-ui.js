var hmb=document.getElementById('hmb'), menu=document.getElementById('menu');
hmb.addEventListener('click',function(){menu.classList.toggle('open');hmb.classList.toggle('x');});
window.addEventListener('scroll',function(){document.getElementById('hd').classList.toggle('solid',window.scrollY>40);},{passive:true});
var obs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}});},{threshold:.01,rootMargin:'0px 0px 45% 0px'});
document.querySelectorAll('[data-rv]').forEach(function(el){obs.observe(el);});
function countUp(el){var to=parseInt(el.getAttribute('data-to'),10),dur=1600,t0=null;function s(t){if(!t0)t0=t;var p=Math.min((t-t0)/dur,1);el.textContent=Math.round(to*(1-Math.pow(1-p,4))).toLocaleString('tr-TR');if(p<1)requestAnimationFrame(s);}requestAnimationFrame(s);}
var cObs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){countUp(e.target);var st=e.target.closest('.stat');if(st)st.classList.add('on');cObs.unobserve(e.target);}});},{threshold:.5});
document.querySelectorAll('.cnt').forEach(function(el){cObs.observe(el);});
