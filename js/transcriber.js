(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    var inputEl = $("input");
    var outputEl = $("output");
    var translitEl = $("translit");
    var hintEl = $("hint");
    var fontEl = $("font");
    var modeEl = $("mode");
    var sizeEl = $("size");
    var exportBtn = $("export-btn");
    var exportGlyphs = $("export-glyphs");
    var exportTrans = $("export-trans");
    var presetGrid = $("preset-grid");

    var STATE_KEY = "tengwar-transcriber:state";

    var PRESETS = [
        { cat: "LOTR", t: "One Ring to rule them all, One Ring to find them,\nOne Ring to bring them all, and in the darkness bind them.", d: "Надпись на Кольце" },
        { cat: "LOTR", t: "Not all those who wander are lost.", d: "«Не все блуждающие — потеряны»" },
        { cat: "LOTR", t: "Even the smallest person can change the course of the future.", d: "Галадриэль" },
        { cat: "LOTR", t: "May it be a light to you in dark places, when all other lights go out.", d: "Лихт из Галадриэль" },
        { cat: "LOTR", t: "Fly, you fools!", d: "Гэндальф" },
        { cat: "LOTR", t: "Ash nazg durbatulûk, ash nazg gimbatul, ash nazg thrakatulûk agh burzum-ishi krimpatul.", d: "Клятва Кольца (язык Мордора)" },
        { cat: "WoW", t: "For the Horde! Lok'tar ogar!", d: "Боевой клич орды" },
        { cat: "WoW", t: "Victory for the Horde!", d: "Победа" },
        { cat: "WoW", t: "Time is money, friend!", d: "Гоблин-аукционист" },
        { cat: "WoW", t: "Stay a while and listen!", d: "Декард Каин" },
        { cat: "Эльф.", t: "Elen síla lúmenn' omentielvo.", d: "«Звезда сияет в час нашей встречи»" },
        { cat: "Эльф.", t: "Namárië!", d: "«Прощай» (квенья)" },
        { cat: "Эльф.", t: "A Elbereth Gilthoniel, silivren penna míriel.", d: "Гимн Варде" },
        { cat: "Эльф.", t: "Ai! laurië lantar lassi súrinen.", d: "Плач Галадриэль" },
        { cat: "WoW", t: "For the Alliance!", d: "Боевой клич Альянса" },
        { cat: "LOTR", t: "The world is indeed full of peril, and in it there are many dark places.", d: "Хоббит" }
    ];

    var PUA_FONTS = { alcarin: true, ariador: true, artano: true };

    function getFontOption(font) {
        return window.Tengwar && (font === "annatar" || font === "parmaite")
            ? window.Tengwar.fonts[font] || window.Tengwar.fonts.annatar
            : null;
    }

    function renderText(text, font, modeName) {
        var T = window.Tengwar;
        if (!T) { return ""; }
        var Mode = T.modes[modeName] || T.modes["general-use"];
        var options = { font: T.fonts.annatar };
        try {
            if (PUA_FONTS[font]) {
                return window.TengwarPua.render(Mode.parse(text.toLowerCase(), options));
            }
            return Mode.transcribe(text, options);
        } catch (e) {
            return "";
        }
    }

    function render() {
        var text = inputEl.value;
        var font = fontEl.value;
        var modeName = modeEl.value;

        var parts = [];
        var lines = text.split(/\n+/);
        lines.forEach(function (line) {
            if (!line.trim()) { parts.push(""); return; }
            parts.push(renderText(line, font, modeName));
        });

        outputEl.innerHTML = parts.join("<br>");
        outputEl.className = "tengwa-output " + font;
        translitEl.textContent = text;
        translitEl.classList.toggle("hidden", !text.trim());
        hintEl.textContent = lines.length + " стр · " + text.replace(/\s+/g, "").length + " символов";

        exportGlyphs.innerHTML = outputEl.innerHTML;
        exportGlyphs.className = "export-glyphs " + font;
        exportTrans.textContent = text;
        saveState();
    }

    function saveState() {
        try {
            var s = {
                font: fontEl.value,
                mode: modeEl.value,
                size: sizeEl.value,
                text: inputEl.value
            };
            localStorage.setItem(STATE_KEY, JSON.stringify(s));
        } catch (e) {}
    }

    function restoreState() {
        try {
            var raw = localStorage.getItem(STATE_KEY);
            if (!raw) { return; }
            var s = JSON.parse(raw);
            if (s.font && fontEl.querySelector('option[value="' + s.font + '"]')) { fontEl.value = s.font; }
            if (s.mode && modeEl.querySelector('option[value="' + s.mode + '"]')) { modeEl.value = s.mode; }
            if (s.size) {
                var v = Math.min(120, Math.max(24, parseInt(s.size, 10) || 56));
                sizeEl.value = v;
                outputEl.style.fontSize = v + "px";
            }
            if (typeof s.text === "string") { inputEl.value = s.text; }
        } catch (e) {}
    }

    function buildPresets() {
        PRESETS.forEach(function (p, i) {
            var card = document.createElement("div");
            card.className = "preset";
            card.title = p.cat + " · " + p.d;

            var preview = document.createElement("div");
            preview.className = "preset-preview";
            preview.appendChild(document.createTextNode(renderText(p.t.replace(/\n/g, " "), fontEl.value, modeEl.value)));

            var latin = document.createElement("div");
            latin.className = "preset-latin";
            latin.textContent = p.t.replace(/\n/g, " · ");

            var meta = document.createElement("div");
            meta.className = "preset-meta";
            meta.textContent = p.cat + " — " + p.d;

            card.appendChild(preview);
            card.appendChild(latin);
            card.appendChild(meta);
            card.addEventListener("click", function () {
                inputEl.value = p.t;
                render();
            });
            presetGrid.appendChild(card);
        });
    }

    function doExport() {
        var card = $("export-card");
        card.style.transform = "none";
        var w = outputEl.offsetWidth * 1.5;
        var glyphFontSize = parseInt(outputEl.style.fontSize || sizeEl.value + "px", 10) * 1.5;

        // рендер во временном кард-контейнере с фиксированной шириной
        card.style.width = Math.max(840, w) + "px";
        exportGlyphs.style.fontSize = glyphFontSize + "px";

        try {
            document.fonts.ready.then(function () {
                return html2canvas(card, { backgroundColor: "#10120d", scale: 3 });
            }).then(function (canvas) {
                var a = document.createElement("a");
                a.download = "tengwar-" + Date.now() + ".png";
                a.href = canvas.toDataURL("image/png");
                a.click();
            }).catch(function (err) {
                alert("Не удалось сохранить PNG: " + err.message);
                console.error("export error", err);
            });
        } catch (e) {
            alert("PNG-экспорт недоступен: " + e.message);
        }
    }

    function bind() {
        inputEl.addEventListener("input", render);
        fontEl.addEventListener("change", render);
        modeEl.addEventListener("change", render);
        sizeEl.addEventListener("input", function () {
            outputEl.style.fontSize = sizeEl.value + "px";
            render();
        });
        exportBtn.addEventListener("click", doExport);

        document.querySelectorAll("[data-quote]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var key = btn.getAttribute("data-quote");
                var p = PRESETS.find(function (x) { return x.key === key; });
                if (p) {
                    inputEl.value = p.t;
                    render();
                }
            });
        });
    }

    // присвоим ключи пресетам
    PRESETS[0].key = "ring";
    PRESETS[1].key = "wander";
    PRESETS[7].key = "horde";
    PRESETS[10].key = "elen";

    restoreState();
    bind();
    buildPresets();
    render();
})();