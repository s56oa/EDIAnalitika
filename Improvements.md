# Predlogi izboljšav / Improvement Proposals

Vse ideje za prihodnje verzije aplikacije EDI Log Analitika.  
Status: `[ ]` = ni implementirano, `[x]` = implementirano, `[~]` = delno implementirano

Zadnja analiza: v1.5 (2026-05-25)

---

## Prioriteta 1 — Robustnost in napake

Pomanjkljivosti, ki vplivajo na pravilnost rezultatov ali povzročijo tihe napake pri realnih dnevnikih.

- [x] **Validacija lokatorja v `locToLatLon()`** — dodan regex `/^[A-R]{2}[0-9]{2}/` za preverjanje veljavnih znakov; sprejema 4-znakoven lokator (JN75 → center kvadranta JN75MM); zavrača 5-znakoven (nestandarden) in 7+-znakoven (pokvarjen); subsquare preverjeno z `/^[A-R]{2}[0-9]{2}[A-X]{2}/`. *(v1.5)*

- [x] **Validacija datuma v `parseEDI()`** — polje `p[0]` (YYMMDD) preverjeno z regex in obsegi (mm 01–12, dd 01–31); QSO z neveljavnim datumom se preskoči; opozorilo se prikaže v UI. *(v1.5)*

- [x] **Validacija načina dela v `parseEDI()`** — sprejema samo 1/2/3; neveljavna vrednost privzeto na SSB (1) in sproži opozorilo. QSO ni preskočen (način je popravljiv podatek). *(v1.5)*

- [ ] **Validacija razdalje** — odločeno: brez validacije vrednosti; razdalja prihaja iz logging programa in ji zaupamo. QSO z dist=0 že filtrirani v obstoječi `valid` logiki.

- [x] **Prepoznava napak v EDI datoteki** — `handleFile()` po uspešnem nalaganju prikaže opozorila z vrstico in vzrokom v `#warnBox` (oranžen `warn-toast` panel pod metrikami). *(v1.5)*

- [x] **Podpora za `[QSORecords` z različnimi ločili** — `startsWith('[qsorecords')` (lowercase) pokriva `[QSORecords;100]`, `[QSORecords]`, `[qsorecords 100]` itd. *(v1.0, preverjeno v1.5)*

---

## Prioriteta 2 — Zmogljivost in stabilnost

Težave, ki postanejo opazne pri večjih dnevnikih (500+ QSO) ali daljši seji.

- [x] **Debounce filtra tabele** — `filterQsoTable(q, debounced)` z drugim parametrom; `oninput` pošlje `true` → 150 ms debounce; klici iz `applyAllTable()` ostanejo takojšnji. *(v1.5)*

- [x] **Memory leak: event listenerji pan karte** — `mousedown`, `wheel`, `touchstart`/`move`/`end` na SVG elementih so se kopičili ob vsakem `resetApp()+reload` ciklu; popravljeno: `initMapPan()` in `initAnimPan()` se izvedeta enkrat za vedno — `_mapPanInited`/`_amPanInited` flagov se ne resetira; `_panStart`/`_amPanStart` se počistita ob resetiranju za čisto drag stanje. *(v1.5)*

- [ ] **Lazy render grafov** — odloženo; benefit je opazen le na mobilnih/počasnih napravah. Prioriteta srednja–velika.

- [x] **DOM batch pri `renderMapData()`** — vsi `appendChild` klici gredo v `DocumentFragment`; en sam `g.appendChild(frag)` zamenja individualne vstavljave. *(v1.5)*

---

## Prioriteta 3 — Uporabnost (UX)

- [x] **Filtriranje QSO tabele** — iskalno polje nad tabelo za filtriranje po klicnem znaku, lokatorju ali načinu dela. *(v1.3)*

- [x] **Razvrščanje stolpcev tabel** — klik na glavo stolpca razvrsti tabelo naraščajoče/padajoče; razvrščanje se ohrani ob filtriranju; `#` stolpec prikazuje izvirni kronološki indeks. *(v1.4)*

- [x] **Offline podpora** — Chart.js 4.4.1 vgrajen inline; Google Fonts naložen z neblokiočnim preload vzorcem. *(v1.4)*

- [x] **Footer z licenco MIT** — stalna vrstica na dnu (`v1.5 · s56oa/EDIAnalitika · MIT License`); klik na "MIT License" odpre overlay z besedilom licence; `Escape` / klik zunaj / `×` zapre; skrito pri tisku. *(v1.5)*

