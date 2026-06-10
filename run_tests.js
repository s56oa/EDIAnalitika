#!/usr/bin/env node
// CLI test runner — extracts pure functions from edi_analytics.html and runs all unit tests.
// No external dependencies. Requires Node.js 16+.
'use strict';

const fs = require('fs');
const html = fs.readFileSync(__dirname + '/edi_analytics.html', 'utf8');
const chartjsClose = html.indexOf('</script>');
const appOpen = html.indexOf('<script>', chartjsClose);
const src = html.slice(appOpen + '<script>'.length, html.lastIndexOf('</script>'));

// Brace-counting extractor: handles string, template, and regex literals so
// a } inside any of them never terminates the match early.
function extractFn(s, name) {
  const marker = `\nfunction ${name}(`;
  const si = s.indexOf(marker);
  if(si < 0) throw new Error(`function ${name} not found in source`);
  let depth = 0, i = si, inStr = false, strCh = '';
  for(; i < s.length; i++){
    const c = s[i];
    if(inStr){ if(c === strCh && s[i-1] !== '\\') inStr = false; continue; }
    if(c === '"' || c === "'"){ inStr = true; strCh = c; continue; }
    if(c === '`'){
      i++;
      while(i < s.length){ if(s[i] === '\\') i++; else if(s[i] === '`') break; i++; }
      continue;
    }
    // regex literal: / not preceded by word char, ), or ]
    if(c === '/' && !/[\w)\]]/.test(s[i-1])){
      i++;
      while(i < s.length){
        if(s[i] === '\\') { i++; }
        else if(s[i] === '['){
          i++;
          while(i < s.length){ if(s[i] === '\\') i++; else if(s[i] === ']') break; i++; }
        }
        else if(s[i] === '/') break;
        i++;
      }
      continue;
    }
    if(c === '{') depth++;
    else if(c === '}'){ depth--; if(depth === 0) return s.substring(si+1, i+1); }
  }
  throw new Error(`function ${name}: unbalanced braces`);
}

const pfxConst = src.match(/const PFX = \[[\s\S]*?\];/)[0];

const blocks = [
  extractFn(src, 'escapeHTML'),
  extractFn(src, 'modeName'),
  extractFn(src, 'modeClass'),
  extractFn(src, 'locToLatLon'),
  extractFn(src, 'bearing'),
  extractFn(src, 'haversine'),
  extractFn(src, 'markDupes'),
  pfxConst + '\n' + extractFn(src, 'getCountry'),
  extractFn(src, 'parseEDI'),
  extractFn(src, 'exportCSV'),
  extractFn(src, 'getLogHistory'),
  extractFn(src, 'setLogHistory'),
  extractFn(src, 'cleanOldLogs'),
  extractFn(src, 'formatLogTime'),
  extractFn(src, 'saveLogToStorage'),
  extractFn(src, 'clearStoredLog'),
  extractFn(src, 'loadStoredLog'),
  extractFn(src, 'updateResumeButtons'),
  extractFn(src, 'confirmOverwrite'),
].join('\n');
const {escapeHTML, modeName, modeClass, locToLatLon, bearing, haversine, markDupes, getCountry, parseEDI, exportCSV, getLogHistory, setLogHistory, cleanOldLogs, formatLogTime, saveLogToStorage, clearStoredLog, loadStoredLog, updateResumeButtons, confirmOverwrite} =
  new Function(blocks + '\nreturn {escapeHTML,modeName,modeClass,locToLatLon,bearing,haversine,markDupes,getCountry,parseEDI,exportCSV,getLogHistory,setLogHistory,cleanOldLogs,formatLogTime,saveLogToStorage,clearStoredLog,loadStoredLog,updateResumeButtons,confirmOverwrite}')();

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
group('haversine — returns raw float (IARU: score = Math.floor(d)+1)');
assertClose(haversine(46, 14, 46, 14), 0, 0.001, 'same point = 0 km');
const d1 = haversine(45.6, 14.5, 48.2, 16.4);
const d2 = haversine(48.2, 16.4, 45.6, 14.5);
assertEqual(d1, d2, `symmetric A→B = B→A (${d1.toFixed(2)} km)`);
assert(typeof d1 === 'number' && !Number.isInteger(d1), 'returns float (not integer)');
const snWar = haversine(45.6, 14.5, 52.2, 21.0);
assert(snWar > 700 && snWar < 1100,  `Snežnik → Warsaw ≈ ${snWar.toFixed(1)} km (700–1100)`);
const snLon = haversine(45.6, 14.5, 51.5, -0.1);
assert(snLon > 1200 && snLon < 1800, `Snežnik → London ≈ ${snLon.toFixed(1)} km (1200–1800)`);
assert(haversine(0, 0, 1, 1) > 0,   'different points give positive distance');
// IARU formula: score = Math.floor(d) + 1
const jn75fo_jn86ao = haversine(45.604, 14.458, 46.604, 16.042);
assertEqual(Math.floor(jn75fo_jn86ao) + 1, 166, 'JN75FO→JN86AO: IARU score = floor(d)+1 = 166 km');

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
group('markDupes — default mode (by call)');
{
  const q = (call, mode) => ({call, mode});
  const qsos1 = [q('DL1ABC',1), q('OK1XYZ',2), q('DL1ABC',2), q('S56OA',1), q('DL1ABC',1)];
  markDupes(qsos1, 'call');
  assertEqual(qsos1[0].isDupe, false, 'DL1ABC (1st) → not dupe');
  assertEqual(qsos1[1].isDupe, false, 'OK1XYZ (1st) → not dupe');
  assertEqual(qsos1[2].isDupe, true,  'DL1ABC (2nd, CW) → dupe (call mode ignores mode)');
  assertEqual(qsos1[3].isDupe, false, 'S56OA (1st) → not dupe');
  assertEqual(qsos1[4].isDupe, true,  'DL1ABC (3rd) → dupe');
}

