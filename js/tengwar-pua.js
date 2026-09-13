/* Tengwar PUA adapter — рендерит дерево разбора tengwarjs в кодировку
   Free Tengwar (E000+). Шрифты: Alcarin, Artano, Eldamar, Tengwar Formal CSUR.
   Тевты PUA имеют собственную ширину, поэтому выводятся как блоки-колонки:
   буква (основа) + метки, позиционированные CSS поверх основы.
   Пробел между словами — обычный U+0020. Красные «боксы» ошибок не выводятся. */

"use strict";

window.TengwarPua = (function () {

    var LETTERS = {
        "tinco": "\uE000", "parma": "\uE001", "calma": "\uE002", "quesse": "\uE003",
        "ando": "\uE004", "umbar": "\uE005", "anga": "\uE006", "ungwe": "\uE007",
        "thule": "\uE008", "formen": "\uE009", "harma": "\uE00A", "hwesta": "\uE00B",
        "anto": "\uE00C", "ampa": "\uE00D", "anca": "\uE00E", "unque": "\uE00F",
        "numen": "\uE010", "malta": "\uE011", "noldo": "\uE012", "nwalme": "\uE013",
        "ore": "\uE014", "vala": "\uE015", "anna": "\uE016", "wilya": "\uE017",
        "thuletinco": "\uE018", "formenparma": "\uE019", "harmacalma": "\uE01A",
        "hwestaquesse": "\uE01B", "antoando": "\uE01C", "ampaumbar": "\uE01D",
        "ancaanga": "\uE01E", "unqueungwe": "\uE01F", "romen": "\uE020",
        "arda": "\uE021", "lambe": "\uE022", "alda": "\uE023", "silme": "\uE024",
        "silme-nuquerna": "\uE025", "esse": "\uE026", "esse-nuquerna": "\uE027",
        "hyarmen": "\uE028", "hwesta-sindarinwa": "\uE029", "yanta": "\uE02A",
        "ure": "\uE02B", "uure": "\uE02B", "long-carrier": "\uE02C",
        "halla": "\uE02D", "short-carrier": "\uE02E",
        "reversed-osse": "\uE030", "bombadil-w": "\uE031", "osse": "\uE032",
        "round-carrier": "\uE034", "open-anna": "\uE036", "christopher-qu": "\uE037",
        "bombadil-hw": "\uE039", "mh": "\uE03A"
    };

    var MARKS = {
        "a": "\uE040", "e": "\uE046", "i": "\uE044", "o": "\uE04C", "u": "\uE04A",
        "á": "\uE040", "é": "\uE046", "í": "\uE044", "ó": "\uE048", "ú": "\uE049",
        "ö": "\uE048", "ü": "\uE049",
        "a-below": "\uE041", "i-below": "\uE045", "o-below": "\uE04D",
        "y-english": "\uE042", "y-sindarin": "\uE043", "y-quenya": "\uE043",
        "tilde-above": "\uE051", "tilde-below": "\uE050",
        "tilde-high-above": "\uE052", "tilde-far-below": "\uE052",
        "bar-above": "\uE053", "bar-below": "\uE054",
        "bar-far-below": "\uE052"
    };

    /* В Eldamar и Formal CSUR нет глифа E048 (двойной акут сверху) —
       двойной акут лежит там на E049. */
    var FONT_MARKS = {
        "eldamar": { "ó": "\uE049", "ö": "\uE049" },
        "formal": { "ó": "\uE049", "ö": "\uE049" }
    };

    function esc(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function columnHtml(col, marks) {
        if (!col || !col.tengwa) return "";
        var base = LETTERS[col.tengwa];
        if (base === undefined) base = " ";

        var html = '<span class="pua-col">';
        html += '<span class="pua-base">' + base + "</span>";

        var above = col.above ? marks[col.above] : null;
        var below = col.below ? marks[col.below] : null;
        var tAbove = col.tildeAbove ? marks["tilde-above"] : null;
        var tBelow = col.tildeBelow ? marks["tilde-below"] : null;
        var tHigh = col.tildeHighAbove ? marks["tilde-high-above"] : null;
        var tFar = col.tildeFarBelow ? marks["tilde-far-below"] : null;
        var bAbove = col.barAbove ? marks["bar-above"] : null;
        var bBelow = col.barBelow ? marks["bar-below"] : null;
        var bFar = col.barFarBelow ? marks["bar-far-below"] : null;
        var following = col.following ? marks[col.following] : null;

        if (tAbove) html += '<span class="pua-mark pua-above-2">' + esc(tAbove) + "</span>";
        if (tHigh) html += '<span class="pua-mark pua-above-3">' + esc(tHigh) + "</span>";
        if (above) html += '<span class="pua-mark pua-above-1">' + esc(above) + "</span>";
        if (bAbove) html += '<span class="pua-mark pua-above-1">' + esc(bAbove) + "</span>";
        if (bBelow) html += '<span class="pua-mark pua-below-1">' + esc(bBelow) + "</span>";
        if (below) html += '<span class="pua-mark pua-below-1">' + esc(below) + "</span>";
        if (tBelow) html += '<span class="pua-mark pua-below-2">' + esc(tBelow) + "</span>";
        if (tFar) html += '<span class="pua-mark pua-below-3">' + esc(tFar) + "</span>";
        if (bFar) html += '<span class="pua-mark pua-below-3">' + esc(bFar) + "</span>";
        if (following) html += '<span class="pua-follow">' + esc(following) + "</span>";

        html += "</span>";
        return html;
    }

    function renderSections(sections, fontKey) {
        var marks = Object.create(MARKS);
        var overrides = FONT_MARKS[fontKey || ""];
        if (overrides) {
            for (var k in overrides) marks[k] = overrides[k];
        }
        var html = [];
        sections.forEach(function (sec) {
            sec.forEach(function (par) {
                var lines = par.map(function (line) {
                    var words = line.map(function (word) {
                        var cols = word.map(function (col) {
                            return columnHtml(col, marks);
                        }).join("");
                        return '<span class="pua-word">' + (cols || " ") + "</span>";
                    });
                    return words.join(" ");
                });
                html.push(lines.join("<br>\n"));
            });
        });
        return html.join("\n\n");
    }

    return {
        letters: LETTERS,
        marks: MARKS,
        render: function (sections, fontKey) {
            return renderSections(sections, fontKey);
        }
    };
})();