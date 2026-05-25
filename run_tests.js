#!/usr/bin/env node
// CLI test runner — extracts pure functions from edi_analytics.html and runs all unit tests.
// No external dependencies. Requires Node.js 16+.
'use strict';

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/edi_analytics.html', 'utf8');
const chartjsClose = html.indexOf('</script>');
const appOpen = html.indexOf('<script>', chartjsClose);
const src = html.slice(appOpen + '<script>'.length, html.lastIndexOf('</script>'));

const blocks = [
  src.match(/function escapeHTML[\s\S]*?\}/)[0],
  src.match(/function modeName[\s\S]*?\}/)[0],
  src.match(/function modeClass[\s\S]*?\}/)[0],
  src.match(/function locToLatLon[\s\S]*?\n\}/)[0],
  src.match(/function bearing[\s\S]*?\n\}/)[0],
  src.match(/function haversine[\s\S]*?\n\}/)[0],
  src.match(/const PFX = \[[\s\S]*?\];[\s\S]*?function getCountry[\s\S]*?\n\}/)[0],
  src.match(/function parseEDI[\s\S]*?\n\}/)[0],
].join('\n');
const {escapeHTML, modeName, modeClass, locToLatLon, bearing, haversine, getCountry, parseEDI} =
  new Function(blocks + '\nreturn {escapeHTML,modeName,modeClass,locToLatLon,bearing,haversine,getCountry,parseEDI}')();

// ── Test framework ──────────────────────────────────────────────
let pass = 0, fail = 0;
const green = s => `\x1b[32m${s}\x1b[0m`;
const red   = s => `\x1b[31m${s}\x1b[0m`;

function group(name) { console.log(`\n── ${name}`); }

function assertEqual(actual, expected, label) {
  if (actual === expected) { pass++; console.log(green(' ✓') + ' ' + label); }
  else { fail++; console.log(red(' ✗') + ` ${label}\n    got:      ${JSON.stringify(actual)}\n    expected: ${JSON.stringify(expected)}`); }
}
function assertClose(actual, expected, tol, label) {
  if (typeof actual === 'number' && Math.abs(actual - expected) <= tol) {
    pass++; console.log(green(' ✓') + ` ${label} (${actual.toFixed(2)})`);
  } else { fail++; console.log(red(' ✗') + ` ${label}\n    got: ${actual}, expected ~${expected} ±${tol}`); }
}
function assertNull(actual, label) { assertEqual(actual, null, label); }
function assert(condition, label) {
  if (condition) { pass++; console.log(green(' ✓') + ' ' + label); }
  else { fail++; console.log(red(' ✗') + ' ' + label); }
}

// ════════════════════════════════════════════
group('escapeHTML');
assertEqual(escapeHTML('<script>'), '&lt;script&gt;',           'escapes angle brackets');
assertEqual(escapeHTML('"quoted"'), '&quot;quoted&quot;',        'escapes double quotes');
assertEqual(escapeHTML('&'),        '&amp;',                     'escapes ampersand');
assertEqual(escapeHTML('<b>x</b>'), '&lt;b&gt;x&lt;/b&gt;',    'escapes full tag');
assertEqual(escapeHTML(''),         '',                          'empty string unchanged');
assertEqual(escapeHTML(42),         '42',                        'coerces number to string');
assertEqual(escapeHTML('safe'),     'safe',                      'plain text unchanged');
assertEqual(escapeHTML('<img onerror=alert(1)>'), '&lt;img onerror=alert(1)&gt;', 'neutralises XSS payload');

// ════════════════════════════════════════════
group('modeName');
assertEqual(modeName(1), 'SSB', 'mode 1 = SSB');
assertEqual(modeName(2), 'CW',  'mode 2 = CW');
assertEqual(modeName(3), 'FM',  'mode 3 = FM');
assertEqual(modeName(0), '??',  'unknown mode = ??');
assertEqual(modeName(9), '??',  'out-of-range = ??');