group('markDupes — call+mode');
{
  const q = (call, mode) => ({call, mode});
  const qsos2 = [q('DL1ABC',1), q('DL1ABC',2), q('DL1ABC',1), q('OK1XYZ',1), q('DL1ABC',2)];
  markDupes(qsos2, 'call+mode');
  assertEqual(qsos2[0].isDupe, false, 'DL1ABC SSB (1st) → not dupe');
  assertEqual(qsos2[1].isDupe, false, 'DL1ABC CW (1st of this mode) → not dupe');
  assertEqual(qsos2[2].isDupe, true,  'DL1ABC SSB (2nd SSB) → dupe');
  assertEqual(qsos2[3].isDupe, false, 'OK1XYZ SSB → not dupe');
  assertEqual(qsos2[4].isDupe, true,  'DL1ABC CW (2nd CW) → dupe');
}

group('markDupes — edge cases');
{
  const empty = [];
  markDupes(empty, 'call');
  assertEqual(empty.length, 0, 'empty array → no error');

  const single = [{call:'S56OA', mode:1}];
  markDupes(single, 'call');
  assertEqual(single[0].isDupe, false, 'single QSO → not dupe');

  const allSame = [{call:'DL1ABC',mode:1},{call:'DL1ABC',mode:1},{call:'DL1ABC',mode:1}];
  markDupes(allSame, 'call');
  assertEqual(allSame.filter(q=>!q.isDupe).length, 1, '3× same call → only 1 valid');
  assertEqual(allSame.filter(q=> q.isDupe).length, 2, '3× same call → 2 dupes');
}

group('markDupes — chronological order prerequisite');
{
  // Simulates what render() now does: sort chronologically BEFORE markDupes
  // so the chronologically first QSO is always the valid one
  const q = (call, hh, mi) => ({call, mode:1, yy:21, mm:7, dd:3, hh, mi});
  const qsos = [q('DL1ABC',12,0), q('DL1ABC',10,0), q('DL1ABC',14,0)];
  // Sort chronologically (as render() does)
  qsos.sort((a,b) => {
    const da=a.yy*10000+a.mm*100+a.dd, db=b.yy*10000+b.mm*100+b.dd;
    return da!==db ? da-db : a.hh*60+a.mi-(b.hh*60+b.mi);
  });
  markDupes(qsos, 'call');
  assertEqual(qsos[0].hh, 10, 'after sort: earliest QSO (10:00) is first');
  assertEqual(qsos[0].isDupe, false, 'earliest (10:00) → not dupe');
  assertEqual(qsos[1].isDupe, true,  '2nd (12:00) → dupe');
  assertEqual(qsos[2].isDupe, true,  '3rd (14:00) → dupe');
}

