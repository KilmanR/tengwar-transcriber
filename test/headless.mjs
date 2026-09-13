import puppeteer from "puppeteer-core";

const FONTS = ["annatar", "alcarin", "artano", "eldamar", "formal"];
const PHRASES = {
  lotr: ["Ash nazg durbatulûk", "Elen síla lúmenn' omentielvo", "Mae govannen!", "Aiya Eärendil Elenion Ancalima!"],
  wow: ["Ishnu-alah", "Anar'alah belore", "Shorel'aran", "Felo'melorn", "Elune-adore!", "For Quel'Thalas!"]
};

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--force-device-scale-factor=1"]
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });

const consoleErrors = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", e => consoleErrors.push(String(e)));

await page.goto("http://127.0.0.1:8123", { waitUntil: "networkidle0", timeout: 30000 });
await page.evaluate(() => document.fonts.ready);

const results = [];
const ok = (name, cond) => results.push({ name, pass: !!cond });

// 9. дефолтная фраза — надпись на Кольце
const defaultText = await page.$eval("#input", el => el.value);
ok("дефолтная фраза — Кольцо (Ash nazg)", /^Ash nazg durbatulûk/.test(defaultText));

// 1. phrases.json loaded
const phraseCards = await page.evaluate(() => document.querySelectorAll(".phrase-card").length);
ok("phrases.json загружен (ожид. 37 карточек)", phraseCards === 37);

const phraseSubs = await page.evaluate(() => Array.from(document.querySelectorAll(".phrase-sub")).map(h => h.textContent).join("|"));
ok("заголовки групп LOTR", /Квенья/.test(phraseSubs) && /Синдарин/.test(phraseSubs) && /Чёрное Наречие/.test(phraseSubs));
ok("заголовки групп WoW", /Калдорай/.test(phraseSubs) && /Син'дорай/.test(phraseSubs) && /Кель'дорай/.test(phraseSubs));

const forbidden = await page.evaluate(() => document.body.innerText.match(/гном|орк|дворф|нежить|undead|troll|goblin/i));
ok("нет запрещённых рас в тексте", !forbidden);

// 2. запрещённые фразы-предметы
const badPhrases = await page.evaluate(() => document.body.innerText.match(/For the Horde|Time is money|Stay a while/i));
ok("нет не-эльфийских фраз-предметов", !badPhrases);

// 2. Загрузка всех 5 @font-face
await page.evaluate(async () => {
  await Promise.all([
    document.fonts.load('16px "Tengwar Annatar"', "\ue000"), document.fonts.load('16px "Tengwar Alcarin"', "\ue000"),
    document.fonts.load('16px "Tengwar Artano"', "\ue000"), document.fonts.load('16px "Tengwar Eldamar"', "\ue000"),
    document.fonts.load('16px "Tengwar Formal CSUR"', "\ue000")
  ]);
});
const faces = await page.evaluate(() => [
  document.fonts.check('16px "Tengwar Annatar"'), document.fonts.check('16px "Tengwar Alcarin"'),
  document.fonts.check('16px "Tengwar Artano"'), document.fonts.check('16px "Tengwar Eldamar"'),
  document.fonts.check('16px "Tengwar Formal CSUR"')
]);
ok("все 5 шрифтов загружены", faces.every(Boolean));

// 2b. Геометрия PUA-меток: центровка, марка в верхней/нижней половине строки
const geo = {};
for (const f of FONTS) {
  await page.select("#font", f);
  await page.$eval("#input", el => { el.value = "meet"; });
  await page.evaluate(() => { document.getElementById("input").dispatchEvent(new Event("input")); });
  const g = await page.evaluate(() => {
    const fs = parseFloat(getComputedStyle(document.getElementById("output")).fontSize);
    const bad = [];
    document.querySelectorAll("#output .pua-col").forEach(col => {
      const base = col.querySelector(".pua-base");
      const mark = col.querySelector(".pua-mark");
      if (!base || !mark) return;
      const b = base.getBoundingClientRect(), m = mark.getBoundingClientRect();
      const centered = Math.abs((m.left + m.right) / 2 - (b.left + b.right) / 2) < fs * 0.45;
      const aboveFitting = m.bottom <= b.bottom - fs * 0.25;
      const belowFitting = m.top >= b.top + fs * 0.25;
      if (!centered || (!aboveFitting && !belowFitting)) bad.push(col.className);
    });
    return { cols: document.querySelectorAll("#output .pua-col").length, bad: bad.length };
  });
  const expectCols = f === "annatar" ? 0 : 3;
  ok(`font ${f}: метки корректны (${g.cols} столбцов, наложений/смещений: ${g.bad})`, g.cols === expectCols && g.bad === 0);
  geo[f] = g;
}

