(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    var inputEl = $("input");
    var outputEl = $("output");
    var outputCard = $("output-card");
    var translitEl = $("translit");
    var hintEl = $("hint");
    var fontEl = $("font");
    var modeEl = $("mode");
    var sizeEl = $("size");
    var fontTipEl = $("font-tip");
    var exportBtn = $("export-btn");
    var exportGlyphs = $("export-glyphs");
    var exportTrans = $("export-trans");
    var exportCard = $("export-card");
    var bgColorEl = $("bg-color");
    var fgColorEl = $("fg-color");
    var previewFrame = $("preview-frame");
    var previewEl = $("preview");
    var previewTrans = $("preview-trans");

    var STATE_KEY = "tengwar-transcriber:state";

    var FONT_TIPS = {
        annatar: "Классический шрифт Dan Smith — полное покрытие, эталон качества.",
        alcarin: "Элегантный гуманистический, лицензия SIL OFL.",
        artano: "Стилизованная гарнитура — как надпись на Единственном Кольце.",
        eldamar: "Писчий рукописный стиль проекта Free Tengwar.",
        formal: "Строгий официальный стиль (кодировка CSUR)."
    };

    var PUA_FONTS = { alcarin: true, artano: true, eldamar: true, formal: true };

    var THEMES = {
        lotr: [
            { id: "ring", icon: "💍", name: "Кольцо Всевластия", desc: "чёрный + золото + свечение", bg: "#050505", fg: "#d4af37", glow: true, pulse: true },
            { id: "rivendell", icon: "📜", name: "Ривенделл", desc: "бежевый + коричневый", bg: "#e2d3ae", fg: "#4b3a1e", glow: false, pulse: false },
            { id: "valinor", icon: "🌟", name: "Валинор", desc: "золотой + белый + свечение", bg: "#4a3a12", fg: "#fff7e0", glow: true, pulse: false },
            { id: "mordor", icon: "🌑", name: "Мордор", desc: "тёмно-красный + чёрный", bg: "#7a1410", fg: "#0b0b0b", glow: false, pulse: false }
        ],
        wow: [
            { id: "black-temple", icon: "🟢", name: "Чёрный Храм", desc: "чёрный + неоново-зелёный + свечение", bg: "#030805", fg: "#3df05a", glow: true, pulse: true },
            { id: "silvermoon", icon: "🟡", name: "Silvermoon", desc: "красный + золотой", bg: "#7a1420", fg: "#e2b540", glow: false, pulse: false },
            { id: "teldrassil", icon: "🌳", name: "Teldrassil", desc: "тёмно-синий + изумрудный", bg: "#071020", fg: "#2ee6a8", glow: true, pulse: false },
            { id: "suramar", icon: "🌙", name: "Сурамар", desc: "пурпурный + серебряный + свечение", bg: "#150a1c", fg: "#cbb9f7", glow: true, pulse: false }
        ]
    };

    var FALLBACK = {
        wow: {
            night_elves: [
                { original: "Ishnu-alah", translation_ru: "«Да сопутствует тебе удача» — приветствие", language: "Дарнассий", faction: "Ночные эльфы (Калдорай)", source: "Дарнасс, WoW" },
                { original: "Elune-adore!", translation_ru: "«Слава Элуне!»", language: "Дарнассий", faction: "Ночные эльфы (Калдорай)", source: "Warcraft III" }
            ],
            blood_elves: [
                { original: "Anar'alah belore", translation_ru: "«Светом солнца клянусь»", language: "Талассийский", faction: "Эльфы крови (Син'дорай)", source: "Warcraft III" },
                { original: "Shorel'aran", translation_ru: "«Прощание / До встречи»", language: "Талассийский", faction: "Эльфы крови (Син'дорай)", source: "WoW" }
            ],
            high_elves: [
                { original: "Felo'melorn", translation_ru: "«Пламя меча»", language: "Талассийский", faction: "Высшие эльфы (Кель'дорай)", source: "Warcraft" }
            ]
        },
        lotr: {
            quenya: [
                { original: "Elen síla lúmenn' omentielvo", translation_ru: "«Звезда сияет в час нашей встречи»", language: "Квенья", faction: "Нолдор (высокое наречие)", source: "Братство Кольца" },
                { original: "Namárië!", translation_ru: "«Прощай!»", language: "Квенья", faction: "Нолдор (высокое наречие)", source: "Плач Галадриэль" },
                { original: "Aiya Eärendil Elenion Ancalima!", translation_ru: "«Привет, Эарендиль, ярчайший из звёзд!»", language: "Квенья", faction: "Нолдор (высокое наречие)", source: "Братство Кольца" }
            ],
            sindarin: [
                { original: "Mae govannen!", translation_ru: "«Добро пожаловать / Рад встрече»", language: "Синдарин", faction: "Синдар (серое наречие)", source: "Братство Кольца" },
                { original: "Noro lim, noro lam!", translation_ru: "«Спеши, как свет, спеши без устали!»", language: "Синдарин", faction: "Синдар (серое наречие)", source: "Братство Кольца" }
            ],
            black_speech: [
                { original: "Ash nazg durbatulûk, ash nazg gimbatul, ash nazg thrakatulûk agh burzum-ishi krimpatul.", translation_ru: "«Одно Кольцо покорит их…»", language: "Чёрное Наречие", faction: "Мордор (Саурон)", source: "Надпись на Кольце" }
            ]
        }
    };

    var GROUP_META = {
        lotr: {
            label: "Властелин Колец", icon: "📖",
            groups: [
                { key: "quenya", name: "Нолдор · Квенья (высокое наречие)", icon: "🧝" },
                { key: "sindarin", name: "Синдар · Синдарин (серое наречие)", icon: "🌲" },
                { key: "black_speech", name: "Язык Саурона · Чёрное Наречие", icon: "🔥" }
            ]
        },
        wow: {
            label: "World of Warcraft", icon: "🌍",
            groups: [
                { key: "night_elves", name: "Ночные эльфы · Калдорай (Тельдрассил)", icon: "🌙" },
                { key: "blood_elves", name: "Эльфы крови · Син'дорай", icon: "🩸" },
                { key: "high_elves", name: "Высшие эльфы · Кель'дорай", icon: "✨" }
            ]
        }
    };

    var QUOTES = {
        "ring": ["lotr", "black_speech", "Ash nazg"],
        "elen": ["lotr", "quenya", "Elen síla"],
        "wander": ["lotr", "sindarin", "Noro lim"],
        "sindorei": ["wow", "blood_elves", "Anar'alah"]
    };

    var phrases = null;

    var theme = { id: "ring", bg: "#050505", fg: "#d4af37", glow: true, pulse: true };
    var customColor = false;

    function phraseText(path) {
        var cat = path[0], key = path[1], needle = path[2];
        var data = phrases || FALLBACK;
        var arr = (data[cat] || {})[key];
        if (!arr) { return ""; }
        if (typeof needle === "number") { return arr[needle] ? arr[needle].original : ""; }
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].original.indexOf(needle) !== -1) { return arr[i].original; }
        }
        return "";
    }

    function renderText(text, font, modeName) {
        var T = window.Tengwar;
        if (!T) { return ""; }
        var Mode = T.modes[modeName] || T.modes["general-use"];
        var options = { font: T.fonts.annatar };
        var lower = (text || "").toLowerCase();
        try {
            if (PUA_FONTS[font]) {
                return window.TengwarPua.render(Mode.parse(lower, options), font);
            }
            return Mode.transcribe(lower, options);
        } catch (e) {
            return "";
        }
    }

    function applyTheme() {
        var bg = theme.bg, fg = theme.fg;

        outputCard.style.background = bg;
        outputEl.style.color = fg;
        outputEl.classList.toggle("themed-glow", !!theme.glow);
        outputEl.classList.toggle("themed-pulse", !!theme.pulse);

        previewFrame.style.background = bg;
        previewEl.style.color = fg;
        previewEl.classList.toggle("themed-glow", !!theme.glow);
        previewEl.classList.toggle("themed-pulse", !!theme.pulse);
        previewTrans.style.color = shade(fg) || "#9a9277";

        bgColorEl.value = bg;
        fgColorEl.value = fg;

        document.querySelectorAll(".theme-card").forEach(function (card) {
            card.classList.toggle("active", card.getAttribute("data-theme") === theme.id);
        });
    }

    function shade(color) {
        // затемнение цветного текста для подписи превью
        try {
            var ctx = document.createElement("canvas").getContext("2d");
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.55;
            return color;
        } catch (e) {
            return color;
        }
    }

    function render() {
        var text = inputEl.value;
        var font = fontEl.value;
        var modeName = modeEl.value;

        var parts = [];
        inputEl.value.split(/\n+/).forEach(function (line) {
            if (!line.trim()) { parts.push(""); return; }
            parts.push(renderText(line, font, modeName));
        });

        var out = parts.join("<br>");
        outputEl.innerHTML = out;
        outputEl.className = "tengwa-output " + font;
        outputEl.classList.toggle("themed-glow", !!theme.glow);
        outputEl.classList.toggle("themed-pulse", !!theme.pulse);
        // вспышка при конвертации
        outputEl.classList.remove("tw-render");
        void outputEl.offsetWidth;
        outputEl.classList.add("tw-render");

        translitEl.textContent = text;
        translitEl.classList.toggle("hidden", !text.trim());
        hintEl.textContent = text.split(/\n+/).length + " стр · " + text.replace(/\s+/g, "").length + " символов";

        previewEl.innerHTML = out;
        previewEl.className = "preview-glyphs " + font;
        previewEl.classList.toggle("themed-glow", !!theme.glow);
        previewEl.classList.toggle("themed-pulse", !!theme.pulse);
        previewTrans.textContent = text.trim() || "\u00A0";

        applyTheme();
        saveState();
    }

    function saveState() {
        try {
            var s = {
                font: fontEl.value,
                mode: modeEl.value,
                size: sizeEl.value,
                text: inputEl.value,
                theme: theme.id,
                bg: theme.bg,
                fg: theme.fg,
                custom: customColor
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
            if (s.custom && s.bg && s.fg) {
                theme.bg = s.bg; theme.fg = s.fg; customColor = true;
            } else if (s.theme) {
                selectThemeById(s.theme);
            }
        } catch (e) {}
    }

    function selectThemeById(id) {
        for (var c in THEMES) {
            for (var i = 0; i < THEMES[c].length; i++) {
                if (THEMES[c][i].id === id) {
                    theme = THEMES[c][i];
                    customColor = false;
                    return;
                }
            }
        }
    }

    function buildThemes() {
        ["lotr", "wow"].forEach(function (cat) {
            var grid = $("themes-" + cat);
            THEMES[cat].forEach(function (t) {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "theme-card";
                btn.setAttribute("data-theme", t.id);
                btn.innerHTML =
                    '<span class="theme-swatch" style="background:' + t.bg + ';color:' + t.fg + '">T</span>' +
                    '<span class="theme-body"><span class="theme-name">' + t.icon + " " + t.name + '</span>' +
                    '<span class="theme-desc">' + t.desc + "</span></span>";
                btn.addEventListener("click", function () {
                    theme = t;
                    customColor = false;
                    applyTheme();
                });
                grid.appendChild(btn);
            });
        });
    }

    function phraseCard(item) {
        var card = document.createElement("div");
        card.className = "phrase-card";

        var orig = document.createElement("div");
        orig.className = "phrase-orig";
        orig.textContent = item.original;
        card.appendChild(orig);

        if (item.translation_ru) {
            var tr = document.createElement("div");
            tr.className = "phrase-trans";
            tr.textContent = item.translation_ru;
            card.appendChild(tr);
        }

        var meta = document.createElement("div");
        meta.className = "phrase-meta";
        meta.textContent = (item.language || "") + (item.faction ? " · " + item.faction : "") + (item.source ? " (" + item.source + ")" : "");
        card.appendChild(meta);

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-insert";
        btn.textContent = "Вставить в переводчик";
        btn.addEventListener("click", function (ev) {
            ev.stopPropagation();
            inputEl.value = item.original;
            render();
            inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
            inputEl.focus({ preventScroll: true });
        });
        card.appendChild(btn);

        return card;
    }

    function buildPhrases() {
        ["lotr", "wow"].forEach(function (cat) {
            var box = $("phrases-" + cat);
            box.innerHTML = "";
            var data = phrases || FALLBACK;
            var groups = GROUP_META[cat] && GROUP_META[cat].groups || [];
            groups.forEach(function (g) {
                var head = document.createElement("h3");
                head.className = "phrase-sub";
                head.textContent = g.icon + " " + g.name;
                box.appendChild(head);
                (data[cat][g.key] || []).forEach(function (item) {
                    box.appendChild(phraseCard(item));
                });
            });
        });
    }

    function loadPhrases() {
        fetch("data/phrases.json")
            .then(function (r) {
                if (!r.ok) { throw new Error("HTTP " + r.status); }
                return r.json();
            })
            .then(function (data) {
                phrases = data;
                buildPhrases();
            })
            .catch(function () {
                phrases = FALLBACK;
                buildPhrases();
            });
    }

    function initAccordion(root) {
        var groups = Array.prototype.slice.call(root.querySelectorAll(".acc-group"));
        var first = root.querySelector(".acc-group");
        if (first) { first.classList.add("open"); }
        groups.forEach(function (g) {
            var head = g.querySelector(".acc-head");
            head.addEventListener("click", function () {
                var wasOpen = g.classList.contains("open");
                groups.forEach(function (o) { o.classList.remove("open"); });
                if (!wasOpen) { g.classList.add("open"); }
            });
        });
    }

    function doExport() {
        var glyphFontSize = parseInt(outputEl.style.fontSize || sizeEl.value + "px", 10) * 1.5;

        exportCard.style.background = theme.bg;
        exportCard.querySelector(".export-frame").style.borderColor = theme.fg;
        exportGlyphs.innerHTML = outputEl.innerHTML;
        exportGlyphs.className = "export-glyphs " + fontEl.value;
        exportGlyphs.style.color = theme.fg;
        exportGlyphs.style.fontSize = glyphFontSize + "px";
        exportGlyphs.style.textShadow = theme.glow ? "0 0 18px " + theme.fg + ", 0 0 40px " + theme.fg : "none";
        exportTrans.textContent = inputEl.value.trim();
        exportTrans.style.color = theme.fg;

        try {
            document.fonts.ready.then(function () {
                exportCard.style.transform = "none";
                exportCard.style.width = Math.max(840, outputEl.offsetWidth * 1.5) + "px";
                return html2canvas(exportCard, { backgroundColor: theme.bg, scale: 3 });
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
        fontEl.addEventListener("change", function () {
            fontTipEl.textContent = FONT_TIPS[fontEl.value] || "";
            render();
        });
        modeEl.addEventListener("change", render);
        sizeEl.addEventListener("input", function () {
            outputEl.style.fontSize = sizeEl.value + "px";
            render();
        });
        exportBtn.addEventListener("click", doExport);

        bgColorEl.addEventListener("input", function () {
            customColor = true;
            theme.bg = bgColorEl.value;
            applyTheme();
        });
        fgColorEl.addEventListener("input", function () {
            customColor = true;
            theme.fg = fgColorEl.value;
            applyTheme();
        });

        document.querySelectorAll("[data-quote]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var key = btn.getAttribute("data-quote");
                var text = QUOTES[key] ? phraseText(QUOTES[key]) : "";
                if (text) {
                    inputEl.value = text;
                    render();
                }
            });
        });

        initAccordion($("themes-acc"));
        initAccordion($("phrases-acc"));
    }

    restoreState();
    fontTipEl.textContent = FONT_TIPS[fontEl.value] || "";
    bind();
    buildThemes();
    applyTheme();
    buildPhrases();
    loadPhrases();
    render();
})();