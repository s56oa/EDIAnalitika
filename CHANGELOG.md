# Changelog

Vse pomembne spremembe so zabeležene v tej datoteki.  
Format sledi [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), verzioniranje pa [Semantic Versioning](https://semver.org/).

---

## [1.3.1] — 2026-05-11

### Popravljeno
- `filterQsoTable()` — filter ni deloval: `<tr>` elementi so bili vstavljeni v `<div>`, kar povzroči ignoriranje s strani HTML parserja; popravljeno z `<tbody>` kot kontejnerjem
- `.ssb / .cw / .fm` badge barve v glavnem CSS — `color:` je bil hardkodiran na temne akcent barve; zamenjano z `var(--accent/2/3)` za pravilno svetlo temo
- Az scatter grafikon — barve legende in oznak osi (`#7d8590`) niso bile temo-zavedne; zamenjano s `CC.tickColor`
- Tooltip karte lokatorjev — barva klicnih znakov (`#7d8590`) hardkodirana; zamenjano z `var(--muted)`

[1.3.1]: https://github.com/s56oa/EDIAnalitika/compare/v1.3...v1.3.1

---

## [1.3.0] — 2026-05-09

### Dodano
- **Svetla / temna tema** — gumb ☀️/🌙 v glavi preklopi med temno (privzeto) in svetlo temo; izbira se shrani v `localStorage`
- **Izvoz interaktivnega HTML (Opcija B)** — gumb "Izvozi interaktivni HTML" ustvari `.html` datoteko z vgrajenimi QSO podatki kot JSON; vsi grafikoni, karta in animacija so polno interaktivni (Chart.js, SVG karta); deluje brez bralnika datotek; tema, jezik in filter so funkcionalni
- **Filter tabele QSO** — iskalno polje nad tabelo "Vse zveze" za takojšnje filtriranje po klicnem znaku, lokatorju ali načinu dela

### Popravljeno
- Statična HTML oznaka različice v glavi popravljena na `v1.3` (JS jo je prepisal pri zagonu, toda statična vrednost je bila zastarela)

### Testi
- Dodanih 15 novih testov v `tests.html` in 7 v `run_tests.js` za: `APP_VERSION`, `mapThemeColors` (temne in svetle barve), `setTheme` (DOM efekti), prisotnost novih funkcij

[1.3.0]: https://github.com/s56oa/EDIAnalitika/releases/tag/v1.3

---

## [1.2.0] — 2026-05-08

### Dodano
- **Izvoz poročila v HTML** — gumb "Izvozi poročilo (HTML)" ustvari samostojno `.html` datoteko z vsemi grafikoni kot vgrajenimi PNG (base64), lokatorsko karto kot inline SVG, metrikami in tabelami kot statičen HTML brez JavaScript ali zunanjih odvisnosti

### Popravljeno
- `modeClass()` — FM zveze (način 3) so napačno dobile CSS razred `ssb` namesto `fm`; dodan manjkajoči `.fm` CSS razred v glavnih stilih in izvozenem HTML
- `parseEDI()` — sekcija `[QSORecords]` brez številke QSO-jev ni bila zaznana; popravek na `startsWith('[qsorecords')`
- Odvečna podpičja (`;;`) v funkciji `applyTransform()`

### Odstranjeno
- Mrtva koda: `hourMap`, `startDate`, `hourLabels` (neuporabljene spremenljivke v `render()`)

[1.2.0]: https://github.com/s56oa/EDIAnalitika/releases/tag/v1.2

---

## [1.1.0] — 2026-05-06

### Dodano
- **Timeline QSO** — točkovni grafikon čas (UTC) vs. razdalja, obarvan po načinu dela (SSB/CW/FM)
- **Kumulativne točke** — stopničasti črtni grafikon naraščanja skupnih km skozi čas tekmovanja
- **Heatmap aktivnosti** — barvna matrika ura × razdalja (8 razredov po 100 km); prikaže "zlato uro"
- **Animirana karta zvez** — SVG Mercatorjeva karta z kronološkim predvajanjem QSO; vključuje predvajanje/pavzo, časovni drsnik, prikaz UTC časa in števila QSO, 4 hitrosti, povečavo in premikanje
- PNG izvoz za vse štiri nove vizualizacije
- Nove i18n ključe za SL in EN vmesnik

[1.1.0]: https://github.com/s56oa/EDIAnalitika/releases/tag/v1.1

---

## [1.0.0] — 2026-05-06

### Dodano
- Uvoz REG1TEST EDI v1 dnevnika (povleci & spusti ali izbira datoteke)
- Metrike tekmovanja: skupaj QSO, točke, kvadranti WWL, DXCC, maks. razdalja, moč TX
- Grafikon aktivnosti po urah (UTC) z upoštevanjem preseka polnoči
- Histogram porazdelitve razdalj (100 km koraki)
- Tortni grafikon načina dela (SSB / CW / FM)
- Kompasni diagram — polarni prikaz azimuta in razdalje z interaktivnim hover tooltipom
- Scatter grafikon azimut vs. razdalja po načinu dela
- Vrstičasti grafikon zvez po državah z avtomatsko detekcijo prefiksa (36 evropskih DXCC entitet)
- Geografska karta lokatorjev — SVG, Mercatorjeva projekcija, premikanje in povečava, 3 načini barvanja
- Tabela Top 15 QSO po razdalji
- Tabela vseh zvez z razvrščanjem po datumu/uri
- Izvoz vsakega grafikona in karte kot PNG
- Gumb Natisni / PDF za celotno poročilo
- Dvojezični vmesnik SL / EN brez ponovnega nalaganja datoteke
- Značka različice v glavi aplikacije
- Vzorčna EDI datoteka `S59DGOJulijsko2021.edi`

### Varnost
- `escapeHTML()` — zaščita pred XSS pri vseh vrednostih iz EDI datoteke, ki se vstavijo prek `innerHTML`

### Popravljeno
- Uhajanje event listenerjev kompasa ob preklopu jezika
- `_workedBounds` se pravilno resetira ob nalaganju novega dnevnika

[1.0.0]: https://github.com/s56oa/EDIAnalitika/releases/tag/v1.0
