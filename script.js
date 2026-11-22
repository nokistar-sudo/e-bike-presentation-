const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const closeButton = document.querySelector(".lightbox-close");

document.querySelectorAll("[data-full]").forEach((button) => {
  button.addEventListener("click", () => {
    const imagePath = button.dataset.full;
    lightboxImage.src = imagePath;
    lightboxImage.alt = button.querySelector("img")?.alt || "Fahrraddetail";
    if (typeof lightbox.showModal === "function") lightbox.showModal();
  });
});

closeButton?.addEventListener("click", () => lightbox.close());

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

lightbox?.addEventListener("close", () => {
  lightboxImage.src = "";
});


// BIKE CONTRIBUTION TRACKER
(() => {
  const goal = 1748;
  const storageKey = "specializedBikeContributions";
  const input = document.querySelector("#funding-input");
  const addButton = document.querySelector("#funding-add");
  const resetButton = document.querySelector("#funding-reset");
  const raisedOutput = document.querySelector("#funding-raised");
  const remainingOutput = document.querySelector("#funding-remaining");
  const percentOutput = document.querySelector("#funding-percent");
  const progress = document.querySelector("#funding-progress");
  const progressFill = document.querySelector("#funding-progress-fill");
  const feedback = document.querySelector("#funding-feedback");
  if (!input || !addButton || !resetButton) return;

  let raised = 0;
  try {
    const saved = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(saved) && saved >= 0) raised = Math.min(saved, goal);
  } catch (_) {}

  const euro = value => new Intl.NumberFormat("de-DE", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0
  }).format(value);

  function render() {
    const remaining = Math.max(0, goal - raised);
    const percent = Math.min(100, Math.round((raised / goal) * 100));
    raisedOutput.textContent = euro(raised);
    remainingOutput.textContent = euro(remaining);
    percentOutput.textContent = percent + " %";
    progressFill.style.width = percent + "%";
    progress.setAttribute("aria-valuenow", String(Math.round(raised)));
    progress.setAttribute("aria-valuemax", String(goal));
    if (remaining === 0) {
      feedback.textContent = "Ziel erreicht – das Fahrrad ist vollständig finanziert!";
    }
  }

  addButton.addEventListener("click", () => {
    const amount = Number(input.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      feedback.textContent = "Bitte gib einen gültigen Betrag größer als 0 € ein.";
      input.focus();
      return;
    }
    if (raised >= goal) {
      feedback.textContent = "Das Ziel ist bereits erreicht. Setze die Beträge zurück, falls du neu beginnen möchtest.";
      return;
    }
    const added = Math.min(Math.round(amount * 100) / 100, goal - raised);
    raised = Math.round((raised + added) * 100) / 100;
    try { localStorage.setItem(storageKey, String(raised)); } catch (_) {}
    input.value = "";
    render();
    if (raised < goal) feedback.textContent = euro(added) + " eingetragen – danke für die Unterstützung!";
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") addButton.click();
  });

  resetButton.addEventListener("click", () => {
    if (!window.confirm("Möchtest du wirklich alle eingetragenen Beiträge auf 0 € zurücksetzen?")) return;
    raised = 0;
    try { localStorage.removeItem(storageKey); } catch (_) {}
    render();
    feedback.textContent = "Alle Beiträge wurden auf 0 € zurückgesetzt.";
  });

  render();
})();


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
  const estimate = Math.round(700 / whPerKm);
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
  const remainingWh = Math.round(700 * cockpitBatteryLevel / 100);
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


// MULTI-PAGE NAVIGATION
(() => {
  const panels = [...document.querySelectorAll(".page-panel")];
  const links = [...document.querySelectorAll("[data-page-link]")];
  if (!panels.length || !links.length) return;

  const validPages = new Set(panels.map(panel => panel.dataset.page));
  function showPage(page, updateAddress = true) {
    if (!validPages.has(page)) page = "home";
    panels.forEach(panel => {
      const active = panel.dataset.page === page;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", String(!active));
    });
    links.forEach(link => {
      if (link.dataset.pageLink === page) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (updateAddress && window.location.hash !== "#page-" + page) {
      window.history.pushState({ page }, "", "#page-" + page);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  links.forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    showPage(link.dataset.pageLink);
  }));

  const initial = window.location.hash.startsWith("#page-")
    ? window.location.hash.slice(6)
    : "home";
  showPage(initial, false);
  window.addEventListener("popstate", () => {
    const page = window.location.hash.startsWith("#page-")
      ? window.location.hash.slice(6)
      : "home";
    showPage(page, false);
  });
})();


// PREMIUM MICRO-INTERACTIONS
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Soft reveal for meaningful content blocks. The observer also catches
  // elements inside pages that become visible after navigation.
  const revealTargets = [
    ".section-heading", ".page-intro", ".destination-card", ".spec-card",
    ".detail-card", ".benefit", ".responsibility-grid > div",
    ".purchase-content", ".range-layout", ".cockpit-shell", ".funding-card",
    ".closing-section"
  ];
  const revealElements = [...new Set(revealTargets.flatMap(selector =>
    [...document.querySelectorAll(selector)]
  ))];
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(element => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

    revealElements.forEach((element, index) => {
      element.classList.add("reveal-on-scroll");
      if (element.classList.contains("spec-card") || element.classList.contains("destination-card")) {
        element.style.setProperty("--reveal-delay", (index % 4) * 65 + "ms");
      }
      revealObserver.observe(element);
    });
  }

  // A restrained pointer halo on mouse/trackpad devices; the normal cursor
  // stays visible and touch devices do not receive extra elements.
  if (window.matchMedia("(hover:hover) and (pointer:fine)").matches && !reducedMotion) {
    const aura = document.createElement("span");
    const core = document.createElement("span");
    aura.className = "cursor-aura";
    core.className = "cursor-core";
    aura.setAttribute("aria-hidden", "true");
    core.setAttribute("aria-hidden", "true");
    document.body.append(aura, core);

    let pointerX = -100;
    let pointerY = -100;
    let frame = 0;
    document.addEventListener("pointermove", event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      aura.classList.add("is-visible");
      core.classList.add("is-visible");
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        aura.style.transform = `translate3d(${pointerX - 17}px,${pointerY - 17}px,0)`;
        core.style.transform = `translate3d(${pointerX - 2.5}px,${pointerY - 2.5}px,0)`;
        frame = 0;
      });
    }, { passive:true });
    document.addEventListener("pointerleave", () => {
      aura.classList.remove("is-visible");
      core.classList.remove("is-visible");
    });
    document.addEventListener("pointerover", event => {
      if (event.target.closest("a,button,[role='button'],input,select")) aura.classList.add("is-hovering");
      else aura.classList.remove("is-hovering");
    });
  }

  // A brief, understated glow confirms a successfully entered contribution.
  const fundingCard = document.querySelector(".funding-card");
  const fundingButton = document.querySelector("#funding-add");
  if (fundingCard && fundingButton) {
    fundingButton.addEventListener("click", () => {
      const feedback = document.querySelector("#funding-feedback");
      if (!feedback?.textContent.includes("eingetragen – danke") || reducedMotion) return;
      fundingCard.classList.remove("is-celebrating");
      void fundingCard.offsetWidth;
      fundingCard.classList.add("is-celebrating");
      window.setTimeout(() => fundingCard.classList.remove("is-celebrating"), 900);
    });
  }
})();
