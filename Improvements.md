# Predlogi izboljšav / Improvement Proposals

Vse ideje za prihodnje verzije aplikacije EDI Log Analitika.  
Status: [ ] = ni implementirano, [x] = implementirano

---

## Prioriteta 1 — Uporabnost (UX)

- [ ] **Offline podpora**: Chart.js in Google Fonts lokalno vgrajena ali naložena kot `<link rel="preload">` z offline fallbackom. Trenutno brez interneta aplikacija nima grafov in fontov.

- [ ] **Povleci več datotek za primerjavo**: Prikaz dveh dnevnikov (npr. dve postaji, isto tekmovanje) z ločenimi barvami na karti in v tabelah. *Zahteva redesign podatkovnega modela.*

- [x] **Filtriranje QSO tabele**: Iskalno polje nad tabelo za filtriranje po klicnem znaku, lokatorju ali načinu dela. *(v1.3)*

- [ ] **Razvrščanje stolpcev tabel**: Klik na glavo stolpca razvrsti tabelo naraščajoče/padajoče.

- [ ] **Prikaz statistike po operatorju**: Če dnevnik vsebuje več operatorjev (`MOpe1`), prikaži razčlenitev QSO po vsakem operatorju.

---

## Prioriteta 2 — Vizualizacije

- [x] **Timeline QSO**: Točkovni grafikon čas vs. razdalja — prikaže, kdaj so bile narejene daljše zveze. *(v1.1)*

- [x] **Heatmap aktivnosti**: Ura × razdalja kot barvna matrika — enostavno videti "zlato uro" tekmovanja. *(v1.1)*

- [x] **Animirana karta**: Predvajanje QSO v kronološkem zaporedju s časovnim drsčem (slider). *(v1.1)*

- [x] **Krivulja kumulativnih točk**: Grafikon naraščanja skupnih točk skozi čas tekmovanja. *(v1.1)*

---

## Prioriteta 3 — Izvozi

- [ ] **CSV izvoz**: Prenos celotne QSO tabele kot `.csv` za nadaljnjo analizo v Excelu / LibreOffice.

