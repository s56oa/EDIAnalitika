# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Single-file static web app (`edi_analytics.html`) that parses and visualises **REG1TEST EDI v1** amateur radio VHF contest logs entirely in the browser — no server, no build step. Target audience: Slovenian and international amateur radio operators (callsign prefix S5x).

GitHub: https://github.com/s56oa/EDIAnalitika

## Running / developing

Open `edi_analytics.html` directly in any modern browser. No build tools, no package manager, no server needed.

```bash
# Quick local server if needed (avoids browser security restrictions on file:// for some exports)
python3 -m http.server 8080
```

External CDN dependencies (must be online to load):
- **Chart.js 4.4.1** – `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js`
- **Google Fonts** – Space Mono + DM Sans

## Architecture

Everything lives in a single HTML file, divided into clearly delimited JS sections marked with `// ═══ SECTION NAME ═══`.

### Data flow

```
File drop/pick → handleFile() → parseEDI() → render() → [charts + map + tables]
```

1. **`parseEDI(text)`** — splits on `[QSORecords` section; each semicolon-delimited line becomes a `qso` object `{call, mode, wwl, dist, hh, mi, dd, mm, yy, ...}`. Header key=value pairs go into `header{}`. Mode integers: 1=SSB, 2=CW, 3=FM.

2. **`render(data)`** — called with `{header, qsos}`. Enriches QSOs with azimuth/distance from home locator (`header['pwwlo']`), then builds all visualisations. Stores the last data in `_lastRenderData` so language switching can re-render without re-parsing.

3. **Locator math** — `locToLatLon(loc)` converts 6-char Maidenhead locator to lat/lon. `bearing()` and `haversine()` compute azimuth and great-circle distance.

4. **Country prefix table** — `PFX` array of `[RegExp, 'XX (COUNTRY)']` pairs, order-sensitive (more specific prefixes first, e.g. `HB0` before `HB`). `getCountry(call)` strips portable suffix before matching.

5. **Charts** — Chart.js instances stored in `charts{}` object, destroyed on reload via `destroyCharts()`. Custom canvas compass (`compassCanvas`) drawn with raw 2D API.

6. **SVG map** — Mercator projection covering lon -12..42, lat 34..72. Country outlines baked in as `EU_SVG_PATHS` array (Natural Earth data). Zoom/pan state in `_vx, _vy, _vz`. Data layer (`#dataLayer`) rebuilt on color-mode change; base layer (`#baseLayer`) built once. Three coloring modes: distance, QSO count, SSB/CW mode.

7. **PNG export** — `exportPNG(id)` handles three element types: Chart.js `<canvas>` (straightforward), `<svg>` map (serialize → base64 → Image → canvas), and the country bars `<div>` (re-draw manually onto canvas since `foreignObject` is unreliable).

### I18N

`STRINGS` object with `sl` and `en` keys. `t(key)` resolves with `_lang` fallback to `sl`. Static DOM elements use `data-i18n` attribute; dynamic content is re-rendered on language switch via `setLang()`.

### Key global state

| Variable | Purpose |
|---|---|
| `_lang` | Current UI language (`'sl'` or `'en'`) |
| `_lastRenderData` | Last parsed `{header, qsos}` for language re-render |
| `charts` | Chart.js instance registry |
| `_mapQsosData`, `_mapHomeLocStr`, `_mapColorMode` | Map render state |
| `_vx, _vy, _vz` | SVG map pan/zoom |
| `_workedBounds` | Bounding box of worked locators for auto-fit |

## EDI format notes

REG1TEST EDI v1 fields used:
- Header: `PCal` (callsign), `TName` (contest name), `PBand` (band), `PWWLo` (own locator), `PSect` (section), `MOpe1` (operators), `CQSOp` (declared points), `CWWLs` (locator multipliers), `CDXCs` (DXCC count), `SPOWe` (TX power), `SAnte` (antenna), `TDate`
- QSO record columns (0-based): `[0]`date YYMMDD, `[1]`time HHMM, `[2]`callsign, `[3]`mode, `[5]`sent serial, `[7]`received serial, `[9]`worked WWL, `[10]`distance km

## Style conventions

- Dark theme CSS variables defined in `:root` (`--bg`, `--bg2`, `--bg3`, `--border`, `--text`, `--muted`, `--accent` blue, `--accent2` green, `--accent3` orange, `--accent4` red)
- Fonts: `'Space Mono'` monospace for callsigns/numbers, `'DM Sans'` sans-serif for body text
- All chart colors use consistent palette: SSB=`#58a6ff`, CW=`#3fb950`, FM=`#f0883e`
