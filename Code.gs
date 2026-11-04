/**
 * ============================================================
 *  WALI KELAS SD — Backend Google Apps Script
 * ============================================================
 *  Cara pakai:
 *  1. Buat Google Sheet baru → Extensions → Apps Script.
 *  2. Tempel seluruh kode ini ke Code.gs.
 *  3. Jalankan fungsi setup() sekali (beri izin akses).
 *  4. Deploy → New deployment → Web app
 *       Execute as : Me
 *       Who has access : Anyone
 *  5. Salin URL /exec ke frontend/js/config.js (API_URL).
 *
 *  Semua permintaan masuk lewat doPost() dengan body JSON:
 *     { action, payload, token }
 * ============================================================
 */

// Opsional: isi dengan kata sandi bebas, lalu samakan di config.js (TOKEN).
const TOKEN = '';

const SHEETS = {
  siswa: 'Siswa',
  absensi: 'Absensi',
  ujian: 'Ujian',
  nilai: 'Nilai',
  poin: 'Poin',
};

const SCHEMA = {
  siswa:   ['id', 'nisn', 'nama', 'jk', 'tempat_lahir', 'tanggal_lahir', 'nama_ortu', 'no_wa', 'dibuat'],
  absensi: ['id', 'tanggal', 'siswa_id', 'status'],
  ujian:   ['id', 'mapel', 'tanggal', 'jenis', 'keterangan'],
  nilai:   ['id', 'ujian_id', 'siswa_id', 'nilai'],
  poin:    ['id', 'tanggal', 'siswa_id', 'jenis', 'deskripsi', 'poin', 'catatan', 'dibuat'],
};

// Kolom yang menjadi kunci unik tiap tabel (dipakai oleh upsert).
const KEYS = {
  siswa:   ['id'],
  absensi: ['tanggal', 'siswa_id'],
  ujian:   ['id'],
  nilai:   ['ujian_id', 'siswa_id'],
  poin:    ['id'],
};

const DEFAULT_SETTINGS = {
  sekolah: 'SD Negeri 1 Manado',
  kelas: 'Kelas 4A',
  wali: '',
  tahun_ajaran: '2026/2027',
  kkm: '70',
};

/* ------------------------------------------------------------
 *  SETUP — jalankan sekali dari editor
 * ---------------------------------------------------------- */
function setup() {
  Object.keys(SHEETS).forEach(function (t) {
    const sh = getSheet_(t); // getSheet_ sudah memanggil ensureHeaders_
    Logger.log('Sheet ' + SHEETS[t] + ' siap, kolom: ' + SCHEMA[t].join(', '));
  });
  getSettingsSheet_();
  const first = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  if (first && first.getLastRow() === 0 && SpreadsheetApp.getActiveSpreadsheet().getSheets().length > 1) {
    SpreadsheetApp.getActiveSpreadsheet().deleteSheet(first);
  }
  Logger.log('Setup selesai. Semua sheet sudah disinkronkan dengan SCHEMA.');
}

/* ------------------------------------------------------------
 *  ENTRY POINT
 * ---------------------------------------------------------- */