// ════════════════════════════════════════════
group('modeClass');
assertEqual(modeClass(1), 'ssb', 'mode 1 = ssb');
assertEqual(modeClass(2), 'cw',  'mode 2 = cw');
assertEqual(modeClass(3), 'fm',  'mode 3 = fm');
assertEqual(modeClass(0), 'ssb', 'unknown mode = ssb (fallback)');

// ════════════════════════════════════════════
group('locToLatLon');
const jn75fo = locToLatLon('JN75FO');
assert(jn75fo !== null,          'JN75FO returns a result');
assertClose(jn75fo?.lat, 45.60, 0.1, 'JN75FO lat ≈ 45.6°N');
assertClose(jn75fo?.lon, 14.46, 0.1, 'JN75FO lon ≈ 14.5°E');
const io91vl = locToLatLon('IO91VL');
assert(io91vl !== null,          'IO91VL returns a result');
assertClose(io91vl?.lat, 51.48, 0.1, 'IO91VL lat ≈ 51.5°N (London)');
assertNull(locToLatLon('JN'),    'too-short locator (2 chars) → null');
assertNull(locToLatLon(''),      'empty string → null');
assertNull(locToLatLon('ZZZZZZ'),'invalid chars (Z not in A-R) → null');
assertNull(locToLatLon('JN75FY'),'invalid 6th char (Y not in A-X) → null');
assertNull(locToLatLon('JN75S'), '5-char locator (non-standard length) → null');
assertNull(locToLatLon('JN75FO!'), '7-char locator with trailing garbage → null');
assertNull(locToLatLon('JN75FOXX'), '8-char locator → null');
const lower = locToLatLon('jn75fo');
assert(lower !== null,           'lowercase locator accepted');
assertClose(lower?.lat, 45.60,  0.1, 'lowercase gives same lat as uppercase');
const jn75mm = locToLatLon('JN75MM');
const jn75_4 = locToLatLon('JN75');
assert(jn75_4 !== null,          '4-char locator JN75 → not null (center of square)');
assertClose(jn75_4?.lat, jn75mm?.lat, 0.001, '4-char JN75 lat = center of JN75MM');
assertClose(jn75_4?.lon, jn75mm?.lon, 0.001, '4-char JN75 lon = center of JN75MM');

// ════════════════════════════════════════════
group('haversine');
assertEqual(haversine(46, 14, 46, 14), 0, 'same point = 0 km');
const d1 = haversine(45.6, 14.5, 48.2, 16.4);
const d2 = haversine(48.2, 16.4, 45.6, 14.5);
assertEqual(d1, d2, `symmetric A→B = B→A (${d1} km)`);
const snWar = haversine(45.6, 14.5, 52.2, 21.0);
assert(snWar > 700 && snWar < 1100,  `Snežnik → Warsaw ≈ ${snWar} km (700–1100)`);
const snLon = haversine(45.6, 14.5, 51.5, -0.1);
assert(snLon > 1200 && snLon < 1800, `Snežnik → London ≈ ${snLon} km (1200–1800)`);
assert(haversine(0, 0, 1, 1) > 0,   'different points give positive distance');

// ════════════════════════════════════════════
group('bearing');
assertClose(bearing(45, 14, 55, 14),   0, 2,   'due North → 0°');
assertClose(bearing( 0,  0,  0, 10),  90, 0.1, 'due East on equator → exactly 90°');
assertClose(bearing(45, 14, 45, 24),  90, 4,   'due East at 45°N → ~86.5° (orthodrome)');
assertClose(bearing(55, 14, 45, 14), 180, 2,   'due South → 180°');
assertClose(bearing(45, 24, 45, 14), 270, 4,   'due West at 45°N → ~273.5° (orthodrome)');
const az = bearing(45.6, 14.5, 48.2, 16.4);
assert(az > 0 && az < 90, `Snežnik → Vienna NE quadrant (${az.toFixed(1)}°)`);

