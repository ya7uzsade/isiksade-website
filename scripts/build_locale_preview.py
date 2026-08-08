#!/usr/bin/env python3
"""Build English HTML from the current static sources."""

from __future__ import annotations

import json
import argparse
from pathlib import Path

from lxml import etree
from lxml import html as lxml_html


ROOT = Path(__file__).resolve().parent.parent
PREVIEW_OUTPUT = ROOT / ".locale-preview" / "en"
SITE_URL = "https://www.isiksade.com"

STATIC_TEXT_TRANSLATIONS = {
    "AVUKATLIK ORTAKLIĞI": "ATTORNEY PARTNERSHIP",
    "Mayıs 2026": "May 2026",
    "İşyerinde KVKK uyumu: özlük dosyasından kamera kayıtlarına": "Workplace data protection compliance: from personnel files to camera recordings",
    "· İstanbul Barosu, Sicil No 49213": "· Istanbul Bar Association, Registration No. 49213",
    "· İstanbul Barosu, Sicil No 48080": "· Istanbul Bar Association, Registration No. 48080",
    "4857 sayılı İş Kanunu": "Labour Act No. 4857",
    "1475 sayılı (mülga) İş Kanunu m.14": "Article 14 of the former Labour Act No. 1475",
    "7036 sayılı İş Mahkemeleri Kanunu": "Labour Courts Act No. 7036",
    "5510 sayılı Sosyal Sigortalar ve GSS Kanunu": "Social Insurance and General Health Insurance Act No. 5510",
    "4447 sayılı İşsizlik Sigortası Kanunu": "Unemployment Insurance Act No. 4447",
    "3201 sayılı Kanun": "Act No. 3201 on Overseas Service Borrowing",
    "6331 sayılı İş Sağlığı ve Güvenliği Kanunu": "Occupational Health and Safety Act No. 6331",
    "Sosyal Güvenlik Kurumu (sgk.gov.tr)": "Social Security Institution (sgk.gov.tr)",
    "Arabuluculuk Daire Başkanlığı": "Department of Mediation",
}

AUDIT_ALLOWED_TERMS = (
    "Işık",
    "IŞIK",
    "Sİ",
    "Türkiye",
    "İŞKUR",
    "ÇSGB",
    "Bahçelievler",
    "Mehmetçik",
    "İstanbul",
    "Yargıtay",
    "KVKK",
)

BREADCRUMB_LABELS = {
    "Anasayfa": "Home",
    "Hakkımızda": "About Us",
    "Uzmanlık Alanları": "Practice Areas",
    "İş Hukuku": "Employment Law",
    "İşçi Hakları Rehberi": "Employee Rights Guide",
    "Hesaplama Araçları": "Calculators",
    "Ekibimiz": "Our Team",
    "Yayınlar": "Publications",
    "İletişim": "Contact",
    "KVKK Aydınlatma Metni": "Privacy Notice",
    "Kıdem Tazminatı Hesaplama": "Severance Pay Calculator",
    "İhbar Tazminatı Hesaplama": "Notice Pay Calculator",
    "Fazla Mesai Hesaplama": "Overtime Pay Calculator",
    "Fazla Mesai Ücreti Hesaplama": "Overtime Pay Calculator",
    "Yıllık İzin Ücreti Hesaplama": "Annual Leave Pay Calculator",
    "Hafta Tatili Ücreti Hesaplama": "Weekly Rest Day Pay Calculator",
    "Ulusal Bayram ve Genel Tatil Ücreti Hesaplama": "Public Holiday Pay Calculator",
    "İşsizlik Maaşı Hesaplama": "Unemployment Benefit Calculator",
    "İş Gücü Kaybı Tazminatı Hesaplama": "Loss of Earning Capacity Calculator",
}