function doGet() {
  return json_({ ok: true, data: 'Wali Kelas SD API aktif' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    const req = JSON.parse(e.postData.contents);
    if (TOKEN && req.token !== TOKEN) throw new Error('Token tidak valid');
    const p = req.payload || {};
    let data;

    switch (req.action) {
      case 'getAll':
        data = {
          siswa: readRows_('siswa'),
          absensi: readRows_('absensi'),
          ujian: readRows_('ujian'),
          nilai: readRows_('nilai'),
          poin: readRows_('poin'),
          pengaturan: readSettings_(),
        };
        break;
      case 'upsert':
        checkTable_(p.table);
        validate_(p.table, [p.row]);
        data = upsertMany_(p.table, [p.row])[0];
        break;
      case 'upsertMany':
        checkTable_(p.table);
        validate_(p.table, p.rows);
        data = upsertMany_(p.table, p.rows || []);
        break;
      case 'remove':
        checkTable_(p.table);
        data = remove_(p.table, p.id);
        break;
      case 'savePengaturan':
        data = saveSettings_(p.data || {});
        break;
      default:
        throw new Error('Aksi tidak dikenal: ' + req.action);
    }
    return json_({ ok: true, data: data });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ------------------------------------------------------------
 *  OPERASI DATA
 * ---------------------------------------------------------- */
function upsertMany_(table, rows) {
  const cols = SCHEMA[table];
  const keys = KEYS[table];
  const list = readRows_(table);
  const idx = {};
  list.forEach(function (r, i) { idx[keyOf_(r, keys)] = i; });

  const result = rows.map(function (row) {
    const clean = {};
    cols.forEach(function (c) { if (row[c] !== undefined && row[c] !== null) clean[c] = String(row[c]); });

    if (keys[0] === 'id' && !clean.id) clean.id = uid_();
    if (table === 'siswa' && !clean.dibuat) clean.dibuat = new Date().toISOString();
    if (table === 'poin' && !clean.dibuat) clean.dibuat = new Date().toISOString();

    const k = keyOf_(clean, keys);
    if (k in idx) {
      const i = idx[k];
      list[i] = Object.assign({}, list[i], clean, { id: list[i].id });
      return list[i];
    }
    if (!clean.id) clean.id = uid_();
    list.push(clean);
    idx[k] = list.length - 1;
    return clean;
  });

  writeAll_(table, list);
  return result;
}

function remove_(table, id) {
  if (!id) throw new Error('ID wajib diisi');
  writeAll_(table, readRows_(table).filter(function (r) { return r.id !== id; }));
  // Hapus data turunan agar tidak ada yatim.
  if (table === 'siswa') {
    writeAll_('absensi', readRows_('absensi').filter(function (r) { return r.siswa_id !== id; }));
    writeAll_('nilai', readRows_('nilai').filter(function (r) { return r.siswa_id !== id; }));
    writeAll_('poin', readRows_('poin').filter(function (r) { return r.siswa_id !== id; }));
  }
  if (table === 'ujian') {
    writeAll_('nilai', readRows_('nilai').filter(function (r) { return r.ujian_id !== id; }));
  }
  return true;
}

/* ------------------------------------------------------------
 *  VALIDASI SISI SERVER
 * ---------------------------------------------------------- */
function validate_(table, rows) {
  (rows || []).forEach(function (r) {
    if (!r) throw new Error('Data kosong');
    if (table === 'siswa') {
      if (!r.nama || !String(r.nama).trim()) throw new Error('Nama siswa wajib diisi');
      if (!/^\d{10}$/.test(String(r.nisn || ''))) throw new Error('NISN harus 10 digit angka');
      if (['L', 'P'].indexOf(r.jk) < 0) throw new Error('Jenis kelamin harus L atau P');
      const dup = readRows_('siswa').some(function (s) { return s.nisn === String(r.nisn) && s.id !== r.id; });
      if (dup) throw new Error('NISN ' + r.nisn + ' sudah terdaftar');
    }
    if (table === 'absensi') {
      if (['H', 'S', 'I', 'A'].indexOf(r.status) < 0) throw new Error('Status absensi tidak valid');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.tanggal))) throw new Error('Format tanggal tidak valid');
    }
    if (table === 'ujian') {
      if (!r.mapel || !String(r.mapel).trim()) throw new Error('Mata pelajaran wajib diisi');
      if (['Penilaian Harian', 'UTS', 'UAS'].indexOf(r.jenis) < 0) throw new Error('Jenis ujian tidak valid');
    }
    if (table === 'nilai' && r.nilai !== '' && r.nilai !== null && r.nilai !== undefined) {
      const n = parseFloat(r.nilai);
      if (isNaN(n) || n < 0 || n > 100) throw new Error('Nilai harus 0 - 100');
    }
    if (table === 'poin') {
      if (!r.siswa_id) throw new Error('Siswa wajib dipilih');
      if (['reward', 'sanksi'].indexOf(r.jenis) < 0) throw new Error('Jenis harus reward atau sanksi');
      if (!r.deskripsi || !String(r.deskripsi).trim()) throw new Error('Deskripsi wajib diisi');
      const p = parseInt(r.poin, 10);
      if (isNaN(p) || p === 0) throw new Error('Poin harus angka bukan nol');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.tanggal || ''))) throw new Error('Format tanggal tidak valid');
    }
  });
}

/* ------------------------------------------------------------
 *  PENGATURAN (key-value)
 * ---------------------------------------------------------- */
