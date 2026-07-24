import QRCode from "qrcode";
import { toPng, toBlob } from "html-to-image";
import "./style.css";

/* ------------------------------------------------------------------ *
 * Assets: official Superteam Talent logo
 *   logoSrc.matrix -> original (white wordmark, for dark cards)
 *   logoSrc.clean  -> dark-wordmark variant (for the light card)
 * The app header uses the standalone favicon.svg mark (see paintHeaderLogo).
 * ------------------------------------------------------------------ */
const LOGO_URL = "/talent-logo.webp";
const HEADER_LOGO = "/favicon.svg";
const logoSrc = { matrix: LOGO_URL, clean: LOGO_URL };

async function buildLogoVariants() {
  const img = new Image();
  img.src = LOGO_URL + "?v=" + Date.now();
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;

  // Dark-wordmark variant: recolor only the text region (right of the icon),
  // keeping each pixel's alpha so anti-aliased edges stay crisp on white.
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  const boundary = Math.floor(W * 0.30); // icon occupies ~28% on the left
  for (let y = 0; y < H; y++) {
    for (let x = boundary; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] > 0) { d[i] = 13; d[i + 1] = 13; d[i + 2] = 15; }
    }
  }
  ctx.putImageData(id, 0, 0);
  logoSrc.clean = c.toDataURL("image/png");
}

const cardLogo = (tpl) =>
  `<img class="card-logo-img" src="${logoSrc[tpl]}" alt="Superteam Talent" />`;

const VERIFIED = `
  <svg class="verified" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l2.4 1.7 2.9-.2 1 2.8 2.5 1.5-.7 2.9.7 2.9-2.5 1.5-1 2.8-2.9-.2L12 22l-2.4-1.7-2.9.2-1-2.8L3.2 16l.7-2.9L3.2 10l2.5-1.5 1-2.8 2.9.2L12 2z" fill="#22c55e"/>
    <path d="M8.5 12.2l2.3 2.3 4.6-4.6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */
const state = {
  name: "Philip Nssien",
  role: "Frontend Developer · DevRel",
  bio: "Frontend dev who ships fast, user-friendly web apps and grows the developer communities behind them.",
  link: "https://app.talent.superteam.fun/p/b5534137-0c5b-4b2a-86d3-8c3685f42f9c?sig=72ccfa68da390213",
  avatar: null, // dataURL
  template: "matrix",
};

/* ------------------------------------------------------------------ *
 * Matrix katakana rain
 * ------------------------------------------------------------------ */
const KATA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEF0123456789$SOLANA".split("");

function makeMatrix(canvas, { fontSize = 14, color = "#ff3b24", fade = 0.08, speed = 1 } = {}) {
  const ctx = canvas.getContext("2d");
  let cols, drops, raf, w, h, dpr, rows;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // offsetWidth/Height give the untransformed layout size, so the rain is
    // sized correctly even when an ancestor is scaled for responsive preview.
    w = Math.max(1, canvas.offsetWidth || canvas.getBoundingClientRect().width);
    h = Math.max(1, canvas.offsetHeight || canvas.getBoundingClientRect().height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rows = h / fontSize;
    cols = Math.ceil(w / fontSize);
    // spread heads across the FULL height so coverage is even from the first
    // frame (columns don't all start at the top) — fills the whole component.
    drops = Array.from({ length: cols }, () => Math.random() * rows);
    ctx.clearRect(0, 0, w, h);
    prewarm();
  }

  function step() {
    ctx.fillStyle = `rgba(5,5,6,${fade})`;
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${fontSize}px monospace`;
    for (let i = 0; i < cols; i++) {
      const ch = KATA[(Math.random() * KATA.length) | 0];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      ctx.fillStyle = Math.random() > 0.975 ? "#ffd0c8" : color;
      ctx.fillText(ch, x, y);
      if (y > h && Math.random() > 0.94) drops[i] = 0;
      drops[i] += 0.5;
    }
  }

  // run enough steps up front to reach a dense, evenly-covered steady state
  // (so a screenshot / PNG export never catches a sparse, top-heavy field)
  function prewarm() {
    const iterations = Math.ceil(rows * 1.5);
    for (let k = 0; k < iterations; k++) step();
  }

  let last = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (t - last < 55 / speed) return;
    last = t;
    step();
  }

  resize();
  const onResize = () => resize();
  window.addEventListener("resize", onResize);
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
}

