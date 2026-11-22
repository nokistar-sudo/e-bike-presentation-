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


// PUBLIC FUNDING TOTAL — read-only for visitors, editable only by approved admins.
(() => {
  const goalCents = 174800;
  const endpoint = "https://gmbvgdoebvqsdmmucyob.supabase.co/rest/v1/funding_progress";
  const apiKey = "sb_publishable_k6cIKJfu-OUiQwgvN7XKzA_EwWNFpxs";
  const raisedOutput = document.querySelector("#funding-raised");
  const remainingOutput = document.querySelector("#funding-remaining");
  const percentOutput = document.querySelector("#funding-percent");
  const progress = document.querySelector("#funding-progress");
  const progressFill = document.querySelector("#funding-progress-fill");
  const feedback = document.querySelector("#funding-feedback");
  if (!raisedOutput || !remainingOutput || !percentOutput || !progress || !progressFill || !feedback) return;

  const euro = cents => new Intl.NumberFormat("de-DE", {
    style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2
  }).format(cents / 100);
  function render(totalCents) {
    const total = Math.max(0,Math.min(goalCents,Math.round(totalCents)));
    const remaining = Math.max(0,goalCents-total);
    const percent = Math.min(100,Math.round(total/goalCents*100));
    raisedOutput.textContent=euro(total);
    remainingOutput.textContent=euro(remaining);
    percentOutput.textContent=percent+" %";
    progressFill.style.width=percent+"%";
    progress.setAttribute("aria-valuenow",String(total/100));
    progress.setAttribute("aria-valuemax",String(goalCents/100));
  }
  async function loadTotal() {
    try {
      const response=await fetch(endpoint+"?select=total_cents&singleton=eq.true&limit=1",{
        headers:{apikey:apiKey,Authorization:"Bearer "+apiKey,Accept:"application/json"},
        cache:"no-store"
      });
      if(!response.ok) throw new Error("Could not load funding total");
      const rows=await response.json();
      const cents=Number(rows?.[0]?.total_cents ?? 0);
      if(!Number.isSafeInteger(cents)||cents<0) throw new Error("Invalid funding total");
      render(cents);
      feedback.textContent="Gemeinsamer Beitragsstand – manuell nach Zahlungseingang aktualisiert.";
    } catch (_) {
      feedback.textContent="Der Beitragsstand kann gerade nicht geladen werden.";
    }
  }
  window.loadFundingTotal=loadTotal;
  render(0);
  loadTotal();
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

  // Custom black cursor with a turquoise edge glow — no comet trail.
  if (window.matchMedia("(hover:hover) and (pointer:fine)").matches && !reducedMotion) {
    const canvas = document.createElement("canvas");
    canvas.className = "cursor-comet";
    canvas.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(canvas);
    canvas.style.pointerEvents = "none";
    const ctx = canvas.getContext("2d", { alpha:true });
    let dpr = 1, width = 0, height = 0;
    let x = -100, y = -100, visible = false, frame = 0;

    function resizeCursor() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintCursor();
    }

    function paintCursor() {
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      if (!visible) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.shadowColor = "rgba(70,245,225,.95)";
      ctx.shadowBlur = 17;
      ctx.beginPath();
      ctx.moveTo(1, 1);
      ctx.lineTo(2, 27);
      ctx.lineTo(9, 20);
      ctx.lineTo(16, 31);
      ctx.lineTo(21, 28);
      ctx.lineTo(14, 17);
      ctx.lineTo(27, 16);
      ctx.closePath();
      ctx.fillStyle = "rgba(8,16,17,.98)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(91,255,235,1)";
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    function schedulePaint() {
      if (!frame) frame = requestAnimationFrame(paintCursor);
    }

    resizeCursor();
    window.addEventListener("resize", resizeCursor, { passive:true });
    document.addEventListener("pointermove", event => {
      x = event.clientX;
      y = event.clientY;
      visible = true;
      schedulePaint();
    }, { passive:true });
    document.addEventListener("pointerleave", () => {
      visible = false;
      schedulePaint();
    });
    document.addEventListener("pointerenter", () => {
      visible = true;
      schedulePaint();
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


// SUPPORT WALL, DRAWING EDITOR, CONTRIBUTION SUBMISSIONS AND ADMIN REVIEW
(() => {
  const SUPABASE_URL="https://gmbvgdoebvqsdmmucyob.supabase.co";
  const SUPABASE_KEY="sb_publishable_k6cIKJfu-OUiQwgvN7XKzA_EwWNFpxs";
  const REST_URL=SUPABASE_URL+"/rest/v1";
  const AUTH_URL=SUPABASE_URL+"/auth/v1";
  const submissionsUrl=REST_URL+"/supporter_submissions";
  const dialog=document.querySelector("#support-dialog");
  const openButton=document.querySelector("#support-open");
  const closeButton=document.querySelector("#support-close");
  const form=document.querySelector("#support-form");
  const canvas=document.querySelector("#support-paint-canvas");
  const nameInput=document.querySelector("#support-name");
  const amountInput=document.querySelector("#support-amount");
  const methodInput=document.querySelector("#support-method");
  const colorInput=document.querySelector("#paint-color");
  const sizeInput=document.querySelector("#paint-size");
  const penButton=document.querySelector("#paint-pen");
  const eraserButton=document.querySelector("#paint-eraser");
  const clearButton=document.querySelector("#paint-clear");
  const submitButton=document.querySelector("#support-submit");
  const formFeedback=document.querySelector("#support-form-feedback");
  const previewImage=document.querySelector("#support-preview-image");
  const previewName=document.querySelector("#support-preview-name");
  const wall=document.querySelector("#support-wall-grid");
  const adminDialog=document.querySelector("#admin-dialog");
  const adminOpen=document.querySelector("#admin-open");
  const adminClose=document.querySelector("#admin-close");
  const adminLoginForm=document.querySelector("#admin-login-form");
  const adminEmail=document.querySelector("#admin-email");
  const adminPassword=document.querySelector("#admin-password");
  const adminFeedback=document.querySelector("#admin-feedback");
  const adminPanel=document.querySelector("#admin-panel");
  const adminQueue=document.querySelector("#admin-queue");
  const adminLogout=document.querySelector("#admin-logout");
  const adminTotal=document.querySelector("#admin-total");
  const adminSaveTotal=document.querySelector("#admin-save-total");
  const adminPushBox=document.querySelector("#admin-push-box");
  const adminPushEnable=document.querySelector("#admin-push-enable");
  const adminPushDisable=document.querySelector("#admin-push-disable");
  const adminPushStatus=document.querySelector("#admin-push-status");
  const PUSH_FUNCTION=SUPABASE_URL+"/functions/v1/admin-push";
  const PUSH_SCOPE="/e-bike-presentation-/";
  let pushRegistration=null;
  const isIPhone=/iPhone|iPod/i.test(navigator.userAgent);
  const isInstalledPWA=window.navigator.standalone===true||window.matchMedia("(display-mode: standalone)").matches;
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register(PUSH_SCOPE+"service-worker.js",{scope:PUSH_SCOPE})
      .then(registration=>{pushRegistration=registration;})
      .catch(()=>{});
  }
  function urlBase64ToUint8Array(base64String){
    const padding="=".repeat((4-base64String.length%4)%4);
    const raw=atob((base64String+padding).replace(/-/g,"+").replace(/_/g,"/"));
    return Uint8Array.from(raw,char=>char.charCodeAt(0));
  }
  async function pushRequest(action,extra={}){
    const response=await fetch(PUSH_FUNCTION,{
      method:"POST",
      headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+adminToken,"Content-Type":"application/json"},
      body:JSON.stringify({action,...extra})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||"Push-Einrichtung fehlgeschlagen");
    return result;
  }
  async function refreshPushControls(){
    if(!adminPushBox)return;
    adminPushBox.hidden=!isIPhone;
    if(!isIPhone)return;
    if(!isInstalledPWA){
      adminPushStatus.textContent="Bitte füge diese Website zuerst über Safari → Teilen → Zum Home-Bildschirm hinzu. Öffne danach das neue App-Symbol.";
      adminPushEnable.disabled=true;adminPushDisable.hidden=true;return;
    }
    if(!("PushManager" in window)||!("Notification" in window)||!pushRegistration){
      try{pushRegistration=await navigator.serviceWorker.ready;}catch(_){}
    }
    if(!("PushManager" in window)||!("Notification" in window)||!pushRegistration){
      adminPushStatus.textContent="Push-Benachrichtigungen werden von diesem Browser gerade nicht unterstützt.";
      adminPushEnable.disabled=true;adminPushDisable.hidden=true;return;
    }
    const subscription=await pushRegistration.pushManager.getSubscription();
    adminPushEnable.disabled=false;
    adminPushDisable.hidden=!subscription;
    adminPushStatus.textContent=subscription?"Benachrichtigungen sind auf diesem iPhone eingerichtet.":"Noch keine Push-Benachrichtigungen auf diesem iPhone eingerichtet.";
  }
  adminPushEnable?.addEventListener("click",async()=>{
    adminPushEnable.disabled=true;adminPushStatus.textContent="Einrichtung läuft …";
    try{
      const permission=await Notification.requestPermission();
      if(permission!=="granted")throw new Error("Die Mitteilungserlaubnis wurde nicht erteilt.");
      pushRegistration=pushRegistration||await navigator.serviceWorker.ready;
      const keyResponse=await fetch(PUSH_FUNCTION+"?action=public-key");
      const keyData=await keyResponse.json();
      if(!keyResponse.ok||!keyData.publicKey)throw new Error("Der Push-Schlüssel ist in Supabase noch nicht eingerichtet.");
      let subscription=await pushRegistration.pushManager.getSubscription();
      if(!subscription)subscription=await pushRegistration.pushManager.subscribe({
        userVisibleOnly:true,
        applicationServerKey:urlBase64ToUint8Array(keyData.publicKey)
      });
      await pushRequest("subscribe",{subscription:subscription.toJSON()});
      adminPushStatus.textContent="Fertig! Neue Beitragsmeldungen erscheinen jetzt als Mitteilung auf diesem iPhone.";
      await refreshPushControls();
    }catch(error){adminPushStatus.textContent=error.message||"Einrichtung fehlgeschlagen.";adminPushEnable.disabled=false;}
  });
  adminPushDisable?.addEventListener("click",async()=>{
    adminPushDisable.disabled=true;
    try{
      await pushRequest("unsubscribe");
      const subscription=await pushRegistration?.pushManager.getSubscription();
      if(subscription)await subscription.unsubscribe();
      adminPushStatus.textContent="Push-Benachrichtigungen wurden ausgeschaltet.";
      await refreshPushControls();
    }catch(error){adminPushStatus.textContent=error.message||"Deaktivieren fehlgeschlagen.";}
    finally{adminPushDisable.disabled=false;}
  });
  function elevateCursorIntoDialog(dialogElement){
    const cursorCanvas=document.querySelector(".cursor-comet");
    if(cursorCanvas&&dialogElement)dialogElement.appendChild(cursorCanvas);
  }
  function restoreCursorToPage(){
    const cursorCanvas=document.querySelector(".cursor-comet");
    if(cursorCanvas)document.documentElement.appendChild(cursorCanvas);
  }
  dialog?.addEventListener("close",restoreCursorToPage);
  adminDialog?.addEventListener("close",restoreCursorToPage);
  let adminToken=null;
  let adminUserId=null;
  if(!dialog||!canvas||!form||!wall) return;

  const ctx=canvas.getContext("2d");
  const background="#f4f2e9";
  let drawing=false,erasing=false,hasDrawn=false,lastPoint=null;
  const euro=cents=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(cents/100);

  function resetCanvas(){
    ctx.save();ctx.fillStyle=background;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
    hasDrawn=false;updatePreview();
  }
  function updatePreview(){
    previewImage.src=canvas.toDataURL("image/png");
    previewName.textContent=nameInput.value.trim()||"Dein Name";
  }
  function setTool(useEraser){
    erasing=useEraser;
    penButton.classList.toggle("is-active",!erasing);
    eraserButton.classList.toggle("is-active",erasing);
    penButton.setAttribute("aria-pressed",String(!erasing));
    eraserButton.setAttribute("aria-pressed",String(erasing));
  }
  function pointFromEvent(event){
    const rect=canvas.getBoundingClientRect();
    return {x:(event.clientX-rect.left)*canvas.width/rect.width,y:(event.clientY-rect.top)*canvas.height/rect.height};
  }
  function startDraw(event){
    if(event.button!==undefined&&event.button!==0)return;
    drawing=true;lastPoint=pointFromEvent(event);canvas.setPointerCapture?.(event.pointerId);
    ctx.beginPath();ctx.arc(lastPoint.x,lastPoint.y,Math.max(1,Number(sizeInput.value)/2),0,Math.PI*2);
    ctx.fillStyle=erasing?background:colorInput.value;ctx.fill();hasDrawn=true;updatePreview();event.preventDefault();
  }
  function draw(event){
    if(!drawing)return;
    const point=pointFromEvent(event);ctx.beginPath();ctx.moveTo(lastPoint.x,lastPoint.y);ctx.lineTo(point.x,point.y);
    ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=Number(sizeInput.value);
    ctx.strokeStyle=erasing?background:colorInput.value;ctx.stroke();lastPoint=point;hasDrawn=true;updatePreview();event.preventDefault();
  }
  function stopDraw(){if(!drawing)return;drawing=false;lastPoint=null;updatePreview();}
  canvas.addEventListener("pointerdown",startDraw);
  canvas.addEventListener("pointermove",draw);
  canvas.addEventListener("pointerup",stopDraw);
  canvas.addEventListener("pointercancel",stopDraw);
  canvas.addEventListener("lostpointercapture",stopDraw);
  nameInput.addEventListener("input",updatePreview);
  colorInput.addEventListener("input",()=>setTool(false));
  penButton.addEventListener("click",()=>setTool(false));
  eraserButton.addEventListener("click",()=>setTool(true));
  clearButton.addEventListener("click",resetCanvas);

  openButton?.addEventListener("click",()=>{
    form.reset();nameInput.value="";amountInput.value="";methodInput.value="cash";
    colorInput.value="#20c5bd";sizeInput.value="7";setTool(false);resetCanvas();
    formFeedback.textContent="";
    if(typeof dialog.showModal==="function"){dialog.showModal();elevateCursorIntoDialog(dialog);}
  });
  closeButton?.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});

  function setWallMessage(message){
    wall.replaceChildren();const p=document.createElement("p");p.className="support-wall-empty";p.textContent=message;wall.appendChild(p);
  }
  async function loadSupporters(){
    try{
      const response=await fetch(submissionsUrl+"?select=id,display_name,avatar_data,created_at&status=eq.approved&order=created_at.desc&limit=60",{
        headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY,Accept:"application/json"},cache:"no-store"
      });
      if(!response.ok)throw new Error("Wall load failed");
      const supporters=await response.json();wall.replaceChildren();
      if(!Array.isArray(supporters)||supporters.length===0){setWallMessage("Hier ist noch Platz für die ersten Supporter. Vielleicht für dich?");return;}
      supporters.forEach(person=>{
        const card=document.createElement("article");card.className="supporter-card";
        const image=document.createElement("img");image.alt="Gemaltes Profilbild von "+person.display_name;image.loading="lazy";image.src=person.avatar_data;
        const name=document.createElement("strong");name.textContent=person.display_name;
        const tag=document.createElement("span");tag.textContent="SUPPORTER";
        card.append(image,name,tag);wall.appendChild(card);
      });
    }catch(_){setWallMessage("Die Support Wall kann gerade nicht geladen werden.");}
  }

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const displayName=nameInput.value.trim();
    const amountNumber=Number(String(amountInput.value).replace(",","."));
    const amountCents=Math.round(amountNumber*100);
    if(!displayName||displayName.length>18){formFeedback.textContent="Bitte gib einen Namen mit 1 bis 18 Zeichen ein.";return;}
    if(!Number.isSafeInteger(amountCents)||amountCents<100||amountCents>174800){formFeedback.textContent="Bitte gib einen Beitrag zwischen 1 € und 1.748 € ein.";return;}
    if(!hasDrawn){formFeedback.textContent="Male zuerst ein kleines Profilbild für dich.";return;}
    const avatarData=canvas.toDataURL("image/png");
    if(avatarData.length>300000){formFeedback.textContent="Das Bild ist zu groß. Bitte male mit weniger Details.";return;}
    submitButton.disabled=true;submitButton.textContent="Wird gesendet …";formFeedback.textContent="";
    try{
      const response=await fetch(submissionsUrl,{
        method:"POST",
        headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify({display_name:displayName,avatar_data:avatarData,amount_cents:amountCents,contribution_method:methodInput.value})
      });
      if(!response.ok)throw new Error(await response.text());
      formFeedback.textContent="Danke! Deine Beitragsmeldung und dein Profil wurden zur Prüfung gesendet. Nach Bestätigung erscheint dein Profil auf der Support Wall.";
      submitButton.textContent="Erfolgreich gesendet ✓";
      window.setTimeout(()=>{dialog.close();submitButton.disabled=false;submitButton.innerHTML='Profil zur Prüfung senden <span>↗</span>';},2400);
    }catch(_){
      formFeedback.textContent="Das Senden hat gerade nicht geklappt. Bitte versuche es später erneut.";
      submitButton.disabled=false;submitButton.innerHTML='Profil zur Prüfung senden <span>↗</span>';
    }
  });

  // Admin login: only a separately allowlisted Supabase Auth user can review or edit data.
  async function adminRequest(path,options={}){
    const response=await fetch(REST_URL+path,{
      ...options,
      headers:{
        apikey:SUPABASE_KEY,
        Authorization:"Bearer "+(adminToken||SUPABASE_KEY),
        Accept:"application/json",
        ...(options.headers||{})
      }
    });
    if(!response.ok)throw new Error(await response.text());
    if(response.status===204)return null;
    const text=await response.text();return text?JSON.parse(text):null;
  }
  function adminMessage(message){adminFeedback.textContent=message;}
  function showAdminLoggedOut(){
    adminToken=null;adminUserId=null;adminPanel.hidden=true;adminLoginForm.hidden=false;
    adminPassword.value="";
  }
  async function loadAdminData(){
    const queue=await adminRequest("/supporter_submissions?select=id,display_name,avatar_data,amount_cents,contribution_method,created_at&status=eq.pending&order=created_at.asc");
    adminQueue.replaceChildren();
    if(!Array.isArray(queue)||queue.length===0){
      const p=document.createElement("p");p.className="support-wall-empty";p.textContent="Keine offenen Beitragsmeldungen.";adminQueue.appendChild(p);
    }else{
      queue.forEach(entry=>{
        const card=document.createElement("article");card.className="admin-submission";
        const image=document.createElement("img");image.src=entry.avatar_data;image.alt="Profilbild von "+entry.display_name;
        const details=document.createElement("div");details.className="admin-submission-details";
        const name=document.createElement("strong");name.textContent=entry.display_name;
        const amount=document.createElement("span");amount.textContent=euro(entry.amount_cents)+" · "+(entry.contribution_method==="cash"?"Bar":"PayPal (separat)");
        const date=document.createElement("small");date.textContent=new Date(entry.created_at).toLocaleString("de-DE");
        details.append(name,amount,date);
        const actions=document.createElement("div");actions.className="admin-submission-actions";
        const approve=document.createElement("button");approve.type="button";approve.className="paint-tool admin-approve";approve.textContent="Beitrag bestätigt · Freigeben";
        const reject=document.createElement("button");reject.type="button";reject.className="paint-tool admin-reject";reject.textContent="Ablehnen";
        approve.addEventListener("click",()=>moderate(entry.id,"approved",approve));
        reject.addEventListener("click",()=>moderate(entry.id,"rejected",reject));
        actions.append(approve,reject);card.append(image,details,actions);adminQueue.appendChild(card);
      });
    }
    const funding=await adminRequest("/funding_progress?select=total_cents&singleton=eq.true&limit=1");
    adminTotal.value=((Number(funding?.[0]?.total_cents)||0)/100).toFixed(2);
  }
  async function moderate(id,status,button){
    button.disabled=true;
    try{
      await adminRequest("/supporter_submissions?id=eq."+encodeURIComponent(id),{
        method:"PATCH",headers:{"Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify({status})
      });
      adminMessage(status==="approved"?"Beitrag bestätigt und Profil freigegeben.":"Beitragsmeldung abgelehnt.");
      await loadAdminData();await loadSupporters();
    }catch(_){adminMessage("Änderung fehlgeschlagen. Prüfe bitte deine Admin-Freigabe.");button.disabled=false;}
  }
  adminOpen?.addEventListener("click",()=>{
    adminMessage("");showAdminLoggedOut();
    if(typeof adminDialog.showModal==="function"){adminDialog.showModal();elevateCursorIntoDialog(adminDialog);}
  });
  adminClose?.addEventListener("click",()=>adminDialog.close());
  adminDialog?.addEventListener("click",event=>{if(event.target===adminDialog)adminDialog.close();});
  adminLoginForm?.addEventListener("submit",async event=>{
    event.preventDefault();
    const loginButton=document.querySelector("#admin-login-button");
    loginButton.disabled=true;adminMessage("Anmeldung wird geprüft …");
    try{
      const response=await fetch(AUTH_URL+"/token?grant_type=password",{
        method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({email:adminEmail.value.trim(),password:adminPassword.value})
      });
      const session=await response.json();
      if(!response.ok||!session.access_token||!session.user?.id)throw new Error("Anmeldung fehlgeschlagen");
      adminToken=session.access_token;adminUserId=session.user.id;
      const allowlist=await adminRequest("/support_wall_admins?select=user_id&user_id=eq."+encodeURIComponent(adminUserId));
      if(!Array.isArray(allowlist)||allowlist.length===0){
        showAdminLoggedOut();
        throw new Error("Dieses Konto ist noch nicht als Admin freigegeben.");
      }
      adminLoginForm.hidden=true;adminPanel.hidden=false;adminPassword.value="";
      adminMessage("Angemeldet. Prüfe die offenen Beitragsmeldungen.");
      await loadAdminData();
      await refreshPushControls();
    }catch(error){
      adminMessage(error.message==="Dieses Konto ist noch nicht als Admin freigegeben."?error.message:"Anmeldung nicht möglich. Prüfe E-Mail, Passwort und Admin-Freigabe.");
      adminToken=null;adminUserId=null;
    }finally{loginButton.disabled=false;}
  });
  adminLogout?.addEventListener("click",async()=>{
    try{
      if(adminToken)await fetch(AUTH_URL+"/logout",{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+adminToken}});
    }catch(_){}
    showAdminLoggedOut();adminMessage("Du wurdest abgemeldet.");
  });
  adminSaveTotal?.addEventListener("click",async()=>{
    const cents=Math.round(Number(String(adminTotal.value).replace(",", "."))*100);
    if(!Number.isSafeInteger(cents)||cents<0||cents>174800){adminMessage("Bitte einen Betrag zwischen 0 € und 1.748 € eintragen.");return;}
    adminSaveTotal.disabled=true;
    try{
      await adminRequest("/funding_progress?singleton=eq.true",{
        method:"PATCH",headers:{"Content-Type":"application/json",Prefer:"return=minimal"},
        body:JSON.stringify({total_cents:cents})
      });
      adminMessage("Fortschritt gespeichert.");window.loadFundingTotal?.();
    }catch(_){adminMessage("Der Fortschritt konnte nicht gespeichert werden. Prüfe deine Admin-Freigabe.");}
    finally{adminSaveTotal.disabled=false;}
  });

  resetCanvas();loadSupporters();showAdminLoggedOut();
})();