SCHEMA_TEXT_TRANSLATIONS = {
    "Işık & Sade Avukatlık Ortaklığı": "Işık & Sade Attorney Partnership",
    "Işık & Sade Avukatlık Ortaklığı — İş Hukuku": "Işık & Sade Attorney Partnership — Employment Law",
    "Kurucu Ortak, Avukat": "Founding Partner, Attorney",
    "Kurucu Ortak / Avukat": "Founding Partner / Attorney",
    "İstanbul Barosu": "Istanbul Bar Association",
    "Baro Sicil No": "Bar Registration No.",
    "İstanbul": "Istanbul",
    "Işığı hukuktan, gücü sadelikten.": "Clarity in law. Strength in simplicity.",
    "İş ve Sosyal Güvenlik Hukuku": "Employment and Social Security Law",
    "İşçi alacakları": "Employee claims",
    "Yurt dışı inşaat işçisi davaları": "Overseas construction worker litigation",
    "Yurt dışı inşaat işçisi alacakları": "Overseas construction worker claims",
    "İşçi alacakları ve işe iade davaları": "Employee claims and reinstatement litigation",
    "İş kazası tazminatları": "Occupational accident compensation",
    "İşe iade davaları": "Reinstatement litigation",
    "Zorunlu arabuluculuk": "Mandatory mediation",
    "Kıdem ve ihbar tazminatı": "Severance and notice pay",
    "Fazla mesai ispatı": "Evidence of overtime work",
    "Hizmet tespiti davası": "Social security service determination actions",
    "İş Hukuku Hizmetleri": "Employment Law Services",
    "İşçilik alacağı davaları": "Employee receivables litigation",
    "İşe iade davası": "Reinstatement litigation",
    "İş kazası tazminatı davası": "Occupational accident compensation litigation",
    "Mobbing ve ayrımcılık tazminatı": "Compensation for workplace bullying and discrimination",
    "İşveren danışmanlığı": "Employer advisory",
    "İşçilik alacakları için izlenecek adımlar": "Steps for pursuing unpaid employment claims",
    "Ödenmeyen işçilik alacakları için belge toplama, süre kontrolü ve arabuluculuk adımları.": "Steps for collecting evidence, checking deadlines and completing mediation for unpaid employment claims.",
    "Belgeleri toplayın": "Collect your documents",
    "İş sözleşmesi, bordrolar, banka kayıtları, puantajlar; yurt dışı çalışmalarda pasaport ve vize kayıtları toplanır.": "Collect the employment contract, payslips, bank records and timesheets; for overseas work, also collect passport and visa records.",
    "Süreleri kontrol edin": "Check the deadlines",
    "İşe iade için bir aylık, alacaklar için beş yıllık süre kontrol edilir.": "Check the one-month deadline for reinstatement and the five-year limitation period for employment claims.",
    "Feragat belgesi imzalamayın": "Do not sign a waiver without advice",
    "İbraname niteliğindeki belgeler hak kaybına yol açar.": "Documents operating as a release may cause a loss of rights.",
    "Ön hesaplama yaptırın": "Obtain a preliminary calculation",
    "Alacak kalemlerinin yaklaşık tutarı hesaplanır.": "Obtain an estimate for each head of claim.",
    "Arabuluculuğa hazırlıklı gidin": "Prepare for mediation",
    "Avukat eşliğinde katılım sağlanır.": "Attend with legal representation and a documented claim calculation.",
    "Ücretsiz ön görüşme ve belge incelemesi": "Free initial consultation and document review",
    "Uzmanlık Alanlarımız": "Our Practice Areas",
    "İşçi alacakları, işe iade, iş kazası tazminatları, yurt dışı inşaat işçisi alacakları": "Employee claims, reinstatement, occupational accident compensation and overseas construction worker claims",
    "İş hukuku, işçi alacakları, inşaat işçisi hakları": "Employment law, employee claims and construction worker rights",
    "İstanbul'da iş ve sosyal güvenlik hukuku: işçilik alacakları, işe iade, iş kazası tazminatı, hizmet tespiti ve yurt dışı inşaat işçisi davaları.": "Employment and social security law services in Istanbul, including employee claims, reinstatement, occupational accident compensation, social security service determination and overseas construction worker litigation.",
    "İşçi hakları": "Employee rights",
    "Kıdem tazminatı": "Severance pay",
    "Hesaplama Araçları": "Calculators",
    "Kıdem Tazminatı Hesaplama": "Severance Pay Calculator",
    "İhbar Tazminatı Hesaplama": "Notice Pay Calculator",
    "Fazla Mesai Ücreti Hesaplama": "Overtime Pay Calculator",
    "Yıllık İzin Ücreti Hesaplama": "Annual Leave Pay Calculator",
    "Hafta Tatili Ücreti Hesaplama": "Weekly Rest Day Pay Calculator",
    "Ulusal Bayram ve Genel Tatil Ücreti": "National and Public Holiday Pay Calculator",
    "İşsizlik Maaşı Hesaplama": "Unemployment Benefit Calculator",
    "İş Gücü Kaybı Tazminatı Hesaplama": "Loss of Earning Capacity Calculator",
    "Gayrimenkul Hukuku": "Real Estate Law",
    "İcra ve İflas Hukuku": "Enforcement and Insolvency Law",
    "Şirketler Hukuku": "Corporate Law",
    "Sözleşmeler Hukuku": "Contract Law",
    "Kira uyuşmazlıkları, tapu, kamulaştırma, kentsel dönüşüm": "Lease disputes, title deeds, expropriation and urban renewal",
    "Kuruluş, birleşme ve devralmalar, sürekli danışmanlık": "Incorporations, mergers and acquisitions, and ongoing advisory",
    "Sözleşme hazırlama, müzakere, uyuşmazlık çözümü": "Contract drafting, negotiation and dispute resolution",
    "Müdafilik, mağdur vekilliği, iş kazası ceza davaları": "Criminal defence, victim representation and occupational accident prosecutions",
    "Boşanma, nafaka, velayet, miras paylaşımı": "Divorce, maintenance, child custody and estate distribution",
    "4857 sayılı İş Kanunu": "Labour Act No. 4857",
    "1475 sayılı İş Kanunu m.14": "Article 14 of Labour Act No. 1475",
    "7036 sayılı İş Mahkemeleri Kanunu": "Labour Courts Act No. 7036",
    "5510 sayılı Sosyal Sigortalar ve GSS Kanunu": "Social Insurance and General Health Insurance Act No. 5510",
    "4447 sayılı İşsizlik Sigortası Kanunu": "Unemployment Insurance Act No. 4447",
    "6331 sayılı İş Sağlığı ve Güvenliği Kanunu": "Occupational Health and Safety Act No. 6331",
    "3201 sayılı Kanun yurt dışı borçlanma": "Act No. 3201 on overseas service borrowing",
}


