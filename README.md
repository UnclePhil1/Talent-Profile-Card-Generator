# Talent Card Generator

A simple generator that turns your **Superteam Talent** details into a shareable card — name, role, short bio, and a **QR code** that links straight to your talent profile.

Built with the Superteam Talent look: dark theme, signature red, and the katakana "matrix" rain.

## Features

- **Two card styles** — pick before you export:
  - **Matrix** — dark, on-theme, animated katakana rain + red glow.
  - **Clean** — bright, minimal white card.
- **Live preview** — the card updates as you type.
- **QR code** — generated offline from your profile link (`app.talent.superteam.fun/p/...`).
- **Optional photo** — upload one, or fall back to an auto monogram from your initials.
- **Export** — download a crisp 2× PNG, or copy the image to your clipboard.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5173).

## Build for deploy

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

The `dist/` folder is static — drop it on Vercel, Netlify, GitHub Pages, or any static host.

## How to use

1. Enter your **name**, **role**, and a **short bio** (≤120 chars).
2. Paste your **Talent profile link** — this becomes the QR code. Copy it from your
   profile page via **Share profile → Copy link**.
3. (Optional) Upload a **photo**.
4. Choose **Matrix** or **Clean**.
5. Hit **Download PNG**.

## Tech

- [Vite](https://vitejs.dev/) — dev server / bundler
- [`qrcode`](https://www.npmjs.com/package/qrcode) — offline QR generation
- [`html-to-image`](https://www.npmjs.com/package/html-to-image) — card → PNG export
- Vanilla JS + CSS, no framework.

## Fonts

Google Fonts are **self-hosted** in `public/fonts/` (not loaded via `@import`) so they
embed cleanly into exported PNGs and work offline:

- **Carrois Gothic SC** — name + platform headings
- **Bricolage Grotesque** — bio text
- **Edu NSW ACT Foundation** — platform accent (subtitle)