group('invalid count excludes dupes (no double-count)');
{
  // QSO with bad locator + is a dupe should NOT inflate invalid count
  const qsos = [
    {call:'DL1ABC', mode:1, isDupe:false, dist:450},
    {call:'DL1ABC', mode:1, isDupe:true,  dist:0  },  // dupe AND invalid locator
    {call:'OK1XYZ', mode:2, isDupe:false, dist:0  },  // invalid locator only
  ];
  const invalid   = qsos.filter(q => q.dist === 0 && !q.isDupe).length;
  const dupeCount = qsos.filter(q => q.isDupe).length;
  assertEqual(invalid,   1, 'invalid count: only OK1XYZ (not the dupe with dist=0)');
  assertEqual(dupeCount, 1, 'dupeCount: only DL1ABC 2nd');
  assertEqual(invalid + dupeCount, 2, 'no double-count: sum = 2 for 2 distinct anomalous QSOs');
}

// ════════════════════════════════════════════
group('APP_VERSION & mapThemeColors');
const vMatch = src.match(/const APP_VERSION\s*=\s*'([^']+)'/);
assertEqual(vMatch ? vMatch[1] : null, '1.7', 'APP_VERSION constant is "1.7"');

const mapThemeSrc = extractFn(src, 'mapThemeColors');
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
//  v1.6 — CSV export + LocalStorage helpers
// ════════════════════════════════════════════
group('v1.6 — new exports & storage');
assert(typeof exportCSV === 'function', 'exportCSV is a function');
assert(typeof getLogHistory === 'function', 'getLogHistory is a function');
assert(typeof setLogHistory === 'function', 'setLogHistory is a function');
assert(typeof cleanOldLogs === 'function', 'cleanOldLogs is a function');
assert(typeof formatLogTime === 'function', 'formatLogTime is a function');
assert(typeof saveLogToStorage === 'function', 'saveLogToStorage is a function');
assert(typeof clearStoredLog === 'function', 'clearStoredLog is a function');
assert(typeof loadStoredLog === 'function', 'loadStoredLog is a function');
assert(typeof updateResumeButtons === 'function', 'updateResumeButtons is a function');
assert(typeof confirmOverwrite === 'function', 'confirmOverwrite is a function');

// formatLogTime — basic and edge cases
const testTs = new Date(2024, 6, 15, 14, 30).getTime(); // 15.07.2024 14:30
assertEqual(formatLogTime(testTs), '15.07.2024 14:30', 'formatLogTime: mid-year timestamp');
assertEqual(formatLogTime(new Date(2024,  0,  1,  0,  0).getTime()), '01.01.2024 00:00', 'formatLogTime: midnight Jan 1 zero-pads');
assertEqual(formatLogTime(new Date(2024, 11, 31, 23, 59).getTime()), '31.12.2024 23:59', 'formatLogTime: Dec 31 23:59');
assertEqual(formatLogTime(new Date(2000,  2,  5,  8,  7).getTime()), '05.03.2000 08:07', 'formatLogTime: zero-pads all fields');