def replace_contents(element, value: str, allow_html: bool) -> None:
    for child in list(element):
        element.remove(child)
    element.text = None

    if not allow_html:
        element.text = value
        return

    fragments = lxml_html.fragments_fromstring(value)
    previous = None
    for fragment in fragments:
        if isinstance(fragment, str):
            if previous is None:
                element.text = (element.text or "") + fragment
            else:
                previous.tail = (previous.tail or "") + fragment
        else:
            element.append(fragment)
            previous = fragment


def translate_static_text(document) -> None:
    for element in document.xpath("//body//*"):
        if element.text:
            stripped = element.text.strip()
            if stripped in STATIC_TEXT_TRANSLATIONS:
                element.text = element.text.replace(stripped, STATIC_TEXT_TRANSLATIONS[stripped])


def translation_audit(document) -> list[str]:
    findings = []
    turkish_characters = set("ğĞşŞıİçÇöÖüÜ")
    for element in document.xpath("//body//*[not(self::script) and not(self::style)]"):
        hidden_turkish = element.xpath(
            'ancestor-or-self::*[contains(concat(" ", normalize-space(@class), " "), " lang-tr ") or @hidden]'
        )
        if hidden_turkish:
            continue
        if not element.text:
            continue
        text = " ".join(element.text.split())
        if not text:
            continue
        remainder = text
        for allowed in AUDIT_ALLOWED_TERMS:
            remainder = remainder.replace(allowed, "")
        if any(character in remainder for character in turkish_characters):
            findings.append(text[:240])
    return list(dict.fromkeys(findings))


def set_meta(document, selector: str, value: str) -> None:
    matches = document.xpath(selector)
    if matches:
        matches[0].set("content", value)


def add_alternates(head, route: str) -> None:
    for old in head.xpath('.//link[@rel="alternate"][@hreflang]'):
        old.getparent().remove(old)

    tr_url = f"{SITE_URL}/" if route == "index" else f"{SITE_URL}/{route}"
    en_url = f"{SITE_URL}/en/" if route == "index" else f"{SITE_URL}/en/{route}"
    for language, url in (("tr", tr_url), ("en", en_url), ("x-default", tr_url)):
        alternate = etree.Element("link", rel="alternate", hreflang=language, href=url)
        head.append(alternate)


def rewrite_local_paths(document, asset_prefix: str) -> None:
    for element in document.xpath('//*[@href or @src]'):
        for attribute in ("href", "src"):
            value = element.get(attribute)
            if not value:
                continue
            if value.startswith("assets/") or value in {
                "favicon.svg",
                "apple-touch-icon.png",
                "logo.svg",
                "og.png",
            }:
                element.set(attribute, asset_prefix + value)
            elif attribute == "href" and value in {"/", "index", "index.html"}:
                element.set(attribute, "index.html")
            elif attribute == "href" and value.startswith("/#"):
                element.set(attribute, "index.html" + value[1:])
            elif attribute == "href" and value.startswith("/") and not value.startswith("//"):
                element.set(attribute, value[1:])


