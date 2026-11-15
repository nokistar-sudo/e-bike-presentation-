
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const closeButton = document.querySelector(".lightbox-close");

// Alle Bilder mit data-full lassen sich durch Anklicken vergrößern.
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

// Schließen über das X.
closeButton.addEventListener("click", () => {
  lightbox.close();
});

// Schließen durch Klick auf den dunklen Hintergrund.
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

// Bildquelle beim Schließen zurücksetzen.
lightbox.addEventListener("close", () => {
  lightboxImage.src = "";
});
