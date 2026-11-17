
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

// DIGITAL COCKPIT DEMO
const cockpitBattery = document.querySelector("#cockpit-battery");
const cockpitMode = document.querySelector("#cockpit-mode");
const cockpitSpeed = document.querySelector("#cockpit-speed");
function updateCockpit() {
  if (!cockpitBattery || !cockpitMode || !cockpitSpeed) return;
  const battery = Number(cockpitBattery.value);
  const speed = Number(cockpitSpeed.value);
  const mode = cockpitMode.value;
  const batteryText = document.querySelector("#cockpit-battery-value");
  const batteryControlText = document.querySelector("#cockpit-battery-control-value");
  const whText = document.querySelector("#cockpit-wh-value");
  const speedText = document.querySelector("#cockpit-speed-value");
  const speedControlText = document.querySelector("#cockpit-speed-control-value");
  const modeText = document.querySelector("#cockpit-mode-value");
  const supportText = document.querySelector("#cockpit-support-value");
  if (batteryText) batteryText.textContent = battery + "%";
  if (batteryControlText) batteryControlText.textContent = battery + "%";
  if (whText) whText.textContent = Math.round(500 * battery / 100) + " Wh";
  if (speedText) speedText.textContent = speed;
  if (speedControlText) speedControlText.textContent = speed + " km/h";
  if (modeText) modeText.textContent = mode.toUpperCase();
  if (supportText) supportText.textContent = ({ eco: "Niedrig", trail: "Mittel", turbo: "Hoch" })[mode];
  document.querySelectorAll(".battery-bars i").forEach((bar, index) => {
    bar.classList.toggle("empty", battery < (index + 1) * 20);
  });
}
[cockpitBattery, cockpitMode, cockpitSpeed].forEach((el) => el?.addEventListener("input", updateCockpit));
[cockpitMode]?.addEventListener("change", updateCockpit);
updateCockpit();