def clean_text(element) -> str:
    return " ".join(element.text_content().split())


def english_faq_entities(document) -> list[dict]:
    entities = []
    seen = set()
    pairs = [
        ('.//div[contains(concat(" ", normalize-space(@class), " "), " faq-item ")]', ".//button", './/div[contains(concat(" ", normalize-space(@class), " "), " faq-a ")]'),
        ('.//div[contains(concat(" ", normalize-space(@class), " "), " kb-i ")]', './/*[contains(concat(" ", normalize-space(@class), " "), " kb-q ")]', './/*[contains(concat(" ", normalize-space(@class), " "), " kb-a ")]'),
    ]
    for item_xpath, question_xpath, answer_xpath in pairs:
        for item in document.xpath(item_xpath):
            questions = item.xpath(question_xpath)
            answers = item.xpath(answer_xpath)
            if not questions or not answers:
                continue
            question = clean_text(questions[0]).removesuffix("+").strip()
            answer = clean_text(answers[0]).removesuffix("Copy link").strip()
            if not question or not answer or question in seen:
                continue
            seen.add(question)
            entities.append({
                "@type": "Question",
                "name": question,
                "acceptedAnswer": {"@type": "Answer", "text": answer},
            })
    return entities


def english_howto_steps(document) -> list[dict]:
    steps = []
    for item in document.xpath('//ol[contains(concat(" ", normalize-space(@class), " "), " steps ") and not(ancestor-or-self::*[contains(concat(" ", normalize-space(@class), " "), " lang-tr ")])]/li'):
        names = item.xpath("./b")
        descriptions = item.xpath("./span")
        name = clean_text(names[0]) if names else clean_text(item)
        description = clean_text(descriptions[0]) if descriptions else clean_text(item)
        if name and description:
            steps.append({"@type": "HowToStep", "name": name, "text": description})
    return steps


def localize_schema_node(node, document, metadata: dict[str, str], canonical_url: str):
    if isinstance(node, list):
        return [localize_schema_node(item, document, metadata, canonical_url) for item in node]
    if isinstance(node, str):
        return SCHEMA_TEXT_TRANSLATIONS.get(node, node)
    if not isinstance(node, dict):
        return node

    schema_type = node.get("@type")
    if schema_type in {"Article", "NewsArticle"}:
        node["headline"] = metadata["title"]
        node["description"] = metadata["description"]
        node["inLanguage"] = "en"
        node.pop("keywords", None)
        main_page = node.get("mainEntityOfPage")
        if isinstance(main_page, dict):
            main_page["@id"] = canonical_url
    elif schema_type == "WebApplication":
        node["name"] = metadata["title"]
        node["description"] = metadata["description"]
        node["url"] = canonical_url
        node["inLanguage"] = "en"
    elif schema_type == "FAQPage":
        node["mainEntity"] = english_faq_entities(document)
    elif schema_type == "HowTo":
        visible_steps = english_howto_steps(document)
        if visible_steps:
            node["name"] = "Employment claim litigation process"
            node["description"] = "From the initial document review and mandatory mediation through judgment and enforcement."
            node["step"] = visible_steps
    elif schema_type == "BreadcrumbList":
        for item in node.get("itemListElement", []):
            if isinstance(item, dict):
                item["name"] = BREADCRUMB_LABELS.get(item.get("name"), item.get("name"))
                url = item.get("item")
                if isinstance(url, str):
                    for origin in (SITE_URL, "https://isiksade.com"):
                        if url.startswith(origin):
                            path = url[len(origin):]
                            item["item"] = f"{SITE_URL}/en/" if path in {"", "/"} else f"{SITE_URL}/en{path}"
                            break

    for key, value in list(node.items()):
        node[key] = localize_schema_node(value, document, metadata, canonical_url)
    return node


