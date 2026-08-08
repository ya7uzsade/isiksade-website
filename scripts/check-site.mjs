import { access, readFile, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const entries = await readdir(root);
const htmlFiles = entries.filter((file) => extname(file) === ".html").sort();
const knownRoutes = new Set(
  htmlFiles.map((file) => (file === "index.html" ? "/" : `/${basename(file, ".html")}`)),
);

const errors = [];
const warnings = [];

function report(bucket, file, message) {
  bucket.push(`${file}: ${message}`);
}

function matches(source, pattern) {
  return [...source.matchAll(pattern)];
}

for (const file of htmlFiles) {
  const html = await readFile(join(root, file), "utf8");

  if (!/<html\s[^>]*lang="tr"/i.test(html)) report(errors, file, 'başlangıç dili lang="tr" değil');
  if (!/<title>[^<]+<\/title>/i.test(html)) report(errors, file, "title eksik");
  if (!/<meta\s+name="description"\s+content="[^"]+"/i.test(html)) {
    report(errors, file, "meta description eksik");
  }
  if (!/<link\s+rel="canonical"\s+href="https:\/\/www\.isiksade\.com\//i.test(html)) {
    report(errors, file, "www.isiksade.com kullanan canonical eksik");
  }

  const trCount = matches(html, /\sdata-tr=/g).length;
  const enCount = matches(html, /\sdata-en=/g).length;
  if (trCount !== enCount) report(errors, file, `TR/EN alan sayısı eşleşmiyor (${trCount}/${enCount})`);

  for (const match of matches(html, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      report(errors, file, `geçersiz JSON-LD (${error.message})`);
    }
  }

  for (const match of matches(html, /href="(\/[^"]*)"/g)) {
    const route = match[1].split(/[?#]/)[0].replace(/\.html$/, "") || "/";
    if (route !== "/" && !knownRoutes.has(route)) report(errors, file, `kırık iç bağlantı: ${match[1]}`);
  }

  for (const match of matches(html, /(?:href|src)="((?:assets\/|favicon\.|apple-touch-icon|og\.png|logo\.svg)[^"]*)"/g)) {
    try {
      await access(join(root, match[1].split(/[?#]/)[0]));
    } catch {
      report(errors, file, `eksik yerel dosya: ${match[1]}`);
    }
  }

  if (!/name="viewport"/i.test(html)) report(errors, file, "viewport etiketi eksik");
  if (!/<script\s+src="assets\/js\/site-core\.js"><\/script>/i.test(html)) {
    report(errors, file, "ortak site çekirdeği bağlı değil");
  }
  if (!/application\/ld\+json/i.test(html)) report(warnings, file, "JSON-LD yapılandırılmış veri yok");
  if (!/property="og:title"/i.test(html)) report(warnings, file, "og:title eksik");
}

const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
for (const route of knownRoutes) {
  const expected = route === "/" ? "https://www.isiksade.com/" : `https://www.isiksade.com${route}`;
  if (!sitemap.includes(`<loc>${expected}</loc>`)) report(errors, "sitemap.xml", `rota eksik: ${route}`);
}

const llms = await readFile(join(root, "llms.txt"), "utf8");
if (/18 kişilik kadro|18-person team/i.test(llms)) {
  report(errors, "llms.txt", "güncelliğini yitirmiş ekip büyüklüğü kullanılıyor");
}

if (warnings.length) {
  console.log(`\nUyarılar (${warnings.length})`);
  warnings.forEach((item) => console.log(`- ${item}`));
}

if (errors.length) {
  console.error(`\nHatalar (${errors.length})`);
  errors.forEach((item) => console.error(`- ${item}`));
  process.exitCode = 1;
} else {
  console.log(`\nKontrol başarılı: ${htmlFiles.length} HTML sayfası doğrulandı.`);
}
