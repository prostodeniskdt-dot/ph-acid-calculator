// Константы как в Excel (Ka, молярная масса, плотность)
const ACIDS = [
  { id: "citric",   name: "Лимонная",     Ka: 7.4e-4,   molarMass: 192.12, density: 1.02  },
  { id: "ascorbic", name: "Аскорбиновая", Ka: 6.76e-5,  molarMass: 176.12, density: 1.02  },
  { id: "malic",    name: "Яблочная",     Ka: 3.98e-4,  molarMass: 134.09, density: 1.02  },
  { id: "lactic",   name: "Молочная",     Ka: 1.38e-4,  molarMass: 90.08,  density: 1.02  },
  { id: "tartaric", name: "Винная",       Ka: 9.6e-4,   molarMass: 150.09, density: 1.02  },
  { id: "acetic",   name: "Уксусная",     Ka: 1.75e-5,  molarMass: 60.05,  density: 1.005 },
];

// Парсер принимает и "1.71", и "1,71", и " 1 234,5 "
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

function fmt1(x) {
  if (!Number.isFinite(x)) return "0.0";
  // показываем с 1 знаком; в RU-локали браузер сам поставит точку/запятую при необходимости
  return (Math.round(x * 10) / 10).toFixed(1);
}

function fmtWater(x) {
  if (!Number.isFinite(x)) return "0";
  const rounded = Math.round(x * 10) / 10;
  const isInt = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  return isInt ? String(Math.round(rounded)) : rounded.toFixed(1);
}

// pH: два режима
// 1) Базовый (как Excel): [H+] ≈ sqrt(Ka*C)
// 2) Точный (квадратное уравнение): [H+] = (sqrt(Ka^2 + 4KaC) - Ka) / 2
function calcPH(percent, acid, exactMode) {
  const p = parseNum(percent);
  if (!(p > 0)) return { pH: 0, note: "" };

  // молярная концентрация (mol/L) из массовых % через плотность
  const C = (p / 100) * acid.density * 1000 / acid.molarMass;

  const Ka = acid.Ka;
  const H = exactMode
    ? (Math.sqrt(Ka * Ka + 4 * Ka * C) - Ka) / 2
    : Math.sqrt(Ka * C);

  const pHraw = -Math.log10(H);

  // как в Excel: округление вниз до 0.1
  const pH = floorTo1Decimal(pHraw);

  let note = "";
  if (p > 50) note = "Предупреждение: очень высокая концентрация; расчёт может заметно расходиться с реальностью из‑за активности/ионной силы.";
  return { pH, note };
}

// Разбавление водой по объёму раствора (мл)
// По сути та же формула, только m заменён на V (принимаем 1 мл ≈ 1 г)
function waterToAddByVolume(volumeMl, c0, ct) {
  const V = parseNum(volumeMl);
  const ci = parseNum(c0);
  const target = parseNum(ct);

  if (!(V > 0) || !(ci > 0) || !(target > 0)) {
    return { water: 0, note: "" };
  }

  if (target >= ci) {
    return { water: 0, note: "Нельзя увеличить концентрацию, добавляя воду (целевая ≥ исходной)." };
  }

  const water = (ci * V / target) - V;
  return { water, note: "" };
}

// --- UI ---
const acidSelect = document.getElementById("acidSelect");
const percentInput = document.getElementById("percentInput");
const phOutput = document.getElementById("phOutput");
const phNote = document.getElementById("phNote");
const exactMode = document.getElementById("exactMode");

const volumeInput = document.getElementById("volumeInput");
const c0Input = document.getElementById("c0Input");
const ctInput = document.getElementById("ctInput");
const waterOutput = document.getElementById("waterOutput");
const dilutionNote = document.getElementById("dilutionNote");

function recalcPH() {
  const acid = ACIDS.find(a => a.id === acidSelect.value) || ACIDS[0];
  const { pH, note } = calcPH(percentInput.value, acid, !!exactMode.checked);
  phOutput.textContent = fmt1(pH);
  phNote.textContent = note || "";
}

function recalcDilution() {
  const { water, note } = waterToAddByVolume(volumeInput.value, c0Input.value, ctInput.value);
  waterOutput.textContent = fmtWater(water);
  dilutionNote.textContent = note || "";
}

function init() {
  acidSelect.innerHTML = ACIDS
    .map(a => `<option value="${a.id}">${a.name}</option>`)
    .join("");

  acidSelect.value = ACIDS[0].id;

  acidSelect.addEventListener("change", recalcPH);
  percentInput.addEventListener("input", recalcPH);
  percentInput.addEventListener("change", recalcPH);
  exactMode.addEventListener("change", recalcPH);

  [volumeInput, c0Input, ctInput].forEach(el => {
    el.addEventListener("input", recalcDilution);
    el.addEventListener("change", recalcDilution);
  });

  recalcPH();
  recalcDilution();
}

init();
