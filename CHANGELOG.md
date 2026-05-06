# Changelog

Vse pomembne spremembe so zabeležene v tej datoteki.  
Format sledi [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), verzioniranje pa [Semantic Versioning](https://semver.org/).

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