// ════════════════════════════════════════════
//  v1.6 — storage helpers (mocked localStorage)
// ════════════════════════════════════════════
group('v1.6 — storage helpers (mocked localStorage)');
{
  const _lsMock = `
    const _lsStore = {};
    const localStorage = {
      getItem:    k     => (_lsStore[k] !== undefined ? _lsStore[k] : null),
      setItem:    (k,v) => { _lsStore[k] = String(v); },
      removeItem: k     => { delete _lsStore[k]; }
    };
    const LOG_HISTORY_KEY = 'ediLogHistory';
    const MAX_LOGS = 5;
    const LOG_MAX_AGE_DAYS = 30;
    function parseEDI(){ return {header:{pcall:'S56OA',tname:'VHF'}, qsos:[], warnings:[]}; }
    function updateResumeButtons(){}
  `;
  const _storageSrc = [
    extractFn(src, 'getLogHistory'),
    extractFn(src, 'setLogHistory'),
    extractFn(src, 'cleanOldLogs'),
    extractFn(src, 'saveLogToStorage'),
    extractFn(src, 'clearStoredLog'),
  ].join('\n');
  const mk = () => new Function(_lsMock + _storageSrc +
    '\nreturn {getLogHistory,setLogHistory,cleanOldLogs,saveLogToStorage,clearStoredLog};')();
  const mkWith = init => new Function(
    `const _lsStore = ${JSON.stringify(init)};\n` +
    `const localStorage={getItem:k=>(_lsStore[k]!==undefined?_lsStore[k]:null),setItem:(k,v)=>{_lsStore[k]=String(v);},removeItem:k=>{delete _lsStore[k];}};\n` +
    `const LOG_HISTORY_KEY='ediLogHistory';const MAX_LOGS=5;const LOG_MAX_AGE_DAYS=30;\n` +
    `function parseEDI(){return {header:{pcall:'S56OA',tname:'VHF'},qsos:[],warnings:[]};}\n` +
    `function updateResumeButtons(){}\n` +
    _storageSrc +
    '\nreturn {getLogHistory,setLogHistory,cleanOldLogs,saveLogToStorage,clearStoredLog};')();

  assert(Array.isArray(mk().getLogHistory()), 'getLogHistory: empty store → array');
  assertEqual(mk().getLogHistory().length, 0, 'getLogHistory: empty store → length 0');

  { const s = mk();
    s.setLogHistory([{text:'X', name:'a.edi', time:1e9, call:'S56OA', contest:'VHF'}]);
    const h = s.getLogHistory();
    assertEqual(h.length, 1, 'setLogHistory/getLogHistory: round-trip length');
    assertEqual(h[0].call, 'S56OA', 'setLogHistory/getLogHistory: round-trip call'); }

  { const s = mk();
    s.setLogHistory(Array.from({length:8}, (_,i) => ({text:'T',name:`f${i}.edi`,time:i,call:`C${i}`,contest:''})));
    assertEqual(s.getLogHistory().length, 5, 'setLogHistory: truncates to MAX_LOGS=5'); }

  { const s = mkWith({'ediLogHistory': 'NOTJSON{{{'});
    const h = s.getLogHistory();
    assert(Array.isArray(h), 'getLogHistory: corrupted JSON → array');
    assertEqual(h.length, 0, 'getLogHistory: corrupted JSON → length 0'); }

  { const s = mkWith({'ediLogHistory': 'null'});
    const h = s.getLogHistory();
    assert(Array.isArray(h), 'getLogHistory: JSON "null" → array (Array.isArray guard)');
    assertEqual(h.length, 0, 'getLogHistory: JSON "null" → length 0'); }

  { const s = mk();
    const oldTs   = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const freshTs = Date.now() - 1000;
    s.setLogHistory([
      {text:'T', name:'old.edi', time: oldTs,   call:'OLD', contest:''},
      {text:'T', name:'new.edi', time: freshTs,  call:'NEW', contest:''},
    ]);
    const h = s.cleanOldLogs();
    assertEqual(h.length, 1, 'cleanOldLogs: removes entries > 30 days old');
    assertEqual(h[0].call, 'NEW', 'cleanOldLogs: retains fresh entry'); }

  { const s = mk();
    s.saveLogToStorage('EDI1', 'test.edi');
    s.saveLogToStorage('EDI2', 'test.edi');
    assertEqual(s.getLogHistory().length, 1, 'saveLogToStorage: deduplicates same file name'); }

  { const s = mk();
    s.saveLogToStorage('EDI1', 'first.edi');
    s.saveLogToStorage('EDI2', 'second.edi');
    const h = s.getLogHistory();
    assertEqual(h[0].name, 'second.edi', 'saveLogToStorage: most recent is first');
    assertEqual(h[1].name, 'first.edi',  'saveLogToStorage: older entry is second'); }

  { const s = mk();
    s.saveLogToStorage('EDI', 'test.edi');
    s.clearStoredLog();
    assertEqual(s.getLogHistory().length, 0, 'clearStoredLog: empties history'); }
}

// ════════════════════════════════════════════
console.log('\n══════════════════════════════════════');
const total = pass + fail;
console.log(`PASSED: ${pass}   FAILED: ${fail}   TOTAL: ${total}`);
if (fail === 0) console.log(green(`✓ ALL ${total} TESTS PASSED`));
else { console.log(red(`✗ ${fail} TESTS FAILED`)); process.exit(1); }
