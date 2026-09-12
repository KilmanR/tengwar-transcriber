(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

exports.tengwar = [
    ["tinco", "parma", "calma", "quesse"],
    ["ando", "umbar", "anga", "ungwe"],
    ["thule", "formen", "harma", "hwesta"],
    ["anto", "ampa", "anca", "unque"],
    ["numen", "malta", "noldo", "nwalme"],
    ["ore", "vala", "anna", "wilya"],
    ["romen", "arda", "lambe", "alda"],
    ["silme", "silme-nuquerna", "esse", "esse-nuquerna"],
    ["hyarmen", "hwesta-sindarinwa", "yanta", "ure"],
    ["halla", "short-carrier", "long-carrier", "round-carrier"],
    ["thuletinco", "formenparma", "harmacalma", "hwestaquesse"],
    ["antoando", "ampaumbar", "ancaanga", "unqueungwe"]
];

exports.tehtarAbove = [
    "a", "e", "i", "o", "u",
    "á", "é", "í", "ó", "ú",
    "w",
    "y-english", "y-sindarin",
];

exports.tehtarBelow = [
    "y-quenya",
    "s", "o-below", "i-below",
];

exports.tehtarFollowing = [
    "s-final", "s-inverse", "s-extended", "s-flourish"
];

exports.barsAndTildes = [
    "tilde-above",
    "tilde-below",
    "tilde-high-above",
    "tilde-far-below",
    "bar-above",
    "bar-below",
    "bar-high-above",
    "bar-far-below"
];

exports.tehtar = [].concat(
    exports.tehtarAbove,
    exports.tehtarBelow,
    exports.tehtarFollowing,
    exports.barsAndTildes
);

exports.aliases = {
    "vilya": "wilya",
    "aha": "harma",
    "gasdil": "halla"
};


},{}],2:[function(require,module,exports){
"use strict";

// TODO parse following "w"

var TengwarParmaite = require("./tengwar-parmaite");
var Parser = require("./parser");
var Notation = require("./notation");
var makeDocumentParser = require("./document-parser");
var punctuation = require("./punctuation");
var parseNumber = require("./numbers");

exports.name = "Mode of Beleriand";

var defaults = {};
exports.makeOptions = makeOptions;
function makeOptions(options) {
    options = options || defaults;
    return {
        font: options.font || TengwarParmaite,
        block: options.block,
        plain: options.plain,
        duodecimal: options.duodecimal
    };
}

exports.transcribe = transcribe;
function transcribe(text, options) {
    options = makeOptions(options);
    var font = options.font;
    return font.transcribe(parse(text.toLowerCase(), options), options);
}

exports.encode = encode;
function encode(text, options) {
    options = makeOptions(options);
    return Notation.encode(parse(text.toLowerCase(), options), options);
}

var parse = exports.parse = makeDocumentParser(parseWord, makeOptions);

function parseWord(callback, options, columns) {
    columns = columns || [];
    return parseColumn(function (column) {
        if (column) {
            return parseWord(
                callback,
                options,
                columns.concat([column])
            );
        } else {
            return function (character) {
                if (/\d/.test(character)) {
                    return parseNumber(function (number) {
                        return parseWord(callback, options, columns.concat(number));
                    }, options)(character);
                } else {
                    return callback(columns)(character);
                }
            };
        }
    }, options);
}

function parseColumn(callback, options) {
    return parseTengwa(function (column) {
        if (column) {
            return parseFollowingS(callback, column);
        } else {
            return callback();
        }
    }, options);
}

function parseTengwa(callback, options) {
    var font = options.font;
    var makeColumn = font.makeColumn;
    return function (character) {
        if (character === "n") { // n
            return function (character) {
                if (character === "t" || character === "d") { // n{t,d}
                    return parseTengwa(function (column) {
                        return callback(column.addTildeAbove());
                    }, options)(character);
                } else if (character === "c" || character === "k" || character === "g") { // n{c,k,g}
                    return parseTengwa(callback, options)("ñ")(character);
                } else if (character === "n") { // nn
                    return callback(makeColumn("numen", {from : "nn"}));
                } else { // n.
                    return callback(makeColumn("ore", {from: "n"}))(character);
                }
            };
        } else if (character === "t") { // t
            return function (character) {
                if (character === "h") { // th
                    return callback(makeColumn("thule", {from: "th"}));
                } else { // t.
                    return callback(makeColumn("tinco", {from: "t"}))(character);
                }
            };
        } else if (character === "d") { // d
            return function (character) {
                if (character === "h") { // dh
                    return callback(makeColumn("anto", {from: "dh"}));
                } else { // d.
                    return callback(makeColumn("ando", {from: "d"}))(character);
                }
            };
        } else if (character === "m") { // m
            return function (character) {
                if (
                    character === "p" || character === "b" ||
                    character === "f" || character === "v"
                ) {
                    return parseTengwa(function (column) {
                        return callback(column.addTildeAbove({from: character}));
                    }, options)(character);
                } else if (character === "m") { // mm
                    return callback(makeColumn("malta", {from: "mm"}));
                } else { // m.
                    return callback(makeColumn("vala", {from: "m"}))(character);
                }
            };
        } else if (character === "p") { // p
            return callback(makeColumn("parma", {from: "p"}));
        } else if (character === "b") { // b
            return callback(makeColumn("umbar", {from: "b"}));
        } else if (character === "f") { // f
            return function (character) {
                if (Parser.isFinal(character)) { // f final
                    return callback(makeColumn("ampa", {from: "f", final: true}))(character);
                } else {
                    return callback(makeColumn("formen", {from: "f", medial: true}))(character);
                }
            };
        } else if (character === "v") { // v
            return callback(makeColumn("ampa", {from: "v"}));
        } else if (character === "ñ") { // ñ
            return function (character) {
                if (character === "c" || character === "k" || character === "g") {
                    return parseTengwa(function (column) {
                        if (column.tengwa === "halla") {
                            column.addError("Lenited G (halla) should not be nasalized with prefix N");
                        }
                        return callback(column.addTildeAbove({from: character}));
                    }, options)(character);
                } else { // ñ.
                    return callback(makeColumn("noldo", {from: "ñ"}))(character);
                }
            };
        } else if (character === "c" || character === "k") { // c or k
            return function (character2) {
                if (character2 === "h") { // ch or kh
                    return function (character3) {
                        if (character3 === "w") { // chw or khw
                            return callback(makeColumn("hwesta", {from: character + "hw"}));
                        } else { // ch. or kh.
                            return callback(makeColumn("harma", {from: character + "h"}))(character3);
                        }
                    };
                } else if (character2 === "w") { // cw
                    return callback(makeColumn("quesse", {from: character + "w"}));
                } else { // c.
                    return callback(makeColumn("calma", {from: character}))(character2);
                }
            };
        } else if (character === "x") {
            return callback(makeColumn("calma", {from: "x (k-)"}).addBelow("s", {from: "x (-s)"}));
        } else if (character === "q") {
            return function (character) {
                if (character == "u" || character == "w") {
                    return callback(makeColumn("quesse", {from: "q" + character}));
                } else {
                    return callback(makeColumn("quesse", {from: "q"}))(character);
                }
            };
        } else if (character === "g") {
            return function (character) {
                if (character === "h") { // gh
                    return function (character) {
                        if (character === "w") { // ghw
                            return callback(makeColumn("unque", {from: "ghw"}));
                        } else { // gh.
                            return callback(makeColumn("anca", {from: "gh"}))(character);
                        }
                    };
                } else if (character === "w") { // gw
                    return callback(makeColumn("ungwe", {from: "gw"}));
                } else if (character === "/") { // g/
                    return callback(makeColumn("halla", {from: "g"})); // gasdil
                } else { // g.
                    return callback(makeColumn("anga", {from: "g"}).varies())(character);
                }
            };
        } else if (character === "r") { // r
            return function (character) {
                if (character === "h") { // rh
                    return callback(makeColumn("arda", {from: "rh"}));
                } else {
                    return callback(makeColumn("romen", {from: "r"}))(character);
                }
            };
        } else if (character === "l") { // l
            return function (character) {
                if (character === "h") { // lh
                    return callback(makeColumn("alda", {from: "lh"}));
                } else {
                    return callback(makeColumn("lambe", {from: "l"}))(character);
                }
            };
        } else if (character === "s") { // s
            return callback(makeColumn("silme", {from: "s"}));
        } else if (character === "a") { // a
            return function (character) {
                if (character === "i") { // ai
                    return callback(makeColumn("round-carrier", {from: "a", diphthong: true}).addAbove("í", {from: "i"}));
                } else if (character === "u") { // au
                    return callback(makeColumn("round-carrier", {from: "a", diphthong: true}).addAbove("w", {from: "u"}));
                } else if (character === "/") { // a/
                    return callback(makeColumn("round-carrier", {from: "a"}).addAbove("i", {from: "a"}));
                } else if (character === "a") { // aa
                    return callback(makeColumn("round-carrier", {from: "a", long: true}).addAbove("e", {from: "a"}));
                } else { // a.
                    return callback(makeColumn("round-carrier", {from: "a"}).varies())(character);
                }
            };
        } else if (character === "e" || character === "ë") { // e
            return function (character) {
                if (character === "i") { // ei
                    return callback(makeColumn("yanta", {from: "e"}).addAbove("í", {from: "i"}));
                } else if (character === "e") {
                    return callback(makeColumn("yanta", {from: "e", long: true}).addAbove("e", {from: "e"}));
                } else { // e.
                    return callback(makeColumn("yanta", {from: "e"}))(character);
                }
            };
        } else if (character === "i") { // i
            return function (character) {
                if (character === "i") { // ii -> í
                    return parseColumn(callback, options)("í");
                } else {
                    return Parser.countPrimes(function (primes) {
                        if (primes === 0) {
                            return callback(makeColumn("short-carrier", {from: "i"}).varies());
                        } else if (primes === 1) {
                            return callback(makeColumn("short-carrier", {from: "i"}).addAbove("i", {from: ""}).varies());
                        } else if (primes === 2) {
                            return callback(makeColumn("long-carrier", {from: "i", long: true}).addAbove("i", {from: ""}).varies());
                        } else if (primes === 3) {
                            return callback(makeColumn("long-carrier", {from: "i", long: true}));
                        } else {
                            return callback(makeColumn("long-carrier").addAbove("i").addError("I only has four variants between short or long and dotted or not."));
                        }
                    })(character);
                }
            };
        } else if (character === "o") {
            return function (character) {
                if (character === "o") { // oo
                    return callback(makeColumn("anna", {from: "o"}).addAbove("e", {from: "o"}));
                } else {
                    return callback(makeColumn("anna", {from: "o"}))(character);
                }
            };
        } else if (character === "u") {
            return function (character) {
                if (character === "i") {
                    return callback(makeColumn("ure", {from: "u", diphthong: true}).addAbove("í", {from: "i"}));
                } else if (character === "u") {
                    return callback(makeColumn("ure", {from: "u", long: true}).addAbove("e", {from: "u"}));
                } else {
                    return callback(makeColumn("ure", {from: "u"}))(character);
                }
            };
        } else if (character === "w") { // w
            return function (character) {
                if (character === "w") { // ww
                    return callback(makeColumn("wilya", {from: "w"}).addAbove("e", {from: "w"}));
                } else { // w.
                    return callback(makeColumn("wilya", {from: "w"}))(character);
                }
            };
        } else if (character === "y") {
            return function (character) {
                if (character === "y") { // yy
                    return callback(makeColumn("silme-nuquerna", {from: "y"}).addAbove("e", {from: "y"}));
                } else { // y.
                    return callback(makeColumn("silme-nuquerna", {from: "y"}))(character);
                }
            };
        } else if (character === "á" || character === "â") {
            return callback(makeColumn("round-carrier", {from: character, long: true}).addAbove("e", {}));
        } else if (character === "é" || character === "ê") {
            return callback(makeColumn("yanta", {from: character, long: true}).addAbove("e", {}));
        } else if (character === "í" || character === "î") {
            return Parser.countPrimes(function (primes) {
                if (primes === 0) {
                    return callback(makeColumn("short-carrier", {from: character, long: true}).addAbove("e", {}).varies());
                } else if (primes === 1) {
                    return callback(makeColumn("long-carrier", {from: character, long: true}).addAbove("e", {}));
                } else {
                    return callback(makeColumn("long-carrier", {from: character, long: true}).addAbove("e", {}).addError(character + " has only has one variant."));
                }
            });
        } else if (character === "ó" || character === "ô") {
            return callback(makeColumn("anna", {from: character, long: true}).addAbove("e", {}));
        } else if (character === "ú" || character === "û") {
            return callback(makeColumn("ure", {from: character, long: true}).addAbove("e", {}));
        } else if (character === "h") {
            return function (character) {
                //if (character === "m") { // TODO
                //    return callback(makeColumn("ore-nasalized"));
                if (character === "w") {
                    return callback(makeColumn("hwesta-sindarinwa", {from: "hw"}));
                } else {
                    return callback(makeColumn("hyarmen", {from: "h"}))(character);
                }
            };
        } else if (character === "z") {
            return callback(makeColumn("silme", {from: "z"}).addError("Z does not appear in the mode of Beleriand"));
        } else if (punctuation[character]) {
            return callback(makeColumn(punctuation[character], {from: character}));
        } else if (Parser.isBreak(character) || /\d/.test(character)) {
            return callback()(character);
        } else {
            return callback(makeColumn("anna", {from: character}).addError("Unexpected character: " + JSON.stringify(character)));
        }
    };
}

function parseFollowingS(callback, column) {
    return function (character) {
        if (character === "s") {
            if (column.canAddBelow("s")) {
                return callback(column.addBelow("s", {from: "s"}));
            } else {
                return Parser.countPrimes(function (primes) {
                    return function (character) {
                        if (Parser.isFinal(character)) { // end of word
                            if (column.canAddFollowing("s-final") && primes-- === 0) {
                                column.addFollowing("s-final", {from: "s"});
                            } else if (column.canAddFollowing("s-inverse") && primes -- === 0) {
                                column.addFollowing("s-inverse");
                            } else if (column.canAddFollowing("s-extended") && primes-- === 0) {
                                column.addFollowing("s-extended", {from: "s"});
                            } else if (column.canAddFollowing("s-flourish")) {
                                column.addFollowing("s-flourish", {from: "s"});
                                if (primes > 0) {
                                    column.addError(
                                        "Following S only has 3 alternate " +
                                        "flourishes."
                                    );
                                }
                            } else {
                                return callback(column)("s", {from: "s"})(character);
                            }
                            return callback(column)(character);
                        } else {
                            return callback(column)("s", {from: "s"})(character);
                        }
                    };
                });
            }
        } else {
            return callback(column)(character);
        }
    };
}


},{"./document-parser":6,"./notation":9,"./numbers":10,"./parser":11,"./punctuation":12,"./tengwar-parmaite":14}],3:[function(require,module,exports){
"use strict";

var TengwarAnnatar = require("./tengwar-annatar");
var Notation = require("./notation");
var Parser = require("./parser");
var makeDocumentParser = require("./document-parser");
var punctuation = require("./punctuation");
var parseNumber = require("./numbers");

exports.name = "Classical Mode";

var defaults = {};
exports.makeOptions = makeOptions;
function makeOptions(options) {
    options = options || defaults;
    return {
        font: options.font || TengwarAnnatar,
        block: options.block,
        plain: options.plain,
        vilya: options.vilya,
        // false: (v: vala, w: wilya)
        // true: (v: vilya, w: ERROR)
        harma: options.harma,
        // between the original formation of the language,
        // but before the third age,
        // harma was renamed aha,
        // and meant breath-h in initial position
        classicalH: options.classicalH,
        classicalR: options.classicalR,
        // before the third age
        // affects use of "r" and "h"
        // without classic, we default to the mode from the namarie poem.
        // in the classical period, "r" was transcribed as "ore" only between
        // vowels.
        // in the third age, through the namarie poem, "r" is only "ore" before
        // consontants and at the end of words.
        swapDotSlash: options.swapDotSlash,
        // false: by default, e is a slash, i is a dot
        // true: e is a dot, i is a slash
        // TODO figure out "h"
        reverseCurls: options.reverseCurls,
        // false: by default, o is forward, u is backward
        // true: o is backward, u is forward
        iuRising: options.iuRising,
        // iuRising thirdAge: anna:y,u
        // otherwise: ure:i
        // in the third age, "iu" is a rising diphthong,
        // whereas all others are falling.  rising means
        // that they are stressed on the second sound, as
        // in "yule".  whether to use yanta or anna is
        // not attested.
        longHalla: options.longHalla,
        // TODO indicates that halla should be used before medial L and W to
        // indicate that these are pronounced with length.
        // initial hl and hw remain short.
        // TODO doubled dots for í
        // TODO triple dots for y
        // TODO simplification of a, noting non-a
        // TODO following W in this mode?
        // TODO namarië does not use double U or O curls
        // TODO namarië does not reverse esse for E tehta
        duodecimal: options.duodecimal
    };
};

exports.transcribe = transcribe;
function transcribe(text, options) {
    options = makeOptions(options);
    var font = options.font;
    return font.transcribe(parse(text.toLowerCase(), options), options);
}

exports.encode = encode;
function encode(text, options) {
    options = makeOptions(options);
    return Notation.encode(parse(text.toLowerCase(), options), options);
}

var parse = exports.parse = makeDocumentParser(parseWord, makeOptions);

function parseWord(callback, options, columns, previous) {
    columns = columns || [];
    return parseColumn(function (moreColumns) {
        if (!moreColumns.length) {
            return callback(columns);
        } else {
            return parseWord(
                callback,
                options,
                columns.concat(moreColumns),
                moreColumns[moreColumns.length - 1] // previous
            );
        }
    }, options, previous);
}

function parseColumn(callback, options, previous) {
    var font = options.font;
    var makeColumn = font.makeColumn;
    return parseTengwa(function (columns) {
        var previous = columns.pop();
        return parseTehta(function (next) {
            var next = columns.concat(next).filter(Boolean)
            if (next.length) {
                return callback(next);
            } else {
                return function (character) {
                    if (Parser.isBreak(character)) {
                        return callback([])(character);
                    } else if (/\d/.test(character)) {
                        return parseNumber(callback, options)(character);
                    } else if (punctuation[character]) {
                        return callback([makeColumn(punctuation[character], {from: character})]);
                    } else {
                        return callback([makeColumn("ure", {}).addError(
                            "Cannot transcribe " + JSON.stringify(character) +
                            " in Classical Mode"
                        )]);
                    }
                };
            }
        }, options, previous);
    }, options, previous);
}

var vowels = "aeiouyáéíóú";

function parseTengwa(callback, options, previous) {
    var font = options.font;
    var makeColumn = font.makeColumn;
    return function (character) {
        if (character === "n") { // n
            return function (character2) {
                if (character2 === "n") { // nn
                    return callback([makeColumn("numen", {from: "n"}).addTildeBelow({from: "n"})]);
                } else if (character2 === "t") { // nt
                    return callback([makeColumn("anto", {from: "nt"})]);
                } else if (character2 === "d") { // nd
                    return callback([makeColumn("ando", {from: "nd"})]);
                } else if (character2 === "g") { // ng
                    return function (character3) {
                        if (character3 === "w") { // ngw -> ñw
                            return callback([makeColumn("ungwe", {from: "ñgw"})]);
                        } else { // ng
                            return callback([makeColumn("anga", {from: "ñg"})])(character3);
                        }
                    };
                } else if (character2 === "c" || character2 == "k") { // nc or nk
                    return function (character3) {
                        if (character3 === "w") { // ncw
                            return callback([makeColumn("unque", {from: "ñ" + character2 + "w"})]);
                        } else { // nc
                            return callback([makeColumn("anca", {from: "ñ" + character2})])(character3);
                        }
                    };
                } else if (character2 === "q") {
                    return function (character3) {
                        if (character3 === "u") { // nqu
                            return callback([makeColumn("unque", {from: "nqu"})]);
                        } else {
                            return callback([makeColumn("unque", {from: "nq"})])(character3);
                        }
                    };
                } else if (character2 === "w" && previous == null) {
                    return callback([makeColumn("nwalme", {from: "nw"})]);
                } else {
                    return callback([makeColumn("numen", {from: "n"})])(character2);
                }
            };
        } else if (character === "m") {
            return function (character) {
                if (character === "m") { // mm
                    return callback([makeColumn("malta", {from: "m"}).addTildeBelow({from: "m"})]);
                } else if (character === "p") { // mp
                    return callback([makeColumn("ampa", {from: "mp"})]);
                } else if (character === "b") { // mb
                    return callback([makeColumn("umbar", {from: "mb"})]);
                } else {
                    return callback([makeColumn("malta", {from: "m"})])(character);
                }
            };
        } else if (character === "ñ") { // ñ
            return function (character) {
                if (character === "g") { // ñg
                    return function (character) {
                        if (character === "w") { // ñgw
                            return callback([makeColumn("ungwe", {from: "ñgw"})]);
                        } else { // ñg
                            return callback([makeColumn("anga", {from: "ñg"})])(character);
                        }
                    }
                } else if (character === "c") { // ñc
                    return function (character) {
                        if (character === "w") { // ñcw
                            return callback([makeColumn("unque", {from: "ñcw"})]);
                        } else { // ñc
                            return callback([makeColumn("anca", {from: "ñc"})]);
                        }
                    }
                } else {
                    return callback([makeColumn("noldo", {from: "ñ"})])(character);
                }
            };
        } else if (character === "t") {
            return function (character) {
                if (character === "t") { // tt
                    return function (character) {
                        if (character === "y") { // tty
                            return callback([makeColumn("tinco", {from: "t"}).addBelow("y-quenya", {from: "y"}).addTildeBelow({from: "t"})]);
                        } else { // tt
                            return callback([makeColumn("tinco", {from: "t"}).addTildeBelow({from: "t"})])(character);
                        }
                    };
                } else if (character === "y") { // ty
                    return callback([makeColumn("tinco", {from: "t"}).addBelow("y-quenya", {from: "y"})]);
                } else if (character === "h") { // th
                    return callback([makeColumn("thule", {from: "th"})]);
                } else if (character === "s") {
                    return function (character) {
                        // TODO s-inverse, s-extended, s-flourish
                        if (Parser.isFinal(character)) { // ts final
                            return callback([makeColumn("tinco", {from: "t"}).addFollowing("s", {from: "s"})])(character);
                        } else { // ts medial
                            return callback([
                                makeColumn("tinco", {from: "t"}),
                                makeColumn("silme", {from: "s"})
                            ])(character);
                        }
                    };
                } else { // t
                    return callback([makeColumn("tinco", {from: "t"})])(character);
                }
            };
        } else if (character === "p") {
            return function (character) {
                if (character === "p") {
                    return function (character) {
                        if (character === "y") { // ppy
                            return callback([makeColumn("parma", {from: "p"}).addBelow("y-quenya", {from: "y"}).addTildeBelow({from: "p"})]);
                        } else { // pp
                            return callback([makeColumn("parma", {from: "p"}).addTildeBelow({from: "p"})])(character);
                        }
                    };
                } else if (character === "y") { // py
                    return callback([makeColumn("parma", {from: "p"}).addBelow("y-quenya", {from: "y"})]);
                } else if (character === "s") { // ps
                    return function (character) {
                        if (Parser.isFinal(character)) { // ps final
                            return callback([makeColumn("parma", {from: "p"}).addFollowing("s", {from: "s"})])(character);
                        } else { // ps medial
                            return callback([
                                makeColumn("parma", {from: "p"}),
                                makeColumn("silme", {from: "s"})
                            ])(character);
                        }
                    };
                } else { // t
                    return callback([makeColumn("parma", {from: "p"})])(character);
                }
            };
        } else if (character === "c" || character === "k") {
            return function (character2) {
                if (character2 === "c" || character2 === "k") {
                    return callback([makeColumn("calma", {from: character}).addTildeBelow({from: character2})]);
                } else if (character2 === "s") {
                    return callback([makeColumn("calma", {from: character}).addBelow("s", {from: character2})]);
                } else if (character2 === "h") {
                    return callback([makeColumn("harma", {from: character + character2})]);
                } else if (character2 === "w") {
                    return callback([makeColumn("quesse", {from: character + character2})]);
                } else {
                    return callback([makeColumn("calma", {from: character})])(character2);
                }
            };
        } else if (character === "x") {
            return callback([makeColumn("calma", {from: "x (k-)"}).addFollowing("s", {from: "x (-s)"})])
        } else if (character === "q") {
            return function (character) {
                if (character === "u") {
                    return callback([makeColumn("quesse", {from: "q"})]);
                } else {
                    return callback([makeColumn("quesse", {from: "q"})])(character);
                }
            }
        } else if (character === "f") {
            return callback([makeColumn("formen", {from: "f"})]);
        } else if (character === "v") {
            if (options.vilya) {
                return callback([makeColumn("wilya", {from: "v", name: "vilya"})]);
            } else {
                return callback([makeColumn("vala", {from: "v", name: "vala"})]);
            }
        } else if (character === "w") {
            if (options.vilya) {
                return callback([])("u");
            } else {
                // TODO Fact-check this interpretation. It may be an error to
                // use w as a consonant depending on whether we're speaking
                // early or late classical.
                return callback([makeColumn("wilya", {from: "w", name: "vilya"})]);
            }
        } else if (character === "r") { // r
            return function (character) {
                if (character === "d") { // rd
                    return callback([makeColumn("arda", {from: "rd"})]);
                } else if (character === "h") { // rh -> hr
                    var error = "R should preceed H in the HR diagraph in Classical mode.";
                    return callback([
                        makeColumn("halla", {from: "h"}).addError(error),
                        makeColumn("romen", {from: "r"}).addError(error)
                    ]);
                } else if (options.classicalR) {
                    // pre-namarie style, ore when r between vowels
                    if (
                        previous &&
                        previous.above &&
                        !Parser.isFinal(character) &&
                        vowels.indexOf(character) !== -1
                    ) {
                        return callback([makeColumn("ore", {from: "r"})])(character);
                    } else {
                        return callback([makeColumn("romen", {from: "r"})])(character);
                    }
                } else {
                    // pre-consonant and word-final
                    if (Parser.isFinal(character) || vowels.indexOf(character) === -1) { // ore
                        return callback([makeColumn("ore", {from: "r"})])(character);
                    } else { // romen
                        return callback([makeColumn("romen", {from: "r"})])(character);
                    }
                }
            };
        } else if (character === "l") {
            return function (character) {
                if (character === "l") {
                    return function (character) {
                        if (character === "y") { // lly
                            return callback([makeColumn("lambe", {from: "l"}).addBelow("y-quenya", {from: "y"}).addTildeBelow({from: "l"})]);
                        } else { // ll
                            return callback([makeColumn("lambe", {from: "l"}).addTildeBelow({from: "y"})])(character);
                        }
                    }
                } else if (character === "y") { // ly
                    return callback([makeColumn("lambe", {from: "l"}).addBelow("y-quenya", {from: "y"})]);
                } else if (character === "h") { // lh -> hl
                    var error = "L should preceed H in the HL diagraph in Classical mode.";
                    return callback([
                        makeColumn("halla", {from: "h"}).addError(error),
                        makeColumn("lambe", {from: "l"}).addError(error)
                    ]);
                } else if (character === "d") { // ld
                    return callback([makeColumn("alda", {from: "ld"})]);
                } else if (character === "b") { // lb
                    // TODO ascertain why this is a special case and make a note.
                    return callback([makeColumn("lambe", {from: "l"}), makeColumn("umbar", {from: "b"})]);
                } else {
                    return callback([makeColumn("lambe", {from: "l"})])(character);
                }
            };
        } else if (character === "s") {
            return function (character) {
                if (character === "s") { // ss
                    return callback([makeColumn("esse", {from: "ss"})]);
                } else { // s.
                    return callback([makeColumn("silme", {from: "s"})])(character);
                }
                // Note that there is no sh phoneme in Classical Elvish languages
            };
        } else if (character === "h") {
            return function (character) {
                if (character === "l") { // hl
                    return callback([
                        makeColumn("halla", {from: "h"}),
                        makeColumn("lambe", {from: "l"})
                    ]);
                } else if (character === "r") {
                    return callback([
                        makeColumn("halla", {from: "h"}),
                        makeColumn("romen", {from: "r"})
                    ]);
                } else if (character === "w") { // hw
                    return callback([makeColumn("hwesta", {from: "hw"})]);
                } else if (character === "t") { // ht
                    // TODO find a reference and example that substantiates
                    // this interpretation. Did I invent this to make harma
                    // expressible?
                    return callback([makeColumn("harma", {from: "ht"})]);
                } else if (character === "y") { // hy
                    if (options.classicalH && !options.harma) { // oldest form
                        return callback([makeColumn("hyarmen", {from: "hy"})]);
                    } else { // post-aha, through to the third-age
                        return callback([makeColumn("hyarmen", {from: "hy"}).addBelow("y-quenya", {from: "y"})]);
                    }
                } else { // h
                    if (options.classicalH) {
                        if (options.harma) { // before harma became aha initially
                            if (previous) { // medial
                                return callback([makeColumn("halla", {from: "h"})])(character);
                            } else { // initial
                                return callback([makeColumn("harma", {from: "h"})])(character);
                            }
                        } else { // harmen renamed and resounded as aha in initial position
                            if (previous) { // medial
                                return callback([makeColumn("hyarmen", {from: "h"})])(character);
                            } else { // initial
                                return callback([makeColumn("halla", {from: "h"})])(character);
                            }
                        }
                    } else { // third age, namarië
                        return callback([makeColumn("hyarmen", {from: "h"})])(character);
                    }
                }
            };
        } else if (character === "d") {
            return callback([makeColumn("ando", {from: "d"}).addError("D cannot appear except after N, L, or R in Classical Mode")]);
        } else if (character === "b") {
            return callback([makeColumn("umbar", {from: "b"}).addError("B cannot appear except after M or L in Classical Mode")]);
        } else if (character === "g") {
            return callback([makeColumn("anga", {from: "g"}).addError("G cannot appear except after N or Ñ in Classical Mode")]);
        } else if (character === "j") {
            return callback([makeColumn("ure", {from: "j"}).addError("J cannot be transcribed in Classical Mode")]);
        } else {
            return callback([])(character);
        }
    };
}

function parseTehta(callback, options, previous) {
    var font = options.font;
    var makeColumn = font.makeColumn;
    return function (character) {
        if (character === "a") {
            return function (character) {
                if (character === "a") {
                    return parseTehta(callback, options, previous)("á");
                } else if (character === "i") {
                    return callback([previous, makeColumn("yanta", {from: "i", diphthong: true}).addAbove("a", {from: "a"})]);
                } else if (character === "u") {
                    return callback([previous, makeColumn("ure", {from: "u", diphthong: true}).addAbove("a", {from: "a"})]);
                } else if (previous && previous.canAddAbove("a")) {
                    return callback([previous.addAbove("a", {from: "a"})])(character);
                } else {
                    return callback([previous, makeColumn("short-carrier", {from: "a"}).addAbove("a", {})])(character);
                }
            };
        } else if (character === "e" || character === "ë") {
            var tehta = swapDotSlash("e", options);
            return function (character) {
                if (character === "e") {
                    return parseTehta(callback, options, previous)("é");
                } else if (character === "u") {
                    return callback([previous, makeColumn("ure", {from: "u", diphthong: true}).addAbove(tehta, {from: "e"})]);
                } else if (previous && previous.canAddAbove("e")) {
                    return callback([previous.addAbove(tehta, {from: "e"})])(character);
                } else {
                    return callback([previous, makeColumn("short-carrier", {from: "e"}).addAbove(tehta, {})])(character);
                }
            };
        } else if (character === "i") {
            var iTehta = swapDotSlash("i", options);
            return function (character) {
                if (character === "i") {
                    return parseTehta(callback, options, previous)("í");
                } else if (character === "u") {
                    if (options.iuRising) {
                        return callback([previous, makeColumn("anna", {from: "i", diphthong: true}).addAbove(reverseCurls("u", options), {from: "u"}).addBelow("y-quenya", {from: "y"})]);
                    } else {
                        return callback([previous, makeColumn("ure", {from: "u", diphthong: true}).addAbove(iTehta, {from: "i"})]);
                    }
                } else if (previous && previous.canAddAbove(iTehta)) {
                    return callback([previous.addAbove(iTehta, {from: "i"})])(character);
                } else {
                    return callback([previous, makeColumn("short-carrier", {from: "i"}).addAbove(iTehta, {})])(character);
                }
            };
        } else if (character === "o") {
            return function (character) {
                if (character === "o") {
                    return parseTehta(callback, options, previous)("ó");
                } else if (character === "i") {
                    return callback([previous, makeColumn("yanta", {from: "i", diphthong: true}).addAbove(reverseCurls("o", options), {from: "o"})]);
                } else if (previous && previous.canAddAbove("o")) {
                    return callback([previous.addAbove(reverseCurls("o", options), {from: "o"})])(character);
                } else {
                    return callback([previous, makeColumn("short-carrier", {from: "o"}).addAbove(reverseCurls("o", options), {})])(character);
                }
            };
        } else if (character === "u") {
            return function (character) {
                if (character === "u") {
                    return parseTehta(callback, options, previous)("ú");
                } else if (character === "i") {
                    return callback([previous, makeColumn("yanta", {from: "i", diphthong: true}).addAbove(reverseCurls("u", options), {from: "u"})]);
                } else if (previous && previous.canAddAbove("u")) {
                    return callback([previous.addAbove(reverseCurls("u", options), {from: "u"})])(character);
                } else {
                    return callback([previous, makeColumn("short-carrier", {from: "u"}).addAbove(reverseCurls("u", options), {})])(character);
                }
            };
        } else if (character === "y") {
            if (previous && previous.canAddBelow("y-quenya")) {
                return parseTehta(callback, options, previous.addBelow("y-quenya", {from: "y"}));
            } else {
                var next = makeColumn("anna", {}).addBelow("y-quenya", {from: "y"});
                return parseTehta(function (moreColumns) {
                    return callback([previous].concat(moreColumns));
                }, options, next);
            }
        } else if (character === "á" || character === "â") {
            return callback([previous, makeColumn("long-carrier", {from: character}).addAbove("a", {})]);
        } else if (character === "é" || character === "ê") {
            return callback([previous, makeColumn("long-carrier", {from: character}).addAbove(swapDotSlash("e", options), {})]);
        } else if (character === "í" || character === "î") {
            return callback([previous, makeColumn("long-carrier", {from: character}).addAbove(swapDotSlash("i", options), {})]);
        } else if (character === "ó" || character === "ô") {
            if (previous && previous.canAddAbove("ó")) {
                return callback([previous.addAbove(reverseCurls("ó", options), {from: character})]);
            } else {
               return callback([previous, makeColumn("long-carrier", {from: character}).addAbove(reverseCurls("o", options), {})]);
            }
        } else if (character === "ú" || character === "û") {
            if (previous && previous.canAddAbove("ú")) {
                return callback([previous.addAbove(reverseCurls("ú", options), {from: character})]);
            } else {
                return callback([previous, makeColumn("long-carrier", {from: character}).addAbove(reverseCurls("u", options), {})]);
            }
        } else {
            return callback([previous])(character);
        }
    };
}

var curlReversals = {"o": "u", "u": "o", "ó": "ú", "ú": "ó"};
function reverseCurls(tehta, options) {
    if (options.reverseCurls) {
        tehta = curlReversals[tehta] || tehta;
    }
    return tehta;
}

var dotSlashSwaps = {"e": "i", "i": "e"};
function swapDotSlash(tehta, options) {
    if (options.swapDotSlash) {
        tehta = dotSlashSwaps[tehta] || tehta;
    }
    return tehta;
}

// Notes regarding "h":
//
// http://at.mansbjorkman.net/teng_quenya.htm#note_harma
// originally:
//  h represented ach-laut and was written with harma.
//  h initial transcribed as halla
//  h medial transcribed as harma
//  hy transcribed as hyarmen
// then harma became aha:
//  then h in initial position became a breath-h, still spelled with harma, but
//  renamed aha.
//  h initial transcribed as harma
//  h medial transcribed as hyarmen
//  hy transcribed as hyarmen with underposed y
// then, in the third age:
//  the h in every position became a breath-h
//  except before t, where it remained pronounced as ach-laut
//  h initial ???
//  h medial transcribed as harma
//  h transcribed as halla or hyarmen in other positions (needs clarification)
//
// ach-laut (_ch_, /x/ phonetically, {h} by tolkien)
//   original: harma in all positions
//   altered: harma initially, halla in all other positions
//   third-age: halla in all other positions
// hy (/ç/ phonetically)
//   original: hyarmen in all positions
//   altered: hyarmen with y below
//   third-age:
// h (breath h)
//   original: halla in all positions
//   altered: hyarmen medially
//   third-age:
//
// harma:
//   original: ach-laut found in all positions
//   altered: breath h initially (renamed aha), ach-laut medial
//   third-age: ach-laut before t, breath h all other places
// hyarmen:
//   original: represented {hy}, palatalized h, in all positions
//   altered: breath h medial, palatalized with y below
//   third-age: same
// halla:
//   original: breath-h, presuming existed only initially
//   altered: breath h initial
//   third-age: only used for hl and hr
//
// hr: halla romen
// hl: halla lambe
// ht: harma
// hy:
//   original: hyarmen
//   altered:
//     initial: ERROR
//     medial: hyarmen lower-y
//   third age: hyarmen lower-y
// ch: harma
// h initial:
//   original: halla
//   altered: XXX
//   third-age: harma
// h medial: hyarmen


},{"./document-parser":6,"./notation":9,"./numbers":10,"./parser":11,"./punctuation":12,"./tengwar-annatar":13}],4:[function(require,module,exports){
"use strict";

module.exports = makeColumn;
function makeColumn(font, tengwa, tengwaNote) {
    return new Column(font, tengwa, tengwaNote);
};

var Column = function (font, tengwa, tengwaNote) {
    Object.defineProperty(this, "font", {
        value: font,
        writable: true,
        configurable: true,
        enumerable: false,
    });

    this.above = void 0;
    this.tildeAbove = void 0;
    this.tengwa = tengwa;
    this.tildeBelow = void 0;
    this.below = void 0;
    this.following = void 0;
    this.error = void 0;

    this.aboveNote = void 0;
    this.tildeAboveNote = void 0;
    this.tengwaNote = tengwaNote;
    this.tildeBelowNote = void 0;
    this.belowNote = void 0;
    this.followingNote = void 0;

    this.hasVariant = false;
};

Column.prototype.canAddAbove = function (tehta, reversed) {
    return (
        !this.above && !!this.font.tehtaForTengwa(this.tengwa, tehta)
    ) || ( // flip it
        !reversed && !this.below && this.reversed().canAddAbove(tehta, true)
    );
};

Column.prototype.addAbove = function (above, aboveNote) {
    if (!this.font.tehtaForTengwa(this.tengwa, above)) {
        this.reverse();
    }
    this.above = above;
    this.aboveNote = aboveNote;
    return this;
};

Column.prototype.canAddBelow = function (tehta, reversed) {
    return (
        !this.below && !!this.font.tehtaForTengwa(this.tengwa, tehta)
    ) || ( // flip it
        !reversed && !this.above && this.reversed().canAddBelow(tehta, true)
    );
};

Column.prototype.addBelow = function (below, belowNote) {
    if (!this.font.tehtaForTengwa(this.tengwa, below)) {
        this.reverse();
    }
    this.below = below;
    this.belowNote = belowNote;
    return this;
};

Column.prototype.addTildeAbove = function (tildeAboveNote) {
    this.tildeAbove = true;
    this.tildeAboveNote = tildeAboveNote;
    return this;
};

Column.prototype.addTildeBelow = function (tildeBelowNote) {
    this.tildeBelow = true;
    this.tildeBelowNote = tildeBelowNote;
    return this;
};

Column.prototype.canAddFollowing = function (following) {
    return !this.following && !!this.font.tehtaForTengwa(this.tengwa, following);
};

Column.prototype.addFollowing = function (following, followingNote) {
    this.following = following;
    this.followingNote = followingNote;
    return this;
};

Column.prototype.reversed = function () {
    return this.clone().reverse();
};

Column.prototype.clone = function () {
    var column = new Column(this.font, this.tengwa);
    if (this.above) column.addAbove(this.above, this.aboveNote);
    if (this.below) column.addBelow(this.below, this.belowNote);
    if (this.following) column.addFollowing(this.following, this.followingNote);
    if (this.tildeBelow) column.addTildeBelow(this.tildeBelowNote);
    if (this.tildeAbove) column.addTildeAbove(this.tildeAboveNote);
    return column;
};

var reversed = {
    "silme": "silme-nuquerna",
    "esse": "esse-nuquerna",
    "silme-nuquerna": "silme",
    "esse-nuquerna": "esse"
};

Column.prototype.reverse = function () {
    this.tengwa = reversed[this.tengwa] || this.tengwa;
    return this;
};

Column.prototype.addError = function (error) {
    this.errors = this.errors || [];
    this.errors.push(error);
    return this;
};

Column.prototype.varies = function () {
    this.hasVariant = true;
    return this;
};


},{}],5:[function(require,module,exports){
"use strict";

exports.tengwar = {
    // 1
    "tinco": "1", // t
    "parma": "q", // p
    "calma": "a", // c
    "quesse": "z", // qu
    // 2
    "ando" : "2", // nd
    "umbar": "w", // mb
    "anga" : "s", // ng
    "ungwe": "x", // ngw
    // 3
    "thule" : "3", // th
    "formen": "e", // ph / f
    "harma" : "d", // h / ch
    "hwesta": "c", // hw / chw
    // 4
    "anto" : "4", // nt
    "ampa" : "r", // mp
    "anca" : "f", // nc
    "unque": "v", // nqu
    // 5
    "numen" : "5", // n
    "malta" : "t", // m
    "noldo" : "g", // ng
    "nwalme": "b", // ngw / nw
    // 6
    "ore"  : "6", // r
    "vala" : "y", // v
    "anna" : "h", // -
    "wilya": "n", // w / v
    // 7
    "romen": "7", // medial r
    "arda" : "u", // rd / rh
    "lambe": "j", // l
    "alda" : "m", // ld / lh
    // 8
    "silme":          "8", // s
    "silme-nuquerna": "i", // s
    "esse":           "k", // z
    "esse-nuquerna":  ",", // z
    // 9
    "hyarmen":           "9", // hyarmen
    "hwesta-sindarinwa": "o", // hwesta sindarinwa
    "yanta":             "l", // yanta
    "ure":               ".", // ure
    // 10
    "halla": "½", // halla
    "short-carrier": "`",
    "long-carrier": "~",
    "round-carrier": "]",
    // I
    "thuletinco": "!",
    "formenparma": "Q",
    "harmacalma": "A",
    "hwestaquesse": "Z",
    "antoando": "@",
    "ampaumbar": "W",
    "ancaanga": "S",
    "unqueungwe": "X",
    // punctuation
    "colon": "ˆ",
    "apostrophe": "²",
    "hyphen": "¬",
    "semi-colon": "Â",
    "comma": "=",
    "full-stop": "-",
    "exclamation-point": "Á",
    "question-mark": "À",
    "open-bracket": "›",
    "close-bracket": "›",
    // open-paren and close-paren vary by font.
    "flourish-left": "Ğ",
    "flourish-right": "ğ",
    // numbers
    "0":  "ð",
    "1":  "ñ",
    "2":  "ò",
    "3":  "ó",
    "4":  "ô",
    "5":  "õ",
    "6":  "ö",
    "7":  "÷",
    "8":  "ø",
    "9":  "ù",
    "10": "ú",
    "11": "û"
};

exports.tehtar = {
    "a": "#EDC",
    "e": "$RFV",
    "i": "%TGB",
    "o": "^YHN",
    "u": [
        "&",
        "U",
        "J",
        "M",
        "Ā", // backward hooks, from the alt font to the custom font
        "ā",
        "Ă",
        "ă"
    ],
    //"á": "",
    "ó": [
        "Ą",
        "ą",
        "Ć",
        "ć"
    ],
    "ú": [
        "Ĉ",
        "ĉ",
        "Ċ",
        "ċ"
    ],
    "í": [
        "Ô",
        "Õ",
        "Ö",
        "×"
    ],
    "w": "èéêë", // TODO custom hooks for tengwar parmaite from the alternate font
    "y-english": "ØÙÚÛ",
    "y-sindarin": "ÔÕÖ×",
    "y-quenya": "ÌÍÎÏ´",
    "o-below": [
        "ä",
        "å",
        "æ",
        "ç",
        "|"
    ],
    "i-below": [
        "È",
        "É",
        "Ê",
        "Ë",
        "L"
    ],
    "s": {
        "special": true,
        "calma": "|",
        "quesse": "|",
        "short-carrier": "}"
    },
    "s-final": {
        "special": true,
        "tinco": "+",
        "ando": "+",
        "numen": "+",
        "malta": "+",
        "lambe": "_"
    },
    "s-inverse": {
        "special": true,
        "tinco": "¡"
    },
    "s-extended": {
        "special": true,
        "tinco": "Ç"
    },
    "s-flourish": {
        "special": true,
        "tinco": "£",
        "lambe": "¥"
    },
    "tilde-above": "Pp",
    "tilde-below": [
        ":",
        ";",
        "°"
    ],
    "tilde-high-above": ")0",
    "tilde-far-below": "?/",
    "bar-above": "{[",
    "bar-below": [
        '"',
        "'",
        "ç" // cedilla
    ],
    "bar-high-above": "ìî",
    "bar-far-below": "íï"
};


},{}],6:[function(require,module,exports){
"use strict";

var Parser = require("./parser");

// produces a document parser from a word parser in an arbitrary mode
module.exports = makeDocumentParser;
function makeDocumentParser(parseWord, makeOptions) {
    var parseLine = Parser.makeDelimitedParser(parseWord, parseSomeSpaces);
    var parseParagraph = Parser.makeDelimitedParser(parseLine, parseNewlineSpace);
    var parseSection = Parser.makeDelimitedParser(parseParagraph, parseNewlineSpace);
    var parseDocument = Parser.makeDelimitedParser(parseSection, parseNewlineSpaces);
    return Parser.makeParser(function (callback, options) {
        options = makeOptions(options);
        var state = parseDocument(callback, options);
        return state;
    });
}

var parseSpace = Parser.makeExpect(" ");
var parseAnySpaces = Parser.makeParseAny(parseSpace);
var parseSomeSpaces = Parser.makeParseSome(parseSpace);
var parseNewline = Parser.makeExpect("\n");
var parseNewlines = Parser.makeParseSome(parseNewline);

function parseNewlineSpace(callback) {
    return parseAnySpaces(function () {
        return parseNewline(function () {
            return parseAnySpaces(callback);
        });
    });
}

function parseNewlineSpaces(callback) {
    return parseAnySpaces(function () {
        return parseNewlines(function () {
            return parseAnySpaces(callback);
        });
    });
}

},{"./parser":11}],7:[function(require,module,exports){
var GeneralUse = require("./general-use");
var Classical = require("./classical");
var Beleriand = require("./beleriand");
var TengwarAnnatar = require("./tengwar-annatar");
var TengwarParmaite = require("./tengwar-parmaite");
window.Tengwar = {
    modes: { "general-use": GeneralUse, classical: Classical, beleriand: Beleriand },
    fonts: { annatar: TengwarAnnatar, parmaite: TengwarParmaite }
};

},{"./beleriand":2,"./classical":3,"./general-use":8,"./tengwar-annatar":13,"./tengwar-parmaite":14}],8:[function(require,module,exports){
"use strict";

var TengwarAnnatar = require("./tengwar-annatar");
var Notation = require("./notation");
var Parser = require("./parser");
var makeDocumentParser = require("./document-parser");
var punctuation = require("./punctuation");
var parseNumber = require("./numbers");

exports.name = "Mode for general use";

var defaults = {};
exports.makeOptions = makeOptions;
function makeOptions(options) {
    options = options || defaults;
    // legacy
    if (options.blackSpeech) {
        options.language = "blackSpeech";
    }
    if (options.language === "blackSpeech") {
        options.language = "black-speech";
    }
    return {
        font: options.font || TengwarAnnatar,
        block: options.block,
        plain: options.plain,
        doubleNasalsWithTildeBelow: options.doubleNasalsWithTildeBelow,
        // Any tengwa can be doubled by placing a tilde above, and any tengwa
        // can be prefixed with the nasal from the same series by putting a
        // tilde below.  Doubled nasals have the special distinction that
        // either of these rules might apply so the tilde can go either above
        // or below.
        // false: by default, place a tilde above doubled nasals.
        // true: place the tilde below doubled nasals.
        reverseCurls: options.reverseCurls || options.language === "black-speech",
        // false: by default, o is forward, u is backward
        // true: o is backward, u is forward
        swapDotSlash: options.swapDotSlash,
        // false: by default, e is a slash, i is a dot
        // true: e is a dot, i is a slash
        medialOre: options.medialOre || options.language === "black-speech",
        // false: by default, ore only appears in final position
        // true: ore also appears before consonants, as in the ring inscription
        language: options.language,
        // by default, no change
        // "english": final e implicitly silent
        // "black speech": sh is harmacalma, gh is unqueungwe, as in
        // the ring inscription
        // not "black-speech": sh is harma, gh is unque
        noAchLaut: options.noAchLaut,
        // false: "kh" is interpreted as ach-laut, as in "bach".
        // true: "kh" is interpreted as merely "k", as in "khan".
        sHook: options.sHook,
        // false: "is" is silme with I tehta
        // true: "is" is short carrier with S hook and I tehta
        tsdz: options.tsdz,
        // false: "ts" and "dz" are rendered as separate characters
        // true: "ts" is IPA "c" and "dz" is IPA "dʒ"
        duodecimal: options.duodecimal
        // false: numbers are decimal by default
        // true: numbers are duodecimal by default
    };
}

exports.transcribe = transcribe;
function transcribe(text, options) {
    options = makeOptions(options);
    var font = options.font;
    return font.transcribe(parse(text.toLowerCase(), options), options);
}

exports.encode = encode;
function encode(text, options) {
    options = makeOptions(options);
    return Notation.encode(parse(text.toLowerCase(), options), options);
}

var parse = exports.parse = makeDocumentParser(parseWord, makeOptions);

function parseWord(callback, options) {
    var font = options.font;
    var makeColumn = font.makeColumn;
    return scanWord(function (word, rewind) {
        if (options.language === "english") {
            if (word === "of") {
                return function (character) {
                    if (Parser.isBreak(character)) {
                        return scanWord(function (word, rewind) {
                            if (word === "the") {
                                return callback([
                                    makeOfThe(makeColumn)
                                ]);
                            } else if (word === "the`") {
                                return callback([
                                    makeOf(makeColumn),
                                    makeThePrime(makeColumn)
                                ]);
                            } else if (word === "the``") {
                                return callback([
                                    makeOf(makeColumn),
                                    makeThePrime(makeColumn)
                                ]);
                            } else {
                                return rewind(callback([
                                    makeOf(makeColumn)
                                ]));
                            }
                        });
                    } else {
                        return callback([makeOf(makeColumn)])(character);
                    }
                }
            } else if (word === "of`") {
                return scanWord(function (word, rewind) {
                    if (word === "the") {
                        return callback([
                            makeOfPrime(makeColumn),
                            makeThe(makeColumn)
                        ]);
                    } else if (word === "the`") {
                        return callback([
                            makeOfPrime(makeColumn),
                            makeThePrime(makeColumn)
                        ]);
                    } else if (word === "the``") {
                        return callback([
                            makeOfPrime(makeColumn),
                            makeThePrimePrime(makeColumn)
                        ]);
                    } else {
                        return rewind(callback([
                            makeOfPrime(makeColumn)
                        ]));
                    }
                });
            } else if (word === "the") {
                return callback([
                    makeThe(makeColumn)
                ]);
            } else if (word === "the`") {
                return callback([
                    makeThePrime(makeColumn)
                ]);
            } else if (word === "the``") {
                return callback([
                    makeThePrimePrime(makeColumn)
                ]);
            } else if (word === "of`the") {
                return callback([
                    makeOf(makeColumn),
                ])("t")("h")("e");
            } else if (word === "of`the`") {
                return callback([
                    makeOfPrime(makeColumn)
                ])("t")("h")("e")("`");
            } else if (word === "and") {
                return callback([
                    makeAnd(makeColumn)
                ]);
            } else if (word === "and`") {
                return callback([
                    makeAndPrime(makeColumn)
                ]);
            } else if (word === "and``") {
                return callback([
                    makeAndPrimePrime(makeColumn)
                ]);
            } else if (word === "we") {
                return callback([
                    makeColumn("vala", {from: "w"}),
                    makeColumn("short-carrier", {from: ""})
                        .addAbove("e", {from: "e"})
                        .varies()
                ]);
            } else if (word === "we`") { // Unattested, my invention - kriskowal
                return callback([
                    makeColumn("vala", {from: "w", diphthong: true})
                        .addBelow("y", {from: "ē"})
                ]);
            }
        }
        if (book[word]) {
            return callback(Notation.decodeWord(book[word], makeColumn), {
                from: word
            });
        } else {
            return callback(parseWordPiecewise(word, word.length, options), word);
        }
    }, options);
}

var book = {
    "iant": "yanta;tinco:a,tilde-above",
    "iaur": "yanta;vala:a;ore",
    "baranduiniant": "umbar;romen:a;ando:a,tilde-above;anna:u;yanta;anto:a,tilde-above",
    "ioreth": "yanta;romen:o;thule:e",
    "noldo": "nwalme;lambe:o;ando;short-carrier:o",
    "noldor": "nwalme;lambe:o;ando;ore:o"
};

// TODO Fix bug where "of", "the", and "and" decompose with following
// punctuation.
function scanWord(callback, options, word, rewind) {
    word = word || "";
    rewind = rewind || function (state) {
        return state;
    };
    return function (character) {
        if (Parser.isBreak(character)) {
            return callback(word, rewind)(character);
        } else {
            return scanWord(callback, options, word + character, function (state) {
                return rewind(state)(character);
            });
        }
    };
}

var parseWordPiecewise = Parser.makeParser(function (callback, length, options) {
    return parseWordTail(callback, length, options, []);
});

function parseWordTail(callback, length, options, columns, previous) {
    return parseColumn(function (moreColumns) {
        if (!moreColumns.length) {
            return callback(columns);
        } else {
            return parseWordTail(
                callback,
                length,
                options,
                columns.concat(moreColumns),
                moreColumns[moreColumns.length - 1] // previous
            );
        }
    }, length, options, previous);
}

function makeOf(makeColumn) {
    return makeColumn("ampaumbar", {from: "of"})
        .varies();
}

function makeOfPrime(makeColumn) {
    return makeOf(makeColumn)
        .addAbove("o", {from: "o", silent: true})
        .varies(); // TODO is this supposed to be u above?
}

function makeOfPrimePrime(makeColumn) {
    return makeColumn("formen", {from: "f"})
        .addAbove("o", {from: "o"});
}

function makeThe(makeColumn) {
    return makeColumn("antoando", {from: "the"})
        .varies();
}

function makeThePrime(makeColumn) {
    return makeThe(makeColumn).addBelow("i-below", {from: ""})
        .varies();
}

function makeThePrimePrime(makeColumn) {
    return makeColumn("thule", {from: "th"}).addBelow("i-below", {from: "e", silent: true});
}

function makeOfThe(makeColumn) {
    return makeColumn("ampaumbar", {from: "of the"})
        .addTildeBelow({from: ""});
}

function makeAnd(makeColumn) {
    return makeColumn("ando", {from: "and"})
        .addTildeAbove({from: ""});
}

function makeAndPrime(makeColumn) {
    return makeAnd(makeColumn)
        .addBelow("i-below", {from: ""})
        .varies();
}

function makeAndPrimePrime(makeColumn) {
    return makeColumn("ando", {from: "d"})
        .addTildeAbove("n", {from: "n"})
        .addAbove("a", {from: "a"});
}

function parseColumn(callback, length, options, previous) {
    var font = options.font;
    var makeColumn = font.makeColumn;

    return parseTehta(function (tehta, tehtaFrom) {
        if (tehta === "y" && options.language === "english" && previous == null) {
            return callback([makeColumn("anna", {from: "y (initial)"})]);
        }
        return parseTengwa(function (column, tehta, tehtaFrom) {
            if (tehta) {
                if (options.reverseCurls) {
                    tehta = reverseCurls[tehta] || tehta;
                }
                if (options.swapDotSlash) {
                    tehta = swapDotSlash[tehta] || tehta;
                }
            }
            if (column) {
                if (tehta) {
                    if (column.tengwa === "silme" && tehta && options.sHook) {
                        return callback([
                            makeColumn("short-carrier", {from: ""})
                            .addAbove(tehta, {from: tehtaFrom})
                            .addBelow("s", {from: "s"})
                        ]);
                    } else if (tehta === "y") {
                        var columns = [column];
                        if (options.language === "english" && column.canAddAbove("y-english")) {
                            column.addAbove("y-english", {from: tehtaFrom});
                        } else if (column.canAddAbove("y-sindarin")) {
                            column.addAbove("y-sindarin", {from: tehtaFrom});
                        } else {
                            columns.push(makeColumn("anna", {from: "y"}));
                        }
                        return parseTengwaAnnotations(function (column) {
                            return callback(columns);
                        }, column, length, options);
                    } else if (canAddAboveTengwa(tehta) && column.canAddAbove(tehta)) {
                        column.addAbove(tehta, {from: tehtaFrom});
                        return parseTengwaAnnotations(function (column) {
                            return callback([column]);
                        }, column, length, options);
                    } else {
                        // some tengwar inherently lack space above them
                        // and cannot be reversed to make room.
                        // some long tehtar cannot be placed on top of
                        // a tengwa.
                        // put the previous tehta over the appropriate carrier
                        // then follow up with this tengwa.
                        return parseTengwaAnnotations(function (column) {
                            return callback([makeCarrier(tehta, tehtaFrom, options), column]);
                        }, column, length, options);
                    }
                } else {
                    return parseTengwaAnnotations(function (column) {
                        return callback([column]);
                    }, column, length, options);
                }
            } else if (tehta === "y") {
                var column;
                if (options.language === "english") {
                    column = makeColumn("short-carrier").addAbove("y-english", {from: "y"});
                } else {
                    column = makeColumn("short-carrier").addAbove("y-sindarin", {from: "y"});
                }
                return parseTengwaAnnotations(function (column) {
                    return callback([column]);
                }, column, length, options);
            } else if (tehta) {
                return parseTengwaAnnotations(function (carrier) {
                    return callback([carrier]);
                }, makeCarrier(tehta, tehtaFrom, options), length, options);
            } else {
                return function (character) {
                    if (Parser.isBreak(character)) {
                        return callback([])(character);
                    } else if (/\d/.test(character)) {
                        return parseNumber(callback, options)(character);
                    } else if (punctuation[character]) {
                        return callback([makeColumn(punctuation[character], {from: character})]);
                    } else {
                        return callback([
                            makeColumn("ure", {from: character})
                            .addError(
                                "Cannot transcribe " +
                                JSON.stringify(character) +
                                " in General Use Mode"
                            )
                        ]);
                    }
                };
            }
        }, options, tehta, tehtaFrom);
    }, options);

}

function makeCarrier(tehta, tehtaFrom, options) {
    var font = options.font;
    var makeColumn = font.makeColumn;
    if (tehta === "á") {
        return makeColumn("anna", {from: "a"})
            .addAbove("a", {from: "a"});
    } else if (shorterVowels[tehta]) {
        return makeColumn("long-carrier", {from: tehtaFrom})
            .addAbove(shorterVowels[tehta], {from: ""});
    } else {
        return makeColumn("short-carrier", {from: tehtaFrom})
            .addAbove(tehta, {from: ""});
    }
}

function parseTehta(callback, options) {
    return function (character) {
        if (character === "") {
            return callback();
        }

        var from = character;
        if (character === "ë" && options.language !== "english") {
            character = "e";
        }

        var caretIndex = caretVowels.indexOf(character);
        if (caretIndex !== -1) {
            character = acuteVowels[caretIndex];
        }

        var shortIndex = shortVowels.indexOf(character);
        if (shortIndex !== -1) {
            return function (nextCharacter) {
                // Doubling vowels as in the English word GREEN is generally
                // rendered orthographically, with two separate E tehtar.
                // However, in other languages, it is convenient to allow users
                // who do not have ready access to diacrtics on their keyboard
                // the ability to get a long vowel by doubling.
                if (options.language !== "english" && nextCharacter === character) { // doubled
                    return callback(acuteVowels[shortIndex], character + nextCharacter);
                } else {
                    return callback(character, from)(nextCharacter);
                }
            };
        } else if (nonLengthenableVowels.indexOf(character) !== -1) {
            return callback(character, from);
        } else {
            return callback()(from);
        }
    };
}

var caretVowels = "âêîôû";
var acuteVowels = "áéíóú";
var shortVowels = "aeiou";
var nonLengthenableVowels = "áéíóúy";
var tehtarThatCanBeAddedAbove = "aeiouóú";
var vowels = "aeëiouáéíóú";
var shorterVowels = {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u"};
var reverseCurls = {"o": "u", "u": "o", "ó": "ú", "ú": "ó"};
var swapDotSlash = {"i": "e", "e": "i"};

function canAddAboveTengwa(tehta) {
    return tehtarThatCanBeAddedAbove.indexOf(tehta) !== -1;
}

function parseTengwa(callback, options, tehta, tehtaFrom) {
    var font = options.font;
    var makeColumn = font.makeColumn;
    return function (character) {
        if (character === "n") {
            return function (character) {
                if (character === "n") { // nn
                    if (options.doubleNasalsWithTildeBelow) {
                        return callback(
                            makeColumn("numen", {from: "n"})
                                .addTildeBelow({from: "n"}),
                            tehta,
                            tehtaFrom
                        );
                    } else {
                        return callback(
                            makeColumn("numen", {from: "n"})
                                .addTildeAbove({from: "n"}),
                            tehta,
                            tehtaFrom
                        );
                    }
                } else if (character === "t") { // nt
                    return function (character) {
                        if (character === "h") { // nth
                            return callback(
                                makeColumn("thule", {from: "th"})
                                    .addTildeAbove({from: "n"}),
                                tehta,
                                tehtaFrom
                            );
                        } else { // nt.
                            return callback(
                                makeColumn("tinco", {from: "t"})
                                    .addTildeAbove({from: "n"}),
                                tehta,
                                tehtaFrom
                            )(character);
                        }
                    };
                } else if (character === "d") { // nd
                    return callback(makeColumn("ando", {from: "d"}).addTildeAbove({from: "n"}), tehta, tehtaFrom);
                } else if (character === "c" || character === "k") { // nc -> ñc
                    return callback(makeColumn("quesse", {from: character}).addTildeAbove({from: "ñ"}), tehta, tehtaFrom);
                } else if (character === "g") { // ng -> ñg
                    return callback(makeColumn("ungwe", {from: "g"}).addTildeAbove({from: "ñ"}), tehta, tehtaFrom);
                } else if (character === "j") { // nj
                    return callback(makeColumn("anca", {from: "j"}).addTildeAbove({from: "n"}), tehta, tehtaFrom);
                } else if (character === "f") { // nf -> nv
                    return callback(makeColumn("numen", {from: "n"}), tehta, tehtaFrom)("v");
                } else  if (character === "w") { // nw -> ñw
                    return function (character) {
                        if (character === "a") { // nwa
                            return function (character) { // nwal
                                if (character === "l") {
                                    return callback(makeColumn("nwalme", {from: "n"}).addAbove("w", {from: "w"}), tehta, tehtaFrom)("a")(character);
                                } else { // nwa.
                                    return callback(makeColumn("numen", {from: "n"}).addAbove("w", {from: "w"}), tehta, tehtaFrom)("a")(character);
                                }
                            };
                        } else if (character === "nw`") { // nw/ prime -> ñw
                            return callback(makeColumn("nwalme", {from: "ñ"}).addAbove("w", {from: "w"}), tehta, tehtaFrom);
                        } else { // nw.
                            return callback(makeColumn("numen", {from: "n"}).addAbove("w", {from: "w"}), tehta, tehtaFrom)(character);
                        }
                    };
                } else { // n.
                    return callback(makeColumn("numen", {from: "n"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "m") { // m
            return function (character) {
                if (character === "m") { // mm
                    if (options.doubleNasalsWithTildeBelow) {
                        return callback(makeColumn("malta", {from: "m"}).addTildeBelow({from: "m"}), tehta, tehtaFrom);
                    } else {
                        return callback(makeColumn("malta", {from: "m"}).addTildeAbove({from: "m"}), tehta, tehtaFrom);
                    }
                } else if (character === "p") { // mp
                    return callback(makeColumn("parma", {from: "p"}).addTildeAbove({from: "m"}), tehta, tehtaFrom);
                } else if (character === "b") { // mb
                    return callback(makeColumn("umbar", {from: "b"}).addTildeAbove({from: "m"}), tehta, tehtaFrom);
                } else if (character === "f") { // mf
                    return callback(makeColumn("formen", {from: "f"}).addTildeAbove({from: "m"}), tehta, tehtaFrom);
                } else if (character === "v") { // mv
                    return callback(makeColumn("ampa", {from: "v"}).addTildeAbove({from: "m"}), tehta, tehtaFrom);
                } else { // m.
                    return callback(makeColumn("malta", {from: "m"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "ñ") { // ñ
            return function (character) {
                // ññ does not exist to the best of my knowledge
                // ñw is handled naturally by following w
                if (character === "c" || character === "k") { // ñc
                    return callback(makeColumn("quesse", {from: character}).addTildeAbove({from: "ñ"}), tehta, tehtaFrom);
                } else if (character === "g") { // ñg
                    return callback(makeColumn("ungwe", {from: "g"}).addTildeAbove({from: "ñ"}), tehta, tehtaFrom);
                } else { // ñ.
                    return callback(makeColumn("nwalme", {from: "ñ"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "t") { // t
            return function (character) {
                if (character === "t") { // tt
                    return callback(makeColumn("tinco", {from: "t"}).addTildeBelow({from: "t"}), tehta, tehtaFrom);
                } else if (character === "h") { // th
                    return callback(makeColumn("thule", {from: "th"}), tehta, tehtaFrom);
                } else if (character === "c") { // tc
                    return function (character) {
                        if (character === "h") { // tch -> tinco calma
                            return callback(makeColumn("tinco", {from: "t"}), tehta, tehtaFrom)("c")("h")("`");
                        } else {
                            return callback(makeColumn("tinco", {from: "t"}), tehta, tehtaFrom)("c")(character);
                        }
                    };
                } else if (character === "s" && options.tsdz) { // ts
                    return callback(makeColumn("calma", {from: "ts"}), tehta, tehtaFrom);
                } else { // t.
                    return callback(makeColumn("tinco", {from: "t"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "p") { // p
            return function (character) {
                if (character === "p") { // pp
                    return callback(makeColumn("parma", {from: "p"}).addTildeBelow({from: "p"}), tehta, tehtaFrom);
                } else if (character === "h") { // ph
                    return Parser.countPrimes(function (primes) {
                        var column;
                        if (primes === 0) {
                            column = makeColumn("formenparma", {from: "ph"}).varies();
                        } else if (primes >= 1) {
                            column = makeColumn("formen", {from: "ph"});
                        }
                        if (primes > 1) {
                            column.addError("PH cluster only has two alternate representations.");
                        }
                        return callback(column, tehta, tehtaFrom);
                    });
                } else { // p.
                    return callback(makeColumn("parma", {from: "p"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "c") {
            return function (character2) {
                if (character2 == "h" && options.language !== "english") {
                    return callback(makeColumn("hwesta", {from: character + character2}), tehta, tehtaFrom);
                } else if (character2 === "k") {
                    return callback(makeColumn("quesse", {from: character2}).addTildeBelow({from: character}), tehta, tehtaFrom);
                } else if (character2 === "h" || character2 === "c") { // ch and cc
                    return callback(makeColumn("calma", {from: character + character2}), tehta, tehtaFrom);
                } else { // c.
                    return callback(makeColumn("quesse", {from: character}), tehta, tehtaFrom)(character2);
                }
            };
        } else if (character === "k") {
            return function (character2) {
                if (character2 === "h") { // kh is ach laut
                    if (!options.noAchLaut) {
                        return callback(makeColumn("hwesta", {from: character + character2}), tehta, tehtaFrom);
                    } else { // kh is just k
                        return callback(makeColumn("quesse", {from: character}), tehta, tehtaFrom);
                    }
                } else { // c. or k.
                    return callback(makeColumn("quesse", {from: character}), tehta, tehtaFrom)(character2);
                }
            };
        } else if (character === "q") {
            return callback(makeColumn("quesse", {from: character}), tehta, tehtaFrom);
        } else if (character === "x") {
            return callback(makeColumn("quesse", {from: "x (k-)"}).addBelow("s", {from: "x (-s)"}), tehta, tehtaFrom);
        } else if (character === "d") {
            return function (character) {
                if (character === "d") { // dd
                    return callback(makeColumn("ando", {from: "d"}).addTildeBelow({from: "d"}), tehta, tehtaFrom);
                } else if (character === "j") { // dj
                    return callback(makeColumn("anga", {from: "dj"}), tehta, tehtaFrom);
                } else if (character === "z" && options.tsdz) { // dz
                    // TODO annotate dz to indicate that options.tsdz affects this cluster
                    return callback(makeColumn("anga", {from: "dz"}), tehta, tehtaFrom);
                } else if (character === "h") { // dh
                    return callback(makeColumn("anto", {from: "dh"}), tehta, tehtaFrom);
                } else { // d.
                    return callback(makeColumn("ando", {from: "d"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "b") { // b
            return function (character) {
                if (character === "b") { // bb
                    return callback(makeColumn("umbar", {from: "b"}).addTildeBelow({from: "b"}), tehta, tehtaFrom);
                } else { // b.
                    return callback(makeColumn("umbar", {from: "b"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "g") { // g
            return function (character) {
                if (character === "g") { // gg
                    return callback(makeColumn("ungwe", {from: "g"}).addTildeBelow({from: "g"}), tehta, tehtaFrom);
                } else if (character === "h") { // gh
                    if (options.language === "black-speech") {
                        return callback(makeColumn("unqueungwe", {from: "gh"}), tehta, tehtaFrom);
                    } else {
                        return callback(makeColumn("unque", {from: "gh"}), tehta, tehtaFrom);
                    }
                } else { // g.
                    return callback(makeColumn("ungwe", {from: "g"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "f") { // f
            return function (character) {
                if (character === "f") { // ff
                    return callback(makeColumn("formen", {from: "f"}).addTildeBelow({from: "f"}), tehta, tehtaFrom);
                } else { // f.
                    return callback(makeColumn("formen", {from: "f"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "v") { // v
            return callback(makeColumn("ampa", {from: "v"}), tehta, tehtaFrom);
        } else if (character === "j") { // j
            if (options.language === 'english') {
                return Parser.countPrimes(function (primes) {
                    if (primes === 0) {
                        return callback(makeColumn("anga", {from: "j"}).varies(), tehta, tehtaFrom); //HH Changed anca to anga
                    } else {
                        var column = callback(makeColumn("anca", {from: "j"}), tehta, tehtaFrom);
                        if (primes > 1) {
                            column.addError("J only has two English variants: 1. anga, as pronounced in JACK and 2. anca , as pronounced in measure.");
                        }
                        return column;
                    }
                });
            } else {
                return callback(makeColumn("anca", {from: "j"}), tehta, tehtaFrom);
            }
        } else if (character === "s") { // s
            return function (character) {
                if (character === "s") { // ss
                    return Parser.countPrimes(function (primes) {
                        var tengwa = primes > 0 ? "silme-nuquerna" : "silme";
                        var tengwaFrom = primes > 0 ? "s′" : "s";
                        var column = makeColumn(tengwa, {from: tengwaFrom}).addTildeBelow({from: "s"});
                        if (primes === 0) {
                            column.varies();
                        }
                        if (primes > 1) {
                            column.addError("Silme does not have this many alternate forms.");
                        }
                        return callback(column, tehta, tehtaFrom);
                    });
                } else if (character === "h") { // sh
                    if (options.language === "black-speech") {
                        return callback(makeColumn("harmacalma", {from: "sh"}), tehta, tehtaFrom);
                    } else {
                        return callback(makeColumn("harma", {from: "sh"}), tehta, tehtaFrom);
                    }
                } else { // s.
                    return Parser.countPrimes(function (primes) {
                        var tengwa = primes > 0 ? "silme-nuquerna" : "silme";
                        var tengwaFrom = primes > 0 ? "s′" : "s";
                        var column = makeColumn(tengwa, {from: tengwaFrom});
                        if (primes === 0) {
                            column.varies();
                        }
                        if (primes > 1) {
                            column.addError("Silme does not have this many alternate forms.");
                        }
                        return callback(column, tehta, tehtaFrom);
                    })(character);
                }
            };
        } else if (character === "z") { // z
            return function (character) {
                if (character === "z") { // zz
                    return Parser.countPrimes(function (primes) {
                        var tengwa = primes > 0 ? "esse-nuquerna" : "esse";
                        var column = makeColumn(tengwa, {from: "z"}).addTildeBelow({from: "z"});
                        if (primes === 0) {
                            column.varies();
                        }
                        if (primes > 1) {
                            column.addError("Esse does not have this many alternate forms.");
                        }
                        return callback(column, tehta, tehtaFrom);
                    });
                } else { // z.
                    return Parser.countPrimes(function (primes) {
                        var tengwa = primes > 0 ? "esse-nuquerna" : "esse";
                        var column = makeColumn(tengwa, {from: "z"});
                        if (primes === 0) {
                            column.varies();
                        }
                        if (primes > 1) {
                            column.addError("Silme does not have this many alternate forms.");
                        }
                        return callback(column, tehta, tehtaFrom);
                    })(character);
                }
            };
        } else if (character === "h") { // h
            return function (character) {
                if (character === "w") { // hw
                    return callback(makeColumn("hwesta-sindarinwa", {from: "hw"}), tehta, tehtaFrom);
                } else { // h.
                    return callback(makeColumn("hyarmen", {from: "h"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "r") { // r
            return function (character) {
                if (character === "r") { // rr
                    return callback(makeColumn("romen", {from: "r"}).addTildeBelow({from: "r"}), tehta, tehtaFrom);
                } else if (character === "h") { // rh
                    return callback(makeColumn("arda", {from: "rh"}), tehta, tehtaFrom);
                } else if (
                    Parser.isFinal(character) || (
                        options.medialOre &&
                        vowels.indexOf(character) === -1
                    )
                ) { // r final (optionally r before consonant)
                    return callback(makeColumn("ore", {from: "r", final: true}), tehta, tehtaFrom)(character);
                } else { // r.
                    return callback(makeColumn("romen", {from: "r"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "l") {
            return function (character) {
                if (character === "l") { // ll
                    return callback(makeColumn("lambe", {from: "l"}).addTildeBelow({from: "l"}), tehta, tehtaFrom);
                } else if (character === "h") { // lh
                    return callback(makeColumn("alda", {from: "lh"}), tehta, tehtaFrom);
                } else { // l.
                    return callback(makeColumn("lambe", {from: "l"}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "i") { // i
            return callback(makeColumn("anna", {from: "i", diphthong: true}), tehta, tehtaFrom);
        } else if (character === "u") { // u
            return callback(makeColumn("vala", {from: "u", diphthong: true}), tehta, tehtaFrom);
        } else if (character === "w") { // w
            return function (character) {
                if (character === "h") { // wh
                    return callback(makeColumn("hwesta-sindarinwa", {from: "wh"}), tehta, tehtaFrom);
                } else { // w.
                    return callback(makeColumn("vala", {from: "w", dipththong: true}), tehta, tehtaFrom)(character);
                }
            };
        } else if (character === "e" && (!tehta || tehta === "a")) { // ae or e after consonants
            return callback(makeColumn("yanta", {from: "e", diphthong: true}), tehta, tehtaFrom);
        } else if (character === "e" && (!tehta || tehta === "i")) { // ie or e after consonants
            return callback(makeColumn("yanta", {from: "e", diphthong: true}), tehta, tehtaFrom);
        } else if (character === "e" && (!tehta || tehta === "o")) { // oe or e after consonants
            return callback(makeColumn("yanta", {from: "e", diphthong: true}), tehta, tehtaFrom);
        } else if (character === "ë") { // if "ë" makes it this far, it's a diaresis for english
            return callback(makeColumn("short-carrier", {from: ""}).addAbove("e", {from: "e"}));
        } else if (character === "y") {
            return Parser.countPrimes(function (primes) {
                if (primes === 0) {
                  return callback(makeColumn("anna", {from: ""}), tehta, tehtaFrom);
                  // 21-9-19 HH edit return callback(makeColumn("wilya", {from: ""}).addBelow("y", {from: "y"}), tehta, tehtaFrom);
                } else if (primes === 1) {
                    return callback(makeColumn("long-carrier", {from: "y"}).addAbove("i", {from: ""}), tehta, tehtaFrom);
                } else {
                    return callback(makeColumn("ure", {from: "y"}).addError("Consonantal Y only has one variation"));
                }
            });
        } else if (shorterVowels[character]) {
            return callback(
                makeCarrier(character, character, options)
                    .addAbove(shorterVowels[character], {from: ""}),
                tehta,
                tehtaFrom
            );
        } else if (character === "`" && options.language === "english" && tehta === "e") {
            return function (character2) {
                if (character2 === "") {
                    // final e` in english should be equivalent to diaresis.
                    // tehta deliberately consumed in this case, not passed forward.
                    return callback(
                        makeColumn("short-carrier", {from: ""})
                            .addAbove("e", {from: "e"})
                    );
                } else {
                    // tehta deliberately consumed in this case, not passed forward.
                    return callback(
                        makeColumn("short-carrier", {from: ""})
                            .addBelow("i-below", {from: "e", silent: true})
                    )(character)(character2);
                }
            };
        } else if (character === "" && options.language === "english" && tehta === "e") {
            // tehta deliberately consumed in this case, not passed forward.
            return callback(
                makeColumn("short-carrier", {from: ""})
                    .addBelow("i-below", {from: "e", silent: true})
            )(character);
        } else {
            return callback(null, tehta, tehtaFrom)(character);
        }
    };
}

exports.parseTengwaAnnotations = parseTengwaAnnotations;
function parseTengwaAnnotations(callback, column, length, options) {
    return parseFollowingAbove(function (column) {
        return parseFollowingBelow(function (column) {
            return parseFollowing(callback, column);
        }, column, length, options);
    }, column);
}

// add a following-w above the current character if the next character is W and
// there is room for it.
function parseFollowingAbove(callback, column) {
    if (column.canAddAbove("w", "w")) {
        return function (character) {
            if (character === "w") {
                return callback(column.addAbove("w", {from: "e"}));
            } else {
                return callback(column)(character);
            }
        };
    } else {
        return callback(column);
    }
}

function parseFollowingBelow(callback, column, length, options) {
    return function (character) {
        if (character === "ë" && options.language !== "english") {
            character = "e";
        }
        if (options.language === "english" && character === "y" && column.canAddAbove("y-english")) {
            return callback(column.addAbove("y-english", {from: "y"}));
        } else if (character === "y" && column.canAddAbove("y-sindarin")) {
            return callback(column.addAbove("y-sindarin", {from: "y"}));
        } else if (character === "e" && column.canAddBelow("i-below")) {
            return Parser.countPrimes(function (primes) {
                return function (character) {
                    if (Parser.isFinal(character) && options.language === "english" && length > 2) {
                        if (primes === 0) {
                            return callback(
                                column.addBelow("i-below", {from: "e", silent: true})
                                    .varies()
                            )(character);
                        } else {
                            if (primes > 1) {
                                column.addError("Following E has only one variation.");
                            }
                            return callback(column)("e")(character);
                        }
                    } else {
                        if (primes === 0) {
                            return callback(column.varies())("e")(character);
                        } else {
                            if (primes > 1) {
                                column.addError("Following E has only one variation.");
                            }
                            return callback(column.addBelow("i-below", {from: "e", eilent: true}))(character);
                        }
                    }
                };
            });
        } else {
            return callback(column)(character);
        }
    };
}

function parseFollowing(callback, column) {
    return function (character) {
        if (character === "s") {
            if (column.canAddBelow("s")) {
                return Parser.countPrimes(function (primes, rewind) {
                    if (primes === 0) {
                        return callback(column.addBelow("s", {from: "s"}).varies());
                    } else if (primes) {
                        if (primes > 1) {
                            column.addError("Only one alternate form for following S.");
                        }
                        return rewind(callback(column)("s"));
                    }
                });
            } else {
                return Parser.countPrimes(function (primes, rewind) {
                    return function (character) {
                        if (Parser.isFinal(character)) { // end of word
                            if (column.canAddFollowing("s-final") && primes-- === 0) {
                                column.addFollowing("s-final", {from: "s"});
                            } else if (column.canAddFollowing("s-inverse") && primes -- === 0) {
                                column.addFollowing("s-inverse", {from: "s"});
                                if (column.canAddFollowing("s-final")) {
                                    column.varies();
                                }
                            } else if (column.canAddFollowing("s-extended") && primes-- === 0) {
                                column.addFollowing("s-extended", {from: "s"});
                                if (column.canAddFollowing("s-inverse")) {
                                    column.varies();
                                }
                            } else if (column.canAddFollowing("s-flourish") && primes-- === 0) {
                                column.addFollowing("s-flourish", {from: "s"});
                                if (column.canAddFollowing("s-extended")) {
                                    column.varies();
                                }
                            } else {
                                // rewind primes for subsequent alterations
                                var state = callback(column)("s");
                                while (primes-- > 0) {
                                    state = state("`");
                                }
                                return state(character);
                            }
                            return callback(column)(character);
                        } else {
                            return rewind(callback(column)("s"))(character);
                        }
                    };
                });
            }
        } else {
            return callback(column)(character);
        }
    };
}


},{"./document-parser":6,"./notation":9,"./numbers":10,"./parser":11,"./punctuation":12,"./tengwar-annatar":13}],9:[function(require,module,exports){
"use strict";

exports.encode = encode;
function encode(sections) {
    return sections.map(function (section) {
        return section.map(function (paragraph) {
            return paragraph.map(function (line) {
                return line.map(function (word) {
                    return word.map(function (column) {
                        var parts = [];
                        if (column.above)
                            parts.push(column.above);
                        if (column.below)
                            parts.push(column.below);
                        if (column.following)
                            parts.push(column.following);
                        if (column.tildeAbove)
                            parts.push("tilde-above");
                        if (column.tildeBelow)
                            parts.push("tilde-below");
                        if (parts.length) {
                            return column.tengwa + ":" + parts.join(",");
                        } else {
                            return column.tengwa;
                        }
                    }).join(";");
                }).join(" ");;
            }).join("\n");
        }).join("\n\n");
    }).join("\n\n\n");
}

exports.decode = decode;
function decode(encoding, makeColumn) {
    return encoding.split("\n\n\n").map(function (section) {
        return section.split("\n\n").map(function (paragraph) {
            return paragraph.split("\n").map(function (line) {
                return line.split(" ").map(function (word) {
                    return decodeWord(word, makeColumn);
                });
            });
        });
    });
}

exports.decodeWord = decodeWord;
function decodeWord(word, makeColumn) {
    return word.split(";").map(function (column) {
        var parts = column.split(":");
        var tengwa = parts.shift();
        var tehtar = parts.length ? parts.shift().split(",") : [];
        var result = makeColumn(tengwa);
        tehtar.forEach(function (tehta) {
            if (tehta === "tilde-above") {
                result.addTildeAbove();
            } else if (tehta === "tilde-below") {
                result.addTildeBelow();
            } else if (tehta === "y-quenya") {
                result.addBelow("y-quenya");
            } else if (tehta === "y-sindarin") {
                result.addAbove("y-sindarin");
            } else if (tehta === "y-english") {
                result.addAbove("y-english");
            } else if (
                tehta === "s" ||
                tehta === "s-inverse" ||
                tehta === "s-extended" ||
                tehta === "s-flourish"
            ) {
                if (
                    tehta === "s" &&
                    (tengwa === "calma" || tengwa === "quesse")
                ) {
                    result.addBelow(tehta, "s");
                } else {
                    result.addFollowing(tehta, "s");
                }
            } else {
                result.addAbove(tehta, "s");
            }
        });
        return result;
    });
}


},{}],10:[function(require,module,exports){
"use strict";

var Parser = require("./parser");

var array_ = Array.prototype;

module.exports = parseNumber;
function parseNumber(callback, options) {
    return parseDigits(function (digits) {
        if (digits) {
            return parseConvert(callback, digits.join(""), options);
        } else {
            return callback();
        }
    });
}

var digits = "0123456789";
var parseDigit = function (callback) {
    return function (character) {
        if (character !== "" && digits.indexOf(character) !== -1) {
            return callback(character);
        } else {
            return callback()(character);
        }
    };
};

function parseConvert(callback, number, options) {
    return Parser.countPrimes(function (primes) {
        return callback(convert(number, primes, options));
    });
}

function convert(string, alt, options) {
    var error;
    var radix;
    var duodecimal = options.duodecimal;
    var font = options.font;
    var makeColumn = font.makeColumn;
    if (alt == 0) {
        radix = duodecimal ? 12 : 10;
    } else {
        radix = duodecimal ? 10 : 12;
        error = alt > 1;
    }
    var number = parseInt(string, 10);
    var string = number.toString(radix).split("");
    return string.map(function (character) {
        var column = makeColumn(""+parseInt(character, 12));
        if (error) {
            column.addError("Numbers can only be parsed in either decimal or dudecimal.");
        }
        return column;
    });
}

var parseDigits = Parser.makeParseSome(parseDigit);


},{"./parser":11}],11:[function(require,module,exports){
"use strict";

var punctuation = require("./punctuation");

// builds a string parser from a streaming character parser
exports.makeParser = makeParser;
function makeParser(production, errorHandler) {
    var errorHandler = errorHandler || function (error, text) {
        throw new Error(error + " while parsing " + JSON.stringify(text));
    };
    return function (text /*, ...args*/) {
        // the parser is a monadic state machine.
        // each state is represented by a function that accepts
        // a character.  parse functions accept a callback (for forwarding the
        // result) and return a state.
        text = text.trim();
        var result;
        var state = production.apply(null, [function (_result) {
            result = _result;
            return expectEof(function (error) {
                return errorHandler(error, text);
            });
        }].concat(Array.prototype.slice.call(arguments, 1)));
        // drive the state machine
        Array.prototype.forEach.call(text, function (letter, i) {
            state = state(letter);
        });
        // break break break
        while (!result) {
            state = state(""); // EOF
        }
        return result;
    };
}

function expectEof(errback) {
    return function (character) {
        if (character !== "") {
            errback("Unexpected " + JSON.stringify(character));
        }
        return function noop() {
            return noop;
        };
    };
}

exports.makeExpect = makeExpect;
function makeExpect(expected) {
    return function (callback) {
        return function (character) {
            if (character === expected) {
                return callback(character);
            } else {
                return callback()(character);
            }
        };
    };
}

exports.makeParseSome = makeParseSome;
function makeParseSome(parseOne) {
    var parseSome = function (callback) {
        return parseOne(function (one) {
            if (one != null) {
                return parseRemaining(callback, [one]);
            } else {
                return callback([]);
            }
        });
    };
    var parseRemaining = makeParseAny(parseOne);
    return parseSome;
}

exports.makeParseAny = makeParseAny;
function makeParseAny(parseOne) {
    return function parseRemaining(callback, any) {
        any = any || [];
        return parseOne(function (one) {
            if (one != null) {
                return parseRemaining(callback, any.concat([one]));
            } else {
                return callback(any);
            }
        });
    };
}

exports.makeDelimitedParser = makeDelimitedParser;
function makeDelimitedParser(parsePrevious, parseDelimiter) {
    return function parseSelf(callback, options, terms) {
        terms = terms || [];
        return parsePrevious(function (term) {
            if (!term.length) {
                return callback(terms);
            } else {
                terms = terms.concat([term]);
                return parseDelimiter(function (delimiter) {
                    if (delimiter) {
                        return parseSelf(callback, options, terms);
                    } else {
                        return callback(terms);
                    }
                });
            }
        }, options);
    }
}

// used by parsers to determine whether the cursor is on a word break
exports.isBreak = isBreak;
function isBreak(character) {
    return character === " " || character === "\n" || character === "";
}

exports.isFinal = isFinal;
function isFinal(character) {
    return isBreak(character) || punctuation[character];
}

// used by multiple modes
exports.countPrimes = countPrimes;
function countPrimes(callback, primes, rewind) {
    primes = primes || 0;
    rewind = rewind || function (state) {
        return state;
    };
    return function (character) {
        if (character === "`") {
            return countPrimes(callback, primes + 1, function (state) {
                return rewind(state)("`");
            });
        } else {
            return callback(primes, rewind)(character);
        }
    };
}


},{"./punctuation":12}],12:[function(require,module,exports){
"use strict";

module.exports = {
    "-": "hyphen",
    "'": "apostrophe",
    ",": "comma",
    ":": "colon",
    ";": "semi-colon",
    ".": "full-stop",
    "!": "exclamation-point",
    "?": "question-mark",
    "(": "open-paren",
    ")": "close-paren",
    "[": "open-bracket",
    "]": "close-bracket",
    ">": "flourish-left",
    "<": "flourish-right"
};


},{}],13:[function(require,module,exports){
"use strict";

var Alphabet = require("./alphabet");
var Bindings = require("./dan-smith");
var makeFontColumn = require("./column");

var tengwar = exports.tengwar = {
    ...Bindings.tengwar,
    "open-paren": "Œ", // alt "&#140;",
    "close-paren": "œ", // alt "&#156;",
};
var tehtar = exports.tehtar = Bindings.tehtar;

// The malta in tengwar annatar has a slightly upward curl on the baseline that
// prevents it from combining gracefully with the final sa-rince.
tehtar["s-final"].malta = null;

var positions = exports.positions = {

    "tinco": {
        "o": 3,
        "w": 3,
        "others": 2
    },
    "parma": {
        "o": 3,
        "w": 3,
        "others": 2
    },
    "calma": {
        "o": 3,
        "w": 3,
        "u": 3,
        "o-below": 1,
        "others": 2
    },
    "quesse": {
        "o": 3,
        "w": 3,
        "o-below": 1,
        "others": 2
    },

    "ando": {
        "wide": true,
        "e": 1,
        "o": 2,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "umbar": {
        "wide": true,
        "e": 1,
        "o": 2,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "anga": {
        "wide": true,
        "e": 1,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "ungwe": {
        "wide": true,
        "e": 1,
        "o": 1,
        "ó": 1,
        "ú": 1,
        "others": 0
    },

    "thule": {
        "others": 3
    },
    "formen": 3,
    "harma": {
        "e": 0,
        "o": 3,
        "u": 7,
        "ó": 2,
        "ú": 2,
        "w": 0,
        "others": 1
    },
    "hwesta": {
        "e": 0,
        "o": 3,
        "u": 7,
        "w": 0,
        "others": 1
    },

    "anto": {
        "wide": true,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "ampa": {
        "wide": true,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "anca": {
        "wide": true,
        "u": 7,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "unque": {
        "wide": true,
        "u": 7,
        "others": 0
    },

    "numen": {
        "wide": true,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "malta": {
        "wide": true,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "noldo": {
        "wide": true,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "nwalme": {
        "wide": true,
        "ó": 1,
        "ú": 1,
        "others": 0
    },

    "ore": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 3,
        "ú": 3,
        "others": 1
    },
    "vala": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 3,
        "ú": 3,
        "others": 1
    },
    "anna": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 2,
        "ú": 2,
        "others": 1
    },
    "wilya": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 3,
        "ú": 3,
        "others": 1
    },

    "romen": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 2,
        "ú": 2,
        "y-quenya": 3,
        "o-below": null,
        "i-below": 3,
        "others": 1
    },
    "arda": {
        "a": 1,
        "e": 3,
        "i": 1,
        "o": 3,
        "u": 3,
        "í": 1,
        "ó": 2,
        "ú": 2,
        "y-quenya": 3,
        "o-below": null,
        "i-below": 3,
        "others": 0
    },
    "lambe": {
        "wide": true,
        "e": 1,
        "y-quenya": 4,
        "ó": 1,
        "ú": 1,
        "o-below": null,
        "i-below": 4,
        "others": 0
    },
    "alda": {
        "wide": true,
        "o-below": null,
        "others": 1
    },

    "silme": {
        "y-quenya": 3,
        "o-below": 2,
        "i-below": 2,
        "others": null
    },
    "silme-nuquerna": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 3,
        "ú": 3,
        "y-quenya": null,
        "o-below": null,
        "i-below": null,
        "others": 1
    },
    "esse": {
        "y-quenya": null,
        "others": null
    },
    "esse-nuquerna": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 3,
        "ú": 3,
        "others": 1
    },

    "hyarmen": 3,
    "hwesta-sindarinwa": {
        "o": 2,
        "u": 2,
        "ó": 1,
        "ú": 2,
        "others": 0
    },
    "yanta": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 2,
        "ú": 2,
        "others": 1
    },
    "ure": {
        "e": 3,
        "o": 3,
        "u": 3,
        "ó": 3,
        "ú": 3,
        "others": 1
    },

    // should not occur:
    "halla": {
        "i-below": 3,
        "others": null
    },
    "short-carrier": 3,
    "long-carrier": {
        "y-quenya": null,
        "o-below": null,
        "i-below": null,
        "others": 3
    },
    "round-carrier": 3,

    "thuletinco": 3,
    "formenparma": 3,
    "harmacalma": {
        "o": 3,
        "u": 7,
        "ó": 2,
        "ú": 2,
        "others": 1
    },
    "hwestaquesse": {
        "o": 0,
        "u": 7,
        "others": 1
    },

    "antoando": {
        "wide": true,
        "e": 1,
        "o": 2,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "ampaumbar": {
        "wide": true,
        "e": 1,
        "o": 2,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "ancaanga": {
        "wide": true,
        "e": 1,
        "ó": 1,
        "ú": 1,
        "others": 0
    },
    "unqueungwe": {
        "wide": true,
        "e": 1,
        "o": 1,
        "ó": 1,
        "ú": 1,
        "others": 0
    }
};

exports.transcribe = transcribe;
function transcribe(sections, options) {
    options = options || {};
    var block = options.block || false;
    var beginParagraph = block ? "<p>" : "";
    var delimitParagraph = "<br>";
    var endParagraph = block ? "</p>" : "";
    return sections.map(function (section) {
        return section.map(function (paragraph) {
            return beginParagraph + paragraph.map(function (line) {
                return line.map(function (word) {
                    return word.map(function (column) {
                        return transcribeColumn(column, options);
                    }).join("");
                }).join(" ");;
            }).join(delimitParagraph + "\n") + endParagraph;
        }).join("\n\n");
    }).join("\n\n\n");
}

exports.transcribeColumn = transcribeColumn;
function transcribeColumn(column, options) {
    options = options || {};
    var plain = options.plain || false;
    var tengwa = column.tengwa || "anna";
    var tehtar = [];
    if (column.above) tehtar.push(column.above);
    if (column.below) tehtar.push(column.below);
    if (column.tildeBelow) tehtar.push("tilde-below");
    if (column.tildeAbove) tehtar.push("tilde-above");
    if (column.following) tehtar.push(column.following);
    var html = tengwar[tengwa] + tehtar.map(function (tehta) {
        return tehtaForTengwa(tengwa, tehta);
    }).join("");
    if (column.errors && !plain) {
        html = "<abbr class=\"error\" title=\"" + column.errors.join("\n").replace(/"/g, "&quot;") + "\">" + html + "</abbr>";
    }
    return html;
}

exports.tehtaForTengwa = tehtaForTengwa;
function tehtaForTengwa(tengwa, tehta) {
    var tehtaKey = tehtaKeyForTengwa(tengwa, tehta);
    if (tehtaKey == null)
        return null;
    return (
        tehtar[tehta][tengwa] ||
        tehtar[tehta][tehtaKey] ||
        ""
    );
}

function tehtaKeyForTengwa(tengwa, tehta) {
    if (!tehtar[tehta])
        return null;
    if (tehtar[tehta].special)
        return tehtar[tehta][tengwa] || null;
    if (Alphabet.barsAndTildes.indexOf(tehta) !== -1) {
        if (tengwa === "lambe" || tengwa === "alda" && tehtar[tehta].length >= 2)
            return 2;
        return positions[tengwa].wide ? 0 : 1;
    }
    if (positions[tengwa] == null)
        return null;
    if (positions[tengwa][tehta] === null)
        return null;
    if (positions[tengwa][tehta] != null)
        return positions[tengwa][tehta];
    if (positions[tengwa].others != null)
        return positions[tengwa].others;
    return positions[tengwa];
}

exports.makeColumn = makeColumn;
function makeColumn(tengwa, tengwarFrom) {
    return makeFontColumn(exports, tengwa, tengwarFrom);
}


},{"./alphabet":1,"./column":4,"./dan-smith":5}],14:[function(require,module,exports){
"use strict";

var Alphabet = require("./alphabet");
var Bindings = require("./dan-smith");
var makeFontColumn = require("./column");

var tengwar = exports.tengwar = {
    ...Bindings.tengwar,
    "open-paren": "=",
    "close-paren": "=",
};
var tehtar = exports.tehtar = Bindings.tehtar;

var positions = exports.positions = {

    "tinco": 2,
    "parma": 2,
    "calma": {
        "y-quenya": 1,
        "o-below": 1,
        "others": 2
    },
    "quesse": {
        "y-quenya": 1,
        "o-below": 1,
        "others": 2
    },

    "ando": {
        "wide": true,
        "others": 0
    },
    "umbar": {
        "wide": true,
        "others": 0
    },
    "anga": {
        "wide": true,
        "others": 0
    },
    "ungwe": {
        "wide": true,
        "others": 0
    },

    "thule": {
        "a": 3,
        "w": 3,
        "y-sindarin": 3,
        "others": 2
    },
    "formen": {
        "a": 3,
        "w": 3,
        "í": 3,
        "y-sindarin": 3,
        "others": 2
    },
    "harma": {
        "a": 0,
        "e": 0,
        "w": 0,
        "í": 0,
        "y-sindarin": 0,
        "others": 1
    },
    "hwesta": {
        "a": 0,
        "e": 0,
        "w": 0,
        "y-sindarin": 0,
        "others": 1
    },

    "anto": {
        "wide": true,
        "others": 0
    },
    "ampa": {
        "wide": true,
        "others": 0
    },
    "anca": {
        "wide": true,
        "others": 0
    },
    "unque": {
        "wide": true,
        "others": 0
    },

    "numen": {
        "wide": true,
        "others": 0
    },
    "malta": {
        "wide": true,
        "others": 0
    },
    "noldo": {
        "wide": true,
        "others": 0
    },
    "nwalme": {
        "wide": true,
        "others": 0
    },

    "ore": {
        "a": 1,
        "e": 2,
        "i": 1,
        "o": 2,
        "u": 3,
        "others": 1
    },
    "vala": {
        "a": 1,
        "e": 2,
        "i": 2,
        "o": 2,
        "w": 1,
        "y-quenya": 1,
        "y-sindarin": 2,
        "y-english": 2,
        "í": 2,
        "i-below": 1,
        "others": 3
    },
    "anna": {
        "a": 1,
        "w": 3,
        "others": 2
    },
    "wilya": {
        "i": 2,
        "í": 2,
        "y-english": 2,
        "y-sindarin": 2,
        "others": 1
    },

    "romen": {
        "a": 1,
        "e": 1,
        "i": 2,
        "o": 1,
        "u": 1,
        "y-quenya": 3,
        "o-below": null,
        "i-below": 3,
        "others": 1
    },
    "arda": {
        "a": 1,
        "e": 1,
        "i": 2,
        "o": 1,
        "u": 1,
        "w": 1,
        "í": 2,
        "y-quenya": 3,
        "y-sindarin": 2,
        "y-english": 2,
        "o-below": null,
        "i-below": 3,
        "others": 0
    },
    "lambe": {
        "wide": true,
        "e": 1,
        "y-quenya": 4,
        "w": 0,
        "o-below": null,
        "i-below": 4,
        "others": 0
    },
    "alda": {
        "wide": true,
        "w": 0,
        "y-quenya": null,
        "o-below": null,
        "i-below": null,
        "others": 1
    },

    "silme": {
        "y-quenya": 2,
        "o-below": 2,
        "i-below": 2,
        "others": null
    },
    "silme-nuquerna": {
        "e": 2,
        "y-quenya": null,
        "o-below": null,
        "i-below": null,
        "others": 1
    },
    "esse": {
        "others": null
    },
    "esse-nuquerna": {
        "e": 2,
        "y-quenya": null,
        "o-below": null,
        "i-below": null,
        "others": 1
    },

    "hyarmen": {
        "y-quenya": 1,
        "o-below": 1,
        "i-below": 1,
        "others": 3
    },
    "hwesta-sindarinwa": {
        "w": 1,
        "y-quenya": 1,
        "o-below": 1,
        "i-below": 1,
        "others": 0
    },
    "yanta": {
        "a": 1,
        "others": 2
    },
    "ure": {
        "a": 1,
        "others": 2
    },

    "halla": {
        "i-below": 3,
        "o-below": 3,
        "others": null
    },
    "short-carrier": {
        "y-quenya": null,
        "others": 3
    },
    "long-carrier": {
        "y-quenya": null,
        "o-below": null,
        "i-below": null,
        "others": 3
    },
    "round-carrier": 2,

    "thuletinco": {
        "a": 3,
        "w": 3,
        "y-quenya": 3,
        "y-sindarin": 3,
        "í": 3,
        "o-below": 3,
        "others": 2
    },
    "formenparma": {
        "a": 3,
        "w": 3,
        "y-quenya": 3,
        "y-sindarin": 3,
        "í": 3,
        "o-below": 3,
        "others": 2
    },
    "harmacalma": {
        "i": 1,
        "w": 1,
        "y-quenya": 0,
        "í": 0,
        "i-below": 1,
        "o-below": 1,
        "others": 0
    },
    "hwestaquesse": {
        "i": 1,
        "w": 1,
        "y-quenya": 0,
        "í": 0,
        "i-below": 1,
        "o-below": 1,
        "others": 0
    },

    "antoando": {
        "wide": true,
        "others": 0
    },
    "ampaumbar": {
        "wide": true,
        "others": 0
    },
    "ancaanga": {
        "wide": true,
        "others": 0
    },
    "unqueungwe": {
        "wide": true,
        "others": 0
    }

};

exports.transcribe = transcribe;
function transcribe(sections, options) {
    options = options || {};
    var block = options.block || false;
    var beginParagraph = block ? "<p>" : "";
    var delimitParagraph = "<br>";
    var endParagraph = block ? "</p>" : "";
    return sections.map(function (section) {
        return section.map(function (paragraph) {
            return beginParagraph + paragraph.map(function (line) {
                return line.map(function (word) {
                    return word.map(function (column) {
                        return transcribeColumn(column, options);
                    }).join("");
                }).join(" ");;
            }).join(delimitParagraph + "\n") + endParagraph;
        }).join("\n\n");
    }).join("\n\n\n");
}

exports.transcribeColumn = transcribeColumn;
function transcribeColumn(column, options) {
    options = options || {};
    var plain = options.plain || false;
    var tengwa = column.tengwa || "anna";
    var tehtar = [];
    if (column.above) tehtar.push(column.above);
    if (column.below) tehtar.push(column.below);
    if (column.tildeBelow) tehtar.push("tilde-below");
    if (column.tildeAbove) tehtar.push("tilde-above");
    if (column.following) tehtar.push(column.following);
    var html = tengwar[tengwa] + tehtar.map(function (tehta) {
        return tehtaForTengwa(tengwa, tehta);
    }).join("");
    if (column.errors && !plain) {
        html = "<abbr class=\"error\" title=\"" + column.errors.join("\n").replace(/"/g, "&quot;") + "\">" + html + "</abbr>";
    }
    return html;
}

exports.tehtaForTengwa = tehtaForTengwa;
function tehtaForTengwa(tengwa, tehta) {
    var tehtaKey = tehtaKeyForTengwa(tengwa, tehta);
    if (tehtaKey == null)
        return null;
    return (
        tehtar[tehta][tengwa] ||
        tehtar[tehta][tehtaKey] ||
        null
    );
}

var longVowels = "áéóú";
function tehtaKeyForTengwa(tengwa, tehta) {
    if (!tehtar[tehta])
        return null;
    if (longVowels.indexOf(tehta) !== -1)
        return null;
    if (tehtar[tehta].special)
        return tehtar[tehta][tengwa] || null;
    if (Alphabet.barsAndTildes.indexOf(tehta) !== -1) {
        if (tengwa === "lambe" || tengwa === "alda" && tehtar[tehta].length >= 2)
            return 2;
        return positions[tengwa].wide ? 0 : 1;
    }
    if (positions[tengwa] == null)
        return null;
    if (positions[tengwa][tehta] === null)
        return null;
    if (positions[tengwa][tehta] != null)
        return positions[tengwa][tehta];
    if (positions[tengwa].others != null)
        return positions[tengwa].others;
    return positions[tengwa];
}

exports.makeColumn = makeColumn;
function makeColumn(tengwa, tengwarFrom) {
    return makeFontColumn(exports, tengwa, tengwarFrom);
}

},{"./alphabet":1,"./column":4,"./dan-smith":5}]},{},[7]);
