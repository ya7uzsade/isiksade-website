(function(){
var TAVAN=73729.87, ASG_BRUT=33030, DAMGA=0.00759;
var EN=function(){return document.documentElement.lang==='en'};
var f=function(n){return (isFinite(n)?n:0).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL'};
var v=function(id){var e=document.getElementById(id);return e?(parseFloat(e.value)||0):0};
var s=function(id){var e=document.getElementById(id);return e?e.value:''};
var d=function(id){var e=document.getElementById(id);return e?new Date(e.value):new Date(NaN)};
function row(l,val,cls){return '<div class="r '+(cls||'')+'"><span>'+l+'</span><b>'+val+'</b></div>'}
function note(t){return '<div class="r cap"><span>'+t+'</span><b></b></div>'}
function err(id,t){document.getElementById(id).innerHTML='<div class="r cap"><span>'+t+'</span><b></b></div>'}
function svc(a,b){ // hizmet suresi
 var gun=Math.floor((b-a)/86400000);
 var y=Math.floor(gun/365), rk=gun-y*365, m=Math.floor(rk/30), g=rk-m*30;
 return {gun:gun, y:y, m:m, g:g, yil:gun/365};
}
function ihbarHafta(yil){return yil<0.5?2:yil<1.5?4:yil<3?6:8}

function cKidem(){
 var a=d('k1'),b=d('k2'),br=v('k3'),ek=v('k4');
 var L=EN()?{s:'Total service',k:'Gross severance pay',c:'Ceiling applied — calculated on ',dv:'Stamp duty (0.759‰)',n:'Net severance pay',e:'Enter valid dates and a wage.',y:'y',mo:'m',da:'d',base:'Dressed daily wage'}
           :{s:'Toplam hizmet süresi',k:'Brüt kıdem tazminatı',c:'Tavan aşıldı — hesap şu tutar üzerinden: ',dv:'Damga vergisi (‰7,59)',n:'Net kıdem tazminatı',e:'Geçerli tarih ve ücret giriniz.',y:'yıl',mo:'ay',da:'gün',base:'Giydirilmiş günlük ücret'};
 if(isNaN(a)||isNaN(b)||b<=a||br<=0){return err('o-kidem',L.e)}
 var t=svc(a,b), giy=br+ek, esas=Math.min(giy,TAVAN);
 var kg=t.y*30+30*(t.m/12)+30*(t.g/365);
 var kidem=kg*(esas/30), dm=kidem*DAMGA;
 var h=row(L.s,t.y+' '+L.y+' '+t.m+' '+L.mo+' '+t.g+' '+L.da);
 h+=row(L.base,f(esas/30));
 h+=row(L.k,f(kidem));
 if(giy>TAVAN) h+=note(L.c+f(TAVAN));
 h+=row(L.dv,'-'+f(dm));
 h+=row(L.n,f(kidem-dm),'tot');
 document.getElementById('o-kidem').innerHTML=h;
}
function cIhbar(){
 var a=d('i1'),b=d('i2'),br=v('i3'),ek=v('i4');
 var L=EN()?{s:'Total service',w:'Statutory notice period',br:'Gross notice pay',gv:'Income tax (15% assumed)',dv:'Stamp duty (0.759‰)',n:'Estimated net',e:'Enter valid dates and a wage.',y:'y',mo:'m',da:'d',wk:' weeks'}
           :{s:'Toplam hizmet süresi',w:'Yasal bildirim süresi',br:'Brüt ihbar tazminatı',gv:'Gelir vergisi (%15 varsayım)',dv:'Damga vergisi (‰7,59)',n:'Tahmini net',e:'Geçerli tarih ve ücret giriniz.',y:'yıl',mo:'ay',da:'gün',wk:' hafta'};
 if(isNaN(a)||isNaN(b)||b<=a||br<=0){return err('o-ihbar',L.e)}
 var t=svc(a,b), hf=ihbarHafta(t.yil), giyG=(br+ek)/30;
 var brut=hf*7*giyG, gv=brut*0.15, dm=brut*DAMGA;
 var h=row(L.s,t.y+' '+L.y+' '+t.m+' '+L.mo+' '+t.g+' '+L.da);
 h+=row(L.w,hf+L.wk+' ('+(hf*7)+' '+L.da+')');
 h+=row(L.br,f(brut));
 h+=row(L.gv,'-'+f(gv));
 h+=row(L.dv,'-'+f(dm));
 h+=row(L.n,f(brut-gv-dm),'tot');
 document.getElementById('o-ihbar').innerHTML=h;
}
function cMesai(){
 var br=v('m1'), hs=v('m2'), hf=v('m3'), ind=v('m4')/100;
 var L=EN()?{sa:'Hourly rate (gross ÷ 225)',fz:'Overtime hours per week',tp:'Total overtime hours',zm:'Premium rate',br:'Gross overtime pay',ind:'Equitable reduction',n:'Net claim',e:'Enter a wage and weekly hours above 45.',lim:'Exceeds the 270-hour annual cap — ',h:' h'}
           :{sa:'Saat ücreti (brüt ÷ 225)',fz:'Haftalık fazla çalışma',tp:'Toplam fazla çalışma saati',zm:'Zam oranı',br:'Brüt fazla mesai ücreti',ind:'Hakkaniyet indirimi',n:'Net talep edilebilir',e:'Ücret ve 45 saatten fazla haftalık çalışma giriniz.',lim:'Yıllık 270 saat sınırı aşıldı — ',h:' saat'};
 if(br<=0||hs<=45||hf<=0){return err('o-mesai',L.e)}
 var saat=br/225, fzH=hs-45, top=fzH*hf, zamli=saat*1.5;
 var brut=top*zamli, kes=brut*ind;
 var h=row(L.sa,f(saat));
 h+=row(L.fz,fzH.toFixed(1)+L.h);
 h+=row(L.tp,top.toFixed(1)+L.h);
 if(hf>=48 && top>270) h+=note(L.lim+top.toFixed(0)+L.h);
 h+=row(L.zm,'%50 ('+f(zamli)+'/'+(EN()?'h':'saat')+')');
 h+=row(L.br,f(brut));
 if(ind>0) h+=row(L.ind,'-'+f(kes));
 h+=row(L.n,f(brut-kes),'tot');
 document.getElementById('o-mesai').innerHTML=h;
}
function cIzin(){
 var a=d('y1'),b=d('y2'),br=v('y3'),kul=v('y4'),yas=s('y5')==='1';
 var L=EN()?{s:'Total service',hk:'Leave days earned',ku:'Leave days used',kl:'Unused leave days',gu:'Daily bare wage (gross ÷ 30)',br:'Gross leave pay',dv:'Stamp duty (0.759‰)',gv:'Income tax (15% assumed)',n:'Estimated net',e:'Enter valid dates and a wage. Minimum one year of service is required.',da:' days',y:'y',mo:'m',dd:'d'}
           :{s:'Toplam hizmet süresi',hk:'Hak edilen izin günü',ku:'Kullanılan izin günü',kl:'Kullanılmayan izin günü',gu:'Günlük çıplak ücret (brüt ÷ 30)',br:'Brüt izin ücreti',dv:'Damga vergisi (‰7,59)',gv:'Gelir vergisi (%15 varsayım)',n:'Tahmini net',e:'Geçerli tarih ve ücret giriniz. En az 1 yıl kıdem gerekir.',da:' gün',y:'yıl',mo:'ay',dd:'gün'};
 if(isNaN(a)||isNaN(b)||b<=a||br<=0){return err('o-izin',L.e)}
 var t=svc(a,b);
 if(t.yil<1){return err('o-izin',L.e)}
 var hak=0;
 for(var i=1;i<=Math.floor(t.yil);i++){
   var g = i<=5?14 : i<=15?20 : 26;
   if(yas && g<20) g=20;
   hak+=g;
 }
 var kalan=Math.max(0,hak-kul), gun=br/30, brut=kalan*gun;
 var dm=brut*DAMGA, gv=brut*0.15;
 var h=row(L.s,t.y+' '+L.y+' '+t.m+' '+L.mo+' '+t.g+' '+L.dd);
 h+=row(L.hk,hak+L.da);
 h+=row(L.ku,kul+L.da);
 h+=row(L.kl,kalan+L.da);
 h+=row(L.gu,f(gun));
 h+=row(L.br,f(brut));
 h+=row(L.gv,'-'+f(gv));
 h+=row(L.dv,'-'+f(dm));
 h+=row(L.n,f(brut-gv-dm),'tot');
 document.getElementById('o-izin').innerHTML=h;
}
function cHafta(){
 var br=v('h1'), n=v('h2'), ind=v('h3')/100;
 var L=EN()?{gu:'Daily wage (gross ÷ 30)',ek:'Additional per rest day',br:'Gross claim',ind:'Equitable reduction',n:'Net claim',e:'Enter a wage and the number of rest days worked.',x:'1.5 daily wages'}
           :{gu:'Günlük ücret (brüt ÷ 30)',ek:'Tatil günü başına ilave',br:'Brüt alacak',ind:'Hakkaniyet indirimi',n:'Net talep edilebilir',e:'Ücret ve çalışılan hafta tatili sayısı giriniz.',x:'1,5 yevmiye'};
 if(br<=0||n<=0){return err('o-hafta',L.e)}
 var gun=br/30, ek=gun*1.5, brut=ek*n, kes=brut*ind;
 var h=row(L.gu,f(gun));
 h+=row(L.ek,L.x+' = '+f(ek));
 h+=row(L.br,f(brut));
 if(ind>0) h+=row(L.ind,'-'+f(kes));
 h+=row(L.n,f(brut-kes),'tot');
 document.getElementById('o-hafta').innerHTML=h;
}
function cUbgt(){
 var br=v('u1'), n=v('u2'), ind=v('u3')/100;
 var L=EN()?{gu:'Daily wage (gross ÷ 30)',ek:'Additional per holiday worked',br:'Gross claim',ind:'Equitable reduction',n:'Net claim',e:'Enter a wage and the number of holidays worked.',x:'1 daily wage'}
           :{gu:'Günlük ücret (brüt ÷ 30)',ek:'Çalışılan tatil günü başına ilave',br:'Brüt alacak',ind:'Hakkaniyet indirimi',n:'Net talep edilebilir',e:'Ücret ve çalışılan tatil günü sayısı giriniz.',x:'1 yevmiye'};
 if(br<=0||n<=0){return err('o-ubgt',L.e)}
 var gun=br/30, brut=gun*n, kes=brut*ind;
 var h=row(L.gu,f(gun));
 h+=row(L.ek,L.x+' = '+f(gun));
 h+=row(L.br,f(brut));
 if(ind>0) h+=row(L.ind,'-'+f(kes));
 h+=row(L.n,f(brut-kes),'tot');
 document.getElementById('o-ubgt').innerHTML=h;
}
function cIssizlik(){
 var ort=v('s1'), pg=parseInt(s('s2'),10);
 var L=EN()?{gk:'Average daily gross earnings',hs:'Benefit (40% of gross)',alt:'Floor applied (40% of gross minimum wage)',ust:'Cap applied (80% of gross minimum wage)',dv:'Stamp duty (0.759‰)',net:'Monthly net benefit',sr:'Duration',tp:'Total to be received',e:'Enter your average gross wage.',ay:' months',gn:' days'}
           :{gk:'Ortalama günlük brüt kazanç',hs:'Ödenek (brütün %40\'ı)',alt:'Alt sınır uygulandı (brüt asgari ücretin %40\'ı)',ust:'Üst sınır uygulandı (brüt asgari ücretin %80\'i)',dv:'Damga vergisi (‰7,59)',net:'Aylık net ödenek',sr:'Ödeme süresi',tp:'Toplam alınacak tutar',e:'Ortalama brüt ücretinizi giriniz.',ay:' ay',gn:' gün'};
 if(ort<=0){return err('o-issizlik',L.e)}
 var gunluk=ort/30, hesap=gunluk*30*0.40;
 var alt=ASG_BRUT*0.40, ust=ASG_BRUT*0.80, brut=hesap, flag='';
 if(brut<alt){brut=alt;flag='alt'} else if(brut>ust){brut=ust;flag='ust'}
 var dm=brut*DAMGA, net=brut-dm;
 var sure = pg>=1080?300 : pg>=900?240 : 180;
 var ay=sure/30;
 var h=row(L.gk,f(gunluk));
 h+=row(L.hs,f(hesap));
 if(flag==='alt') h+=note(L.alt+' — '+f(alt));
 if(flag==='ust') h+=note(L.ust+' — '+f(ust));
 h+=row(L.dv,'-'+f(dm));
 h+=row(L.net,f(net));
 h+=row(L.sr,sure+L.gn+' ('+ay+L.ay+')');
 h+=row(L.tp,f(net*ay),'tot');
 document.getElementById('o-issizlik').innerHTML=h;
}
var OMUR=[[20,60],[25,55.3],[30,50.6],[35,46],[40,41.4],[45,36.9],[50,32.5],[55,28.2],[60,24.1],[65,20.1],[70,16.3],[75,12.8]];
function bakiye(y){
 if(y<=20)return 60; if(y>=75)return 12.8;
 for(var i=0;i<OMUR.length-1;i++){var a=OMUR[i],b=OMUR[i+1];
  if(y>=a[0]&&y<=b[0]) return a[1]+(b[1]-a[1])*((y-a[0])/(b[0]-a[0]));}
 return 20;
}
function cIsgucu(){
 var yas=v('g1'), gel=v('g2'), oran=v('g3')/100, kusur=v('g4')/100;
 var L=EN()?{ak:'Active period (to age 60)',pa:'Passive period (remaining life)',akk:'Active-period earnings',pak:'Passive-period earnings (at minimum wage)',tp:'Total earnings base',ic:'× incapacity rate',ku:'× employer fault',hk:'− 10% equitable reduction',so:'Rough estimate of pecuniary damages',e:'Enter your age, income and incapacity rate.',yl:' years'}
           :{ak:'Aktif dönem (60 yaşa kadar)',pa:'Pasif dönem (bakiye ömür)',akk:'Aktif dönem kazancı',pak:'Pasif dönem kazancı (asgari ücret)',tp:'Toplam kazanç matrahı',ic:'× iş göremezlik oranı',ku:'× işveren kusur oranı',hk:'− %10 hakkaniyet indirimi',so:'Kaba maddi tazminat tahmini',e:'Yaş, gelir ve iş göremezlik oranı giriniz.',yl:' yıl'};
 if(yas<16||gel<=0||oran<=0){return err('o-isgucu',L.e)}
 var aktif=Math.max(0,60-yas), bak=bakiye(yas), pasif=Math.max(0,bak-aktif);
 var netAsg=28075.50;
 var ak=gel*12*aktif, pa=netAsg*12*pasif, tp=ak+pa;
 var son=tp*oran*kusur*0.90;
 var h=row(L.ak,aktif.toFixed(0)+L.yl);
 h+=row(L.pa,pasif.toFixed(1)+L.yl);
 h+=row(L.akk,f(ak));
 h+=row(L.pak,f(pa));
 h+=row(L.tp,f(tp));
 h+=row(L.ic,'%'+(oran*100).toFixed(1));
 h+=row(L.ku,'%'+(kusur*100).toFixed(0));
 h+=row(L.hk,'%10');
 h+=row(L.so,f(son),'tot');
 document.getElementById('o-isgucu').innerHTML=h;
}
var ALL=[cKidem,cIhbar,cMesai,cIzin,cHafta,cUbgt,cIssizlik,cIsgucu];
function run(){ALL.forEach(function(fn){try{fn()}catch(e){}})}
document.querySelectorAll('.tool-in input,.tool-in select').forEach(function(e){
 e.addEventListener('input',run); e.addEventListener('change',run);
});
run();
var _s=window.setLang; if(_s) window.setLang=function(l){_s(l);setTimeout(run,60)};
// chip nav aktif takibi (scroll tabanli)
var chips=[].slice.call(document.querySelectorAll('.tnav a'));
var secs=chips.map(function(c){return document.querySelector(c.getAttribute('href'))});
var nav=document.querySelector('.tnav');
function mark(){
 var y=window.scrollY+(nav?nav.getBoundingClientRect().height:0)+120, idx=0;
 for(var i=0;i<secs.length;i++){ if(secs[i] && (secs[i].getBoundingClientRect().top+window.scrollY)<=y) idx=i; }
 chips.forEach(function(c,k){c.classList.toggle('on',k===idx)});
 var a=chips[idx], box=document.querySelector('.tnav-in');
 if(a&&box&&box.scrollWidth>box.clientWidth){
  var l=a.offsetLeft-box.clientWidth/2+a.offsetWidth/2;
  box.scrollTo({left:Math.max(0,l),behavior:'smooth'});
 }
}
window.addEventListener('scroll',mark,{passive:true});
window.addEventListener('resize',mark);
mark();
// yazdır
var pb=document.getElementById('printBtn');
if(pb) pb.addEventListener('click',function(){window.print()});
})();
