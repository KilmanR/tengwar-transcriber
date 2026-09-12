# Tengwar Transcriber

Веб-конвертер английского и эльфийского (квенья, синдарин) в **тенгвар** — письменность из легендариума Дж. Р. Р. Толкина.

**Живой сайт:** https://kilmanr.github.io/tengwar-transcriber/

## Возможности

- **Живой перевод** — текст транскрибируется по мере ввода
- **3 режима транскрипции**: General Use (английский), Classical (квенья), Beleriand (синдарин)
- **5 шрифтов тенгвар**:
  - Tengwar Annatar (классический, MIT)
  - Tengwar Parmaite (изящный, MIT)
  - Alcarin (каллиграфический, OFL-1.1)
  - Ariador (изящный рукописный, OFL-1.1)
  - Artano (стиль надписи Единственного Кольца)
- **Пресеты фраз**: надпись Кольца, LOTR, WoW, эльфийская приветственная
- **Тёмная «эльфийская» тема**, адаптивная вёрстка

## Технологии

- Движок транскрипции: [tengwarjs](https://github.com/kriskowal/tengwarjs) (MIT)
- Шрифты Annatar/Parmaite — оттуда же (MIT)
- PUA-адаптер `js/tengwar-pua.js` — рендер для шрифтов с Unicode-кодировкой (Alcarin/Ariador/Artano)
- Чистый HTML/CSS/JS, без сборки, GitHub Pages

## Запуск локально

```sh
python3 -m http.server 8000
# → http://127.0.0.1:8000/
```

## Лицензии

- Движок и шрифты Annatar/Parmaite — MIT (см. `fonts/LICENSE.md`)
- Alcarin — SIL Open Font License 1.1 (см. `fonts/OFL-Alcarin.txt`)
- Ariador — OFL-1.1
- Artano — свободное распространение (без файла лицензии в источнике)