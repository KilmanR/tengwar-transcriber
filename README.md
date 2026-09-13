# Tengwar Transcriber

Веб-конвертер английского и эльфийского (квенья, синдарин) в **тенгвар** — письменность из легендариума Дж. Р. Р. Толкина.

**Живой сайт:** https://kilmanr.github.io/tengwar-transcriber/

## Возможности

- **Живой перевод** — текст транскрибируется по мере ввода
- **3 режима транскрипции**: General Use (английский), Classical (квенья), Beleriand (синдарин)
- **5 шрифтов тенгвар**:
  - Tengwar Annatar (классический, ASCII; ядро транскрипции)
  - Tengwar Artano (стиль надписи Единственного Кольца)
  - Alcarin (каллиграфический, SIL OFL-1.1)
  - Tengwar Eldamar (писчий рукописный, Free Tengwar)
  - Tengwar Formal (строгий официальный, кодировка CSUR)
- **Фразы из игр и книг** (только эльфы + Чёрное Наречие): LOTR (квенья/синдарин/Мордор) и WoW (ночные эльфы / эльфы крови / высшие эльфы), русские переводы, кнопка «Вставить в переводчик»
- **Экспорт в PNG**: выбор цвета фона и текста, живое превью, темы-пресеты (Кольцо, Ривенделл, Валинор, Мордор, Чёрный Храм, Silvermoon, Teldrassil, Сурамар) со свечением и пульсацией
- **Тёмная «эльфийская» тема**, адаптивная вёрстка (375px+), офлайн через service worker

## Технологии

- Движок транскрипции: [tengwarjs](https://github.com/kriskowal/tengwarjs) (MIT)
- Шрифт Annatar — оттуда же (MIT)
- PUA-адаптер `js/tengwar-pua.js` — рендер для шрифтов с Unicode/CSUR-кодировкой (Alcarin/Artano/Eldamar/Formal)
- Генерация PNG — html2canvas
- Линтеры: htmlhint, stylelint, eslint; headless-тесты (Chrome)

## Запуск локально

```sh
python3 -m http.server 8000
# → http://127.0.0.1:8000/
```

Проверка качества:

```sh
npm install
npm run lint   # htmlhint + stylelint + eslint
npm test       # headless-тесты (нужен сервер, см. выше)
```

## Лицензии

- Движок и шрифт Annatar — MIT (см. `fonts/LICENSE.md`)
- Alcarin — SIL Open Font License 1.1 (см. `fonts/OFL-Alcarin.txt`)
- Eldamar и Formal — свободные шрифты Free Tengwar (некоммерческое использование)