- [ ] **Izboljšan PDF**: Namesto `window.print()` generiranje pravega PDF z [jsPDF](https://github.com/parallax/jsPDF) — fiksna postavitev, logotip, brez odvisnosti od tiskalnih nastavitev brskalnika. *Zahteva dodaten CDN vir (~250 kB).*

- [ ] **Izvoz karte kot SVG**: Poleg PNG omogoči izvoz lokatorske karte v vektorskem SVG formatu.

### Izvoz analize v HTML za vgradnjo na spletno stran (WordPress, blog …)

Spodaj so možnosti za izvoz celotnega poročila v obliki, ki jo je mogoče objaviti ali vgraditi na drugo spletno stran brez strežnika in brez JavaScript odvisnosti.

#### [x] Opcija A — Samostojni HTML posnetek *(v1.2)*
Gumb **"Izvozi poročilo (HTML)"** ustvari novo `.html` datoteko, ki vsebuje:
- vse grafikone kot vgrajene slike `<img src="data:image/png;base64,...">` (iz Chart.js canvas),
- lokatorsko karto kot inline SVG,
- metrike, tabele in legendo kot statičen HTML,
- vse stile inline (brez zunanjih CSS),
- brez JavaScript — čisti statičen dokument.

Datoteko je mogoče:
- neposredno odpreti v brskalniku in poslati po e-pošti,
- priložiti kot prilogo forumskemu prispevku,
- v WordPress prilepiti z blokom **"Prilagojeni HTML"** (Custom HTML block),
- vgraditi z `<iframe src="analiza.html">` po gostovanju na kateremkoli spletnem prostoru.

**Prednosti**: brez odvisnosti, popolnoma prenosna datoteka, arhivsko prikladna.  
**Slabosti**: grafikoni so statične slike (brez hover tooltipov), animirana karta ni vključena.

---

#### [x] Opcija B — Miniaturna interaktivna stran z vgrajenimi podatki *(v1.3)*
Izvozi `.html` datoteko, ki je strukturno enaka aplikaciji, toda namesto bralnika datotek vsebuje QSO podatke vgrajene kot JSON spremenljivka:
```javascript
const EMBEDDED_DATA = { header: {...}, qsos: [...] };
```
Stran se ob nalaganju takoj izriše (brez gumba za nalaganje). Vsi grafikoni so interaktivni (Chart.js, kompas, karta). Datoteko je mogoče gostovati kot statično stran (GitHub Pages, Netlify, spletni prostor) ali na WordPress z vtičnikom za statično HTML gostovanje.

**Prednosti**: polna interaktivnost, vsebuje animirano karto.  
**Slabosti**: datoteka je večja (~500 kB z vsemi potmi SVG + CDN zahteva internet za Chart.js), vgradnja z `<iframe>` v WordPress zahteva vtičnik (npr. *Advanced iFrame*).

---

#### Opcija C — ZIP s PNG slikami + HTML poročilo
Izvozi `.zip` arhiv z:
- posameznimi PNG izvozi vsakega grafikona,
- `report.html` z `<img src="hour.png">` referencami,
- `qsos.csv` s celotno tabelo zvez.

Namenjeno: nalaganje PNG slik v WordPress medijsko knjižnico in vstavljanje z Gutenberg blokom za slike + tabelo.

**Prednosti**: slike so ločene in po posameznih blokov vgrajene v prispevek.  
**Slabosti**: zahteva JavaScript knjižnico za ustvarjanje ZIP na strani brskalnika ([JSZip](https://stuk.github.io/jszip/), ~100 kB), večstopenjski uvozni postopek za WordPress.

---

#### Opcija D — Permalink na GitHub Pages z URL-kodirano vsebino
Namesto lokalne datoteke se na GitHub Pages gostovana aplikacija odpre z vsebino dnevnika kodirano v URL hash ali prek Gist API:
- Majhni dnevniki (< 8 kB): gzip + base64 v `#data=...` fragmentu URL.
- Večji dnevniki: naložiti na GitHub Gist, aplikacija prebere prek Gist API in se izriše.

Rezultat: permalink, ki ga je mogoče vgraditi z `<a href>` ali `<iframe>`.

**Prednosti**: nobene lokalne datoteke, deljivo z URL-jem.  
**Slabosti**: URL z base64 je nepregleden; Gist API zahteva token; zasebnost (dnevnik gre na GitHub).

---

**Priporočeni vrstni red implementacije**: A → B → C. Opcija D je kompleksna in primerna le, če aplikacija dobi spletni portal.

---

## Prioriteta 4 — Tehnično

- [ ] **Prepoznava napak v EDI datoteki**: Namesto splošne napake prikaži vrstico in opis specifične težave (npr. napačna dolžina lokatorja, neveljaven datum).

- [ ] **Podpora za `[QSORecords` z različnimi ločili**: Nekatere verzije logging programov pišejo `[QSORecords;100]` z različnim presledkjem ali velikimi/malimi črkami — robustnejši parser.

- [ ] **URL hash stanje**: Ohrani izbrani jezikovni parameter v URL (`#lang=en`), da ga brskalnik zapomni.

- [ ] **Service Worker za offline**: Registracija SW, ki cachira aplikacijo in CDN vire ob prvem obisku — deluje brez interneta.

- [x] **Dark/light mode toggle**: Alternativna svetla tema za tiskanje in boljšo berljivost na svetlih zaslonih. *(v1.3)*

---

## Prioriteta 5 — Skupnost

- [x] **GitHub Pages namestitev**: Objava kot `https://s56oa.github.io/EDIAnalitika/` *(v1.0)*

- [x] **Testna EDI datoteka v repozitoriju**: `S59DGOJulijsko2021.edi` — anonimiziran primer za demonstracijo in testiranje. *(v1.0)*

- [x] **CHANGELOG.md**: Vodenje sprememb po verzijah v standardnem formatu [Keep a Changelog](https://keepachangelog.com/). *(v1.0)*

---

## Unit testi — ugotovitve

- [x] **Opcija B — Browser testi** (`tests.html`): iframe-based vizualni prikaz, 84 testnih primerov. *(v1.0)*
- [x] **Node.js CLI runner** (`run_tests.js`): brez strežnika, brez zunanjih odvisnosti. *(v1.0)*

Ker je aplikacija ena HTML datoteka brez modularnih izvozov, direktni unit testi z orodji kot je Jest niso takoj možni. Opcije:

### Opcija A — Izvleči čiste funkcije v ločen `edi_core.js`
Funkcije `parseEDI`, `locToLatLon`, `bearing`, `haversine`, `getCountry`, `escapeHTML`, `modeName` nimajo nobenih stranskih učinkov (pure functions) in so idealne za testiranje. Izvoz v ločeno datoteko bi omogočil:
```bash
npm init -y && npm install --save-dev jest
# edi_core.test.js z ~40 testi
```
Slabost: aplikacija ni več povsem "en sam HTML".

### Opcija C — Playwright / Puppeteer E2E testi
Avtomatizirani testi v pravem brskalniku: naloži `.edi` datoteko, preveri, da se prikažejo pravi metapodatki in stevilo QSO. Bolj kompleksno, a testira celotno aplikacijo.
