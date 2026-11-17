
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const closeButton = document.querySelector(".lightbox-close");

document.querySelectorAll("[data-full]").forEach((button) => {
  button.addEventListener("click", () => {
    const imagePath = button.dataset.full;

    lightboxImage.src = imagePath;
    lightboxImage.alt = button.querySelector("img")?.alt || "Fahrraddetail";

    if (typeof lightbox.showModal === "function") {
      lightbox.showModal();
    }
  });
});

closeButton.addEventListener("click", () => {
  lightbox.close();
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

lightbox.addEventListener("close", () => {
  lightboxImage.src = "";
});


// REICHWEITEN-SIMULATOR
const weightInput = document.querySelector("#rider-weight");
const assistInput = document.querySelector("#assist-level");
const routeInput = document.querySelector("#route-type");
const rangeOutput = document.querySelector("#range-output");
const rangeFill = document.querySelector("#range-meter-fill");
const rangeExplanation = document.querySelector("#range-explanation");
const weightValue = document.querySelector("#weight-value");

function updateRangeEstimate() {
  if (!weightInput || !assistInput || !routeInput || !rangeOutput) return;
  const weight = Number(weightInput.value);
  const assist = assistInput.value;
  const route = routeInput.value;
  const assistConsumption = { eco: 6.3, trail: 9.5, turbo: 14 };
  const routeFactor = { flat: 0.86, mixed: 1, hills: 1.28 };
  const weightFactor = 1 + (weight - 65) * 0.004;
  const whPerKm = assistConsumption[assist] * routeFactor[route] * weightFactor;
  const estimate = Math.round(500 / whPerKm);
  rangeOutput.textContent = estimate;
  weightValue.textContent = weight;
  rangeFill.style.width = Math.min(100, estimate / 100 * 100) + "%";
  const assistNames = { eco: "Eco", trail: "Trail", turbo: "Turbo" };
  const routeNames = { flat: "flacher Strecke", mixed: "gemischter Strecke", hills: "vielen Steigungen" };
  rangeExplanation.textContent = "Bei " + assistNames[assist] + "-Unterstützung und " + routeNames[route] + " ergibt sich eine grobe Modellschätzung.";
}
[weightInput, assistInput, routeInput].forEach((el) => el?.addEventListener("input", updateRangeEstimate));
updateRangeEstimate();

// DIGITAL COCKPIT: VIRTUELLE PROBEFAHRT
const cockpitBattery = document.querySelector("#cockpit-battery");
const cockpitMode = document.querySelector("#cockpit-mode");
const cockpitStart = document.querySelector("#cockpit-start");
const cockpitReset = document.querySelector("#cockpit-reset");
let cockpitRunning = false;
let cockpitSpeed = 0;
let cockpitDistance = 0;
let cockpitElapsed = 0;
let cockpitBatteryLevel = Number(cockpitBattery?.value || 78);
let cockpitTimer = null;

const cockpitModes = {
  eco:   { label: "Niedrig", consumption: 6.5, topSpeed: 18, acceleration: 1.0 },
  trail: { label: "Mittel",  consumption: 10,  topSpeed: 25, acceleration: 1.5 },
  turbo: { label: "Hoch",    consumption: 15,  topSpeed: 32, acceleration: 2.1 }
};

function cockpitFormatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

function cockpitRender() {
  const mode = cockpitModes[cockpitMode?.value || "trail"];
  const remainingWh = Math.round(500 * cockpitBatteryLevel / 100);
  const remainingRange = Math.max(0, Math.floor(remainingWh / mode.consumption));
  const values = {
    "#cockpit-speed-value": Math.round(cockpitSpeed),
    "#cockpit-mode-value": (cockpitMode?.value || "trail").toUpperCase(),
    "#cockpit-battery-value": Math.round(cockpitBatteryLevel) + "%",
    "#cockpit-battery-control-value": Math.round(cockpitBatteryLevel) + "%",
    "#cockpit-wh-value": remainingWh + " Wh",
    "#cockpit-range-value": remainingRange + " km",
    "#cockpit-distance-value": cockpitDistance.toFixed(1).replace(".", ",") + " km",
    "#cockpit-time-value": cockpitFormatTime(cockpitElapsed),
    "#cockpit-support-value": mode.label
  };
  Object.entries(values).forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  });
  document.querySelectorAll(".battery-bars i").forEach((bar, index) => {
    bar.classList.toggle("empty", cockpitBatteryLevel < (index + 1) * 20);
  });
  const status = document.querySelector("#cockpit-status");
  const light = document.querySelector("#cockpit-status-light");
  if (status) status.textContent = cockpitRunning ? "SIMULATION LÄUFT" : cockpitElapsed > 0 ? "PAUSIERT" : "BEREIT";
  if (light) light.classList.toggle("is-running", cockpitRunning);
  if (cockpitStart) cockpitStart.textContent = cockpitRunning ? "Ⅱ Pause" : cockpitElapsed > 0 ? "▶ Weiterfahren" : "▶ Probefahrt starten";
  if (cockpitBattery) cockpitBattery.disabled = cockpitRunning || cockpitElapsed > 0;
  if (cockpitMode) cockpitMode.disabled = cockpitRunning;
}