def build_page(filename: str, metadata: dict[str, str], output: Path, publish: bool) -> None:
    parser = lxml_html.HTMLParser(encoding="utf-8", remove_comments=False)
    document = lxml_html.parse(ROOT / filename, parser).getroot()
    document.set("lang", "en")
    document.set("dir", "ltr")

    # Locale-specific source blocks are paired in a few long-form pages. The
    # published English document must contain only the English branch so it
    # remains correct even before JavaScript runs or when scripts are disabled.
    for element in document.xpath('//*[contains(concat(" ", normalize-space(@class), " "), " lang-tr ")]'):
        parent = element.getparent()
        if parent is not None:
            parent.remove(element)
    for element in document.xpath('//*[contains(concat(" ", normalize-space(@class), " "), " lang-en ")]'):
        classes = [name for name in element.get("class", "").split() if name != "lang-en"]
        if classes:
            element.set("class", " ".join(classes))
        else:
            element.attrib.pop("class", None)
        element.attrib.pop("hidden", None)

    for element in document.xpath('//*[@data-en]'):
        replace_contents(element, element.get("data-en"), "data-html" in element.attrib)
    translate_static_text(document)

    title = document.xpath("//title")[0]
    title.text = metadata["title"]
    set_meta(document, '//meta[@name="description"]', metadata["description"])
    set_meta(document, '//meta[@property="og:title"]', metadata["title"])
    set_meta(document, '//meta[@property="og:description"]', metadata["description"])
    set_meta(document, '//meta[@property="og:site_name"]', "Işık & Sade Attorney Partnership")
    set_meta(document, '//meta[@name="twitter:title"]', metadata["title"])
    set_meta(document, '//meta[@name="twitter:description"]', metadata["description"])

    route = "index" if filename == "index.html" else Path(filename).stem
    canonical_url = f"{SITE_URL}/en/" if route == "index" else f"{SITE_URL}/en/{route}"
    canonical = document.xpath('//link[@rel="canonical"]')[0]
    canonical.set("href", canonical_url)
    set_meta(document, '//meta[@property="og:url"]', canonical_url)

    head = document.xpath("//head")[0]
    robots = document.xpath('//meta[@name="robots"]')
    if robots:
        robots[0].set("content", "index, follow" if publish else "noindex, nofollow")
        for duplicate in robots[1:]:
            duplicate.getparent().remove(duplicate)
    else:
        head.append(etree.Element("meta", name="robots", content="index, follow" if publish else "noindex, nofollow"))
    add_alternates(head, route)
    rewrite_local_paths(document, "../" if publish else "../../")

    for button_id, destination in (
        ("btn-tr", "/" if route == "index" else f"/{route}"),
        ("btn-en", filename),
    ):
        buttons = document.xpath(f'//*[@id="{button_id}"]')
        if buttons:
            buttons[0].set("onclick", f"window.location.href='{destination}'")

    output.mkdir(parents=True, exist_ok=True)
    for schema in document.xpath('//script[@type="application/ld+json"]'):
        payload = json.loads(schema.text or "")
        payload = localize_schema_node(payload, document, metadata, canonical_url)
        schema.text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))

    rendered = etree.tostring(document, method="html", encoding="unicode", doctype="<!DOCTYPE html>")
    # lxml normalises HTML attribute names; SVG presentation attributes are case-sensitive.
    rendered = rendered.replace(" viewbox=", " viewBox=").replace(
        " preserveaspectratio=", " preserveAspectRatio="
    )
    (output / filename).write_text(rendered, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--publish", action="store_true", help="write indexable pages to en/")
    args = parser.parse_args()
    output = ROOT / "en" if args.publish else PREVIEW_OUTPUT
    metadata = json.loads((ROOT / "data" / "en-preview.json").read_text(encoding="utf-8"))
    site = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
    expected = {"index.html" if route == "index" else f"{route}.html" for route in site["routes"]}
    if set(metadata) != expected:
        missing = sorted(expected - set(metadata))
        extra = sorted(set(metadata) - expected)
        raise ValueError(f"English metadata route mismatch; missing={missing}, extra={extra}")
    audit = {}
    for filename, page_metadata in metadata.items():
        build_page(filename, page_metadata, output, args.publish)
        preview = lxml_html.parse(output / filename).getroot()
        findings = translation_audit(preview)
        if findings:
            audit[filename] = findings
    audit_path = PREVIEW_OUTPUT.parent / "translation-audit.json"
    audit_path.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    if (args.publish or site["locales"]["en"]["publish"]) and audit:
        raise ValueError(f"English publication blocked by untranslated visible text in {sorted(audit)}")
    label = "published" if args.publish else "preview"
    print(f"Built {len(metadata)} English {label} pages in {output}")
    print(f"Translation audit flagged {sum(len(items) for items in audit.values())} text nodes across {len(audit)} pages")


if __name__ == "__main__":
    main()
