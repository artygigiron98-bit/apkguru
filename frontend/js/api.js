/**
 * Lapisan API.
 * - Jika CONFIG.API_URL terisi → kirim ke Google Apps Script.
 * - Jika kosong → MODE DEMO: semua operasi dijalankan di localStorage
 *   dengan aturan yang sama persis seperti backend (upsert, cascade delete).
 *
 * Catatan CORS: body dikirim sebagai text/plain agar browser tidak
 * melakukan preflight (GAS tidak mendukung OPTIONS).
 */
(function () {
  const LS = 'walikelas_demo_v2';

  const KEYS = {
    siswa: ['id'],
    absensi: ['tanggal', 'siswa_id'],
    ujian: ['id'],
    nilai: ['ujian_id', 'siswa_id'],
    poin: ['id'],
    jurnal: ['id'],
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };

  /* ---------------- REMOTE (Google Apps Script) ---------------- */
  async function remote(action, payload) {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload, token: CONFIG.TOKEN }),
    });
    if (!res.ok) throw new Error('Server error ' + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Permintaan gagal');
    return json.data;
  }

  /* ---------------- DEMO (localStorage) ---------------- */
  function seed() {
    const siswa = [
      ['Ahmad Fauzi Ramadhan', 'L', 'Manado', '2016-03-14', 'Hasan Ramadhan'],
      ['Bunga Citra Lestari', 'P', 'Tomohon', '2016-07-02', 'Maria Lestari'],
      ['Kevin Alexander Tumbelaka', 'L', 'Manado', '2016-01-21', 'Jefry Tumbelaka'],
      ['Grace Natalia Mokodompit', 'P', 'Kotamobagu', '2016-09-09', 'Rudy Mokodompit'],
      ['Rafael Wowor Lumentut', 'L', 'Tondano', '2016-05-30', 'Steven Lumentut'],
      ['Siti Aisyah Pontoh', 'P', 'Bitung', '2016-11-17', 'Nurhayati Pontoh'],
      ['Jonathan Sumampouw', 'L', 'Manado', '2016-04-25', 'Meidy Sumampouw'],
      ['Putri Anggraini Kalalo', 'P', 'Minahasa', '2016-08-12', 'Debby Kalalo'],
      ['Daniel Rumengan', 'L', 'Bitung', '2016-02-05', 'Olivia Rumengan'],
      ['Nadia Safira Mamonto', 'P', 'Manado', '2016-12-01', 'Ichsan Mamonto'],
    ].map((r, i) => ({
      id: 's' + (i + 1),
      nisn: '01625' + String(10001 + i * 37).padStart(5, '0'),
      nama: r[0], jk: r[1], tempat_lahir: r[2], tanggal_lahir: r[3], nama_ortu: r[4],
      no_wa: '0812' + String(34567890 + i * 111).slice(0, 8),
      dibuat: new Date().toISOString(),
    }));

    // Absensi: 8 hari kerja terakhir sebelum hari ini
    const absensi = [];
    const pattern = ['H', 'H', 'H', 'S', 'H', 'H', 'I', 'H', 'H', 'A', 'H', 'H', 'H'];
    let made = 0, back = 1;
    while (made < 8 && back < 30) {
      const d = new Date(); d.setDate(d.getDate() - back); back++;
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      siswa.forEach((s, i) => {
        absensi.push({ id: uid() + i, tanggal: ymd(d), siswa_id: s.id, status: pattern[(made * 7 + i * 3) % pattern.length] });
      });
      made++;
    }

    const ujian = [
      { id: 'u1', mapel: 'Matematika', tanggal: addDays(-12), jenis: 'Penilaian Harian', keterangan: 'Perkalian & pembagian bersusun' },
      { id: 'u2', mapel: 'Bahasa Indonesia', tanggal: addDays(-6), jenis: 'UTS', keterangan: 'Teks narasi dan puisi' },
      { id: 'u3', mapel: 'IPAS', tanggal: addDays(5), jenis: 'Penilaian Harian', keterangan: 'Wujud zat dan perubahannya' },
      { id: 'u4', mapel: 'Matematika', tanggal: addDays(16), jenis: 'UAS', keterangan: 'Semua bab semester ganjil' },
    ];

    const nilai = [];
    ['u1', 'u2'].forEach((u, ui) => {
      siswa.forEach((s, i) => {
        if (u === 'u2' && i === 8) return; // satu siswa belum dinilai
        const v = 58 + ((i * 17 + ui * 11 + 7) % 41);
        nilai.push({ id: uid() + u + i, ujian_id: u, siswa_id: s.id, nilai: String(v) });
      });
    });

    const poin = [
      { id: 'p1', tanggal: addDays(-3), siswa_id: 's1', jenis: 'reward', deskripsi: 'Datang tepat waktu', poin: '2', catatan: '', dibuat: new Date().toISOString() },
      { id: 'p2', tanggal: addDays(-3), siswa_id: 's1', jenis: 'reward', deskripsi: 'Mengerjakan dan mengumpulkan tugas tepat waktu', poin: '3', catatan: '', dibuat: new Date().toISOString() },
      { id: 'p3', tanggal: addDays(-2), siswa_id: 's2', jenis: 'reward', deskripsi: 'Aktif bertanya atau menjawab pertanyaan', poin: '2', catatan: '', dibuat: new Date().toISOString() },
      { id: 'p4', tanggal: addDays(-2), siswa_id: 's3', jenis: 'sanksi', deskripsi: 'Mengganggu teman saat belajar', poin: '-2', catatan: 'Teguran pertama', dibuat: new Date().toISOString() },
      { id: 'p5', tanggal: addDays(-1), siswa_id: 's1', jenis: 'reward', deskripsi: 'Melaksanakan piket sesuai jadwal', poin: '3', catatan: '', dibuat: new Date().toISOString() },
      { id: 'p6', tanggal: addDays(-1), siswa_id: 's4', jenis: 'reward', deskripsi: 'Berkata sopan dan jujur', poin: '3', catatan: '', dibuat: new Date().toISOString() },
      { id: 'p7', tanggal: addDays(0), siswa_id: 's2', jenis: 'reward', deskripsi: 'Membantu teman yang kesulitan', poin: '2', catatan: '', dibuat: new Date().toISOString() },
      { id: 'p8', tanggal: addDays(0), siswa_id: 's5', jenis: 'sanksi', deskripsi: 'Tidak mengerjakan tugas tanpa alasan', poin: '-2', catatan: '', dibuat: new Date().toISOString() },
    ];

    const jurnal = [
      { id: 'j1', tanggal: addDays(-2), mapel: 'Matematika', materi: 'Perkalian bersusun', kegiatan: 'Penjelasan konsep, latihan soal, kuis singkat', keterangan: 'Siswa antusias, 2 anak masih kesulitan', dibuat: new Date().toISOString() },
      { id: 'j2', tanggal: addDays(-2), mapel: 'Bahasa Indonesia', materi: 'Teks narasi', kegiatan: 'Membaca cerita, mengidentifikasi unsur, menulis paragraf', keterangan: 'Diskusi kelas berjalan baik', dibuat: new Date().toISOString() },
      { id: 'j3', tanggal: addDays(-1), mapel: 'IPAS', materi: 'Wujud zat', kegiatan: 'Percobaan sederhana es–air–uap, pengamatan, laporan', keterangan: 'Alat peraga lengkap', dibuat: new Date().toISOString() },
      { id: 'j4', tanggal: addDays(0), mapel: 'Matematika', materi: 'Pembagian bersusun', kegiatan: 'Review, contoh soal, kerja kelompok', keterangan: 'Lanjutan dari pertemuan sebelumnya', dibuat: new Date().toISOString() },
      { id: 'j5', tanggal: addDays(0), mapel: 'Pendidikan Pancasila', materi: 'Gotong royong', kegiatan: 'Cerita pengalaman, role play, refleksi', keterangan: '', dibuat: new Date().toISOString() },
    ];

    return {
      siswa, absensi, ujian, nilai, poin, jurnal,
      pengaturan: { sekolah: 'SD Negeri 1 Manado', kelas: 'Kelas 4A', wali: 'Ibu Maria Wowor, S.Pd', tahun_ajaran: '2026/2027', kkm: '70', wa_grup: '' },
    };
  }

  function upsertMany(list, table, rows) {
    const keys = KEYS[table];
    const keyOf = (r) => keys.map((k) => r[k]).join('|');
    const idx = new Map(list.map((r, i) => [keyOf(r), i]));
    return rows.map((row) => {
      const r = { ...row };
      if (keys[0] === 'id' && !r.id) r.id = uid();
      if (table === 'siswa' && !r.dibuat) r.dibuat = new Date().toISOString();
      if (table === 'poin' && !r.dibuat) r.dibuat = new Date().toISOString();
      if (table === 'jurnal' && !r.dibuat) r.dibuat = new Date().toISOString();
      const k = keyOf(r);
      if (idx.has(k)) {
        const i = idx.get(k);
        list[i] = { ...list[i], ...r, id: list[i].id };
        return { ...list[i] };
      }
      if (!r.id) r.id = uid();
      list.push(r);
      idx.set(k, list.length - 1);
      return { ...r };
    });
  }

  function validate(table, rows, db) {
    rows.forEach((r) => {
      if (table === 'siswa') {
        if (!r.nama || !String(r.nama).trim()) throw new Error('Nama siswa wajib diisi');
        if (!/^\d{10}$/.test(String(r.nisn || ''))) throw new Error('NISN harus 10 digit angka');
        if (db.siswa.some((s) => s.nisn === String(r.nisn) && s.id !== r.id)) throw new Error('NISN ' + r.nisn + ' sudah terdaftar');
      }
      if (table === 'nilai' && r.nilai !== '' && r.nilai != null) {
        const n = parseFloat(r.nilai);
        if (isNaN(n) || n < 0 || n > 100) throw new Error('Nilai harus 0 - 100');
      }
      if (table === 'poin') {
        if (!r.siswa_id) throw new Error('Siswa wajib dipilih');
        if (['reward', 'sanksi'].indexOf(r.jenis) < 0) throw new Error('Jenis harus reward atau sanksi');
        if (!r.deskripsi || !String(r.deskripsi).trim()) throw new Error('Deskripsi wajib diisi');
        const p = parseInt(r.poin, 10);
        if (isNaN(p) || p === 0) throw new Error('Poin harus angka bukan nol');
      }
      if (table === 'jurnal') {
        if (!r.tanggal) throw new Error('Tanggal wajib diisi');
        if (!r.mapel || !String(r.mapel).trim()) throw new Error('Mata pelajaran wajib diisi');
        if (!r.materi || !String(r.materi).trim()) throw new Error('Materi wajib diisi');
        if (!r.kegiatan || !String(r.kegiatan).trim()) throw new Error('Kegiatan wajib diisi');
      }
    });
  }

  const Demo = {
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(LS)); } catch (e) { /* abaikan */ }
      if (!d) { d = seed(); this.save(d); }
      if (!Array.isArray(d.jurnal)) d.jurnal = [];
      if (!d.pengaturan) d.pengaturan = {};
      if (d.pengaturan.wa_grup === undefined) d.pengaturan.wa_grup = '';
      return d;
    },
    save(d) { localStorage.setItem(LS, JSON.stringify(d)); },
    reset() { localStorage.removeItem(LS); },
    async call(action, p) {
      const d = this.load();
      let out;
      switch (action) {
        case 'getAll': out = d; break;
        case 'upsert':
          validate(p.table, [p.row], d);
          out = upsertMany(d[p.table], p.table, [p.row])[0]; break;
        case 'upsertMany':
          validate(p.table, p.rows, d);
          out = upsertMany(d[p.table], p.table, p.rows); break;
        case 'remove':
          d[p.table] = d[p.table].filter((r) => r.id !== p.id);
          if (p.table === 'siswa') {
            d.absensi = d.absensi.filter((r) => r.siswa_id !== p.id);
            d.nilai = d.nilai.filter((r) => r.siswa_id !== p.id);
            d.poin = (d.poin || []).filter((r) => r.siswa_id !== p.id);
          }
          if (p.table === 'ujian') d.nilai = d.nilai.filter((r) => r.ujian_id !== p.id);
          out = true; break;
        case 'savePengaturan':
          Object.assign(d.pengaturan, p.data); out = d.pengaturan; break;
        default: throw new Error('Aksi tidak dikenal: ' + action);
      }
      this.save(d);
      await new Promise((r) => setTimeout(r, 120)); // simulasi latensi jaringan
      return JSON.parse(JSON.stringify(out));
    },
  };

  window.API = {
    demo: !CONFIG.API_URL,
    call: (action, payload = {}) => (CONFIG.API_URL ? remote(action, payload) : Demo.call(action, payload)),
    resetDemo: () => Demo.reset(),
  };
})();
