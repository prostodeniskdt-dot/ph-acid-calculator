// Константы как в Excel (Ka, молярная масса, плотность)
const ACIDS = [
  { id: "citric",   name: "Лимонная",     Ka: 7.4e-4,   molarMass: 192.12, density: 1.02  },
  { id: "ascorbic", name: "Аскорбиновая", Ka: 6.76e-5,  molarMass: 176.12, density: 1.02  },
  { id: "malic",    name: "Яблочная",     Ka: 3.98e-4,  molarMass: 134.09, density: 1.02  },
  { id: "lactic",   name: "Молочная",     Ka: 1.38e-4,  molarMass: 90.08,  density: 1.02  },
  { id: "tartaric", name: "Винная",       Ka: 9.6e-4,   molarMass: 150.09, density: 1.02  },
  { id: "acetic",   name: "Уксусная",     Ka: 1.75e-5,  molarMass: 60.05,  density: 1.005 },
];

// Парсит числа и принимает "1.71", "1,71", " 1 234,5 "
function parseNum(v) {
  const s = String(v ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function floorTo1Decimal(x) {
  return Math.floor(x * 10) / 10;
}

// pH = -log10( sqrt(Ka * C) ), C через плотность; округление вниз до 0.1
function calcPH(percent, acid) {
  const p = parseNum(percent);
  if (!(p > 0)) return { pH: 0, note: "" };

  const C = (p / 100) * acid.density * 1000 / acid.molarMass; // mol/L
  const H = Math.sqrt(acid.Ka * C);
  const pH = -Math.log10(H);

  return { pH: floorTo1Decimal(pH), note: "" };
}

/**
 * Разбавление водой.
 * Важно: используем ОБЪЁМ исходного раствора (мл), как просил автор исходного файла.
 * Формула та же:
 *   water = (c0 * V / ct) - V
 * Выводим воду в граммах, но это ≈ миллилитры (для воды 1 г/мл).
 */
function waterToAddByVolume(volumeMl, c0, ct) {
  const V = parseNum(volumeMl);
  const ci = parseNum(c0);
  const target = parseNum(ct);

  if (!(V > 0) || !(ci > 0) || !(target > 0)) {
    return { water: 0, note: "" };
  }

  // Если хотим сделать раствор концентрированнее — водой не получится.
  if (target >= ci) {
    return { water: 0, note: "Нельзя увеличить концентрацию, добавляя воду (целевая ≥ исходной)." };
  }

  const water = (ci * V / target) - V;
  return { water, note: "" };
}

function formatPH(x) {
  return Number.isFinite(x) ? x.toFixed(1) : "0.0";
}

function formatWater(x) {
  if (!Number.isFinite(x)) return "0";
  const rounded = Math.round(x * 10) / 10;
  const isInt = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  return isInt ? String(Math.round(rounded)) : rounded.toFixed(1);
}

// UI
const acidSelect = document.getElementById("acidSelect");
const percentInput = document.getElementById("percentInput");
const phOutput = document.getElementById("phOutput");
const phNote = document.getElementById("phNote");

const volumeInput = document.getElementById("volumeInput");
const c0Input = document.getElementById("c0Input");
const ctInput = document.getElementById("ctInput");
const waterOutput = document.getElementById("waterOutput");
const dilutionNote = document.getElementById("dilutionNote");

function recalcPH() {
  const acid = ACIDS.find(a => a.id === acidSelect.value) || ACIDS[0];
  const { pH, note } = calcPH(percentInput.value, acid);

  phOutput.textContent = formatPH(pH);
  if (phNote) phNote.textContent = note || "";
}

function recalcDilution() {
  const { water, note } = waterToAddByVolume(volumeInput.value, c0Input.value, ctInput.value);

  // Вода по формуле может быть дробной — выводим аккуратно.
  waterOutput.textContent = formatWater(Math.max(0, water));
  if (dilutionNote) dilutionNote.textContent = note || "";
}

function bindRecalc(el, fn) {
  if (!el) return;
  el.addEventListener("input", fn);
  el.addEventListener("change", fn);
}

function init() {
  acidSelect.innerHTML = ACIDS
    .map(a => `<option value="${a.id}">${a.name}</option>`)
    .join("");
  acidSelect.value = ACIDS[0].id;

  bindRecalc(acidSelect, recalcPH);
  bindRecalc(percentInput, recalcPH);

  bindRecalc(volumeInput, recalcDilution);
  bindRecalc(c0Input, recalcDilution);
  bindRecalc(ctInput, recalcDilution);

  recalcPH();
  recalcDilution();
}

init();