// ════════════════════════════════════════════
group('getCountry — neighbours');
assertEqual(getCountry('S56OA'),  'S5 (SVN)', 'S5 = Slovenia');
assertEqual(getCountry('9A2AA'),  '9A (HRV)', '9A = Croatia');
assertEqual(getCountry('OE5XYZ'), 'OE (AUT)', 'OE = Austria');
assertEqual(getCountry('OM3ABC'), 'OM (SVK)', 'OM = Slovakia');
assertEqual(getCountry('HA7PQ'),  'HA (HUN)', 'HA = Hungary');
assertEqual(getCountry('YU7EF'),  'YU (SRB)', 'YU = Serbia');
assertEqual(getCountry('T94B'),   'T9 (BIH)', 'T9 = Bosnia');
assertEqual(getCountry('4O3AA'),  '4O (MNE)', '4O = Montenegro');

group('getCountry — Western Europe');
assertEqual(getCountry('DL1ABC'), 'DL (DEU)', 'DL = Germany');
assertEqual(getCountry('DC3XYZ'), 'DL (DEU)', 'DC prefix = Germany');
assertEqual(getCountry('G4ZZZ'),  'G (GBR)',  'G = Great Britain');
assertEqual(getCountry('F5KAB'),  'F (FRA)',  'F = France');
assertEqual(getCountry('PA3AA'),  'PA (HOL)', 'PA = Netherlands');
assertEqual(getCountry('ON4AA'),  'ON (BEL)', 'ON = Belgium');
assertEqual(getCountry('HB9XYZ'), 'HB (SUI)', 'HB = Switzerland');
assertEqual(getCountry('HB0AAA'), 'HB0 (LIE)','HB0 = Liechtenstein (not Switzerland)');
assertEqual(getCountry('SM5ABC'), 'SM (SWE)', 'SM = Sweden');
assertEqual(getCountry('OH2BH'),  'OH (FIN)', 'OH = Finland');

group('getCountry — Eastern Europe');
assertEqual(getCountry('OK1ABC'), 'OK (CZE)', 'OK = Czech Republic');
assertEqual(getCountry('SP5XY'),  'SP (POL)', 'SP = Poland');
assertEqual(getCountry('YO8CRA'), 'YO (ROU)', 'YO = Romania');
assertEqual(getCountry('LZ1AB'),  'LZ (BGR)', 'LZ = Bulgaria');
assertEqual(getCountry('UR5XY'),  'UR (UKR)', 'UR = Ukraine');
assertEqual(getCountry('EU1AA'),  'EU (BLR)', 'EU = Belarus');

group('getCountry — portable suffixes');
assertEqual(getCountry('S56OA/P'),  'S5 (SVN)', '/P suffix stripped');
assertEqual(getCountry('DL1ABC/M'), 'DL (DEU)', '/M suffix stripped');
assertEqual(getCountry('G4ZZZ/MM'), 'G (GBR)',  '/MM suffix stripped');

// ════════════════════════════════════════════
group('parseEDI — header');
const minEDI = [
  '[REG1TEST;1]',
  'TName=Test Contest 2024',
  'PCall=S56OA',
  'PWWLo=JN75FO',
  'PBand=144 MHz',
  'SPowe=100',
  '[QSORecords;2]',
  '210703;1000;DL1ABC;1;59;001;59;001;#;JO31NC;450',
  '210703;1130;OK1XYZ;2;59;002;59;002;#;JN79IO;210',
].join('\n');
const parsed = parseEDI(minEDI);
assertEqual(parsed.header['pcall'],  'S56OA',            'header: pcall');
assertEqual(parsed.header['pwwlo'],  'JN75FO',           'header: pwwlo');
assertEqual(parsed.header['tname'],  'Test Contest 2024','header: tname');
assertEqual(parsed.header['pband'],  '144 MHz',          'header: pband');
assertEqual(parsed.header['spowe'],  '100',              'header: spowe');

