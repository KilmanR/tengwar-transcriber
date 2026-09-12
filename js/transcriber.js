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

    var PRESETS = {
        ltr: "One Ring to rule them all, One Ring to find them,\nOne Ring to bring them all, and in the darkness bind them.",
        lotr: "Not all those who wander are lost.",
        wow: "For the Horde! Lok'tar ogar!",
        elf: "Elen síla lúmenn' omentielvo."
    };

    var PUA_FONTS = { alcarin: true, ariador: true, artano: true };

    function render() {
        var text = inputEl.value;
        var font = fontEl.value;
        var modeName = modeEl.value;

        var T = window.Tengwar;
        if (!T) { return; }

        var Mode = T.modes[modeName] || T.modes["general-use"];
        var options = { font: T.fonts.annatar };

        var parts = [];
        var lines = text.split(/\n+/);
        lines.forEach(function (line) {
            if (!line.trim()) { parts.push(""); return; }
            try {
                if (PUA_FONTS[font]) {
                    var tree = Mode.parse(line.toLowerCase(), options);
                    parts.push(window.TengwarPua.render(tree));
                } else {
                    options.font = T.fonts[font] || T.fonts.annatar;
                    parts.push(Mode.transcribe(line, options));
                }
            } catch (e) {
                parts.push("");
            }
        });

        outputEl.innerHTML = parts.join("<br>");
        outputEl.className = "tengwa-output " + font;
        translitEl.textContent = text;
        hintEl.textContent = lines.length + " строк · " + text.length + " символов";
    }

    inputEl.addEventListener("input", render);
    fontEl.addEventListener("change", render);
    modeEl.addEventListener("change", render);
    sizeEl.addEventListener("input", function () {
        outputEl.style.fontSize = sizeEl.value + "px";
    });

    var presetButtons = document.querySelectorAll("[data-preset]");
    Array.prototype.forEach.call(presetButtons, function (btn) {
        btn.addEventListener("click", function () {
            inputEl.value = PRESETS[btn.getAttribute("data-preset")];
            render();
        });
    });

    render();
})();