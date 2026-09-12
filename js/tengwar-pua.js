/* Tengwar PUA adapter — рендерит то же дерево разбора tengwarjs,
   но в стандартную PUA-кодировку E000+ (Dan Smith / Free Tengwar),
   для шрифтов: Alcarin, Ariador, Artano.
   Логика повторяет tengwar-annatar.js::transcribe/transcribeColumn. */

"use strict";

window.TengwarPua = (function () {

    var LETTERS = {
        "tinco": "\uE000", "parma": "\uE001", "calma": "\uE002", "quesse": "\uE003",
        "ando": "\uE004", "umbar": "\uE005", "anga": "\uE006", "ungwe": "\uE007",
        "thule": "\uE008", "formen": "\uE009", "harma": "\uE00A", "hwesta": "\uE00B",
        "anto": "\uE00C", "ampa": "\uE00D", "anca": "\uE00E", "unque": "\uE00F",
        "numen": "\uE010", "malta": "\uE011", "noldo": "\uE012", "nwalme": "\uE013",
        "ore": "\uE014", "vala": "\uE015", "anna": "\uE016", "wilya": "\uE017",
        "thuletinco": "\uE018", "formenparma": "\uE019", "harmacalma": "\uE01A", "hwestaquesse": "\uE01B",
        "antoando": "\uE01C", "ampaumbar": "\uE01D", "ancaanga": "\uE01E", "unqueungwe": "\uE01F",
        "romen": "\uE020", "arda": "\uE021", "lambe": "\uE022", "alda": "\uE023",
        "silme": "\uE024", "silme-nuquerna": "\uE025", "esse": "\uE026", "esse-nuquerna": "\uE027",
        "hyarmen": "\uE028", "hwesta-sindarinwa": "\uE029", "yanta": "\uE02A", "ure": "\uE02B",
        "long-carrier": "\uE02C", "halla": "\uE02D", "short-carrier": "\uE02E",
        "round-carrier": "\uE034"
    };

    var MARKS = {
        "a": "\uE040", "i": "\uE044", "e": "\uE046", "o": "\uE04A", "u": "\uE04C",
        "ó": "\uE048", "í": "\uE045", "ú": "\uE049",
        "o-below": "\uE04B", "i-below": "\uE045",
        "y-english": "\uE07B", "y-sindarin": "\uE047", "y-quenya": "\uE7A6",
        "tilde-above": "\uE051", "tilde-below": "\uE050",
        "tilde-high-above": "\uE052", "tilde-far-below": "\uE04F",
        "bar-above": "\uE053", "bar-below": "\uE054",
        "bar-high-above": "\uE055", "bar-far-below": "\uE047"
    };

    var PUNCT = {
        "full-stop": " \uE060 ", "colon": " \uE060\uE060 ",
        "comma": " ", "semi-colon": " ",
        "exclamation-point": "\uE060", "question-mark": "\uE060",
        "hyphen": " ", "apostrophe": " "
    };

    function errorAttr(errors) {
        var title = (errors || []).join("\n").replace(/"/g, "&quot;");
        return ' class="pua-error" title="' + title + '"';
    }

    function columnText(col) {
        var tengwa = col.tengwa || "anna";
        var base = LETTERS[tengwa] !== undefined ? LETTERS[tengwa] : "";
        var parts = [base];
        if (col.above) parts.push(MARKS[col.above] || "");
        if (col.tildeBelow) parts.push(MARKS["tilde-below"]);
        if (col.tildeAbove) parts.push(MARKS["tilde-above"]);
        if (col.below) parts.push(MARKS[col.below] || "");
        if (col.following && MARKS[col.following]) parts.push(MARKS[col.following]);
        return parts.join("");
    }

    function renderSections(sections) {
        var html = [];
        sections.forEach(function (sec) {
            sec.forEach(function (par) {
                var lines = par.map(function (line) {
                    var words = line.map(function (word) {
                        var cols = word.map(function (col) {
                            var out = columnText(col);
                            if (col.errors) {
                                out = '<span' + errorAttr(col.errors) + '>' + out + '</span>';
                            }
                            return out;
                        }).join("");
                        return cols || " ";
                    }).join(" \uE08B ");
                    return words;
                });
                html.push(lines.join("<br>\n"));
            });
        });
        return html.join("\n\n");
    }

    return {
        letters: LETTERS,
        marks: MARKS,
        render: function (sections) {
            return renderSections(sections);
        }
    };
})();