group('parseEDI — QSO records');
assertEqual(parsed.qsos.length,       2,        '2 QSO records parsed');
assertEqual(parsed.qsos[0].call,  'DL1ABC',     'QSO[0] callsign');
assertEqual(parsed.qsos[0].mode,      1,        'QSO[0] mode = SSB');
assertEqual(parsed.qsos[0].wwl,   'JO31NC',     'QSO[0] locator');
assertEqual(parsed.qsos[0].dist,    450,         'QSO[0] distance');
assertEqual(parsed.qsos[0].hh,       10,         'QSO[0] hour');
assertEqual(parsed.qsos[0].mi,        0,         'QSO[0] minute');
assertEqual(parsed.qsos[0].dd,        3,         'QSO[0] day');
assertEqual(parsed.qsos[0].timeStr, '10:00',    'QSO[0] timeStr formatted');
assertEqual(parsed.qsos[1].call,  'OK1XYZ',     'QSO[1] callsign');
assertEqual(parsed.qsos[1].mode,      2,         'QSO[1] mode = CW');
assertEqual(parsed.qsos[1].dist,    210,         'QSO[1] distance');

group('parseEDI — robustness');
assertEqual(parseEDI('').qsos.length, 0, 'empty input → 0 QSOs');
assert(typeof parseEDI('').header === 'object', 'empty input → header is object');
const noSect = parseEDI('PCall=TEST\nPWWLo=JN75FO');
assertEqual(noSect.header['pcall'], 'TEST', 'header parsed without QSORecords section');
assertEqual(noSect.qsos.length, 0, 'no QSORecords section → 0 QSOs');
assertEqual(parseEDI('[QSORecords;1]\n210703;1000;DL1ABC;1;59').qsos.length, 0, 'QSO with <10 fields skipped');
const crlf = '[REG1TEST;1]\r\nPCall=S56OA\r\n[QSORecords;1]\r\n210703;1000;DL1ABC;1;59;001;59;001;#;JO31NC;450\r\n';
assertEqual(parseEDI(crlf).qsos.length, 1, 'CRLF line endings handled');
const noCount = '[REG1TEST;1]\nPCall=S56OA\n[QSORecords]\n210703;1000;DL1ABC;1;59;001;59;001;#;JO31NC;450\n';
assertEqual(parseEDI(noCount).qsos.length, 1, '[QSORecords] without count parsed correctly');

group('parseEDI — validation & warnings');
assert(Array.isArray(parsed.warnings), 'valid EDI → warnings is array');
assertEqual(parsed.warnings.length, 0, 'valid EDI → 0 warnings');
assertEqual(parseEDI('').warnings.length, 0, 'empty input → 0 warnings');

// Invalid date — month out of range
const badMonth = parseEDI('[QSORecords;1]\n211399;1000;DL1ABC;1;59;001;59;001;#;JO31NC;450\n');
assertEqual(badMonth.qsos.length, 0, 'invalid date (month 13) → QSO skipped');
assertEqual(badMonth.warnings.length, 1, 'invalid date (month 13) → 1 warning');
assertEqual(badMonth.warnings[0].type, 'date', 'invalid date → warning type = "date"');
assertEqual(badMonth.warnings[0].raw, '211399', 'invalid date → warning carries raw value');

// Invalid date — non-numeric
const badDateFmt = parseEDI('[QSORecords;1]\nABCDEF;1000;DL1ABC;1;59;001;59;001;#;JO31NC;450\n');
assertEqual(badDateFmt.qsos.length, 0, 'non-numeric date → QSO skipped');
assertEqual(badDateFmt.warnings[0].type, 'date', 'non-numeric date → warning type = "date"');

// Invalid date — day out of range
const badDay = parseEDI('[QSORecords;1]\n210732;1000;DL1ABC;1;59;001;59;001;#;JO31NC;450\n');
assertEqual(badDay.qsos.length, 0, 'invalid date (day 32) → QSO skipped');
assertEqual(badDay.warnings[0].type, 'date', 'day 32 → warning type = "date"');