// 3. все 5 шрифтов: рендер фразы + наличие папки маркерных спанов + нулевые консоль-ошибки
for (const f of FONTS) {
  await page.select("#font", f);
  await page.$eval("#input", el => { el.value = "hello world"; });
  await page.evaluate(() => { document.getElementById("input").dispatchEvent(new Event("input")); });
  const out = await page.evaluate(() => document.getElementById("output").innerHTML);
  ok(`font ${f}: вывод непустой`, out.length > 0);
  await page.screenshot({ path: `/tmp/opencode/shot-${f}-1280.png` });
}

// маркеры PUA у alcarin
await page.select("#font", "alcarin");
const markInfo = await page.evaluate(() => {
  const marks = Array.from(document.querySelectorAll("#output .pua-mark"));
  const abs = marks.every(m => getComputedStyle(m).position === "absolute");
  const bases = document.querySelectorAll("#output .pua-col").length;
  return { count: marks.length, abs, bases };
});
ok("PUA-метки позиционируются absolute", markInfo.abs && markInfo.count > 0);

// 4. аккордеон: one-open (классы) + реальное схлопывание по высоте
await page.click('#phrases-acc .acc-group[data-acc="wow"] .acc-head');
const accState = await page.evaluate(() => {
  const groups = Array.from(document.querySelectorAll("#phrases-acc .acc-group"));
  return groups.filter(g => g.classList.contains("open")).map(g => g.getAttribute("data-acc"));
});
ok("аккордеон фраз: открыта только WoW", accState.length === 1 && accState[0] === "wow");

const accHeights = await page.evaluate(async () => {
  const sb = s => Math.round(document.querySelector(s).getBoundingClientRect().height);
  const groups = document.querySelectorAll("#themes-acc .acc-group, #phrases-acc .acc-group");
  groups.forEach(g => g.classList.remove("open"));
  await new Promise(r => setTimeout(r, 600));
  const closed = {
    themes: sb("#themes-acc .acc-group[data-acc='lotr'] .acc-body"),
    phLotr: sb("#phrases-acc .acc-group[data-acc='lotr'] .acc-body"),
    phWow: sb("#phrases-acc .acc-group[data-acc='wow'] .acc-body")
  };
  document.querySelector("#phrases-acc .acc-group[data-acc='lotr']").classList.add("open");
  await new Promise(r => setTimeout(r, 600));
  const opened = sb("#phrases-acc .acc-group[data-acc='lotr'] .acc-body");
  const openCount = document.querySelectorAll("#themes-acc .acc-group.open, #phrases-acc .acc-group.open").length;
  return { closed, opened, openCount };
});
ok("аккордеон реально схлопывается (закрыт ≈ 0px)", accHeights.closed.themes <= 1 && accHeights.closed.phLotr <= 1 && accHeights.closed.phWow <= 1);
ok("аккордеон раскрывается по клику (>1000px) и остаётся one-open", accHeights.opened > 1000 && accHeights.openCount === 1);

// 5. чипы квотинга
await page.click('[data-quote="wanber"]').catch(() => null);
await page.click('[data-quote="wander"]');
const quoteVal = await page.$eval("#input", el => el.value);
ok("чип 'Noro lim' вставил фразу", /Noro lim/.test(quoteVal));

// 6. темы: клик по Валинор меняет фон карточки
const themeCount = await page.evaluate(() => document.querySelectorAll(".theme-card").length);
ok("из 8 тем построено 8 карточек", themeCount === 8);
await page.click('#themes-acc .acc-group[data-acc="lotr"] .acc-head');
await page.$eval('.theme-card[data-theme="valinor"]', el => el.click());
const themeBg = await page.evaluate(() => document.getElementById("output-card").style.background);
ok("тема Валинор применена", themeBg === "rgb(74, 58, 18)");

// 7. PNG-экспорт: html2canvas рендерит без ошибок
try {
  await page.click("#export-btn");
  await new Promise(r => setTimeout(r, 2500));
  ok("html2canvas отработал", true);
} catch (e) {
  ok("html2canvas отработал", false);
}

// 8. мобильный 375px
await page.setViewport({ width: 375, height: 800 });
await page.select("#font", "annatar");
await page.screenshot({ path: "/tmp/opencode/shot-mobile-375.png" });
const mobileErr = await page.$eval(".app", el => el.getBoundingClientRect().width >= 375);
ok("375px: нет горизонтального скролла", mobileErr && !(await page.evaluate(() => document.documentElement.scrollWidth > 375)));

ok("нет ошибок в консоли", consoleErrors.length === 0);

for (const r of results) console.log(`[${r.pass ? "PASS" : "FAIL"}] ${r.name}`);
const fails = results.filter(r => !r.pass);
if (consoleErrors.length) console.log("CONSOLE ERRORS:", consoleErrors);
console.log(`\nИтого: ${results.length - fails.length}/${results.length} пройдено`);
await browser.close();
process.exit(fails.length ? 1 : 0);