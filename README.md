# EDI Log Analitika / EDI Log Analytics

Spletna aplikacija za analizo radioamaterskih tekmovalnih dnevnikov v formatu REG1TEST EDI.  
Web application for analysing amateur radio contest logs in REG1TEST EDI format.

---

## Slovenščina

### Opis

EDI Log Analitika je enostranska spletna aplikacija, ki uvozi vaš tekmovalni dnevnik v formatu REG1TEST EDI (v1) in ga vizualizira z naborom interaktivnih grafikonov ter kart. Celotna obdelava poteka v brskalniku — datoteka se nikoli ne pošlje na strežnik.

Namenjena je radioamaterjem, ki tekmujejo v VHF (in UHF) tekmovanjih, kjer se za izmenjavo dnevnikov uporablja format EDI. Vmesnik je na voljo v slovenskem in angleškem jeziku.

### Funkcionalnosti

- **Uvoz EDI datoteke** — povleci in spusti ali klasična izbira datoteke
- **Metrike tekmovanja** — število QSO, točke, kvadranti WWL, DXCC, maksimalna razdalja, moč oddajnika
- **Aktivnost po urah (UTC)** — stolpični grafikon z upoštevanjem preseka polnoči
- **Porazdelitev razdalj** — histogram po korakih 100 km
- **Način dela** — tortni grafikon SSB / CW / FM
- **Kompasni diagram** — polarni diagram azimut + razdalja z interaktivnim povečanjem posameznih QSO ob premiku miške
- **Scatter: azimut vs. razdalja** — razpršeni diagram po načinu dela
- **Zveze po državah** — vrstičasti grafikon z detekcijo prefiksa
- **Geografska karta lokatorjev** — SVG karta z Mercatorjevo projekcijo, premaknljiva in z možnostjo povečave; trije načini barvanja (razdalja / število QSO / način dela)
- **Tabeli QSO** — Top 15 po razdalji in celotna tabela vseh zvez
- **Izvoz PNG** — vsak grafikon in karta se izvozi kot PNG slika z imenom postaje
- **Tisk / PDF** — gumb za tiskanje oziroma shranjevanje v PDF neposredno iz brskalnika
- **Dvojezičnost** — SL / EN preklapljanje brez ponovnega nalaganja datoteke

### Uporaba

1. Odpri `edi_analytics.html` v brskalniku (Chrome, Firefox, Edge, Safari).
2. Povleci EDI datoteko na označeno polje ali klikni **Izberi datoteko**.
3. Analize se prikažejo takoj.
4. Za izvoz klikni **PNG** pri želenem grafikonu ali **Natisni / PDF** za celotno poročilo.
5. Za uvoz novega dnevnika klikni **↩ Nov dnevnik**.

### Format EDI

Aplikacija podpira format **REG1TEST EDI v1** — standardni format za izmenjavo dnevnikov VHF tekmovanj v Evropi. Datoteka mora imeti končnico `.edi` ali `.EDI`. Dnevnik se ne pošilja nikamor; celotna obdelava je lokalna v brskalniku.

Tipične vrednosti iz glave, ki jih aplikacija prebere:

| Ključ EDI | Pomen |
|---|---|
| `PCal` | Klicni znak postaje |
| `PWWLo` | Lokator domače postaje (Maidenhead, 6 znakov) |
| `PBand` | Band (npr. `144 MHz`) |
| `TName` | Ime tekmovanja |
| `MOpe1` | Operatorji (ločeni s podpičji) |
| `CQSOp` | Deklarirane točke |

### Tehnične podrobnosti

- Ena datoteka HTML, CSS, JavaScript — brez ogrodij, brez strežnika, brez namestitvenih korakov.
- Zunanja odvisnost: [Chart.js 4.4.1](https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js) (CDN) in Google Fonts (Space Mono, DM Sans). Za offline delovanje je priporočljivo lokalno streženje obeh virov.
- Karta Evrope je vgrajena kot SVG poti (Natural Earth podatki) — ne zahteva internetne povezave.
- Podprti brskalniki: Chrome 99+, Firefox 112+, Edge 99+, Safari 15.4+.

