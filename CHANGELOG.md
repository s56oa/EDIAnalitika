# Changelog

Vse pomembne spremembe so zabeležene v tej datoteki.  
Format sledi [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), verzioniranje pa [Semantic Versioning](https://semver.org/).

---

## [1.6.0] — 2026-05-25

### Dodano
- **Izvoz CSV** — gumb "Izvozi CSV" prenese celotno QSO tabelo kot `.csv` z UTF-8 BOM; semicolon-ločena; stolpci: `#`, `Date`, `Time (UTC)`, `Callsign`, `Mode`, `Locator`, `Distance (km)`, `Azimuth (°)`; azimut izračunan iz domačega lokatorja
- **Shranjevanje dnevnika (LocalStorage)** — zadnjih 5 naloženih dnevnikov se avtomatsko shrani; gumbi "Nadaljuj z zadnjim dnevnikom" omogočajo takojšen ponovni dostop brez ponovnega nalaganja datoteke; samodejno čiščenje po 30 dneh; deduplikacija po imenu datoteke
- **`confirmOverwrite()`** — potrditveni dialog pred prepisovanjem obstoječega shranjenega dnevnika z istim imenom datoteke
- **`formatLogTime(ts)`** — formatira timestamp v `DD.MM.YYYY HH:MM` za prikaz v seznamu zgodovine

### Popravljeno
- **`exportCSV()`** — manjkajoč `return` v `map` callbacku; QSO vrstice so bile `undefined` → CSV je vseboval le glavo tabele
- **`resetApp()`** — klik na "↩ Nov dnevnik" je po pomoti brisal celotno zgodovino dnevnikov; zdaj le posodobi gumbe brez brisanja
- **`exportHTMLInteractive()`** — `exportCSV` ni bil vključen v seznam serializiranih funkcij; izvožena datoteka ni imela delujočega CSV gumba
- **`loadStoredLog()`** — `warnBox` ni bil vedno očiščen pred novim prikazom opozoril iz shranjenega dnevnika
- **`getLogHistory()`** — `JSON.parse("null")` vrne `null`, ne polje; dodan `Array.isArray()` guard prepreči zrušitev pri poškodovanih podatkih
- Statična HTML značka različice v glavi (`v1.5`) posodobljena na `v1.6`

### Izboljšano
- **`saveLogToStorage(ediText, fileName, meta?)`** — neobvezni `meta` parameter `{call, contest}` preprečuje dvojni klic `parseEDI()`; klicatelji (`handleFile`, `loadStoredLog`) posredujejo že parsiran header
- **`confirmOverwrite()`** — sporočilo premaknjeno iz direktne `_lang` primerjave v `STRINGS` objekt (`confirmOverwriteMsg` s placeholderji `{file}`, `{call}`, `{time}`) za doslednost z i18n sistemom
- **`extractFn()` v `run_tests.js`** — zamenjava krhke `[\s\S]*?\n\}` regex ekstrakcije z brace-counting ekstraktorjem; pravilno preskakuje string, template in regex literale (vključno z `"` v regex character classih kot `/[..."<>|]/`)

### Testi
- 178 testnih primerov v CLI (`run_tests.js`), ~159 v brskalniku (`tests.html`)
- Dodane nove testne skupine: `v1.6 — new functions (typeof)` (10 funkcij), `v1.6 — formatLogTime` (4 primeri z mejnimi vrednostmi), `v1.6 — storage helpers` (11 testov z realnim localStorage v brskalniku; 9 testov z mock localStorage v Node.js)
- Storage testi shranijo in obnovijo originalno vrednost `ediLogHistory` — testni tek ne uniči shranjenih dnevnikov

[1.6.0]: https://github.com/s56oa/EDIAnalitika/compare/v1.5...v1.6

---

## [1.5.0] — 2026-05-25

### Dodano
- **Footer z licenco MIT** — stalna vrstica na dnu strani (`v1.5 · s56oa/EDIAnalitika · MIT License`); klik na "MIT License" odpre overlay z besedilom licence; zapiranje z `×`, klikom zunaj ali tipko `Escape`; skrito pri tisku
- **Opozorila pri parsiranju EDI** — `#warnBox` (jantarni panel pod metrikami) prikazuje opozorila z vrstico in vzrokom po uspešnem nalaganju datoteke
- **Podpora za 4-znakoven Maidenhead lokator** — `locToLatLon('JN75')` vrne center kvadranta (ekvivalent `JN75MM`); koristen za dnevnike, ki beležijo lokatorje brez podmreže

### Popravljeno
- **`locToLatLon()` — validacija lokatorja**: dodan regex `/^[A-R]{2}[0-9]{2}/` za preverjanje veljavnih znakov in `/^[A-R]{2}[0-9]{2}[A-X]{2}/` za subsquare; zavrača 5-znakoven (nestandarden) in 7+ znakoven (pokvarjen) lokator; sprejema 4-znakoven (center kvadranta)
- **`parseEDI()` — validacija datuma**: polje `p[0]` (YYMMDD) preverjeno z regex in obsegi (mm 01–12, dd 01–31); QSO z neveljavnim datumom se preskoči in sproži opozorilo v `#warnBox`
- **`parseEDI()` — validacija načina dela**: sprejema samo 1/2/3; neveljavna vrednost privzeto na SSB (1) in sproži opozorilo; QSO ni preskočen (način je popravljiv podatek)
- **`filterQsoTable()` — debounce**: dodan 150 ms debounce pri tipkanju (`oninput` pošlje `debounced=true`); programatski klici iz `applyAllTable()` ostanejo takojšnji
- **Memory leak: SVG event listenerji pan karte** — `mousedown`, `wheel`, `touchstart`, `touchmove`, `touchend` na `#mapSvg` in `#animMapSvg` so se kopičili ob vsakem `resetApp()+reload` ciklu; popravljeno: `initMapPan()` in `initAnimPan()` se izvedeta enkrat — `_mapPanInited`/`_amPanInited` se ne resetirata; `_panStart`/`_amPanStart` se počistita ob resetiranju
- **`renderMapData()` — DOM batch**: vsi `appendChild` klici gredo v `DocumentFragment`; en sam `g.appendChild(frag)` zamenja individualne vstavljave

### Testi
- 149 testnih primerov v CLI (`run_tests.js`), ~134 v brskalniku (`tests.html`)
- Dodane nove testne skupine: `parseEDI — validation & warnings` (datum, način dela, mešani scenariji), razširjeni `locToLatLon` testi (7-znakoven, 5-znakoven, 4-znakoven lokator)
- Posodobljeni testi verzije na `'1.5'`

[1.5.0]: https://github.com/s56oa/EDIAnalitika/compare/v1.4...v1.5

---

## [1.4.0] — 2026-05-24

### Dodano
- **Offline podpora** — Chart.js 4.4.1 (200 kB) vgrajen neposredno v HTML; grafikoni delujejo brez internetne povezave. Google Fonts se nalagajo z `<link rel="preload">` vzorcem (ne-blokirno); brskalnik sistemski font se uporabi kot fallback, ko ni interneta.
- **Razvrščanje stolpcev tabele "Vse zveze"** — klik na glavo stolpca razvrsti naraščajoče ali padajoče; ponovni klik obrne smer (▲ / ▼); razvrščanje se ohrani ob hkratnem filtriranju; stolpec `#` prikazuje izvirni kronološki vrstni red
- **Razvrščanje po datumu/uri** — tiebreaker pri enakem UTC času: prejšnji datum dobi prednost; zagotavlja deterministično zaporedje pri zvezah z istim časovnim žigom

### Popravljeno
- `applyAllTable()` — razvrščanje po `time`: pri enakem času ure tiebreaker upošteva datum (`(hh*60+mi)*10000000+(yy*10000+mm*100+dd)`); prej so zveze z enakim časom dobile nedeterminirano zaporedje
- `run_tests.js` — ekstrakcija izvorne kode: zamenjana krhka regex z eksplicitnim `indexOf`; preprečuje napačno ujemanje z `<script>` znotraj predloge za izvoz

### Testi
- Dodanih 26 novih testnih primerov v `run_tests.js` (skupaj 122): `origIdx` dodelitev, ključi razvrščanja po razdalji / klicnem znaku / načinu / času, tiebreaker za enaki čas, logika preklapljanja smeri razvrščanja
- Posodobljeni testi verzije na `'1.4'`

[1.4.0]: https://github.com/s56oa/EDIAnalitika/compare/v1.3.1...v1.4

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
