(function () {
  "use strict";

  function setActiveLanguageButton(lang) {
    var buttons = document.querySelectorAll("[data-lang]");
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].classList.toggle("active", buttons[i].getAttribute("data-lang") === lang);
    }

    var legacyTr = document.getElementById("btn-tr");
    var legacyEn = document.getElementById("btn-en");
    if (legacyTr) legacyTr.classList.toggle("active", lang === "tr");
    if (legacyEn) legacyEn.classList.toggle("active", lang === "en");
  }

  window.setLang = function setLang(lang) {
    if (lang !== "tr" && lang !== "en" && lang !== "ar") return;

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    var pageTitle = document.body && document.body.getAttribute("data-title-" + lang);
    if (pageTitle) document.title = pageTitle;

    var translated = document.querySelectorAll("[data-" + lang + "]");
    for (var i = 0; i < translated.length; i += 1) {
      var element = translated[i];
      var value = element.getAttribute("data-" + lang);
      if (element.hasAttribute("data-html")) element.innerHTML = value;
      else element.textContent = value;
    }

    var languageBlocks = document.querySelectorAll(".lang-tr, .lang-en, .lang-ar");
    for (var j = 0; j < languageBlocks.length; j += 1) {
      languageBlocks[j].hidden = !languageBlocks[j].classList.contains("lang-" + lang);
    }

    var revealBlocks = document.querySelectorAll(".rv");
    for (var k = 0; k < revealBlocks.length; k += 1) revealBlocks[k].classList.add("in");

    setActiveLanguageButton(lang);
  };

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
