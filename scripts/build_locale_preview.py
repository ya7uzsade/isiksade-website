#!/usr/bin/env python3
"""Build non-published English HTML previews from the current static sources."""

from __future__ import annotations

import json
from pathlib import Path

from lxml import etree
from lxml import html as lxml_html


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / ".locale-preview" / "en"
SITE_URL = "https://www.isiksade.com"


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


def rewrite_local_paths(document) -> None:
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
                element.set(attribute, "../../" + value)
            elif attribute == "href" and value in {"/", "index", "index.html"}:
                element.set(attribute, "index.html")


def build_page(filename: str, metadata: dict[str, str]) -> None:
    parser = lxml_html.HTMLParser(encoding="utf-8", remove_comments=False)
    document = lxml_html.parse(ROOT / filename, parser).getroot()
    document.set("lang", "en")
    document.set("dir", "ltr")

    for element in document.xpath('//*[@data-en]'):
        replace_contents(element, element.get("data-en"), "data-html" in element.attrib)

    title = document.xpath("//title")[0]
    title.text = metadata["title"]
    set_meta(document, '//meta[@name="description"]', metadata["description"])
    set_meta(document, '//meta[@property="og:title"]', metadata["title"])
    set_meta(document, '//meta[@property="og:description"]', metadata["description"])
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
        robots[0].set("content", "noindex, nofollow")
        for duplicate in robots[1:]:
            duplicate.getparent().remove(duplicate)
    else:
        head.append(etree.Element("meta", name="robots", content="noindex, nofollow"))
    add_alternates(head, route)
    rewrite_local_paths(document)

    for button_id, destination in (("btn-tr", "/" if route == "index" else f"/{route}"), ("btn-en", canonical_url)):
        buttons = document.xpath(f'//*[@id="{button_id}"]')
        if buttons:
            buttons[0].set("onclick", f"window.location.href='{destination}'")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    for schema in document.xpath('//script[@type="application/ld+json"]'):
        json.loads(schema.text or "")

    rendered = etree.tostring(document, method="html", encoding="unicode", doctype="<!DOCTYPE html>")
    # lxml normalises HTML attribute names; SVG presentation attributes are case-sensitive.
    rendered = rendered.replace(" viewbox=", " viewBox=").replace(
        " preserveaspectratio=", " preserveAspectRatio="
    )
    (OUTPUT / filename).write_text(rendered, encoding="utf-8")


def main() -> None:
    metadata = json.loads((ROOT / "data" / "en-preview.json").read_text(encoding="utf-8"))
    for filename, page_metadata in metadata.items():
        build_page(filename, page_metadata)
    print(f"Built {len(metadata)} English preview pages in {OUTPUT}")


if __name__ == "__main__":
    main()