function cockpitTick() {
  const mode = cockpitModes[cockpitMode.value];
  cockpitElapsed += 1;
  const targetSpeed = mode.topSpeed * (0.72 + 0.18 * Math.sin(cockpitElapsed / 5));
  cockpitSpeed += (targetSpeed - cockpitSpeed) * 0.18;
  cockpitDistance += cockpitSpeed / 3600;
  const terrainLoad = 1 + 0.12 * (0.5 + 0.5 * Math.sin(cockpitElapsed / 8));
  const usedWh = mode.consumption * Math.max(cockpitSpeed, 5) * terrainLoad / 3600;
  cockpitBatteryLevel = Math.max(0, cockpitBatteryLevel - usedWh / 5);
  if (cockpitBatteryLevel <= 0) {
    cockpitBatteryLevel = 0;
    cockpitStop();
  }
  cockpitRender();
}

function cockpitStop() {
  cockpitRunning = false;
  if (cockpitTimer) window.clearInterval(cockpitTimer);
  cockpitTimer = null;
  cockpitRender();
}

function cockpitToggle() {
  if (cockpitRunning) {
    cockpitStop();
    return;
  }
  if (cockpitBatteryLevel <= 0) return;
  cockpitRunning = true;
  cockpitRender();
  cockpitTimer = window.setInterval(cockpitTick, 1000);
}

function cockpitResetAll() {
  cockpitStop();
  cockpitSpeed = 0;
  cockpitDistance = 0;
  cockpitElapsed = 0;
  cockpitBatteryLevel = Number(cockpitBattery?.value || 78);
  cockpitRender();
}

cockpitBattery?.addEventListener("input", () => {
  cockpitBatteryLevel = Number(cockpitBattery.value);
  cockpitRender();
});
cockpitMode?.addEventListener("change", cockpitRender);
cockpitStart?.addEventListener("click", cockpitToggle);
cockpitReset?.addEventListener("click", cockpitResetAll);
cockpitRender();


// LIVE SCENE STUDIO – Umgebung, Wetter und Tageszeit
(() => {
  const stage = document.querySelector("#scene-stage");
  const weatherLayer = document.querySelector("#scene-weather-layer");
  const caption = document.querySelector("#scene-caption");
  if (!stage || !weatherLayer || !caption) return;
  const sceneNames = {village:"DORFSTRASSE",forest:"WALDWEG",urban:"STADTVIERTEL",winter:"WINTERLANDSCHAFT",lake:"AM SEE",night:"STADT BEI NACHT"};
  const weatherNames = {clear:"KLAR",cloudy:"WOLKIG",rain:"REGEN",snow:"SCHNEE",fog:"NEBEL"};
  const timeNames = {day:"TAG",sunset:"ABEND",night:"NACHT"};
  function select(group, value) {
    if (group === "scene") {
      stage.dataset.scene = value;
      document.querySelectorAll("[data-scene]").forEach(b => b.classList.toggle("active", b.dataset.scene === value));
    } else {
      stage.dataset[group] = value;
      document.querySelectorAll("#scene-" + group + " [data-" + group + "]").forEach(b => b.classList.toggle("active", b.dataset[group] === value));
    }
    if (group === "weather") {
      weatherLayer.className = "scene-weather-layer" + (value === "clear" || value === "cloudy" ? "" : " " + value);
    }
    caption.textContent = sceneNames[stage.dataset.scene] + " · " + weatherNames[stage.dataset.weather] + " · " + timeNames[stage.dataset.time];
  }
  document.querySelectorAll(".scene-choice").forEach(b => b.addEventListener("click", () => select("scene", b.dataset.scene)));
  document.querySelectorAll("#scene-weather button").forEach(b => b.addEventListener("click", () => select("weather", b.dataset.weather)));
  document.querySelectorAll("#scene-time button").forEach(b => b.addEventListener("click", () => select("time", b.dataset.time)));
})();