function readSettings_() {
  const sh = getSettingsSheet_();
  const out = Object.assign({}, DEFAULT_SETTINGS);
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
      if (r[0] !== '') out[String(r[0])] = String(r[1]);
    });
  }
  return out;
}

function saveSettings_(data) {
  const merged = Object.assign(readSettings_(), data);
  const sh = getSettingsSheet_();
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
  const rows = Object.keys(merged).map(function (k) { return [k, String(merged[k])]; });
  sh.getRange(2, 1, rows.length, 2).setNumberFormat('@').setValues(rows);
  return merged;
}

/* ------------------------------------------------------------
 *  HELPER LEVEL SHEET
 * ---------------------------------------------------------- */
function styleHeader_(sh, n) {
  sh.getRange(1, 1, 1, n)
    .setFontWeight('bold').setFontColor('#ffffff').setBackground('#4f46e5');
  sh.setFrozenRows(1);
}

function getSheet_(table) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = SHEETS[table];
  const cols = SCHEMA[table];
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, cols.length).setValues([cols]);
    styleHeader_(sh, cols.length);
    return sh;
  }
  // Pastikan header selalu sesuai SCHEMA (migrasi kolom baru, mis. no_wa)
  ensureHeaders_(sh, cols);
  return sh;
}

/** Sinkronkan baris header dengan SCHEMA: tambah kolom yang belum ada, urutkan sesuai SCHEMA. */
function ensureHeaders_(sh, cols) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const existing = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h || '').trim(); });
  // Sudah sama persis?
  if (existing.length >= cols.length && cols.every(function (c, i) { return existing[i] === c; })) {
    return;
  }
  // Baca data lama berdasarkan header lama
  const n = sh.getLastRow() - 1;
  let oldRows = [];
  if (n > 0) {
    const raw = sh.getRange(2, 1, n, existing.length).getValues();
    const tz = Session.getScriptTimeZone();
    oldRows = raw.filter(function (r) { return r[0] !== ''; }).map(function (r) {
      const o = {};
      existing.forEach(function (h, i) {
        if (!h) return;
        let v = r[i];
        if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
        o[h] = String(v == null ? '' : v);
      });
      return o;
    });
  }
  // Tulis ulang header + data sesuai SCHEMA
  sh.clear();
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), 100), cols.length).setNumberFormat('@');
  sh.getRange(1, 1, 1, cols.length).setValues([cols]);
  styleHeader_(sh, cols.length);
  if (oldRows.length) {
    const values = oldRows.map(function (o) {
      return cols.map(function (c) { return o[c] === undefined || o[c] === null ? '' : String(o[c]); });
    });
    sh.getRange(2, 1, values.length, cols.length).setValues(values);
  }
}

function getSettingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Pengaturan');
  if (!sh) {
    sh = ss.insertSheet('Pengaturan');
    sh.getRange(1, 1, sh.getMaxRows(), 2).setNumberFormat('@');
    sh.getRange(1, 1, 1, 2).setValues([['kunci', 'nilai']]);
    styleHeader_(sh, 2);
    const rows = Object.keys(DEFAULT_SETTINGS).map(function (k) { return [k, DEFAULT_SETTINGS[k]]; });
    sh.getRange(2, 1, rows.length, 2).setValues(rows);
  }
  return sh;
}

function readRows_(table) {
  const sh = getSheet_(table);
  const cols = SCHEMA[table];
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const tz = Session.getScriptTimeZone();
  return sh.getRange(2, 1, n, cols.length).getValues()
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      const o = {};
      cols.forEach(function (c, i) {
        let v = r[i];
        if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
        o[c] = String(v);
      });
      return o;
    });
}

function writeAll_(table, objs) {
  const sh = getSheet_(table);
  const cols = SCHEMA[table];
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, cols.length).clearContent();
  if (!objs.length) return;
  const values = objs.map(function (o) {
    return cols.map(function (c) { return o[c] === undefined || o[c] === null ? '' : String(o[c]); });
  });
  sh.getRange(2, 1, values.length, cols.length).setNumberFormat('@').setValues(values);
}

/* ------------------------------------------------------------
 *  UTIL
 * ---------------------------------------------------------- */
function keyOf_(row, keys) {
  return keys.map(function (k) { return String(row[k]); }).join('|');
}
function uid_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 10); }
function checkTable_(t) { if (!SHEETS[t]) throw new Error('Tabel tidak dikenal: ' + t); }
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