/* Page background rain */
makeMatrix(document.getElementById("matrix-bg"), { fontSize: 16, fade: 0.06, speed: 0.9 });

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "ST";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

async function qrDataUrl(link) {
  const value = (link || "").trim() || "https://app.talent.superteam.fun";
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 220,
    color: { dark: "#0d0d0f", light: "#ffffff" },
  });
}

/* ------------------------------------------------------------------ *
 * Card rendering
 * ------------------------------------------------------------------ */
let stopCardMatrix = null;

function avatarBlock(cls) {
  if (state.avatar) {
    return `<div class="card-avatar ${cls}" style="background-image:url('${state.avatar}')"></div>`;
  }
  return `<div class="card-monogram">${esc(initials(state.name))}</div>`;
}

function cardHTML() {
  const name = esc(state.name || "Your Name");
  const role = esc(state.role || "Your role");
  const bio = esc(state.bio || "A short line about what you build and the communities you grow.");

  if (state.template === "matrix") {
    return `
      <div class="card card--matrix" id="the-card">
        <canvas class="card-canvas"></canvas>
        <div class="card-glow"></div>
        <div class="card-top">
          ${cardLogo("matrix")}
          <span class="pill">Talent</span>
        </div>
        ${avatarBlock("")}
        <div>
          <div class="card-name">${name}${VERIFIED}</div>
          <div class="card-role">${role}</div>
        </div>
        <div class="card-bio">${bio}</div>
        <div class="divider"></div>
        <div class="card-footer">
          <div class="qr-caption">Scan to view profile<span class="muted">app.talent.superteam.fun</span></div>
          <div class="qr-tile"><img id="qr-img" alt="Profile QR code" /></div>
        </div>
      </div>`;
  }

  if (state.template === "hero") {
    return `
      <div class="card card--hero" id="the-card">
        <div class="hero-band">
          <canvas class="card-canvas"></canvas>
          <div class="hero-fade"></div>
          <div class="card-top">
            ${cardLogo("matrix")}
            <span class="pill">Talent</span>
          </div>
        </div>
        <div class="hero-body">
          <div class="hero-avatar">${avatarBlock("")}</div>
          <div>
            <div class="card-name">${name}${VERIFIED}</div>
            <div class="card-role">${role}</div>
          </div>
          <div class="card-bio">${bio}</div>
          <div class="divider"></div>
          <div class="card-footer">
            <div class="qr-caption">Scan to view profile<span class="muted">app.talent.superteam.fun</span></div>
            <div class="qr-tile"><img id="qr-img" alt="Profile QR code" /></div>
          </div>
        </div>
      </div>`;
  }

  // clean
  return `
    <div class="card card--clean" id="the-card">
      <div class="clean-hero"></div>
      <div class="clean-body">
        <div class="card-top">
          ${cardLogo("clean")}
          <span class="pill">Talent</span>
        </div>
        ${avatarBlock("")}
        <div>
          <div class="card-name">${name}${VERIFIED}</div>
          <div class="card-role">${role}</div>
        </div>
        <div class="card-bio">${bio}</div>
        <div class="divider"></div>
        <div class="card-footer">
          <div class="qr-caption">Scan to view profile<span class="muted">app.talent.superteam.fun</span></div>
          <div class="qr-tile"><img id="qr-img" alt="Profile QR code" /></div>
        </div>
      </div>
    </div>`;
}

