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
