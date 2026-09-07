# Lineburst — itch.io page pack

**Play now:** https://zachthasan-pixel.github.io/lineburst/

Paste these into a new itch project. Assets in this folder.

On itch: Kind of project = **HTML** is optional. Fastest path is **this project is hosted elsewhere** with the URL above as the playable. Do not zip the Vercel SSR output.

---

## Title

Lineburst

## Short description / tagline

Fit three pieces. Burst full rows and columns. Hold the ugly one. Chain a tight fit into back-to-back.

## Classification

- **Kind of project:** HTML
- **Genre:** Puzzle
- **Release status:** Released
- **Pricing:** Free, or $0+ name-your-price (suggest $1)
- **Platforms:** HTML5 (play in browser). Tick **Mobile friendly**.

## Tags

```
puzzle
blocks
html5
browser-game
high-score
casual
endless
mobile-friendly
grid
singleplayer
arcade
minimalist
```

Do **not** tag `block-blast` or `tetris`. Those are other people’s marks.

## Theme (optional)

Dark, abstract, geometric.

---

## Description (paste into the editor)

```
Play: https://zachthasan-pixel.github.io/lineburst/

Fit three pieces onto an 8×8 grid. Fill a row or a column and it bursts. The board never rotates the pieces for you — what you see is what you place.

A new trio deals when the tray is empty. The run ends when nothing left can fit.

## Why it bites

- **Hold** — park one shape (tap Hold, or press C). One swap until you place. A held piece can still save a dead tray.
- **Tight fit** — box a piece in and clear: extra score, a banner, a harder shake.
- **Back-to-back** — chain hard clears (tight, 2+ lines, or a perfect). The next one pays ×1.5. Easy singles break the streak.
- **Mean deals** — shapes come from a 7-family bag. Fair, not nice.

Undo three times per run. High score lives in the browser.

## Controls

- Drag a piece onto the grid, or tap the piece then tap a cell (places from the top-left).
- Ghost preview shows where it lands and which lines will burst.
- Hold: tap a piece, then Hold.
- Keyboard: 1 / 2 / 3 select a piece. C holds. Z or Backspace undoes. Esc pauses.

Works on a phone. Landscape or portrait.

No account. No download. One sitting.
```

## Community / itch “instructions” box

```
Play in the browser: https://zachthasan-pixel.github.io/lineburst/

On a phone, use the whole screen — drag or tap-to-place. First run shows a short how-to.
```

## Credits

```
Lineburst — original grid puzzle. Not affiliated with any other block game.
```

---

## Images (upload in this order)

| File | Use |
|---|---|
| `cover-630x500.png` | **Cover image** (itch wants ~630×500) |
| `trailer.gif` | GIF under the cover, or “Add a video” skip and use this as a screenshot |
| `screenshot-portrait-play.png` | Screenshot 1 (hero) |
| `screenshot-portrait-hold.png` | Screenshot 2 (Hold) |
| `screenshot-portrait-title.png` | Screenshot 3 (title) |
| `screenshot-16x9-play.png` | Extra / embed-friendly 16:9 |
| `screenshot-16x9-hold.png` | Extra 16:9 |
| `screenshot-16x9-title.png` | Extra 16:9 |
| `og-16x9.png` | Social / embed thumbnail if itch asks |

---

## HTML upload

From the project root, after a production build:

```bash
npm run build
cd .vercel/output/static
zip -r ../../../store/lineburst-web.zip .
```

On itch: **Uploads →** `lineburst-web.zip` → **This file will be played in the browser**.

If the zip’s `index.html` is not at the root, itch will blank-screen. Do not zip the `static` folder itself; zip its *contents*.

Viewport: leave default, or set min 360×640. Tick **Mobile friendly**.

---

## Visibility

- **Draft** until the zip actually plays in itch’s preview.
- Then **Public**. Optional: post a GIF on X / Reddit with the itch URL, not the Vercel URL, so comments and ratings pile up in one place.

## One-line posts

X / Reddit:

```
Lineburst — a mean little grid puzzle in the browser. Hold the 5-bar. Chain a tight fit into B2B.
https://zachthasan-pixel.github.io/lineburst/
```