async function render() {
  if (stopCardMatrix) { stopCardMatrix(); stopCardMatrix = null; }
  // The card keeps its fixed 380x540 size (for a crisp export); a wrapper is
  // scaled down to fit small screens without touching the card itself.
  $("card-mount").innerHTML = `<div class="card-scale">${cardHTML()}</div>`;

  // QR
  try {
    const url = await qrDataUrl(state.link);
    const img = $("qr-img");
    if (img) img.src = url;
  } catch (e) {
    console.error("QR error", e);
  }

  // card matrix animation (full-card for matrix, top band for hero)
  if (state.template === "matrix" || state.template === "hero") {
    const c = document.querySelector(".card-canvas");
    if (c) stopCardMatrix = makeMatrix(c, { fontSize: 12, fade: 0.12, speed: 1 });
  }

  fitCard();
}

// Scale the card wrapper down to fit the available preview width (never up).
function fitCard() {
  const stage = document.querySelector(".preview-stage");
  const mount = $("card-mount");
  const scaler = mount?.querySelector(".card-scale");
  if (!stage || !scaler) return;
  const scale = Math.min(1, stage.clientWidth / 380);
  scaler.style.transform = `scale(${scale})`;
  mount.style.width = 380 * scale + "px";
  mount.style.height = 540 * scale + "px";
}

/* ------------------------------------------------------------------ *
 * Form wiring
 * ------------------------------------------------------------------ */
function bindInput(id, key, extra) {
  const el = $(id);
  el.value = state[key];
  el.addEventListener("input", () => {
    state[key] = el.value;
    extra?.();
    render();
  });
}

function updateBioCount() {
  $("bio-count").textContent = `${state.bio.length}/120`;
}

bindInput("in-name", "name");
bindInput("in-role", "role");
bindInput("in-bio", "bio", updateBioCount);
bindInput("in-link", "link");
updateBioCount();

/* Avatar upload */
$("btn-upload").addEventListener("click", () => $("in-avatar").click());
$("in-avatar").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.avatar = reader.result;
    $("file-hint").textContent = file.name;
    $("btn-clear-avatar").hidden = false;
    render();
  };
  reader.readAsDataURL(file);
});
$("btn-clear-avatar").addEventListener("click", () => {
  state.avatar = null;
  $("in-avatar").value = "";
  $("file-hint").textContent = "No file chosen — a monogram is used instead";
  $("btn-clear-avatar").hidden = true;
  render();
});

/* Template picker */
document.querySelectorAll(".tpl-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tpl-option").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-checked", b === btn ? "true" : "false");
    });
    state.template = btn.dataset.tpl;
    render();
  });
});

/* ------------------------------------------------------------------ *
 * Export
 * ------------------------------------------------------------------ */
const statusEl = $("status");
function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

function fileName() {
  const base = (state.name || "talent-card").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "talent-card"}-superteam.png`;
}

async function snapshot() {
  const node = $("the-card");
  // make sure the custom fonts are loaded before we rasterize
  try { await document.fonts.ready; } catch {}
  // wait a couple frames so the QR image + fonts are painted
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return node;
}

$("btn-download").addEventListener("click", async () => {
  try {
    setStatus("Rendering…");
    const node = await snapshot();
    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, width: 380, height: 540 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName();
    a.click();
    setStatus("Downloaded ✓", "ok");
  } catch (e) {
    console.error(e);
    setStatus("Could not render the card. Try again.", "err");
  }
});

$("btn-copy").addEventListener("click", async () => {
  try {
    setStatus("Rendering…");
    const node = await snapshot();
    const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true, width: 380, height: 540 });
    if (!blob) throw new Error("no blob");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Copied to clipboard ✓", "ok");
  } catch (e) {
    console.error(e);
    setStatus("Copy not supported here — use Download instead.", "err");
  }
});

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */
$("brand-logo").innerHTML = `<img class="brand-logo-img" src="${HEADER_LOGO}" alt="Superteam Talent" />`;

window.addEventListener("resize", fitCard);

(async () => {
  try { await buildLogoVariants(); } catch (e) { console.warn("logo variant failed", e); }
  render();
})();
