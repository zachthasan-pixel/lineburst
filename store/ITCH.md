# Lineburst — itch.io upload checklist

**Play URL (paste everywhere):** https://drzahirhasan.com/lineburst/

Open that on your phone first. If the button still says **Play** (not **Draft a kit**), keep the itch page on **Draft** until the public build catches up.

Assets: [github.com/zachthasan-pixel/lineburst/tree/main/store](https://github.com/zachthasan-pixel/lineburst/tree/main/store)

---

## 1. New project

1. Log in at [itch.io](https://itch.io).
2. Top right: your name → **Upload new project**.
   Direct: [https://itch.io/game/new](https://itch.io/game/new)

## 2. Top of the form (required)

| Field | Put this |
|---|---|
| **Title** | `Lineburst` |
| **Project URL** | `lineburst` → `yours.itch.io/lineburst` |
| **Classification** | Games |
| **Kind of project** | **HTML** |
| **Release status** | Released |
| **Pricing** | **$0+** (name your price). Suggested price `$1`. Leave “This project is free” **off** if you want tips. Or tick **No payments** if you want it strictly free. |
| **Genre** | Puzzle |

## 3. Tags

Paste, then tick **Mobile friendly** if you see that checkbox:

```
puzzle, blocks, html5, browser-game, high-score, casual, endless, mobile-friendly, grid, singleplayer, arcade, minimalist
```

Do **not** tag `block-blast` or `tetris`.

## 4. Uploads — skip the engine zip

Do **not** zip the React/Vercel build. It will white-screen on itch.

**Fast path (recommended):** no game file. The page is a storefront; players use the play URL.

**If itch won’t save HTML without a file:** on your computer, save this as `index.html`, then **Upload files** → that one file → tick **This file will be played in the browser**.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lineburst</title>
    <style>
      html, body { margin: 0; height: 100%; background: #0b0d14; }
      iframe { border: 0; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <iframe
      src="https://drzahirhasan.com/lineburst/"
      allow="autoplay; fullscreen"
      allowfullscreen
    ></iframe>
  </body>
</html>
```

Embed options (only if you uploaded that file):

- **Click to launch in fullscreen** (not “Embed in page”)
- Tick **Mobile friendly**
- Viewport can stay empty in fullscreen mode

## 5. Description (paste into the editor)

```
Play now (full game): https://drzahirhasan.com/lineburst/

Draft five shapes. The tray only deals from your kit. Burst full rows and columns. Hold the ugly one. Chain a tight fit into back-to-back.

This is a loadout puzzle, not a random trio.

## How it plays

- **Draft** — five picks from named shapes (Spark, Lance, Boot, Cup…). Duplicates allowed.
- **Kit** — every deal comes from those five. You own the dead board.
- **Hold** — tap a piece, then Hold (or press C). One swap until you place.
- **Tight fit / B2B** — box a piece in, or chain hard clears, for extra pay.

Undo three times per run. High score lives in the browser.

## Controls

- Drag a piece onto the 8×8 grid, or tap the piece then tap a cell.
- Ghost preview shows the landing and which lines will burst.
- Keyboard: 1 / 2 / 3 select. C holds. Z undoes. Esc pauses.

Phone or desktop. No account. No download.
```

## 6. Instructions box (under the editor)

```
Play in the browser: https://drzahirhasan.com/lineburst/

On a phone, use the whole screen — drag or tap-to-place. First run is a five-pick draft, then a short how-to.
```

## 7. Cover + gallery

Download from the `store/` folder, then upload in this order:

| File | Where on itch |
|---|---|
| `cover-630x500.png` | **Cover image** (required look). itch wants ~630×500. |
| `trailer.gif` | First screenshot / GIF under the cover |
| `screenshot-portrait-play.png` | Screenshot |
| `screenshot-portrait-hold.png` | Screenshot |
| `screenshot-portrait-title.png` | Screenshot |
| `screenshot-16x9-play.png` | Extra 16:9 |
| `screenshot-16x9-hold.png` | Extra 16:9 |

Cover: click **Upload cover image**. Screenshots: **Add screenshots** / the gallery under the cover.

## 8. Bottom of the form

| Field | Put this |
|---|---|
| **Credits** | `Lineburst — original grid puzzle. Not affiliated with any other block game.` |
| **Community** | **Comments** (so people can yell at your kit) |
| **Visibility** | **Draft** first |

## 9. Save, preview, then Public

1. **Save**.
2. Open **View page** (or `yours.itch.io/lineburst`). You are the only one who can see a Draft.
3. Check: cover, GIF, description, play URL is clickable.
4. If you uploaded `index.html`, press the in-page launch and confirm Lineburst actually loads. If the frame is blank, delete the upload and keep the play URL in the description — that still counts.
5. Edit → **Visibility: Public** → Save.

Your public URL is:

`https://YOURNAME.itch.io/lineburst`

Share **that**, not the GitHub Pages URL, so comments and PWYW land in one place.

## Don’t

- Don’t zip `dist/` or `.vercel/output`.
- Don’t tag Block Blast or Tetris.
- Don’t set a hard price above $0 until someone has actually paid you once.
- Don’t hit Public if the play URL 404s.
