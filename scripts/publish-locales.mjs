import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const site = JSON.parse(await readFile(join(root, "data/site.json"), "utf8"));
const origin = site.siteUrl;

const routeUrl = (locale, route) => {
  const prefix = locale === "en" ? "/en" : "";
  return route === "index" ? `${origin}${prefix}/` : `${origin}${prefix}/${route}`;
};

for (const route of site.routes) {
  const filename = route === "index" ? "index.html" : `${route}.html`;
  const path = join(root, filename);
  let html = await readFile(path, "utf8");
  html = html.replace(/\n?<link rel="alternate" hreflang="(?:tr|en|x-default)" href="[^"]+">/g, "");
  const tr = routeUrl("tr", route);
  const en = routeUrl("en", route);
  const alternates = [
    `<link rel="alternate" hreflang="tr" href="${tr}">`,
    `<link rel="alternate" hreflang="en" href="${en}">`,
    `<link rel="alternate" hreflang="x-default" href="${tr}">`,
  ].join("\n");
  html = html.replace(/(<link rel="canonical" href="[^"]+">)/, `$1\n${alternates}`);
  html = html.replace(
    /(<button id="btn-en"[^>]*?)onclick="[^"]*"/,
    `$1onclick="window.location.href='${route === "index" ? "/en/" : `/en/${route}`}'"`,
  );
  await writeFile(path, html);
}

const priorities = {
  index: "1.0", "is-hukuku": "0.9", "isci-haklari": "0.9", hesaplama: "0.9",
  hizmetler: "0.8", iletisim: "0.7", hakkimizda: "0.6", ekibimiz: "0.6",
  yayinlar: "0.6", kvkk: "0.3",
};
const blocks = [];
for (const locale of ["tr", "en"]) {
  for (const route of site.routes) {
    const tr = routeUrl("tr", route);
    const en = routeUrl("en", route);
    blocks.push(`  <url>
    <loc>${routeUrl(locale, route)}</loc>
    <xhtml:link rel="alternate" hreflang="tr" href="${tr}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${tr}"/>
    <lastmod>2026-08-08</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priorities[route] ?? "0.8"}</priority>
  </url>`);
  }
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks.join("\n")}
</urlset>
`;
await writeFile(join(root, "sitemap.xml"), sitemap);
console.log(`Prepared ${site.routes.length} Turkish and English route pairs.`);