### Avtor

**S56OA — Ognjen Antonic**  
GitHub: [https://github.com/s56oa/EDIAnalitika](https://github.com/s56oa/EDIAnalitika)

---

## English

### Description

EDI Log Analytics is a single-page web application that imports your REG1TEST EDI (v1) amateur radio contest log and visualises it with a set of interactive charts and maps. All processing happens in the browser — the file is never sent to any server.

It is aimed at amateur radio operators who participate in VHF (and UHF) contests where the EDI format is used for log exchange. The interface is available in Slovenian and English.

### Features

- **EDI file import** — drag & drop or classic file picker
- **Contest metrics** — total QSOs, points, WWL squares, DXCC count, maximum distance, TX power
- **Hourly activity (UTC)** — bar chart with correct handling of midnight crossovers
- **Distance distribution** — histogram in 100 km bins
- **Mode breakdown** — doughnut chart for SSB / CW / FM
- **Compass diagram** — polar chart of azimuth + distance with per-QSO hover tooltip
- **Scatter: azimuth vs. distance** — scatter plot grouped by mode
- **QSOs by country** — horizontal bar chart with automatic prefix detection
- **Locator map** — pannable and zoomable SVG map (Mercator projection) with three colour modes: distance / QSO count / operating mode
- **QSO tables** — Top 15 by distance and full log table
- **PNG export** — each chart and the map can be saved as a PNG image named after the station callsign
- **Print / PDF** — one-click print or browser Save-as-PDF for a complete statistics report
- **Bilingual UI** — SL / EN switching without re-loading the file

### Usage

1. Open `edi_analytics.html` in a browser (Chrome, Firefox, Edge, Safari).
2. Drag your EDI file onto the marked area or click **Choose file**.
3. All analytics appear immediately.
4. To export, click **PNG** next to any chart or **Print / PDF** for the full report.
5. To load a new log, click **↩ New log**.

### EDI Format

The application supports the **REG1TEST EDI v1** format — the standard log exchange format for VHF contests in Europe. The file must have a `.edi` or `.EDI` extension. No data leaves the browser; all processing is local.

Key EDI header fields read by the application:

| EDI key | Meaning |
|---|---|
| `PCal` | Station callsign |
| `PWWLo` | Home locator (Maidenhead, 6 characters) |
| `PBand` | Band (e.g. `144 MHz`) |
| `TName` | Contest name |
| `MOpe1` | Operators (semicolon-separated) |
| `CQSOp` | Declared points |

QSO record columns (0-based): `[0]` date YYMMDD, `[1]` time HHMM, `[2]` callsign, `[3]` mode (1=SSB, 2=CW, 3=FM), `[9]` worked locator, `[10]` distance km.

### Technical Details

- Single HTML file — CSS and JavaScript included inline. No framework, no server, no installation.
- External dependency: [Chart.js 4.4.1](https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js) (CDN) and Google Fonts (Space Mono, DM Sans). For offline use, serve both resources locally.
- The European map is embedded as SVG paths (Natural Earth data) and requires no internet connection.
- Supported browsers: Chrome 99+, Firefox 112+, Edge 99+, Safari 15.4+.

### Country Prefix Detection

The application includes a built-in prefix table covering all European DXCC entities (ITU / DXCC list). Detection is regex-based, with more specific prefixes (e.g. `HB0` for Liechtenstein) checked before broader ones (e.g. `HB` for Switzerland). Portable suffixes (`/P`, `/M`, etc.) are stripped before matching.

### Privacy

The EDI file is loaded with the browser's `FileReader` API and processed entirely in client-side JavaScript. No data is transmitted to any server. No cookies, no tracking, no external analytics.

### Author

**S56OA — Ognjen Antonic**  
GitHub: [https://github.com/s56oa/EDIAnalitika](https://github.com/s56oa/EDIAnalitika)

### License

This project is released under the [MIT License](LICENSE).
