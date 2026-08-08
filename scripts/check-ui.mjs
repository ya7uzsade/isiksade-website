import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const issues=[];

async function htmlFiles(dir=root){
  const result=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.')||entry.name==='node_modules')continue;
    const path=join(dir,entry.name);
    if(entry.isDirectory())result.push(...await htmlFiles(path));
    else if(entry.name.endsWith('.html'))result.push(path);
  }
  return result;
}

function count(text,pattern){return (text.match(pattern)||[]).length;}
function label(file){return file.slice(root.length+1);}

async function localTargetExists(file,href){
  if(!href||href.startsWith('#')||/^(https?:|mailto:|tel:|javascript:)/.test(href))return true;
  const clean=href.split(/[?#]/)[0];
  if(!clean)return true;
  const base=clean.startsWith('/')?root:dirname(file);
  const target=normalize(join(base,clean.replace(/^\//,'')));
  const candidates=extname(target)?[target]:[target+'.html',join(target,'index.html')];
  for(const candidate of candidates){try{if((await stat(candidate)).isFile())return true;}catch{}}
  return false;
}

for(const file of await htmlFiles()){
  const html=await readFile(file,'utf8');
  const name=label(file);
  const isEnglish=name.startsWith('en/');
  const isPreview=name==='ui-preview.html';

  if(!/<meta[^>]+name=["']viewport["']/i.test(html))issues.push(`${name}: viewport meta etiketi eksik`);
  if(isPreview){
    if(count(html,/ui-preview\.css/g)!==1)issues.push(`${name}: ui-preview.css tam bir kez yüklenmeli`);
  }else{
    if(count(html,/ux-modern\.css/g)!==1)issues.push(`${name}: ux-modern.css tam bir kez yüklenmeli`);
    if(count(html,/ux-modern\.js/g)!==1)issues.push(`${name}: ux-modern.js tam bir kez yüklenmeli`);
  }
  if(!/<header\b/i.test(html)||!/<footer\b/i.test(html))issues.push(`${name}: header veya footer eksik`);
  if(isEnglish&&!/<html[^>]+lang=["']en["']/i.test(html))issues.push(`${name}: İngilizce sayfanın lang değeri en değil`);
  if(!isEnglish&&!/<html[^>]+lang=["']tr["']/i.test(html))issues.push(`${name}: Türkçe sayfanın lang değeri tr değil`);

  const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]);
  const duplicates=ids.filter((id,index)=>id!=='p'&&ids.indexOf(id)!==index);
  if(duplicates.length)issues.push(`${name}: yinelenen id: ${[...new Set(duplicates)].join(', ')}`);

  for(const button of html.matchAll(/<button[^>]*class=["'][^"']*faq-q[^"']*["'][^>]*>([\s\S]*?)<\/button>/g)){
    if(count(button[1],/class=["'][^"']*faq-ic/g)!==1)issues.push(`${name}: eski SSS butonunda tam bir faq-ic bulunmalı`);
  }

  const hasLegacyFaq=/class=["'][^"']*faq-q/.test(html);
  const hasLegacyController=/assets\/js\/content-ui\.js/.test(html)||/querySelectorAll\(["']\.faq-q["']\)/.test(html);
  if(hasLegacyFaq&&!hasLegacyController)issues.push(`${name}: eski SSS için açma-kapama denetleyicisi eksik`);

  for(const match of html.matchAll(/href=["']([^"']+)["']/g)){
    if(!(await localTargetExists(file,match[1])))issues.push(`${name}: bulunamayan yerel bağlantı ${match[1]}`);
  }
}

if(issues.length){
  console.error(`UI kontrolü başarısız (${issues.length} sorun):\n- ${issues.join('\n- ')}`);
  process.exit(1);
}

console.log(`UI kontrolü başarılı: ${(await htmlFiles()).length} sayfa; dil, asset, SSS, id ve yerel bağlantılar doğrulandı.`);