- [ ] **Loading indikator** — pri nalaganju velikih datotek (>1 MB) ni nobene povratne informacije; UI se zdi zamrznjena. Pokaži `"Analiziram dnevnik…"` sporočilo v dropzoni med branjem in parsiranjem.

- [ ] **Povratna informacija pri izvozu** — po kliku na PNG/HTML gumb ni nobenega znaka, da je prenos uspel (ali spodletel). Prikaži toast obvestilo `"✓ Prenesen: S56OA_144MHz.png"`.

- [ ] **Iskanje in označevanje klicnega znaka** — vpiši klicni znak (npr. `S59DGO`) in vse zveze s tem znakom se označijo na karti, kompasu in v tabeli. Koristno za iskanje specifičnih ali redkih zvez.

- [ ] **Zoom na časovni razpon animacije** — pri animirani karti omeji predvajanje na izbran časovni okvir (npr. samo 09:00–11:00 UTC); koristno za analizo dinamike v kritičnih urah tekmovanja.

- [ ] **Legenda za kompasni diagram** — pri gostih dnevnikih (100+ QSO) se točke SSB/CW prekrivajo in barv ni mogoče razbrati; dodaj legendo ali možnost filtriranja po načinu.

- [ ] **Prikaz statistike po operatorju** — če dnevnik vsebuje več operatorjev (`MOpe1`), prikaži razčlenitev QSO po vsakem operatorju.

- [ ] **URL hash za stanje** — ohrani jezikovni parameter v URL (`#lang=en`), da ga brskalnik/zaznamek zapomni.

- [ ] **Povleci več datotek za primerjavo** — prikaz dveh dnevnikov z ločenimi barvami na karti in v tabelah. *Zahteva redesign podatkovnega modela.*

---

## Prioriteta 4 — Vizualizacije

- [x] **Timeline QSO** — točkovni grafikon čas vs. razdalja. *(v1.1)*
- [x] **Heatmap aktivnosti** — ura × razdalja kot barvna matrika. *(v1.1)*
- [x] **Animirana karta** — kronološko predvajanje QSO s časovnim drsnikom. *(v1.1)*
- [x] **Krivulja kumulativnih točk** — grafikon naraščanja skupnih točk skozi čas. *(v1.1)*

- [ ] **Lokatorski heatmap** — vizualizacija, kateri WWL 4-znaki se pojavljajo najpogosteje; prikaže strateške lokacije tekmovalcev.

- [ ] **Analiza portable/mobile postaj** — ločen prikaz zvez s `/P`, `/M`, `/MM` pripono; pove, koliko QSO je bilo z mobilnimi ali prenosnimi postajami.

- [ ] **Analiza izmenjave (RST)** — prikaži porazdelitev sprejetih RST poročil; pove o kakovosti zvez in pogojih.

- [ ] **Grafikon razdalja vs. azimut po urah** — kombinirana vizualizacija, ki razkrije, v kateri smeri in kdaj so bile narejene daljše zveze.

---

## Prioriteta 5 — Izvozi

- [ ] **CSV izvoz** — prenos celotne QSO tabele kot `.csv` za nadaljnjo analizo v Excelu / LibreOffice.

- [ ] **Izvoz karte kot SVG** — poleg PNG omogoči izvoz lokatorske karte v vektorskem SVG formatu.

