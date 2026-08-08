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

const siteConfig = JSON.parse(await readFile(join(root, "data/site.json"), "utf8"));
const vercelConfig = JSON.parse(await readFile(join(root, "vercel.json"), "utf8"));
if (siteConfig.organization.teamSizeMinimum < 31) {
  report(errors, "data/site.json", "ekip büyüklüğü 30 kişiyi aşan ekip bilgisini karşılamıyor");
}
if (siteConfig.locales.ar.direction !== "rtl") {
  report(errors, "data/site.json", "Arapça yönü rtl olmalı");
}
const configuredRoutes = new Set(siteConfig.routes);
if (Object.keys(siteConfig.englishRoutes).length !== siteConfig.routes.length) {
  report(errors, "data/site.json", "İngilizce rota eşlemesi eksik");
}
if (new Set(Object.values(siteConfig.englishRoutes)).size !== siteConfig.routes.length) {
  report(errors, "data/site.json", "İngilizce rotalar benzersiz değil");
}
for (const route of siteConfig.routes.filter((item) => item !== "index")) {
  if (route === siteConfig.englishRoutes[route]) continue;
  const redirect = vercelConfig.redirects?.find((item) => item.source === `/en/${route}`);
  if (!redirect || redirect.destination !== `/en/${siteConfig.englishRoutes[route]}` || !redirect.permanent) {
    report(errors, "vercel.json", `eski İngilizce rota yönlendirmesi eksik: ${route}`);
  }
}
for (const file of htmlFiles) {
  const route = basename(file, ".html");
  if (!configuredRoutes.has(route)) report(errors, "data/site.json", `rota eksik: ${route}`);
}

for (const file of htmlFiles) {
  const route = file === "index.html" ? "index" : basename(file, ".html");
  const html = await readFile(join(root, file), "utf8");
  const trUrl = route === "index" ? `${siteConfig.siteUrl}/` : `${siteConfig.siteUrl}/${route}`;
  const enRoute = siteConfig.englishRoutes[route];
  const enUrl = route === "index" ? `${siteConfig.siteUrl}/en/` : `${siteConfig.siteUrl}/en/${enRoute}`;
  if (!html.includes(`hreflang="tr" href="${trUrl}"`)) report(errors, file, "TR hreflang eksik");
  if (!html.includes(`hreflang="en" href="${enUrl}"`)) report(errors, file, "EN hreflang eksik");
  if (!html.includes(`window.location.href='${route === "index" ? "/en/" : `/en/${enRoute}`}'`)) {
    report(errors, file, "EN dil düğmesi yayın rotasına gitmiyor");
  }
}

if (siteConfig.locales.en.publish) {
  const enRoot = join(root, "en");
  const enFiles = (await readdir(enRoot)).filter((file) => extname(file) === ".html").sort();
  if (enFiles.length !== siteConfig.routes.length) {
    report(errors, "en/", `İngilizce sayfa sayısı hatalı (${enFiles.length}/${siteConfig.routes.length})`);
  }
  for (const route of siteConfig.routes) {
    const enRoute = siteConfig.englishRoutes[route];
    const file = route === "index" ? "index.html" : `${enRoute}.html`;
    const html = await readFile(join(enRoot, file), "utf8");
    const expected = route === "index" ? `${siteConfig.siteUrl}/en/` : `${siteConfig.siteUrl}/en/${enRoute}`;
    if (!/<html\s[^>]*lang="en"[^>]*dir="ltr"/i.test(html)) report(errors, `en/${file}`, "lang/dir hatalı");
    if (!html.includes(`<link rel="canonical" href="${expected}">`)) report(errors, `en/${file}`, "canonical hatalı");
    if (!/name="robots" content="index, follow"/i.test(html)) report(errors, `en/${file}`, "index izni eksik");
    if (/noindex/i.test(html)) report(errors, `en/${file}`, "noindex kalmış");
    if (!sitemap.includes(`<loc>${expected}</loc>`)) report(errors, "sitemap.xml", `EN rota eksik: ${route}`);
    for (const match of matches(html, /href="([^"]+)"/g)) {
      const href = match[1];
      if (/^(?:#|\/en(?:\/|$)|\.\.\/|https?:\/\/|mailto:|tel:|javascript:)/.test(href)) continue;
      report(errors, `en/${file}`, `İngilizce sayfada göreli iç bağlantı kaldı: ${href}`);
    }
    if (!html.includes('href="../assets/') && !html.includes('src="../assets/')) {
      report(errors, `en/${file}`, "İngilizce varlık yolları beklenen yapıda değil");
    }
    for (const match of matches(html, /(?:href|src)="(\.\.\/(?:assets\/|favicon\.|apple-touch-icon|og\.png|logo\.svg)[^"]*)"/g)) {
      try {
        await access(join(enRoot, match[1].split(/[?#]/)[0]));
      } catch {
        report(errors, `en/${file}`, `eksik yerel dosya: ${match[1]}`);
      }
    }
  }
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