// Invalid mode — warn but keep QSO (default SSB)
const badMode = parseEDI('[QSORecords;1]\n210703;1000;DL1ABC;9;59;001;59;001;#;JO31NC;450\n');
assertEqual(badMode.qsos.length, 1, 'invalid mode (9) → QSO kept with SSB default');
assertEqual(badMode.qsos[0].mode, 1, 'invalid mode → mode defaults to SSB (1)');
assertEqual(badMode.warnings.length, 1, 'invalid mode → 1 warning');
assertEqual(badMode.warnings[0].type, 'mode', 'invalid mode → warning type = "mode"');
assertEqual(badMode.warnings[0].raw, '9', 'invalid mode → warning carries raw value');

// Mode 0 is also invalid
const modeZero = parseEDI('[QSORecords;1]\n210703;1000;DL1ABC;0;59;001;59;001;#;JO31NC;450\n');
assertEqual(modeZero.qsos[0].mode, 1, 'mode 0 → SSB default');
assertEqual(modeZero.warnings[0].type, 'mode', 'mode 0 → warning type = "mode"');

// Mixed: one valid, one bad date
const mixed = '[QSORecords;2]\n210703;0900;S59DGO;1;59;001;59;001;#;JN75FO;50\n991399;1000;DL1ABC;1;59;001;59;001;#;JO31NC;450\n';
const mixedP = parseEDI(mixed);
assertEqual(mixedP.qsos.length, 1, 'mixed: valid QSO retained');
assertEqual(mixedP.warnings.length, 1, 'mixed: 1 warning for skipped QSO');

// ════════════════════════════════════════════
group('APP_VERSION & mapThemeColors');
const vMatch = src.match(/const APP_VERSION\s*=\s*'([^']+)'/);
assertEqual(vMatch ? vMatch[1] : null, '1.5', 'APP_VERSION constant is "1.5"');

const mapThemeSrc = src.match(/function mapThemeColors\b[\s\S]*?\n\}/)[0];
const {mapThemeColors: mtcDark}  = new Function(`let _theme='dark';\n${mapThemeSrc}\nreturn {mapThemeColors};`)();
const {mapThemeColors: mtcLight} = new Function(`let _theme='light';\n${mapThemeSrc}\nreturn {mapThemeColors};`)();
const dkC = mtcDark();
const ltC = mtcLight();
assert(typeof dkC === 'object', 'mapThemeColors returns object');
assert(['sea','land','border','grid'].every(k => k in dkC), 'dark theme has sea/land/border/grid keys');
assertEqual(dkC.sea,  '#0d1a2a', 'dark sea color');
assertEqual(dkC.land, '#1e2e1a', 'dark land color');
assertEqual(ltC.sea,  '#c8dde8', 'light sea color');
assertEqual(ltC.land, '#d8e6cc', 'light land color');

// ════════════════════════════════════════════
group('v1.4 — origIdx assignment & sort key logic');
const sortEDI = [
  '[REG1TEST;1]',
  'PCall=S56OA',
  'PWWLo=JN75FO',
  '[QSORecords;3]',
  '210703;1030;DL1ABC;1;59;001;59;001;#;JO31NC;450',
  '210703;0900;OK1XYZ;2;59;002;59;002;#;JN79IO;210',
  '210704;0800;S59DGO;1;59;003;59;003;#;JN75GR;50',
].join('\n');
const sortData = parseEDI(sortEDI);
const chronoSorted = [...sortData.qsos].sort((a, b) => {
  const da = a.yy*10000+a.mm*100+a.dd, db = b.yy*10000+b.mm*100+b.dd;
  return da !== db ? da - db : a.hh*60+a.mi - (b.hh*60+b.mi);
});
chronoSorted.forEach((q, i) => { q.origIdx = i + 1; });

assertEqual(chronoSorted[0].call,    'OK1XYZ', 'chronological: earliest QSO first (09:00)');
assertEqual(chronoSorted[0].origIdx, 1,        'origIdx = 1 for earliest QSO');
assertEqual(chronoSorted[1].call,    'DL1ABC', 'chronological: second QSO (10:30)');
assertEqual(chronoSorted[1].origIdx, 2,        'origIdx = 2 for second QSO');
assertEqual(chronoSorted[2].call,    'S59DGO', 'chronological: next-day QSO last');
assertEqual(chronoSorted[2].origIdx, 3,        'origIdx = 3 for next-day QSO');

