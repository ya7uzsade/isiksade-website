(function(){
  'use strict';

  function initStandaloneFaq(){
    document.querySelectorAll('.faq-sec .faq-item').forEach(function(item,index){
      var button=item.querySelector('button:not(.faq-q)');
      var answer=item.querySelector('.faq-a');
      if(!button||!answer)return;
      var id=answer.id||('standalone-faq-'+index);
      answer.id=id;
      button.setAttribute('aria-controls',id);
      button.setAttribute('aria-expanded','false');
      item.classList.remove('open');
      button.addEventListener('click',function(){
        var opening=!item.classList.contains('open');
        item.classList.toggle('open',opening);
        button.setAttribute('aria-expanded',String(opening));
      });
    });
  }

  function markCurrentNavigation(){
    var current=location.pathname.replace(/\/$/,'')||'/';
    document.querySelectorAll('nav.menu a').forEach(function(link){
      var target=new URL(link.href,location.href).pathname.replace(/\/$/,'')||'/';
      if(target===current){
        link.classList.add('current');
        link.setAttribute('aria-current','page');
      }
    });
  }

  function init(){initStandaloneFaq();markCurrentNavigation();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
