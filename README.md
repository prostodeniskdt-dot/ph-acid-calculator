# pH калькулятор для кислот (статическая веб-страница)

## Что умеет
- Расчёт pH для растворов кислот по модели как в Excel:
  - C = (%/100) * density * 1000 / molarMass
  - [H+] ≈ sqrt(Ka * C)
  - pH = -log10([H+])
  - округление вниз до 0.1 (как ROUNDDOWN в Excel)

- Разбавление водой:
  - water = (c0 * mass / cTarget) - mass

## Запуск
Достаточно открыть `index.html` в браузере.

## Деплой на GitHub Pages
1. Залейте файлы в репозиторий (ветка `main`)
2. Settings → Pages → Deploy from a branch
3. Branch: `main` / root `/`
4. Сохраните — GitHub выдаст URL сайта