// origIdx must survive re-sort by other columns
const byDist = [...chronoSorted].sort((a, b) => b.dist - a.dist);
assertEqual(byDist[0].dist,    450, 'sort dist desc: 450 km first');
assertEqual(byDist[0].origIdx,   2, 'origIdx preserved under dist sort (DL1ABC had origIdx 2)');
assertEqual(byDist[2].dist,     50, 'sort dist desc: 50 km last');
assertEqual(byDist[2].origIdx,   3, 'origIdx preserved for nearest QSO');

const byCall = [...chronoSorted].sort((a, b) => a.call.localeCompare(b.call));
assertEqual(byCall[0].call,    'DL1ABC', 'sort call asc: DL < OK < S5');
assertEqual(byCall[0].origIdx, 2,        'origIdx = 2 preserved under call sort');
assertEqual(byCall[1].call,    'OK1XYZ', 'sort call asc: OK1 second');
assertEqual(byCall[2].call,    'S59DGO', 'sort call asc: S5 last');

// sort by mode
const byMode = [...chronoSorted].sort((a, b) => a.mode - b.mode);
assertEqual(byMode[0].mode, 1, 'sort mode asc: SSB(1) before CW(2)');
assertEqual(byMode[2].mode, 2, 'sort mode asc: CW last in this dataset');

// sort by time-of-day primary, date tiebreaker
const byTime = [...chronoSorted].sort((a, b) => {
  const ta = (a.hh*60+a.mi)*10000000+(a.yy*10000+a.mm*100+a.dd);
  const tb = (b.hh*60+b.mi)*10000000+(b.yy*10000+b.mm*100+b.dd);
  return ta - tb;
});
assertEqual(byTime[0].call, 'S59DGO', 'sort time asc: 08:00 first (earlier time of day, regardless of date)');
assertEqual(byTime[1].call, 'OK1XYZ', 'sort time asc: 09:00 second');
assertEqual(byTime[2].call, 'DL1ABC', 'sort time asc: 10:30 last');

// tiebreaker: same time of day on different dates → earlier date sorts first
const tieSortData = [
  {call:'X1', hh:10, mi:0, dd:5, mm:7, yy:21},
  {call:'X2', hh:10, mi:0, dd:3, mm:7, yy:21},
];
const tieSort = [...tieSortData].sort((a, b) =>
  ((a.hh*60+a.mi)*10000000+(a.yy*10000+a.mm*100+a.dd)) -
  ((b.hh*60+b.mi)*10000000+(b.yy*10000+b.mm*100+b.dd))
);
assertEqual(tieSort[0].call, 'X2', 'time sort tiebreaker: same time (10:00), earlier date (day 3) sorts first');

// sort direction toggle logic
let sortCol = 'origIdx', sortDir = 'asc';
function simulateSortAllTable(col) {
  sortDir = sortCol === col ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
  sortCol = col;
}
simulateSortAllTable('dist');
assertEqual(sortCol, 'dist', 'toggle: new col sets _sortCol');
assertEqual(sortDir, 'asc',  'toggle: new col sets asc');
simulateSortAllTable('dist');
assertEqual(sortDir, 'desc', 'toggle: same col flips to desc');
simulateSortAllTable('dist');
assertEqual(sortDir, 'asc',  'toggle: same col flips back to asc');
simulateSortAllTable('call');
assertEqual(sortCol, 'call', 'toggle: different col changes _sortCol');
assertEqual(sortDir, 'asc',  'toggle: different col resets to asc');

// ════════════════════════════════════════════
console.log('\n══════════════════════════════════════');
const total = pass + fail;
console.log(`PASSED: ${pass}   FAILED: ${fail}   TOTAL: ${total}`);
if (fail === 0) console.log(green(`✓ ALL ${total} TESTS PASSED`));
else { console.log(red(`✗ ${fail} TESTS FAILED`)); process.exit(1); }