- [ ] **Izboljšan PDF** — namesto `window.print()` generiranje pravega PDF z [jsPDF](https://github.com/parallax/jsPDF). *Zahteva dodaten CDN vir (~250 kB).*

### Izvoz analize v HTML za vgradnjo na spletno stran (WordPress, blog …)

#### [x] Opcija A — Samostojni HTML posnetek *(v1.2)*
Gumb **"Izvozi poročilo (HTML)"** ustvari `.html` z vsemi grafikoni kot vgrajenimi PNG, karto kot inline SVG in tabelami kot statičen HTML brez JavaScript ali zunanjih odvisnosti.

**Prednosti**: brez odvisnosti, arhivsko prikladna.  
**Slabosti**: grafikoni so statične slike, animirana karta ni vključena.

---

#### [x] Opcija B — Interaktivna stran z vgrajenimi podatki *(v1.3)*
Gumb **"Izvozi interaktivni HTML"** ustvari `.html` z QSO podatki kot vgrajeno JSON spremenljivko. Vsi grafikoni, karta, animacija, filter in razvrščanje so funkcionalni.

**Prednosti**: polna interaktivnost.  
**Slabosti**: ~500 kB, CDN zahteva internet za Chart.js.

---

#### Opcija C — ZIP s PNG slikami + HTML poročilo
Izvozi `.zip` z ločenimi PNG grafikoni, `report.html` in `qsos.csv`.

**Zahtevnost**: srednja (zahteva [JSZip](https://stuk.github.io/jszip/), ~100 kB).

---

#### Opcija D — Permalink na GitHub Pages z URL-kodirano vsebino
Gzip + base64 vsebine dnevnika v URL hash ali Gist API permalink.

**Prednosti**: nobene lokalne datoteke, deljivo z URL-jem.  
**Slabosti**: URL z base64 je nepregleden; Gist API zahteva token.

---

**Priporočeni vrstni red implementacije**: A → B → C. Opcija D je primerna le za spletni portal.

---

## Prioriteta 6 — Tehnični dolg

Arhitekturne pomanjkljivosti brez takojšnjega vidnega učinka, ki otežujejo vzdrževanje.

- [ ] **Centralizacija globalnega stanja** — aplikacija ima 30+ globalnih spremenljivk (`_lang`, `_theme`, `_vx`, `_vy`, `_vz`, `_amQsos`, `_amInterval`, `_mapQsosData`, …) brez jasne strukture. Refaktoriraj v eno objektno drevo (`appState.ui`, `appState.map`, `appState.anim`).

- [ ] **Konstante v config objekt** — razdalje (`[0, 100, 200, …]`), barve, velikosti canvasa in polmeri kompasa so hardkodirani na 3+ mestih. Izvleči v `const CONFIG = { DISTANCE_BINS, COMPASS_RINGS, … }`.

- [ ] **Deduplikacija SVG kode za karti** — `buildBaseSvg()` (statična karta) in `buildAnimBase()` (animirana karta) vsebujeta skoraj identičen kod za gridlines, country paths in barvne sheme; sprememba ene ne posodobi druge. Izvleči skupno logiko.

- [ ] **Service Worker za offline** — registracija SW, ki cachira aplikacijo in CDN vire ob prvem obisku za popolno offline delovanje. *Chart.js je že bundled; SW bi pokrila še animirani HTML export.*

---

## Prioriteta 7 — Skupnost

- [x] **GitHub Pages namestitev** — `https://s56oa.github.io/EDIAnalitika/` *(v1.0)*
- [x] **Testna EDI datoteka** — `S59DGOJulijsko2021.edi` *(v1.0)*
- [x] **CHANGELOG.md** *(v1.0)*
- [x] **GitHub Releases z `edi_analytics.html` kot asset** *(v1.4)*

- [ ] **Temno ozadje za GitHub Pages landing** — README.md na GitHub Pages ni stiliziran; dodaj `index.html` z navodili in primeri zaslonskih posnetkov.

---

## Unit testi — stanje

- [x] **Browser testi** (`tests.html`): iframe-based vizualni prikaz, ~134 testnih primerov. *(v1.0)*
- [x] **Node.js CLI runner** (`run_tests.js`): 149 testnih primerov, brez strežnika ali zunanjih odvisnosti. *(v1.0)*

### Pokrite funkcije
`escapeHTML`, `modeName`, `modeClass`, `locToLatLon` (6-znakoven, 4-znakoven, 5-znakoven, 7+-znakoven, neveljavni znaki), `haversine`, `bearing`, `getCountry` (36 evropskih entitet + portable pripone), `parseEDI` (header, QSO zapisi, validacija datuma, validacija načina dela, opozorila), `mapThemeColors`, `APP_VERSION`, razvrščanje QSO tabele (`origIdx`, dist, call, mode, time + tiebreaker, toggle logika).

### Nepokrite funkcije (priložnosti)
- `render()` — kompleksna DOM funkcija; zahteva browser okolje
- `exportPNG()` / `exportHTML()` — E2E testi z [Playwright](https://playwright.dev/)
- `buildBaseSvg()` / `renderMapData()` — SVG izhod bi se dal validirati v Node.js
- Animacijska logika (`_amInterval`, `buildAnimBase`) — zahteva browser

### Opcije za razširitev testov

#### Opcija A — Izvleči čiste funkcije v ločen `edi_core.js`
`parseEDI`, `locToLatLon`, `bearing`, `haversine`, `getCountry`, `escapeHTML`, `modeName` so čiste funkcije brez stranskih učinkov — idealne za Jest. Slabost: aplikacija ni več povsem "en sam HTML".

#### Opcija C — Playwright / Puppeteer E2E testi
Avtomatizirani testi v pravem brskalniku: naloži `.edi` datoteko, preveri metapodatke, število QSO, izrise. Testira celotno aplikacijo, vključno z DOM in izvozi.
