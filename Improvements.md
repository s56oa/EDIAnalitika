# Predlogi izboljšav / Improvement Proposals

Vse ideje za prihodnje verzije aplikacije EDI Log Analitika.  
Status: [ ] = ni implementirano, [x] = implementirano

---

## Prioriteta 1 — Uporabnost (UX)

- [ ] **Offline podpora**: Chart.js in Google Fonts lokalno vgrajena ali naložena kot `<link rel="preload">` z offline fallbackom. Trenutno brez interneta aplikacija nima grafov in fontov.

- [ ] **Povleci več datotek za primerjavo**: Prikaz dveh dnevnikov (npr. dve postaji, isto tekmovanje) z ločenimi barvami na karti in v tabelah. *Zahteva redesign podatkovnega modela.*

- [ ] **Filtriranje QSO tabele**: Iskalno polje nad tabelo za filtriranje po klicnem znaku, lokatorju ali načinu dela.

- [ ] **Razvrščanje stolpcev tabel**: Klik na glavo stolpca razvrsti tabelo naraščajoče/padajoče.

- [ ] **Prikaz statistike po operatorju**: Če dnevnik vsebuje več operatorjev (`MOpe1`), prikaži razčlenitev QSO po vsakem operatorju.

---

## Prioriteta 2 — Vizualizacije

- [ ] **Timeline QSO**: Točkovni grafikon čas vs. razdalja — prikaže, kdaj so bile narejene daljše zveze.

- [ ] **Heatmap aktivnosti**: Ura × razdalja (ali ura × azimut) kot barvna matrika — enostavno videti "zlato uro" tekmovanja.

- [ ] **Animirana karta**: Predvajanje QSO v kronološkem zaporedju s časovnim drsčem (slider).

- [ ] **Krivulja kumulativnih točk**: Grafikon naraščanja skupnih točk skozi čas tekmovanja.

---

## Prioriteta 3 — Izvozi

- [ ] **CSV izvoz**: Prenos celotne QSO tabele kot `.csv` za nadaljnjo analizo v Excelu / LibreOffice.

- [ ] **Izboljšan PDF**: Namesto `window.print()` generiranje pravega PDF z [jsPDF](https://github.com/parallax/jsPDF) — fiksna postavitev, logotip, brez odvisnosti od tiskalnih nastavitev brskalnika. *Zahteva dodaten CDN vir (~250 kB).*

- [ ] **Izvoz karte kot SVG**: Poleg PNG omogoči izvoz lokatorske karte v vektorskem SVG formatu.

---

## Prioriteta 4 — Tehnično

- [ ] **Prepoznava napak v EDI datoteki**: Namesto splošne napake prikaži vrstico in opis specifične težave (npr. napačna dolžina lokatorja, neveljaven datum).

- [ ] **Podpora za `[QSORecords` z različnimi ločili**: Nekatere verzije logging programov pišejo `[QSORecords;100]` z različnim presledkjem ali velikimi/malimi črkami — robustnejši parser.

- [ ] **URL hash stanje**: Ohrani izbrani jezikovni parameter v URL (`#lang=en`), da ga brskalnik zapomni.

- [ ] **Service Worker za offline**: Registracija SW, ki cachira aplikacijo in CDN vire ob prvem obisku — deluje brez interneta.

- [ ] **Dark/light mode toggle**: Alternativna svetla tema za tiskanje in boljšo berljivost na svetlih zaslonih.

---

## Prioriteta 5 — Skupnost

- [ ] **GitHub Pages namestitev**: Objava kot `https://s56oa.github.io/EDIAnalitika/` — direkten dostop brez prenosa datoteke.

- [ ] **Testna EDI datoteka v repozitoriju**: Primer anonimiziranega `.edi` dnevnika za demonstracijo in testiranje (`sample.edi`).

- [ ] **CHANGELOG.md**: Vodenje sprememb po verzijah v standardnem formatu [Keep a Changelog](https://keepachangelog.com/).

---

## Unit testi — ugotovitve

Ker je aplikacija ena HTML datoteka brez modularnih izvozov, direktni unit testi z orodji kot je Jest niso takoj možni. Opcije:

### Opcija A — Izvleči čiste funkcije v ločen `edi_core.js`
Funkcije `parseEDI`, `locToLatLon`, `bearing`, `haversine`, `getCountry`, `escapeHTML`, `modeName` nimajo nobenih stranskih učinkov (pure functions) in so idealne za testiranje. Izvoz v ločeno datoteko bi omogočil:
```bash
npm init -y && npm install --save-dev jest
# edi_core.test.js z ~40 testi
```
Slabost: aplikacija ni več povsem "en sam HTML".

### Opcija B — Browser testi z `<script>` injektom (brez build sistema)
Ustvari `tests.html`, ki naloži `edi_analytics.html` funkcije prek `<script src="">` in požene asercije v konzoli. Brez zunanjih odvisnosti, deluje v brskalniku.

### Opcija C — Playwright / Puppeteer E2E testi
Avtomatizirani testi v pravem brskalniku: naloži `.edi` datoteko, preveri, da se prikažejo pravi metapodatki in stevilo QSO. Bolj kompleksno, a testira celotno aplikacijo.

**Priporočilo**: Za zdaj je **Opcija B** (tests.html) najlažja brez spremembe arhitekture. Opcija A je smiselna, če se aplikacija nadalje razvija.
