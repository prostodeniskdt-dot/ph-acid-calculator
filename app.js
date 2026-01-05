// Константы как в Excel (Ka, молярная масса, плотность)
const ACIDS = [
  { id: "citric",   name: "Лимонная",     Ka: 7.4e-4,   molarMass: 192.12, density: 1.02  },
  { id: "ascorbic", name: "Аскорбиновая", Ka: 6.76e-5,  molarMass: 176.12, density: 1.02  },
  { id: "malic",    name: "Яблочная",     Ka: 3.98e-4,  molarMass: 134.09, density: 1.02  },
  { id: "lactic",   name: "Молочная",     Ka: 1.38e-4,  molarMass: 90.08,  density: 1.02  },
  { id: "tartaric", name: "Винная",       Ka: 9.6e-4,   molarMass: 150.09, density: 1.02  },
  { id: "acetic",   name: "Уксусная",     Ka: 1.75e-5,  molarMass: 60.05,  density: 1.005 },
];

function floorTo1Decimal(x) {
  return Math.floor(x * 10) / 10;
}

// Повторяет Excel:
// pH = -log10( sqrt(Ka * ((%/100)*density*1000/molarMass)) )
// затем ROUNDDOWN до 1 знака
function calcPH(percent, acid) {
  const p = Number(percent);
  if (!p || p <= 0) return 0;

  const C = (p / 100) * acid.density * 1000 / acid.molarMass; // mol/L
  const H = Math.sqrt(acid.Ka * C);
  const pH = -Math.log10(H);

  return floorTo1Decimal(pH);
}

// Разбавление как в Excel:
// вода = (c0*m/ct) - m
function waterToAdd(mass, c0, ct) {
  const m = Number(mass);
  const ci = Number(c0);
  const target = Number(ct);

  if (!(m > 0) || !(ci > 0) || !(target > 0)) return 0;

  const water = (ci * m / target) - m;

  // Практичнее, чем отрицательные значения (если target > ci)
  return Math.max(0, water);
}

// UI wiring
const acidSelect = document.getElementById("acidSelect");
const percentInput = document.getElementById("percentInput");
const phOutput = document.getElementById("phOutput");

const massInput = document.getElementById("massInput");
const c0Input = document.getElementById("c0Input");
const ctInput = document.getElementById("ctInput");
const waterOutput = document.getElementById("waterOutput");

function formatNumber(x, digits = 1) {
  return Number.isFinite(x) ? x.toFixed(digits) : "0";
}

function formatWater(x) {
  if (!Number.isFinite(x)) return "0";
  // выводим без лишнего шума: если целое — без десятых, иначе 1 знак
  const rounded = Math.round(x * 10) / 10;
  return (Math.abs(rounded - Math.round(rounded)) < 1e-9)
    ? String(Math.round(rounded))
    : rounded.toFixed(1);
}

function recalcPH() {
  const acid = ACIDS.find(a => a.id === acidSelect.value) || ACIDS[0];
  const pH = calcPH(percentInput.value, acid);
  phOutput.textContent = formatNumber(pH, 1);
}

function recalcDilution() {
  const water = waterToAdd(massInput.value, c0Input.value, ctInput.value);
  waterOutput.textContent = formatWater(water);
}

function init() {
  // populate select
  acidSelect.innerHTML = ACIDS
    .map(a => `<option value="${a.id}">${a.name}</option>`)
    .join("");

  // defaults
  acidSelect.value = ACIDS[0].id;

  // listeners
  acidSelect.addEventListener("change", recalcPH);
  percentInput.addEventListener("input", recalcPH);

  [massInput, c0Input, ctInput].forEach(el => {
    el.addEventListener("input", recalcDilution);
  });

  // initial calc
  recalcPH();
  recalcDilution();
}

init();
