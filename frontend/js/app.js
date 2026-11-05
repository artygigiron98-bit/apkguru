/**
 * Wali Kelas SD — logika aplikasi (Vanilla JS)
 * Alur: boot → loadAll() (getAll) → render view sesuai hash → aksi via event delegation (data-act).
 */
(() => {
  'use strict';

  /* ============================================================
   *  KONSTANTA
   * ========================================================== */
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', short: 'Beranda', icon: 'layout-dashboard' },
    { id: 'siswa', label: 'Data Siswa', short: 'Siswa', icon: 'users' },
    { id: 'absensi', label: 'Absensi', short: 'Absensi', icon: 'clipboard-check' },
    { id: 'jurnal', label: 'Jurnal Guru', short: 'Jurnal', icon: 'book-open' },
    { id: 'poin', label: 'Poin Perilaku', short: 'Poin', icon: 'award' },
    { id: 'ujian', label: 'Agenda Ujian', short: 'Ujian', icon: 'calendar-days' },
    { id: 'nilai', label: 'Nilai Ujian', short: 'Nilai', icon: 'table-2' },
  ];
  const JENIS = ['Penilaian Harian', 'UTS', 'UAS'];
  const JENIS_STYLE = {
    'Penilaian Harian': 'bg-sky-50 text-sky-700 ring-sky-200',
    UTS: 'bg-amber-50 text-amber-700 ring-amber-200',
    UAS: 'bg-rose-50 text-rose-700 ring-rose-200',
  };
  const JENIS_SHORT = { 'Penilaian Harian': 'PH', UTS: 'UTS', UAS: 'UAS' };
  const STATUS = [
    { k: 'H', label: 'Hadir', on: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30', off: 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600', hex: '#10b981', icon: 'check' },
    { k: 'S', label: 'Sakit', on: 'bg-amber-500 text-white shadow-md shadow-amber-500/30', off: 'bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600', hex: '#f59e0b', icon: 'thermometer' },
    { k: 'I', label: 'Izin', on: 'bg-sky-500 text-white shadow-md shadow-sky-500/30', off: 'bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600', hex: '#0ea5e9', icon: 'mail' },
    { k: 'A', label: 'Alpa', on: 'bg-rose-500 text-white shadow-md shadow-rose-500/30', off: 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600', hex: '#f43f5e', icon: 'x' },
  ];
  const REWARD_LIST = [
    { deskripsi: 'Datang tepat waktu', poin: 2 },
    { deskripsi: 'Berangkat sekolah tanpa didampingi orang tua', poin: 3 },
    { deskripsi: 'Mengerjakan dan mengumpulkan tugas tepat waktu', poin: 3 },
    { deskripsi: 'Aktif bertanya atau menjawab pertanyaan', poin: 2 },
    { deskripsi: 'Melaksanakan piket sesuai jadwal', poin: 3 },
    { deskripsi: 'Membantu teman yang kesulitan', poin: 2 },
    { deskripsi: 'Menjaga kebersihan dan kerapian kelas', poin: 2 },
    { deskripsi: 'Berkata sopan dan jujur', poin: 3 },
  ];
  const SANKSI_LIST = [
    { deskripsi: 'Mengganggu teman saat belajar', poin: -2 },
    { deskripsi: 'Tidak mengerjakan tugas tanpa alasan', poin: -2 },
    { deskripsi: 'Tidak melaksanakan piket', poin: -2 },
    { deskripsi: 'Berkata kasar kepada guru atau teman', poin: -3 },
    { deskripsi: 'Berbohong', poin: -3 },
    { deskripsi: 'Mengejek atau menyakiti teman', poin: -3 },
    { deskripsi: 'Tidak hadir tanpa informasi dari orang tua/wali', poin: -3 },
  ];
  const REWARD_THRESHOLDS = [
    { min: 30, label: 'Reward 1', desc: 'Bebas memilih tempat duduk selama 1 minggu' },
    { min: 35, label: 'Reward 2', desc: 'Mendapatkan alat tulis lucu' },
    { min: 40, label: 'Reward 3', desc: 'Mendapatkan hadiah spesial' },
    { min: 45, label: 'Reward 4', desc: 'Piagam Siswa Hebat + alat tulis lucu' },
    { min: 50, label: 'Reward 5', desc: 'Piagam Siswa Hebat + hadiah spesial' },
  ];
  const MAPEL = ['Matematika', 'Bahasa Indonesia', 'IPAS', 'Pendidikan Pancasila', 'Bahasa Inggris', 'PJOK', 'Seni Budaya', 'Pendidikan Agama', 'Muatan Lokal'];

  /* ============================================================
   *  HELPER
   * ========================================================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const shiftDate = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const fmtDate = (s, o) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('id-ID', o || { day: 'numeric', month: 'short', year: 'numeric' }) : '–');
  const num = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const fmt = (n, d = 1) => (n == null ? '–' : (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('id-ID', { maximumFractionDigits: d }));
  const kkm = () => num(S.pengaturan.kkm) ?? 70;
  const initial = (n) => (String(n || '?').trim()[0] || '?').toUpperCase();
  const icons = () => window.lucide && window.lucide.createIcons();
  const daysUntil = (s) => Math.round((new Date(s + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000);

  const countStatus = (list) => list.reduce((c, a) => { c[a.status] = (c[a.status] || 0) + 1; return c; }, { H: 0, S: 0, I: 0, A: 0 });

  function downloadCSV(name, rows) {
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /** Normalisasi nomor HP Indonesia ke format 62xxxxxxxxxx */
  function toWaNumber(raw) {
    if (!raw) return '';
    let n = String(raw).replace(/\D/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1);
    if (n.startsWith('8')) n = '62' + n;
    if (!n.startsWith('62') || n.length < 11) return '';
    return n;
  }

  function waLink(no, text) {
    const n = toWaNumber(no);
    if (!n) return null;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }

  function openWa(no, text) {
    const url = waLink(no, text);
    if (!url) {
      toast('Nomor WhatsApp orang tua belum diisi atau tidak valid', 'error');
      return;
    }
    window.open(url, '_blank');
  }

  function pesanAbsensi(siswa, status, tanggal) {
    const sekolah = S.pengaturan.sekolah || 'Sekolah';
    const kelas = S.pengaturan.kelas || '';
    const wali = S.pengaturan.wali || 'Wali Kelas';
    const statusLabel = { H: 'Hadir', S: 'Sakit', I: 'Izin', A: 'Tidak hadir (Alpa)' }[status] || status;
    const tgl = fmtDate(tanggal, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `Selamat Pagi.\n\nYth. Bapak/Ibu ${siswa.nama_ortu || 'Orang Tua/Wali'} dari ananda *${siswa.nama}*.\n\nKami informasikan kehadiran siswa pada hari ${tgl}:\n*Status: ${statusLabel}*\n\nKelas: ${kelas}\n${sekolah}\n\nPesan ini dikirim oleh ${wali}.\nTerima kasih atas perhatiannya.\n\n`;
  }

  function pesanPoin(siswa, jenis, deskripsi, poin, tanggal) {
    const sekolah = S.pengaturan.sekolah || 'Sekolah';
    const kelas = S.pengaturan.kelas || '';
    const wali = S.pengaturan.wali || 'Wali Kelas';
    const tgl = fmtDate(tanggal, { day: 'numeric', month: 'long', year: 'numeric' });
    const total = totalPoin(siswa.id);
    if (jenis === 'reward') {
      return `Selamat Pagi.\n\nYth. Bapak/Ibu ${siswa.nama_ortu || 'Orang Tua/Wali'}.\n\nKabar baik! Ananda *${siswa.nama}* mendapatkan *poin reward*:\n\n• Perilaku: ${deskripsi}\n• Poin: +${Math.abs(poin)}\n• Tanggal: ${tgl}\n• Total poin saat ini: *${total}*\n\nKelas: ${kelas}\n${sekolah}\n\nPesan ini dikirim oleh ${wali}.\nMari terus dukung kebiasaan baik ananda.\n\nTerima Kasih.`;
    }
    return `Selamat Pagi.\n\nYth. Bapak/Ibu ${siswa.nama_ortu || 'Orang Tua/Wali'}.\n\nKami informasikan bahwa ananda *${siswa.nama}* mendapatkan *poin sanksi*:\n\n• Perilaku: ${deskripsi}\n• Poin: ${poin}\n• Tanggal: ${tgl}\n• Total poin saat ini: *${total}*\n\nKelas: ${kelas}\n${sekolah}\n\nMohon bantuan Bapak/Ibu untuk membimbing ananda agar tidak mengulangi.\nPesan ini dikirim oleh ${wali}.\n\nTerima Kasih`;
  }

  function pesanRekapAbsensi(tanggal) {
    const sekolah = S.pengaturan.sekolah || 'Sekolah';
    const kelas = S.pengaturan.kelas || '';
    const wali = S.pengaturan.wali || 'Wali Kelas';
    const tgl = fmtDate(tanggal, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const draft = {};
    S.absensi.filter((a) => a.tanggal === tanggal).forEach((a) => { draft[a.siswa_id] = a.status; });
    // prefer draft if same date and dirty
    if (tanggal === UI.absDate && Object.keys(UI.absDraft).length) {
      Object.assign(draft, UI.absDraft);
    }
    const byStatus = { H: [], S: [], I: [], A: [] };
    S.siswa.forEach((s) => {
      const st = draft[s.id];
      if (st && byStatus[st]) byStatus[st].push(s.nama);
    });
    const total = S.siswa.length;
    const hadir = byStatus.H.length;
    const lines = (arr, label) => arr.length ? `*${label} (${arr.length}):*\n${arr.map((n) => `• ${n}`).join('\n')}` : `*${label}:* —`;
    return `📋 *REKAP KEHADIRAN HARIAN*\n\n📅 ${tgl}\n🏫 ${kelas} — ${sekolah}\n\n✅ Hadir: *${hadir}/${total}* siswa\n\n${lines(byStatus.S, 'Sakit')}\n\n${lines(byStatus.I, 'Izin')}\n\n${lines(byStatus.A, 'Alpa')}\n\n_Pesan otomatis dari Wali Kelas ${wali}_`;
  }

  /* ============================================================
   *  STATE
   * ========================================================== */
  const S = { siswa: [], absensi: [], ujian: [], nilai: [], poin: [], jurnal: [], pengaturan: {} };
  const UI = {
    view: 'dashboard',
    q: '',
    absTab: 'harian',
    absDate: today(),
    absDraft: {},
    absDirty: false,
    rekapMonth: today().slice(0, 7),
    ujianFilter: 'Semua',
    nilaiFilter: 'Semua',
    nilaiDirty: {},
    nilaiFocus: null,
    poinTab: 'reward',
    poinRekap: false,
    jurnalTab: 'catatan',
    jurnalMapel: 'Semua',
  };
  let CONFIRM = null;

  const nilaiMap = () => { const m = {}; S.nilai.forEach((n) => { const v = num(n.nilai); if (v != null) m[n.ujian_id + '|' + n.siswa_id] = v; }); return m; };
  const studentAvg = (sid, nm) => mean(S.ujian.map((u) => nm[u.id + '|' + sid]).filter((v) => v != null));

  async function loadAll() {
    const d = await API.call('getAll');
    Object.assign(S, d);
    if (!Array.isArray(S.poin)) S.poin = [];
    if (!Array.isArray(S.jurnal)) S.jurnal = [];
    S.siswa.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    S.ujian.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    S.jurnal.sort((a, b) => (b.tanggal + (b.dibuat || '')).localeCompare(a.tanggal + (a.dibuat || '')));
  }

  /* ============================================================
   *  UI PRIMITIF: loader, toast, modal, konfirmasi
   * ========================================================== */
  let busy = 0;
  const showLoader = (on) => { busy = Math.max(0, busy + (on ? 1 : -1)); $('#bar').classList.toggle('hidden', busy === 0); };

  /** Jalankan panggilan API dengan loader + penanganan error. Mengembalikan null jika gagal. */
  async function run(fn, okMsg) {
    showLoader(true);
    try {
      const r = await fn();
      if (okMsg) toast(okMsg);
      return r;
    } catch (e) {
      toast(e.message || 'Terjadi kesalahan', 'error');
      return null;
    } finally { showLoader(false); }
  }

  function toast(msg, type = 'ok') {
    const el = document.createElement('div');
    const color = type === 'error' ? 'bg-rose-600' : 'bg-slate-900';
    el.className = `fadeup pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl ${color} px-4 py-3 text-sm font-semibold text-white shadow-2xl transition duration-300`;
    el.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle-2'}" class="h-5 w-5 shrink-0 ${type === 'error' ? '' : 'text-emerald-400'}"></i><span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    icons();
    setTimeout(() => { el.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => el.remove(), 300); }, 3200);
  }

  function openModal(html, maxW = 'sm:max-w-lg') {
    const m = $('#modal');
    $('#modal-box').className = `pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${maxW}`;
    $('#modal-body').innerHTML = html;
    m.classList.remove('hidden'); m.classList.add('flex');
    icons();
    const f = $('#modal-body input:not([type=radio]), #modal-body button[data-act=confirm-yes]');
    f && setTimeout(() => f.focus(), 50);
  }
  function closeModal() {
    const r = CONFIRM; CONFIRM = null;
    $('#modal').classList.add('hidden'); $('#modal').classList.remove('flex');
    r && r(false);
  }
  function confirmBox(title, text, btn = 'Hapus', danger = true) {
    return new Promise((res) => {
      openModal(`
        <div class="p-6 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${danger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}">
            <i data-lucide="${danger ? 'trash-2' : 'alert-triangle'}" class="h-7 w-7"></i></div>
          <h3 class="text-lg font-extrabold text-slate-800">${esc(title)}</h3>
          <p class="mt-1.5 text-sm text-slate-500">${esc(text)}</p>
          <div class="mt-6 grid grid-cols-2 gap-3">
            <button class="btn btn-ghost" data-act="confirm-no">Batal</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm-yes">${esc(btn)}</button>
          </div>
        </div>`, 'sm:max-w-sm');
      CONFIRM = res;
    });
  }

  const modalHead = (title, sub, icon) => `
    <div class="flex items-start gap-3 border-b border-slate-100 p-6 pb-4">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"><i data-lucide="${icon}" class="h-5 w-5"></i></div>
      <div class="min-w-0"><h3 class="text-lg font-extrabold text-slate-800">${esc(title)}</h3><p class="text-xs text-slate-500">${esc(sub)}</p></div>
      <button type="button" class="icon-btn ml-auto" data-act="modal-close"><i data-lucide="x" class="h-5 w-5"></i></button>
    </div>`;

  const pageHead = (title, sub, actions = '') => `
    <div class="fadeup mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h2 class="text-2xl font-extrabold text-slate-800">${title}</h2><p class="text-sm text-slate-500">${sub}</p></div>
      <div class="flex flex-wrap gap-2">${actions}</div>
    </div>`;

  const emptyState = (icon, title, text, btn = '') => `
    <div class="flex flex-col items-center px-6 py-14 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500"><i data-lucide="${icon}" class="h-8 w-8"></i></div>
      <p class="text-base font-bold text-slate-700">${title}</p><p class="mt-1 max-w-sm text-sm text-slate-500">${text}</p>${btn ? `<div class="mt-5">${btn}</div>` : ''}
    </div>`;

  /* ============================================================
   *  NAVIGASI & LAYOUT
   * ========================================================== */
  function renderNav() {
    $('#side-nav').innerHTML = NAV.map((n) => `<a href="#${n.id}" class="nav-item ${UI.view === n.id ? 'active' : ''}"><i data-lucide="${n.icon}" class="h-5 w-5"></i><span>${n.label}</span></a>`).join('');
    $('#bottom-nav').innerHTML = NAV.map((n) => `<a href="#${n.id}" class="bnav ${UI.view === n.id ? 'active' : ''}"><i data-lucide="${n.icon}" class="h-5 w-5"></i><span>${n.short}</span></a>`).join('');
  }

  function renderHeader() {
    const p = S.pengaturan;
    $('#hdr-school').textContent = p.sekolah || 'Sekolah Dasar';
    $('#hdr-meta').textContent = `${p.kelas || 'Kelas'} • TA ${p.tahun_ajaran || '-'}`;
    $('#hdr-date').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('#side-wali').textContent = p.wali || 'Wali Kelas';
    $('#side-kelas').textContent = p.kelas || '';
    $('#side-avatar').textContent = initial(p.wali || 'W');
    $('#mode-badge').innerHTML = API.demo
      ? `<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-300/90 px-2.5 py-1 text-[11px] font-bold text-amber-900"><i data-lucide="flask-conical" class="h-3.5 w-3.5"></i>Mode Demo • data di browser</span>`
      : `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/90 px-2.5 py-1 text-[11px] font-bold text-emerald-900"><i data-lucide="sheet" class="h-3.5 w-3.5"></i>Terhubung Google Sheets</span>`;
  }

  const VIEWS = {
    dashboard: { html: viewDashboard },
    siswa: { html: viewSiswa, after: renderSiswaRows },
    absensi: { html: viewAbsensi, after: renderAbsBody },
    jurnal: { html: () => (UI.jurnalTab === 'mapel' ? viewDaftarMapel() : viewJurnal()) },
    poin: { html: () => (UI.poinRekap ? viewPoinRekap() : viewPoin()), after: () => { if (!UI.poinRekap) renderPoinBody(); } },
    ujian: { html: viewUjian },
    nilai: { html: viewNilai, after: () => { recalcGrid(); focusExamColumn(); } },
  };

  function render() {
    renderNav(); renderHeader();
    const v = VIEWS[UI.view];
    $('#app').innerHTML = v.html();
    v.after && v.after();
    icons();
  }

  function route() {
    const id = (location.hash || '#dashboard').slice(1);
    UI.view = NAV.some((n) => n.id === id) ? id : 'dashboard';
    if (UI.view === 'absensi' && !UI.absDirty) loadDraft();
    if (UI.view !== 'poin') UI.poinRekap = false;
    if (UI.view !== 'jurnal') { UI.jurnalTab = 'catatan'; }
    render();
    window.scrollTo({ top: 0 });
  }
  const go = (id) => { if (location.hash === '#' + id) route(); else location.hash = id; };

  /* ============================================================
   *  DASHBOARD
   * ========================================================== */
  function viewDashboard() {
    const t = today();
    const abs = S.absensi.filter((a) => a.tanggal === t);
    const c = countStatus(abs);
    const total = S.siswa.length;
    const L = S.siswa.filter((s) => s.jk === 'L').length;
    const pct = total ? Math.round((c.H / total) * 100) : 0;
    const up = S.ujian.filter((u) => u.tanggal >= t).slice(0, 4);
    const nm = nilaiMap();
    const avgs = S.siswa.map((s) => ({ s, avg: studentAvg(s.id, nm) }));
    const classAvg = mean(avgs.filter((x) => x.avg != null).map((x) => x.avg));
    const month = t.slice(0, 7);
    const alpa = {};
    S.absensi.filter((a) => a.tanggal.startsWith(month) && a.status === 'A').forEach((a) => { alpa[a.siswa_id] = (alpa[a.siswa_id] || 0) + 1; });
    const attention = avgs.map(({ s, avg }) => {
      const r = [];
      if (avg != null && avg < kkm()) r.push(`Rata-rata ${fmt(avg)} (di bawah KKM ${kkm()})`);
      if (alpa[s.id]) r.push(`${alpa[s.id]}× alpa bulan ini`);
      return { s, r };
    }).filter((x) => x.r.length).slice(0, 5);

    // donut kehadiran hari ini
    let acc = 0;
    const stops = STATUS.map((st) => { const from = acc; acc += abs.length ? (c[st.k] / abs.length) * 100 : 0; return `${st.hex} ${from}% ${acc}%`; }).join(',');
    const donut = abs.length ? `conic-gradient(${stops})` : 'conic-gradient(#e2e8f0 0 100%)';

    // tren 7 hari terakhir yang tercatat
    const days = [...new Set(S.absensi.map((a) => a.tanggal))].sort().slice(-7);
    const trend = days.map((d) => { const l = S.absensi.filter((a) => a.tanggal === d); return { d, p: l.length ? Math.round((l.filter((a) => a.status === 'H').length / l.length) * 100) : 0 }; });

    const h = new Date().getHours();
    const sapa = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
    const nama = S.pengaturan.wali ? S.pengaturan.wali.split(',')[0] : 'Bapak/Ibu Guru';

    const stat = (icon, grad, label, value, sub) => `
      <div class="card fadeup p-5">
        <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-white shadow-lg"><i data-lucide="${icon}" class="h-5 w-5"></i></div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">${label}</p>
        <p class="mt-0.5 text-2xl font-extrabold text-slate-800">${value}</p>
        <p class="mt-0.5 text-xs text-slate-500">${sub}</p>
      </div>`;

    return `
      <section class="fadeup relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-indigo-500/20 sm:p-8">
        <div class="pointer-events-none absolute -right-10 -top-12 h-52 w-52 rounded-full bg-white/10"></div>
        <div class="pointer-events-none absolute bottom-[-4rem] right-24 h-44 w-44 rounded-full bg-white/10"></div>
        <div class="relative max-w-xl">
          <p class="text-sm font-semibold text-indigo-100">${sapa} 👋</p>
          <h2 class="mt-1 text-2xl font-extrabold sm:text-3xl">${esc(nama)}</h2>
          <p class="mt-2 text-sm text-indigo-100">${done(abs, total)}</p>
          <div class="mt-5 flex flex-wrap gap-2.5">
            <button data-act="go" data-go="absensi" class="btn bg-white text-indigo-700 shadow-lg hover:bg-indigo-50"><i data-lucide="clipboard-check" class="h-4 w-4"></i>Isi Absensi</button>
            <button data-act="siswa-new" class="btn bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25"><i data-lucide="user-plus" class="h-4 w-4"></i>Tambah Siswa</button>
            <button data-act="ujian-new" class="btn bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25"><i data-lucide="calendar-plus" class="h-4 w-4"></i>Jadwalkan Ujian</button>
          </div>
        </div>
      </section>

      <section class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        ${stat('users', 'from-indigo-500 to-violet-500', 'Total Siswa', total, `${L} laki-laki • ${total - L} perempuan`)}
        ${stat('user-check', 'from-emerald-500 to-teal-500', 'Hadir Hari Ini', abs.length ? pct + '%' : '–', abs.length ? `${c.H} dari ${total} siswa` : 'Belum diabsen')}
        ${stat('calendar-clock', 'from-amber-500 to-orange-500', 'Ujian Mendatang', up.length, up[0] ? `${esc(up[0].mapel)} • ${relDay(up[0].tanggal)}` : 'Tidak ada jadwal')}
        ${stat('trophy', 'from-fuchsia-500 to-pink-500', 'Rata-rata Kelas', fmt(classAvg), classAvg == null ? 'Belum ada nilai' : classAvg >= kkm() ? 'Di atas KKM 🎉' : `Di bawah KKM ${kkm()}`)}
      </section>

      <section class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <div class="card fadeup p-6">
            <div class="mb-5 flex items-center justify-between"><h3 class="font-extrabold text-slate-800">Kehadiran Hari Ini</h3>
              <button data-act="go" data-go="absensi" class="text-xs font-bold text-indigo-600 hover:underline">Kelola →</button></div>
            <div class="flex flex-col items-center gap-6 sm:flex-row">
              <div class="relative h-40 w-40 shrink-0 rounded-full" style="background:${donut}">
                <div class="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white">
                  <span class="text-3xl font-extrabold text-slate-800">${abs.length ? pct + '%' : '–'}</span><span class="text-[11px] font-semibold text-slate-400">hadir</span></div>
              </div>
              <div class="grid w-full grid-cols-2 gap-3">
                ${STATUS.map((st) => `<div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><span class="h-3 w-3 rounded-full" style="background:${st.hex}"></span>
                  <div><p class="text-xs font-semibold text-slate-500">${st.label}</p><p class="text-lg font-extrabold text-slate-800">${c[st.k]}</p></div></div>`).join('')}
              </div>
            </div>
          </div>

          <div class="card fadeup p-6">
            <h3 class="mb-1 font-extrabold text-slate-800">Tren Kehadiran</h3>
            <p class="mb-5 text-xs text-slate-500">Persentase hadir pada ${trend.length || 0} hari terakhir yang tercatat</p>
            ${trend.length ? `<div class="flex h-40 items-end gap-2 sm:gap-3">${trend.map((x) => `
              <div class="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span class="text-[11px] font-bold text-slate-600">${x.p}%</span>
                <div class="w-full rounded-t-xl bg-gradient-to-t from-indigo-500 to-fuchsia-400" style="height:${Math.max(x.p, 4)}%"></div>
                <span class="text-[10px] font-semibold text-slate-400">${fmtDate(x.d, { day: 'numeric', month: 'short' })}</span></div>`).join('')}</div>`
              : emptyState('bar-chart-3', 'Belum ada data', 'Grafik akan muncul setelah absensi pertama disimpan.')}
          </div>
        </div>

        <div class="space-y-6">
          <div class="card fadeup p-6">
            <div class="mb-4 flex items-center justify-between"><h3 class="font-extrabold text-slate-800">Ujian Terdekat</h3>
              <button data-act="go" data-go="ujian" class="text-xs font-bold text-indigo-600 hover:underline">Semua →</button></div>
            ${up.length ? `<div class="space-y-3">${up.map((u) => `
              <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">${dateBlock(u.tanggal)}
                <div class="min-w-0"><p class="truncate text-sm font-bold text-slate-800">${esc(u.mapel)}</p>
                <p class="text-xs text-slate-500"><span class="badge ${JENIS_STYLE[u.jenis]}">${esc(u.jenis)}</span> <span class="ml-1">${relDay(u.tanggal)}</span></p></div></div>`).join('')}</div>`
              : `<p class="py-6 text-center text-sm text-slate-400">Tidak ada ujian mendatang</p>`}
          </div>

          <div class="card fadeup p-6">
            <h3 class="mb-4 font-extrabold text-slate-800">Perlu Perhatian</h3>
            ${attention.length ? `<div class="space-y-3">${attention.map((x) => `
              <div class="flex items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-bold text-rose-600">${initial(x.s.nama)}</div>
              <div class="min-w-0"><p class="truncate text-sm font-bold text-slate-800">${esc(x.s.nama)}</p><p class="text-xs text-slate-500">${x.r.map(esc).join(' • ')}</p></div></div>`).join('')}</div>`
              : `<p class="py-6 text-center text-sm text-slate-400">Semua siswa dalam kondisi baik ✨</p>`}
          </div>
        </div>
      </section>`;
  }

  const done = (abs, total) => (abs.length ? `Absensi hari ini sudah tercatat untuk ${abs.length} dari ${total} siswa. Semangat mengajar!` : 'Absensi hari ini belum diisi. Yuk mulai hari dengan mencatat kehadiran siswa.');
  const relDay = (s) => { const n = daysUntil(s); return n === 0 ? 'Hari ini' : n === 1 ? 'Besok' : n > 0 ? `${n} hari lagi` : `${-n} hari lalu`; };
  const dateBlock = (s) => `<div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-indigo-700 ring-1 ring-indigo-100">
    <span class="text-base font-extrabold leading-none">${new Date(s + 'T00:00:00').getDate()}</span>
    <span class="text-[10px] font-bold uppercase text-indigo-400">${fmtDate(s, { month: 'short' })}</span></div>`;

  /* ============================================================
   *  DATA SISWA (CRUD)
   * ========================================================== */
  function viewSiswa() {
    return `
      ${pageHead('Data Siswa', `${S.siswa.length} siswa terdaftar di kelas ini`,
        `<button class="btn btn-ghost" data-act="siswa-export"><i data-lucide="download" class="h-4 w-4"></i>Ekspor CSV</button>
         <button class="btn btn-primary" data-act="siswa-new"><i data-lucide="user-plus" class="h-4 w-4"></i>Tambah Siswa</button>`)}
      <div class="card fadeup overflow-hidden">
        <div class="flex items-center gap-3 border-b border-slate-100 p-4">
          <div class="relative flex-1 sm:max-w-sm"><i data-lucide="search" class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"></i>
            <input id="q" class="input !pl-10" placeholder="Cari nama, NISN, atau orang tua…" value="${esc(UI.q)}" autocomplete="off" /></div>
          <span id="q-count" class="hidden text-xs font-semibold text-slate-400 sm:block"></span>
        </div>
        <div class="overflow-x-auto scroll-thin"><table class="w-full min-w-[720px]">
          <thead class="bg-slate-50/70"><tr><th class="th">Siswa</th><th class="th">NISN</th><th class="th">L/P</th><th class="th">Tempat, Tgl Lahir</th><th class="th">Orang Tua / Wali</th><th class="th text-right">Aksi</th></tr></thead>
          <tbody id="siswa-rows" class="divide-y divide-slate-100"></tbody></table></div>
      </div>`;
  }

  function renderSiswaRows() {
    const q = UI.q.trim().toLowerCase();
    const list = S.siswa.filter((s) => !q || [s.nama, s.nisn, s.nama_ortu, s.tempat_lahir].join(' ').toLowerCase().includes(q));
    const body = $('#siswa-rows'); if (!body) return;
    $('#q-count').textContent = q ? `${list.length} hasil` : '';
    body.innerHTML = list.length ? list.map((s) => `
      <tr class="transition hover:bg-indigo-50/40">
        <td class="td"><div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${s.jk === 'L' ? 'bg-gradient-to-br from-sky-500 to-indigo-500' : 'bg-gradient-to-br from-pink-500 to-fuchsia-500'}">${initial(s.nama)}</div>
          <span class="font-bold text-slate-800">${esc(s.nama)}</span></div></td>
        <td class="td font-mono text-xs text-slate-500">${esc(s.nisn)}</td>
        <td class="td"><span class="badge ${s.jk === 'L' ? 'bg-sky-50 text-sky-700 ring-sky-200' : 'bg-pink-50 text-pink-700 ring-pink-200'}">${s.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</span></td>
        <td class="td text-slate-600">${esc(s.tempat_lahir)}, ${fmtDate(s.tanggal_lahir)}</td>
        <td class="td text-slate-600">
          <div>${esc(s.nama_ortu) || '–'}</div>
          ${toWaNumber(s.no_wa) ? `<div class="mt-0.5 flex items-center gap-1 text-xs text-emerald-600"><i data-lucide="message-circle" class="h-3 w-3"></i>${esc(s.no_wa)}</div>` : '<div class="mt-0.5 text-xs text-slate-400">Belum ada No. WA</div>'}
        </td>
        <td class="td"><div class="flex justify-end gap-1">
          <button class="icon-btn" title="Edit" data-act="siswa-edit" data-id="${s.id}"><i data-lucide="pencil" class="h-4 w-4"></i></button>
          <button class="icon-btn hover:!bg-rose-50 hover:!text-rose-600" title="Hapus" data-act="siswa-del" data-id="${s.id}"><i data-lucide="trash-2" class="h-4 w-4"></i></button></div></td>
      </tr>`).join('')
      : `<tr><td colspan="6">${S.siswa.length ? emptyState('search-x', 'Tidak ditemukan', 'Coba kata kunci lain.') : emptyState('users', 'Belum ada siswa', 'Mulai dengan menambahkan siswa pertama Anda.', `<button class="btn btn-primary" data-act="siswa-new"><i data-lucide="user-plus" class="h-4 w-4"></i>Tambah Siswa</button>`)}</td></tr>`;
    icons();
  }

  function siswaForm(id) {
    const s = S.siswa.find((x) => x.id === id) || { jk: 'L' };
    const radio = (v, label, color) => `<label class="cursor-pointer"><input type="radio" name="jk" value="${v}" class="peer sr-only" ${s.jk === v ? 'checked' : ''}>
      <div class="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-500 transition peer-checked:border-${color}-500 peer-checked:bg-${color}-50 peer-checked:text-${color}-700">${label}</div></label>`;
    openModal(`
      ${modalHead(id ? 'Edit Data Siswa' : 'Tambah Siswa Baru', 'Lengkapi profil siswa dengan benar', id ? 'user-cog' : 'user-plus')}
      <form id="f-siswa" class="space-y-4 p-6" data-id="${id || ''}">
        <div><label class="label">NISN (10 digit)</label><input name="nisn" class="input" inputmode="numeric" maxlength="10" placeholder="0012345678" value="${esc(s.nisn)}" required /></div>
        <div><label class="label">Nama Lengkap</label><input name="nama" class="input" placeholder="Nama sesuai akta kelahiran" value="${esc(s.nama)}" required /></div>
        <div><label class="label">Jenis Kelamin</label><div class="grid grid-cols-2 gap-3">${radio('L', 'Laki-laki', 'sky')}${radio('P', 'Perempuan', 'pink')}</div></div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div><label class="label">Tempat Lahir</label><input name="tempat_lahir" class="input" placeholder="Manado" value="${esc(s.tempat_lahir)}" /></div>
          <div><label class="label">Tanggal Lahir</label><input name="tanggal_lahir" type="date" class="input" value="${esc(s.tanggal_lahir)}" /></div>
        </div>
        <div><label class="label">Nama Orang Tua / Wali</label><input name="nama_ortu" class="input" placeholder="Nama ayah / ibu / wali" value="${esc(s.nama_ortu)}" /></div>
        <div><label class="label">No. WhatsApp Orang Tua</label><input name="no_wa" class="input" inputmode="tel" placeholder="08xxxxxxxxxx" value="${esc(s.no_wa || '')}" /></div>
        <div class="flex justify-end gap-3 pt-2"><button type="button" class="btn btn-ghost" data-act="modal-close">Batal</button>
          <button class="btn btn-primary"><i data-lucide="save" class="h-4 w-4"></i>Simpan</button></div>
      </form>`);
  }

  async function saveSiswa(form) {
    const id = form.dataset.id;
    const fd = Object.fromEntries(new FormData(form).entries());
    fd.nama = (fd.nama || '').trim(); fd.nisn = (fd.nisn || '').trim();
    if (!fd.nama) return toast('Nama lengkap wajib diisi', 'error');
    if (!/^\d{10}$/.test(fd.nisn)) return toast('NISN harus 10 digit angka', 'error');
    if (S.siswa.some((s) => s.nisn === fd.nisn && s.id !== id)) return toast('NISN sudah dipakai siswa lain', 'error');
    if (id) fd.id = id;
    const row = await run(() => API.call('upsert', { table: 'siswa', row: fd }), id ? 'Data siswa diperbarui' : 'Siswa berhasil ditambahkan');
    if (!row) return;
    const i = S.siswa.findIndex((s) => s.id === row.id);
    if (i >= 0) S.siswa[i] = row; else S.siswa.push(row);
    S.siswa.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    closeModal(); render();
  }

  async function deleteSiswa(id) {
    const s = S.siswa.find((x) => x.id === id); if (!s) return;
    if (!(await confirmBox(`Hapus ${s.nama}?`, 'Seluruh data absensi dan nilai siswa ini juga akan terhapus dan tidak bisa dikembalikan.'))) return;
    const ok = await run(() => API.call('remove', { table: 'siswa', id }), 'Siswa dihapus');
    if (!ok) return;
    S.siswa = S.siswa.filter((x) => x.id !== id);
    S.absensi = S.absensi.filter((x) => x.siswa_id !== id);
    S.nilai = S.nilai.filter((x) => x.siswa_id !== id);
    S.poin = (S.poin || []).filter((x) => x.siswa_id !== id);
    delete UI.absDraft[id];
    render();
  }

  /* ============================================================
   *  ABSENSI
   * ========================================================== */
  function loadDraft() {
    UI.absDraft = {};
    S.absensi.filter((a) => a.tanggal === UI.absDate).forEach((a) => { UI.absDraft[a.siswa_id] = a.status; });
    UI.absDirty = false;
  }

  function viewAbsensi() {
    const tab = (id, label, icon) => `<button data-act="abs-tab" data-tab="${id}" class="chip !px-4 !py-2 ${UI.absTab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'}"><i data-lucide="${icon}" class="h-4 w-4"></i>${label}</button>`;
    return `
      ${pageHead('Absensi', 'Catat kehadiran harian dengan satu sentuhan', `<div class="flex gap-2">${tab('harian', 'Input Harian', 'check-square')}${tab('rekap', 'Rekap Bulanan', 'bar-chart-3')}</div>`)}
      ${UI.absTab === 'harian' ? absHarianShell() : absRekapShell()}`;
  }

  function absHarianShell() {
    const dow = new Date(UI.absDate + 'T00:00:00').getDay();
    return `
      <div class="card fadeup mb-4 flex flex-wrap items-center gap-3 p-4">
        <button class="icon-btn ring-1 ring-slate-200" data-act="abs-shift" data-n="-1"><i data-lucide="chevron-left" class="h-5 w-5"></i></button>
        <input id="abs-date" type="date" class="input !w-auto font-semibold" value="${UI.absDate}" />
        <button class="icon-btn ring-1 ring-slate-200" data-act="abs-shift" data-n="1"><i data-lucide="chevron-right" class="h-5 w-5"></i></button>
        <button class="btn btn-soft" data-act="abs-today">Hari ini</button>
        <p class="ml-1 hidden text-sm font-semibold text-slate-600 md:block">${fmtDate(UI.absDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div class="ml-auto flex flex-wrap gap-2">
          <button class="btn btn-ghost" data-act="abs-all"><i data-lucide="check-check" class="h-4 w-4"></i><span class="hidden sm:inline">Semua Hadir</span></button>
          <button class="btn btn-ghost !text-emerald-700 hover:!bg-emerald-50" data-act="wa-absensi-all" title="Kirim WA ke orang tua siswa non-hadir"><i data-lucide="message-circle" class="h-4 w-4"></i><span class="hidden sm:inline">WA Non-Hadir</span></button>
          <button class="btn btn-ghost !text-indigo-700 hover:!bg-indigo-50" data-act="wa-absensi-grup" title="Kirim rekap absensi hari ini ke grup WA"><i data-lucide="users" class="h-4 w-4"></i><span class="hidden sm:inline">WA Grup</span></button>
          <button id="abs-save" class="btn btn-primary" data-act="abs-save"><i data-lucide="save" class="h-4 w-4"></i>Simpan</button>
        </div>
      </div>
      ${dow === 0 || dow === 6 ? `<div class="mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-200"><i data-lucide="info" class="h-4 w-4"></i>Tanggal ini jatuh pada akhir pekan.</div>` : ''}
      <div id="abs-summary" class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5"></div>
      <div id="abs-list" class="card fadeup divide-y divide-slate-100 overflow-hidden"></div>`;
  }

  function renderAbsBody() {
    const list = $('#abs-list');
    if (UI.absTab === 'rekap') return renderRekapBody();
    if (!list) return;
    const c = countStatus(S.siswa.map((s) => ({ status: UI.absDraft[s.id] })).filter((x) => x.status));
    const filled = Object.keys(UI.absDraft).filter((id) => S.siswa.some((s) => s.id === id)).length;
    $('#abs-summary').innerHTML = STATUS.map((st) => `<div class="card flex items-center gap-3 p-3.5"><span class="h-9 w-1.5 rounded-full" style="background:${st.hex}"></span>
      <div><p class="text-xs font-semibold text-slate-500">${st.label}</p><p class="text-xl font-extrabold text-slate-800">${c[st.k]}</p></div></div>`).join('')
      + `<div class="card col-span-2 flex items-center gap-3 p-3.5 sm:col-span-1"><span class="h-9 w-1.5 rounded-full bg-slate-300"></span><div><p class="text-xs font-semibold text-slate-500">Belum diisi</p><p class="text-xl font-extrabold text-slate-800">${S.siswa.length - filled}</p></div></div>`;
    $('#abs-save').classList.toggle('ring-4', UI.absDirty);
    $('#abs-save').classList.toggle('ring-indigo-200', UI.absDirty);

    list.innerHTML = S.siswa.length ? S.siswa.map((s, i) => {
      const st = UI.absDraft[s.id];
      const showWa = st && st !== 'H' && toWaNumber(s.no_wa);
      return `
      <div class="flex flex-col gap-3 p-4 transition hover:bg-indigo-50/30 sm:flex-row sm:items-center">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <span class="w-6 text-center text-xs font-bold text-slate-300">${i + 1}</span>
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${s.jk === 'L' ? 'bg-gradient-to-br from-sky-500 to-indigo-500' : 'bg-gradient-to-br from-pink-500 to-fuchsia-500'}">${initial(s.nama)}</div>
          <div class="min-w-0"><p class="truncate font-bold text-slate-800">${esc(s.nama)}</p><p class="font-mono text-[11px] text-slate-400">${esc(s.nisn)}</p></div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="grid grid-cols-4 gap-2 sm:w-[22rem]">
            ${STATUS.map((stItem) => `<button data-act="abs-set" data-id="${s.id}" data-st="${stItem.k}" class="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition active:scale-95 ${UI.absDraft[s.id] === stItem.k ? stItem.on : stItem.off}">
              <i data-lucide="${stItem.icon}" class="h-3.5 w-3.5"></i>${stItem.label}</button>`).join('')}
          </div>
          ${showWa ? `<button class="icon-btn !bg-emerald-50 !text-emerald-600 hover:!bg-emerald-100" title="Kirim WhatsApp ke orang tua" data-act="wa-absensi" data-id="${s.id}" data-st="${st}"><i data-lucide="message-circle" class="h-4 w-4"></i></button>` : ''}
        </div>
      </div>`;
    }).join('')
      : emptyState('users', 'Belum ada siswa', 'Tambahkan siswa terlebih dahulu di menu Data Siswa.', `<button class="btn btn-primary" data-act="go" data-go="siswa">Ke Data Siswa</button>`);
    icons();
  }

  async function saveAbsensi() {
    const rows = S.siswa.filter((s) => UI.absDraft[s.id]).map((s) => ({ tanggal: UI.absDate, siswa_id: s.id, status: UI.absDraft[s.id] }));
    if (!rows.length) return toast('Belum ada status yang dipilih', 'error');
    const res = await run(() => API.call('upsertMany', { table: 'absensi', rows }), `Absensi ${fmtDate(UI.absDate, { day: 'numeric', month: 'long' })} tersimpan`);
    if (!res) return;
    const keep = S.absensi.filter((a) => !(a.tanggal === UI.absDate && rows.some((r) => r.siswa_id === a.siswa_id)));
    S.absensi = keep.concat(res);
    UI.absDirty = false;
    renderAbsBody();
  }

  async function changeAbsDate(newDate) {
    if (!newDate) return;
    if (UI.absDirty && !(await confirmBox('Perubahan belum disimpan', 'Absensi pada tanggal ini belum disimpan. Pindah tanggal tanpa menyimpan?', 'Pindah', false))) { const i = $('#abs-date'); if (i) i.value = UI.absDate; return; }
    UI.absDate = newDate; loadDraft(); render();
  }

  /* ---- Rekap bulanan ---- */
  function absRekapShell() {
    return `
      <div class="card fadeup mb-4 flex flex-wrap items-center gap-3 p-4">
        <i data-lucide="calendar-range" class="h-5 w-5 text-indigo-500"></i>
        <input id="rekap-month" type="month" class="input !w-auto font-semibold" value="${UI.rekapMonth}" />
        <button class="btn btn-ghost ml-auto" data-act="abs-export"><i data-lucide="download" class="h-4 w-4"></i>Ekspor CSV</button>
      </div>
      <div id="rekap-body"></div>`;
  }

  function rekapData(month) {
    const recs = S.absensi.filter((a) => a.tanggal.startsWith(month));
    const hari = new Set(recs.map((a) => a.tanggal)).size;
    const rows = S.siswa.map((s) => ({ s, c: countStatus(recs.filter((a) => a.siswa_id === s.id)) }));
    return { hari, rows, total: countStatus(recs) };
  }

  function renderRekapBody() {
    const el = $('#rekap-body'); if (!el) return;
    const { hari, rows, total } = rekapData(UI.rekapMonth);
    const label = fmtDate(UI.rekapMonth + '-01', { month: 'long', year: 'numeric' });
    if (!hari) { el.innerHTML = `<div class="card">${emptyState('calendar-x', 'Belum ada data absensi', `Tidak ada absensi tercatat pada ${label}.`)}</div>`; icons(); return; }
    el.innerHTML = `
      <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div class="card p-3.5"><p class="text-xs font-semibold text-slate-500">Hari tercatat</p><p class="text-xl font-extrabold text-slate-800">${hari}</p></div>
        ${STATUS.map((st) => `<div class="card flex items-center gap-3 p-3.5"><span class="h-9 w-1.5 rounded-full" style="background:${st.hex}"></span><div><p class="text-xs font-semibold text-slate-500">Total ${st.label}</p><p class="text-xl font-extrabold text-slate-800">${total[st.k]}</p></div></div>`).join('')}
      </div>
      <div class="card fadeup overflow-hidden"><div class="overflow-x-auto scroll-thin"><table class="w-full min-w-[640px]">
        <thead class="bg-slate-50/70"><tr><th class="th w-12">No</th><th class="th">Nama Siswa</th>${STATUS.map((st) => `<th class="th text-center">${st.label}</th>`).join('')}<th class="th w-56">% Kehadiran (${hari} hari)</th></tr></thead>
        <tbody class="divide-y divide-slate-100">${rows.map(({ s, c }, i) => { const p = Math.round((c.H / hari) * 100); const col = p >= 90 ? 'bg-emerald-500' : p >= 75 ? 'bg-amber-500' : 'bg-rose-500';
          return `<tr class="hover:bg-indigo-50/40"><td class="td text-slate-400">${i + 1}</td><td class="td font-bold text-slate-800">${esc(s.nama)}</td>
          ${STATUS.map((st) => `<td class="td text-center font-semibold ${c[st.k] ? '' : 'text-slate-300'}" ${c[st.k] ? `style="color:${st.hex}"` : ''}>${c[st.k]}</td>`).join('')}
          <td class="td"><div class="flex items-center gap-3"><div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full ${col}" style="width:${p}%"></div></div><span class="w-10 text-right text-xs font-bold text-slate-600">${p}%</span></div></td></tr>`; }).join('')}</tbody>
      </table></div></div>`;
    icons();
  }

  function exportRekap() {
    const { hari, rows } = rekapData(UI.rekapMonth);
    if (!hari) return toast('Tidak ada data untuk diekspor', 'error');
    downloadCSV(`rekap-absensi-${UI.rekapMonth}.csv`, [['No', 'Nama', 'NISN', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Hari Tercatat', '% Hadir'],
      ...rows.map(({ s, c }, i) => [i + 1, s.nama, s.nisn, c.H, c.S, c.I, c.A, hari, Math.round((c.H / hari) * 100) + '%'])]);
  }

  /* ============================================================
   *  JURNAL GURU & DAFTAR MAPEL
   * ========================================================== */
  function allMapelList() {
    const set = new Set(MAPEL);
    (S.jurnal || []).forEach((j) => { if (j.mapel) set.add(j.mapel); });
    (S.ujian || []).forEach((u) => { if (u.mapel) set.add(u.mapel); });
    return [...set].sort((a, b) => a.localeCompare(b, 'id'));
  }

  function viewJurnal() {
    const tab = (id, label, icon) => `<button data-act="jurnal-tab" data-tab="${id}" class="chip !px-4 !py-2 ${UI.jurnalTab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'}"><i data-lucide="${icon}" class="h-4 w-4"></i>${label}</button>`;
    const mapels = allMapelList();
    let list = [...(S.jurnal || [])];
    if (UI.jurnalMapel !== 'Semua') list = list.filter((j) => j.mapel === UI.jurnalMapel);
    list.sort((a, b) => (b.tanggal + (b.dibuat || '')).localeCompare(a.tanggal + (a.dibuat || '')));

    const filterChips = [`<button data-act="jurnal-mapel" data-m="Semua" class="chip ${UI.jurnalMapel === 'Semua' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}">Semua</button>`]
      .concat(mapels.map((m) => `<button data-act="jurnal-mapel" data-m="${esc(m)}" class="chip ${UI.jurnalMapel === m ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}">${esc(m)}</button>`));

    return `
      ${pageHead('Jurnal Guru', 'Catat materi & kegiatan mengajar harian', `
        <div class="flex flex-wrap gap-2">
          ${tab('catatan', 'Catatan Jurnal', 'notebook-pen')}
          ${tab('mapel', 'Daftar Mapel', 'library')}
          <button class="btn btn-primary" data-act="jurnal-new"><i data-lucide="plus" class="h-4 w-4"></i>Tambah Jurnal</button>
        </div>`)}
      <div class="mb-4 flex flex-wrap gap-2">${filterChips.join('')}</div>
      ${list.length ? `<div class="space-y-3">${list.map((j) => {
        const hari = fmtDate(j.tanggal, { weekday: 'long' });
        return `<div class="card fadeup p-5">
          <div class="flex flex-wrap items-start gap-3">
            <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              <span class="text-base font-extrabold leading-none">${new Date(j.tanggal + 'T00:00:00').getDate()}</span>
              <span class="text-[10px] font-bold uppercase text-indigo-400">${fmtDate(j.tanggal, { month: 'short' })}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge bg-violet-50 text-violet-700 ring-violet-200">${esc(j.mapel)}</span>
                <span class="text-xs font-semibold text-slate-400">${hari}, ${fmtDate(j.tanggal)}</span>
              </div>
              <p class="mt-1.5 text-sm font-bold text-slate-800">${esc(j.materi)}</p>
              <p class="mt-1 text-sm text-slate-600"><span class="font-semibold text-slate-500">Kegiatan:</span> ${esc(j.kegiatan)}</p>
              ${j.keterangan ? `<p class="mt-1 text-xs text-slate-500"><span class="font-semibold">Keterangan:</span> ${esc(j.keterangan)}</p>` : ''}
            </div>
            <div class="flex gap-1">
              <button class="icon-btn" data-act="jurnal-edit" data-id="${j.id}" title="Edit"><i data-lucide="pencil" class="h-4 w-4"></i></button>
              <button class="icon-btn hover:!text-rose-600" data-act="jurnal-del" data-id="${j.id}" title="Hapus"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
            </div>
          </div>
        </div>`;
      }).join('')}</div>`
        : `<div class="card">${emptyState('book-open', 'Belum ada jurnal', UI.jurnalMapel === 'Semua' ? 'Mulai catat materi dan kegiatan mengajar Anda.' : `Belum ada jurnal untuk ${esc(UI.jurnalMapel)}.`, `<button class="btn btn-primary" data-act="jurnal-new"><i data-lucide="plus" class="h-4 w-4"></i>Tambah Jurnal</button>`)}</div>`}`;
  }

  function viewDaftarMapel() {
    const tab = (id, label, icon) => `<button data-act="jurnal-tab" data-tab="${id}" class="chip !px-4 !py-2 ${UI.jurnalTab === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'}"><i data-lucide="${icon}" class="h-4 w-4"></i>${label}</button>`;
    const mapels = allMapelList();
    const nm = nilaiMap();
    const cards = mapels.map((m) => {
      const jurnals = (S.jurnal || []).filter((j) => j.mapel === m);
      const uj = S.ujian.filter((u) => u.mapel === m);
      const lastJ = jurnals[0];
      const scores = [];
      uj.forEach((u) => S.siswa.forEach((s) => { const v = nm[u.id + '|' + s.id]; if (v != null) scores.push(v); }));
      const avg = mean(scores);
      return `<div class="card fadeup p-5">
        <div class="flex items-start gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg"><i data-lucide="book-marked" class="h-5 w-5"></i></div>
          <div class="min-w-0 flex-1">
            <h3 class="font-extrabold text-slate-800">${esc(m)}</h3>
            <div class="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
              <span class="inline-flex items-center gap-1"><i data-lucide="notebook-pen" class="h-3.5 w-3.5"></i>${jurnals.length} jurnal</span>
              <span class="inline-flex items-center gap-1"><i data-lucide="calendar-days" class="h-3.5 w-3.5"></i>${uj.length} ujian</span>
              ${avg != null ? `<span class="inline-flex items-center gap-1"><i data-lucide="bar-chart-2" class="h-3.5 w-3.5"></i>Rata-rata ${fmt(avg)}</span>` : ''}
            </div>
            ${lastJ ? `<p class="mt-2 text-xs text-slate-500">Terakhir: <span class="font-semibold text-slate-700">${esc(lastJ.materi)}</span> · ${fmtDate(lastJ.tanggal)}</p>` : `<p class="mt-2 text-xs text-slate-400">Belum ada catatan jurnal</p>`}
          </div>
          <button class="btn btn-soft !px-3 !py-2 text-xs" data-act="jurnal-mapel-go" data-m="${esc(m)}"><i data-lucide="list" class="h-3.5 w-3.5"></i>Jurnal</button>
        </div>
      </div>`;
    });

    return `
      ${pageHead('Daftar Mata Pelajaran', 'Ringkasan jurnal, ujian, dan nilai per mapel', `
        <div class="flex flex-wrap gap-2">
          ${tab('catatan', 'Catatan Jurnal', 'notebook-pen')}
          ${tab('mapel', 'Daftar Mapel', 'library')}
          <button class="btn btn-primary" data-act="jurnal-new"><i data-lucide="plus" class="h-4 w-4"></i>Tambah Jurnal</button>
        </div>`)}
      <div class="grid gap-4 sm:grid-cols-2">${cards.join('') || emptyState('library', 'Belum ada mapel', 'Tambah jurnal atau ujian untuk menampilkan daftar mapel.')}</div>`;
  }

  function jurnalForm(id) {
    const j = id ? (S.jurnal || []).find((x) => x.id === id) : null;
    const mapels = allMapelList();
    const opts = mapels.map((m) => `<option value="${esc(m)}" ${j && j.mapel === m ? 'selected' : ''}>${esc(m)}</option>`).join('');
    openModal(`
      ${modalHead(j ? 'Edit Jurnal' : 'Tambah Jurnal', 'Hari/tanggal, mapel, materi, kegiatan, keterangan', 'book-open')}
      <form id="f-jurnal" class="space-y-4 p-6">
        <input type="hidden" name="id" value="${j ? esc(j.id) : ''}" />
        <div class="grid gap-4 sm:grid-cols-2">
          <div><label class="label">Tanggal</label><input name="tanggal" type="date" class="input" required value="${esc(j ? j.tanggal : today())}" /></div>
          <div><label class="label">Mata Pelajaran</label>
            <input name="mapel" list="mapel-list" class="input" required placeholder="Pilih atau ketik mapel" value="${esc(j ? j.mapel : '')}" />
            <datalist id="mapel-list">${opts}</datalist>
          </div>
        </div>
        <div><label class="label">Materi</label><input name="materi" class="input" required placeholder="Contoh: Perkalian bersusun" value="${esc(j ? j.materi : '')}" /></div>
        <div><label class="label">Kegiatan</label><textarea name="kegiatan" class="input min-h-[80px]" required placeholder="Kegiatan pembelajaran yang dilakukan">${esc(j ? j.kegiatan : '')}</textarea></div>
        <div><label class="label">Keterangan (opsional)</label><textarea name="keterangan" class="input min-h-[60px]" placeholder="Catatan tambahan, kendala, dll.">${esc(j ? j.keterangan : '')}</textarea></div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn btn-ghost" data-act="modal-close">Batal</button>
          <button class="btn btn-primary"><i data-lucide="save" class="h-4 w-4"></i>Simpan</button>
        </div>
      </form>`);
  }

  async function saveJurnal(form) {
    const fd = Object.fromEntries(new FormData(form));
    const row = {
      id: fd.id || undefined,
      tanggal: fd.tanggal,
      mapel: (fd.mapel || '').trim(),
      materi: (fd.materi || '').trim(),
      kegiatan: (fd.kegiatan || '').trim(),
      keterangan: (fd.keterangan || '').trim(),
    };
    const saved = await run(() => API.call('upsert', { table: 'jurnal', row }), 'Jurnal tersimpan');
    if (!saved) return;
    S.jurnal = S.jurnal || [];
    const i = S.jurnal.findIndex((x) => x.id === saved.id);
    if (i >= 0) S.jurnal[i] = saved; else S.jurnal.push(saved);
    S.jurnal.sort((a, b) => (b.tanggal + (b.dibuat || '')).localeCompare(a.tanggal + (a.dibuat || '')));
    closeModal();
    render();
  }

  async function deleteJurnal(id) {
    if (!(await confirmBox('Hapus jurnal?', 'Catatan jurnal ini akan dihapus permanen.', 'Hapus', true))) return;
    const ok = await run(() => API.call('remove', { table: 'jurnal', id }), 'Jurnal dihapus');
    if (ok) {
      S.jurnal = (S.jurnal || []).filter((j) => j.id !== id);
      render();
    }
  }

  /* ============================================================
   *  POIN PERILAKU
   * ========================================================== */
  const totalPoin = (siswaId) => (S.poin || []).filter((p) => p.siswa_id === siswaId).reduce((sum, p) => sum + (parseInt(p.poin, 10) || 0), 0);
  const rewardFor = (total) => {
    let best = null;
    REWARD_THRESHOLDS.forEach((r) => { if (total >= r.min) best = r; });
    return best;
  };

  function viewPoin() {
    const totals = S.siswa.map((s) => ({ s, total: totalPoin(s.id) })).sort((a, b) => b.total - a.total);
    const top = totals.filter((t) => t.total > 0).slice(0, 5);
    const low = totals.filter((t) => t.total < 5);
    const recent = [...(S.poin || [])].sort((a, b) => (b.tanggal + b.dibuat).localeCompare(a.tanggal + a.dibuat)).slice(0, 8);

    return `
      ${pageHead('Poin Perilaku', 'Reward & sanksi perilaku siswa Kelas 3 SD',
        `<button class="btn btn-ghost" data-act="poin-rekap"><i data-lucide="list-ordered" class="h-4 w-4"></i>Rekap Siswa</button>
         <button class="btn btn-primary" data-act="poin-new"><i data-lucide="plus" class="h-4 w-4"></i>Catat Poin</button>`)}

      <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="card p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Total catatan</p>
          <p class="mt-1 text-2xl font-extrabold text-slate-800">${(S.poin || []).length}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Reward minggu ini</p>
          <p class="mt-1 text-2xl font-extrabold text-emerald-600">${(S.poin || []).filter((p) => p.jenis === 'reward' && isThisWeek(p.tanggal)).length}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Sanksi minggu ini</p>
          <p class="mt-1 text-2xl font-extrabold text-rose-600">${(S.poin || []).filter((p) => p.jenis === 'sanksi' && isThisWeek(p.tanggal)).length}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Siswa dengan poin ≥ 30</p>
          <p class="mt-1 text-2xl font-extrabold text-indigo-600">${totals.filter((t) => t.total >= 30).length}</p>
        </div>
      </div>

      <div class="mb-6 grid gap-6 lg:grid-cols-2">
        <div class="card overflow-hidden">
          <div class="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <h3 class="font-bold text-slate-800">Peringkat poin</h3>
            <button class="text-xs font-semibold text-indigo-600 hover:underline" data-act="poin-rekap">Lihat semua →</button>
          </div>
          <div class="divide-y divide-slate-100">
            ${top.length ? top.map((t, i) => {
              const rw = rewardFor(t.total);
              return `<div class="flex items-center gap-3 px-5 py-3.5 hover:bg-indigo-50/40">
                <span class="flex h-8 w-8 items-center justify-center rounded-full ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'} text-sm font-bold">${i + 1}</span>
                <div class="min-w-0 flex-1"><p class="truncate font-semibold text-slate-800">${esc(t.s.nama)}</p>
                  ${rw ? `<p class="text-xs text-emerald-600">${rw.label}</p>` : ''}</div>
                <span class="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">${t.total} pt</span>
              </div>`;
            }).join('') : `<p class="px-5 py-8 text-center text-sm text-slate-400">Belum ada poin. Mulai catat perilaku positif!</p>`}
          </div>
        </div>

        <div class="card overflow-hidden">
          <div class="border-b border-slate-100 px-5 py-4">
            <h3 class="font-bold text-slate-800">Catatan terbaru</h3>
          </div>
          <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto scroll-thin">
            ${recent.length ? recent.map((p) => {
              const s = S.siswa.find((x) => x.id === p.siswa_id);
              const pos = parseInt(p.poin, 10) > 0;
              return `<div class="flex items-start gap-3 px-5 py-3.5">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pos ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}">
                  <i data-lucide="${pos ? 'plus' : 'minus'}" class="h-4 w-4"></i>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-slate-800">${esc(s ? s.nama : '—')}</p>
                  <p class="text-sm text-slate-600">${esc(p.deskripsi)}</p>
                  <p class="mt-0.5 text-xs text-slate-400">${fmtDate(p.tanggal, { day: 'numeric', month: 'short' })}${p.catatan ? ' · ' + esc(p.catatan) : ''}</p>
                </div>
                <span class="font-bold ${pos ? 'text-emerald-600' : 'text-rose-600'}">${pos ? '+' : ''}${p.poin}</span>
              </div>`;
            }).join('') : `<p class="px-5 py-8 text-center text-sm text-slate-400">Belum ada catatan.</p>`}
          </div>
        </div>
      </div>

      ${low.length ? `
      <div class="card mb-6 border-amber-200 bg-amber-50/50">
        <div class="px-5 py-4 flex items-center gap-2">
          <i data-lucide="alert-triangle" class="h-5 w-5 text-amber-600"></i>
          <h3 class="font-bold text-amber-800">Perlu perhatian (${low.length} siswa poin &lt; 5)</h3>
        </div>
        <div class="flex flex-wrap gap-2 px-5 pb-4">
          ${low.map((t) => `<span class="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">${esc(t.s.nama)} (${t.total})</span>`).join('')}
        </div>
      </div>` : ''}

      <div class="card overflow-hidden">
        <div class="border-b border-slate-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <h3 class="font-bold text-slate-800">Daftar perilaku & poin</h3>
          <div class="flex gap-2">
            <button data-act="poin-tab" data-tab="reward" class="chip ${UI.poinTab !== 'sanksi' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}">Reward</button>
            <button data-act="poin-tab" data-tab="sanksi" class="chip ${UI.poinTab === 'sanksi' ? 'bg-rose-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}">Sanksi</button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50/70"><tr><th class="th w-12">No</th><th class="th">Perilaku</th><th class="th w-24 text-center">Poin</th><th class="th w-32"></th></tr></thead>
            <tbody id="poin-list-body" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </div>`;
  }

  function isThisWeek(ymdStr) {
    const d = new Date(ymdStr + 'T12:00:00');
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return d >= start && d < end;
  }

  function renderPoinBody() {
    const body = $('#poin-list-body');
    if (!body) return;
    const list = UI.poinTab === 'sanksi' ? SANKSI_LIST : REWARD_LIST;
    body.innerHTML = list.map((item, i) => `
      <tr class="hover:bg-slate-50/80">
        <td class="td text-slate-400">${i + 1}</td>
        <td class="td font-medium text-slate-800">${esc(item.deskripsi)}</td>
        <td class="td text-center font-bold ${item.poin > 0 ? 'text-emerald-600' : 'text-rose-600'}">${item.poin > 0 ? '+' : ''}${item.poin}</td>
        <td class="td text-right">
          <button class="btn btn-soft text-xs py-1.5 px-3" data-act="poin-quick" data-jenis="${item.poin > 0 ? 'reward' : 'sanksi'}" data-desc="${esc(item.deskripsi)}" data-poin="${item.poin}">
            <i data-lucide="plus" class="h-3.5 w-3.5"></i>Catat
          </button>
        </td>
      </tr>`).join('');
    icons();
  }

  function poinForm(prefill = {}) {
    const todayStr = today();
    const jenis = prefill.jenis || 'reward';
    const list = jenis === 'sanksi' ? SANKSI_LIST : REWARD_LIST;
    return `
      ${modalHead('Catat Poin Perilaku', 'Pilih siswa dan perilaku yang ditampilkan', 'award')}
      <form id="f-poin" class="space-y-4 p-6">
        <div>
          <label class="label">Tanggal</label>
          <input type="date" name="tanggal" class="input" value="${prefill.tanggal || todayStr}" required />
        </div>
        <div>
          <label class="label">Siswa</label>
          <select name="siswa_id" class="input" required>
            <option value="">— Pilih siswa —</option>
            ${S.siswa.map((s) => `<option value="${s.id}" ${prefill.siswa_id === s.id ? 'selected' : ''}>${esc(s.nama)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="label">Jenis</label>
          <div class="flex gap-3">
            <label class="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 ${jenis === 'reward' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}">
              <input type="radio" name="jenis" value="reward" ${jenis === 'reward' ? 'checked' : ''} class="accent-emerald-600" />
              <span class="font-semibold text-emerald-700">Reward (+)</span>
            </label>
            <label class="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 ${jenis === 'sanksi' ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}">
              <input type="radio" name="jenis" value="sanksi" ${jenis === 'sanksi' ? 'checked' : ''} class="accent-rose-600" />
              <span class="font-semibold text-rose-700">Sanksi (−)</span>
            </label>
          </div>
        </div>
        <div>
          <label class="label">Perilaku</label>
          <select name="deskripsi" class="input" id="poin-desc-select">
            ${list.map((item) => `<option value="${esc(item.deskripsi)}" data-poin="${item.poin}" ${prefill.deskripsi === item.deskripsi ? 'selected' : ''}>${esc(item.deskripsi)} (${item.poin > 0 ? '+' : ''}${item.poin})</option>`).join('')}
            <option value="__custom__">Lainnya (tulis sendiri)…</option>
          </select>
        </div>
        <div id="poin-custom-wrap" class="hidden">
          <label class="label">Deskripsi kustom</label>
          <input type="text" name="deskripsi_custom" class="input" placeholder="Tuliskan perilaku..." />
        </div>
        <div>
          <label class="label">Poin</label>
          <input type="number" name="poin" class="input" value="${prefill.poin || (list[0] ? list[0].poin : 2)}" required />
        </div>
        <div>
          <label class="label">Catatan (opsional)</label>
          <input type="text" name="catatan" class="input" placeholder="Mis. teguran ke-2, sudah dibina..." value="${esc(prefill.catatan || '')}" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn btn-ghost" data-act="modal-close">Batal</button>
          <button type="submit" class="btn btn-primary"><i data-lucide="save" class="h-4 w-4"></i>Simpan</button>
        </div>
      </form>`;
  }

  function viewPoinRekap() {
    const rows = S.siswa.map((s) => {
      const list = (S.poin || []).filter((p) => p.siswa_id === s.id);
      const reward = list.filter((p) => p.jenis === 'reward').reduce((a, p) => a + (parseInt(p.poin, 10) || 0), 0);
      const sanksi = list.filter((p) => p.jenis === 'sanksi').reduce((a, p) => a + Math.abs(parseInt(p.poin, 10) || 0), 0);
      const total = reward - sanksi;
      return { s, reward, sanksi, total, rw: rewardFor(total) };
    }).sort((a, b) => b.total - a.total);

    return `
      ${pageHead('Rekap Poin Siswa', 'Total reward, sanksi, dan capaian hadiah',
        `<button class="btn btn-ghost" data-act="go" data-go="poin"><i data-lucide="arrow-left" class="h-4 w-4"></i>Kembali</button>
         <button class="btn btn-primary" data-act="poin-new"><i data-lucide="plus" class="h-4 w-4"></i>Catat Poin</button>`)}
      <div class="card overflow-hidden">
        <div class="overflow-x-auto scroll-thin">
          <table class="w-full min-w-[640px]">
            <thead class="bg-slate-50/70">
              <tr>
                <th class="th w-12">No</th>
                <th class="th">Nama Siswa</th>
                <th class="th text-center">Reward (+)</th>
                <th class="th text-center">Sanksi (−)</th>
                <th class="th text-center">Total</th>
                <th class="th">Capaian</th>
                <th class="th w-28"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rows.map((r, i) => `
                <tr class="hover:bg-indigo-50/40">
                  <td class="td text-slate-400">${i + 1}</td>
                  <td class="td font-bold text-slate-800">${esc(r.s.nama)}</td>
                  <td class="td text-center font-semibold text-emerald-600">${r.reward || '—'}</td>
                  <td class="td text-center font-semibold text-rose-600">${r.sanksi || '—'}</td>
                  <td class="td text-center"><span class="rounded-full px-3 py-1 text-sm font-bold ${r.total >= 30 ? 'bg-indigo-100 text-indigo-700' : r.total < 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}">${r.total}</span></td>
                  <td class="td text-sm">${r.rw ? `<span class="font-semibold text-emerald-700">${r.rw.label}</span><br><span class="text-xs text-slate-500">${r.rw.desc}</span>` : '<span class="text-slate-400">—</span>'}</td>
                  <td class="td text-right">
                    <button class="icon-btn" title="Lihat riwayat" data-act="poin-detail" data-id="${r.s.id}"><i data-lucide="history" class="h-4 w-4"></i></button>
                    <button class="icon-btn" title="Tambah poin" data-act="poin-quick-siswa" data-id="${r.s.id}"><i data-lucide="plus" class="h-4 w-4"></i></button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        ${REWARD_THRESHOLDS.map((r) => `
          <div class="card p-4 text-center">
            <p class="text-xs font-bold uppercase tracking-wide text-indigo-600">${r.label}</p>
            <p class="mt-1 text-2xl font-extrabold text-slate-800">${r.min}+</p>
            <p class="mt-1 text-xs text-slate-500">${r.desc}</p>
          </div>`).join('')}
      </div>`;
  }

  function poinDetail(siswaId) {
    const s = S.siswa.find((x) => x.id === siswaId);
    if (!s) return;
    const list = (S.poin || []).filter((p) => p.siswa_id === siswaId).sort((a, b) => (b.tanggal + b.dibuat).localeCompare(a.tanggal + a.dibuat));
    const total = totalPoin(siswaId);
    const rw = rewardFor(total);
    openModal(`
      ${modalHead(s.nama, `Total poin: ${total}${rw ? ' · ' + rw.label : ''}`, 'user')}
      <div class="max-h-96 overflow-y-auto scroll-thin p-4">
        ${list.length ? `<div class="space-y-3">${list.map((p) => {
          const pos = parseInt(p.poin, 10) > 0;
          const hasWa = toWaNumber(s.no_wa);
          return `<div class="flex items-start gap-3 rounded-2xl border border-slate-100 p-3">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${pos ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} text-sm font-bold">${pos ? '+' : ''}${p.poin}</span>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-slate-800">${esc(p.deskripsi)}</p>
              <p class="text-xs text-slate-400">${fmtDate(p.tanggal, { day: 'numeric', month: 'long', year: 'numeric' })}${p.catatan ? ' · ' + esc(p.catatan) : ''}</p>
            </div>
            <div class="flex shrink-0 gap-1">
              ${hasWa ? `<button class="icon-btn !text-emerald-600 hover:!bg-emerald-50" data-act="wa-poin" data-siswa="${s.id}" data-jenis="${p.jenis}" data-desc="${esc(p.deskripsi)}" data-poin="${p.poin}" data-tgl="${p.tanggal}" title="Kirim WhatsApp"><i data-lucide="message-circle" class="h-4 w-4"></i></button>` : ''}
              <button class="icon-btn hover:!bg-rose-50 hover:!text-rose-600" data-act="poin-del" data-id="${p.id}" title="Hapus"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
            </div>
          </div>`;
        }).join('')}</div>` : `<p class="py-10 text-center text-sm text-slate-400">Belum ada catatan poin.</p>`}
      </div>
      <div class="flex justify-end gap-3 border-t border-slate-100 p-4">
        <button class="btn btn-ghost" data-act="modal-close">Tutup</button>
        <button class="btn btn-primary" data-act="poin-quick-siswa" data-id="${siswaId}"><i data-lucide="plus" class="h-4 w-4"></i>Tambah Poin</button>
      </div>`);
    icons();
  }

  /* ============================================================
   *  AGENDA UJIAN
   * ========================================================== */
  function viewUjian() {
    const t = today();
    const list = S.ujian.filter((u) => UI.ujianFilter === 'Semua' || u.jenis === UI.ujianFilter);
    const nm = nilaiMap();
    const chip = (f) => `<button data-act="ujian-filter" data-f="${f}" class="chip ${UI.ujianFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'}">${f}</button>`;
    return `
      ${pageHead('Agenda Ujian', `${S.ujian.length} ujian dijadwalkan`, `<button class="btn btn-primary" data-act="ujian-new"><i data-lucide="calendar-plus" class="h-4 w-4"></i>Jadwalkan Ujian</button>`)}
      <div class="mb-5 flex flex-wrap gap-2">${['Semua', ...JENIS].map(chip).join('')}</div>
      ${list.length ? `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">${[...list].sort((a, b) => (a.tanggal >= t) === (b.tanggal >= t) ? (a.tanggal >= t ? a.tanggal.localeCompare(b.tanggal) : b.tanggal.localeCompare(a.tanggal)) : (a.tanggal >= t ? -1 : 1)).map((u) => {
        const filled = S.siswa.filter((s) => nm[u.id + '|' + s.id] != null).length;
        const pct = S.siswa.length ? Math.round((filled / S.siswa.length) * 100) : 0;
        const past = u.tanggal < t;
        return `<div class="card fadeup flex flex-col p-5 ${past ? 'opacity-90' : ''}">
          <div class="flex items-start gap-3">${dateBlock(u.tanggal)}
            <div class="min-w-0 flex-1"><p class="truncate text-base font-extrabold text-slate-800">${esc(u.mapel)}</p>
              <p class="text-xs font-semibold ${past ? 'text-slate-400' : 'text-indigo-600'}">${fmtDate(u.tanggal, { weekday: 'long', day: 'numeric', month: 'long' })} • ${relDay(u.tanggal)}</p></div>
            <span class="badge ${JENIS_STYLE[u.jenis]}">${JENIS_SHORT[u.jenis]}</span></div>
          <p class="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">${esc(u.keterangan) || '<span class="text-slate-300">Tanpa keterangan</span>'}</p>
          <div class="mt-3"><div class="mb-1 flex justify-between text-[11px] font-semibold text-slate-500"><span>Nilai terisi</span><span>${filled}/${S.siswa.length}</span></div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style="width:${pct}%"></div></div></div>
          <div class="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
            <button class="btn btn-soft flex-1 !py-2" data-act="ujian-grade" data-id="${u.id}"><i data-lucide="table-2" class="h-4 w-4"></i>Input Nilai</button>
            <button class="icon-btn" data-act="ujian-edit" data-id="${u.id}" title="Edit"><i data-lucide="pencil" class="h-4 w-4"></i></button>
            <button class="icon-btn hover:!bg-rose-50 hover:!text-rose-600" data-act="ujian-del" data-id="${u.id}" title="Hapus"><i data-lucide="trash-2" class="h-4 w-4"></i></button></div>
        </div>`; }).join('')}</div>`
        : `<div class="card">${emptyState('calendar-days', 'Belum ada jadwal ujian', 'Jadwalkan Penilaian Harian, UTS, atau UAS untuk mulai mencatat nilai.', `<button class="btn btn-primary" data-act="ujian-new"><i data-lucide="calendar-plus" class="h-4 w-4"></i>Jadwalkan Ujian</button>`)}</div>`}`;
  }

  function ujianForm(id) {
    const u = S.ujian.find((x) => x.id === id) || { jenis: 'Penilaian Harian', tanggal: today() };
    const radio = (j) => `<label class="cursor-pointer"><input type="radio" name="jenis" value="${j}" class="peer sr-only" ${u.jenis === j ? 'checked' : ''}>
      <div class="rounded-xl border border-slate-200 px-2 py-2.5 text-center text-xs font-bold text-slate-500 transition peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700">${j}</div></label>`;
    openModal(`
      ${modalHead(id ? 'Edit Jadwal Ujian' : 'Jadwalkan Ujian', 'Tentukan mata pelajaran, tanggal, dan jenis ujian', 'calendar-plus')}
      <form id="f-ujian" class="space-y-4 p-6" data-id="${id || ''}">
        <div><label class="label">Mata Pelajaran</label><input name="mapel" list="dl-mapel" class="input" placeholder="Contoh: Matematika" value="${esc(u.mapel)}" required />
          <datalist id="dl-mapel">${MAPEL.map((m) => `<option value="${m}">`).join('')}</datalist></div>
        <div><label class="label">Tanggal Pelaksanaan</label><input name="tanggal" type="date" class="input" value="${esc(u.tanggal)}" required /></div>
        <div><label class="label">Jenis Ujian</label><div class="grid grid-cols-3 gap-2.5">${JENIS.map(radio).join('')}</div></div>
        <div><label class="label">Keterangan / Materi (opsional)</label><textarea name="keterangan" rows="2" class="input" placeholder="Bab / materi yang diujikan">${esc(u.keterangan)}</textarea></div>
        <div class="flex justify-end gap-3 pt-2"><button type="button" class="btn btn-ghost" data-act="modal-close">Batal</button>
          <button class="btn btn-primary"><i data-lucide="save" class="h-4 w-4"></i>Simpan</button></div>
      </form>`);
  }

  async function saveUjian(form) {
    const id = form.dataset.id;
    const fd = Object.fromEntries(new FormData(form).entries());
    fd.mapel = (fd.mapel || '').trim();
    if (!fd.mapel) return toast('Mata pelajaran wajib diisi', 'error');
    if (!fd.tanggal) return toast('Tanggal wajib diisi', 'error');
    if (id) fd.id = id;
    const row = await run(() => API.call('upsert', { table: 'ujian', row: fd }), id ? 'Jadwal diperbarui' : 'Ujian dijadwalkan');
    if (!row) return;
    const i = S.ujian.findIndex((u) => u.id === row.id);
    if (i >= 0) S.ujian[i] = row; else S.ujian.push(row);
    S.ujian.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    closeModal(); render();
  }

  async function deleteUjian(id) {
    const u = S.ujian.find((x) => x.id === id); if (!u) return;
    if (!(await confirmBox(`Hapus ujian ${u.mapel}?`, 'Semua nilai yang sudah diinput untuk ujian ini juga akan terhapus.'))) return;
    const ok = await run(() => API.call('remove', { table: 'ujian', id }), 'Ujian dihapus');
    if (!ok) return;
    S.ujian = S.ujian.filter((x) => x.id !== id);
    S.nilai = S.nilai.filter((x) => x.ujian_id !== id);
    Object.keys(UI.nilaiDirty).forEach((k) => { if (k.startsWith(id + '|')) delete UI.nilaiDirty[k]; });
    render();
  }

  /* ============================================================
   *  NILAI — GRID BERGAYA SPREADSHEET
   * ========================================================== */
  const gridExams = () => S.ujian.filter((u) => UI.nilaiFilter === 'Semua' || u.jenis === UI.nilaiFilter);

  function viewNilai() {
    const ex = gridExams();
    const nm = nilaiMap();
    const chip = (f) => `<button data-act="nilai-filter" data-f="${f}" class="chip ${UI.nilaiFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'}">${f}</button>`;
    const head = pageHead('Nilai Ujian', 'Ketik langsung di sel — rata-rata dihitung otomatis',
      `<button class="btn btn-ghost" data-act="nilai-export"><i data-lucide="download" class="h-4 w-4"></i>Ekspor CSV</button>
       <button id="nilai-save" class="btn btn-primary" data-act="nilai-save"><i data-lucide="save" class="h-4 w-4"></i>Simpan Nilai <span id="dirty-n" class="hidden rounded-full bg-white/25 px-2 text-xs"></span></button>`);
    if (!S.siswa.length) return head + `<div class="card">${emptyState('users', 'Belum ada siswa', 'Tambahkan siswa terlebih dahulu.', `<button class="btn btn-primary" data-act="go" data-go="siswa">Ke Data Siswa</button>`)}</div>`;
    if (!S.ujian.length) return head + `<div class="card">${emptyState('calendar-days', 'Belum ada agenda ujian', 'Grid nilai dibuat otomatis dari jadwal ujian yang Anda buat.', `<button class="btn btn-primary" data-act="ujian-new"><i data-lucide="calendar-plus" class="h-4 w-4"></i>Jadwalkan Ujian</button>`)}</div>`;

    return `${head}
      <div class="mb-4 flex flex-wrap items-center gap-2">${['Semua', ...JENIS].map(chip).join('')}
        <span class="ml-auto hidden items-center gap-1.5 text-xs text-slate-500 md:inline-flex"><i data-lucide="keyboard" class="h-4 w-4"></i>Panah / Enter untuk pindah sel • tempel dari Excel didukung • merah = di bawah KKM ${kkm()}</span></div>
      ${ex.length ? `
      <div class="card fadeup overflow-hidden">
        <div class="scroll-thin max-h-[68vh] overflow-auto">
          <table id="grid" class="w-full border-separate border-spacing-0 text-sm">
            <thead class="sticky top-0 z-20"><tr>
              <th class="sticky left-0 z-30 w-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-semibold text-slate-400">No</th>
              <th class="sticky left-10 z-30 min-w-[200px] border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nama Siswa</th>
              ${ex.map((u) => `<th data-colhead="${u.id}" class="min-w-[110px] border-b border-r border-slate-200 bg-slate-50 px-2 py-2.5 text-center align-top">
                <p class="truncate text-xs font-bold text-slate-700" title="${esc(u.mapel)}">${esc(u.mapel)}</p>
                <span class="badge mt-1 ${JENIS_STYLE[u.jenis]} !px-2 !py-0.5 !text-[10px]">${JENIS_SHORT[u.jenis]}</span>
                <p class="mt-0.5 text-[10px] font-medium text-slate-400">${fmtDate(u.tanggal, { day: 'numeric', month: 'short' })}</p></th>`).join('')}
              <th class="sticky right-0 z-30 min-w-[100px] border-b border-l border-indigo-200 bg-indigo-50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-indigo-700">Rata-rata</th>
            </tr></thead>
            <tbody>${S.siswa.map((s, r) => `<tr class="group">
              <td class="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 text-center text-xs text-slate-400 group-hover:bg-indigo-50">${r + 1}</td>
              <td class="sticky left-10 z-10 truncate border-b border-r border-slate-100 bg-white px-4 py-2 font-semibold text-slate-800 group-hover:bg-indigo-50">${esc(s.nama)}</td>
              ${ex.map((u, c) => { const k = u.id + '|' + s.id; const v = UI.nilaiDirty[k] ? UI.nilaiDirty[k].nilai : (nm[k] ?? '');
                return `<td data-col="${u.id}" class="border-b border-r border-slate-100 p-0"><input class="cell" type="number" inputmode="decimal" min="0" max="100" step="0.1" data-r="${r}" data-c="${c}" data-s="${s.id}" data-u="${u.id}" value="${v}" /></td>`; }).join('')}
              <td data-ra="${s.id}" class="sticky right-0 z-10 border-b border-l border-indigo-100 bg-indigo-50/80 px-3 text-center font-extrabold text-indigo-700">–</td>
            </tr>`).join('')}</tbody>
            <tfoot class="sticky bottom-0 z-20">
              ${[['Rata-rata Kelas', 'ca', 'text-indigo-700 bg-indigo-50'], ['Tertinggi', 'cmax', 'text-emerald-700 bg-emerald-50'], ['Terendah', 'cmin', 'text-rose-700 bg-rose-50']].map(([label, key, cls], i) => `<tr>
                <td colspan="2" class="sticky left-0 z-30 border-t ${i === 0 ? 'border-indigo-200' : 'border-slate-200'} px-4 py-2.5 text-xs font-bold uppercase tracking-wide ${cls}">${label}</td>
                ${ex.map((u) => `<td data-${key}="${u.id}" class="border-t ${i === 0 ? 'border-indigo-200' : 'border-slate-200'} px-2 py-2.5 text-center font-bold ${cls}">–</td>`).join('')}
                <td ${i === 0 ? 'id="grand"' : ''} class="sticky right-0 z-30 border-t border-l ${i === 0 ? 'border-indigo-200 bg-indigo-600 text-white' : 'border-slate-200 ' + cls} px-3 py-2.5 text-center text-base font-extrabold">${i === 0 ? '–' : ''}</td></tr>`).join('')}
            </tfoot>
          </table>
        </div>
      </div>
      <p class="mt-3 text-xs text-slate-400">Rata-rata per siswa dan kelas dihitung dari kolom yang sedang tampil (gunakan filter jenis ujian untuk menghitung khusus PH, UTS, atau UAS).</p>`
        : `<div class="card">${emptyState('filter-x', 'Tidak ada ujian', `Belum ada ujian berjenis ${UI.nilaiFilter}.`)}</div>`}`;
  }

  function recalcGrid() {
    if (!$('#grid')) return updateDirtyBadge();
    const k = kkm();
    const rows = {}, cols = {};
    $$('#grid input.cell').forEach((inp) => {
      const v = num(inp.value);
      inp.classList.toggle('low', v != null && v < k);
      if (v == null) return;
      (rows[inp.dataset.s] = rows[inp.dataset.s] || []).push(v);
      (cols[inp.dataset.u] = cols[inp.dataset.u] || []).push(v);
    });
    const rowAvgs = [];
    $$('#grid [data-ra]').forEach((el) => {
      const a = mean(rows[el.dataset.ra] || []);
      el.textContent = fmt(a);
      el.classList.toggle('!text-rose-600', a != null && a < k);
      if (a != null) rowAvgs.push(a);
    });
    $$('#grid [data-ca]').forEach((el) => { el.textContent = fmt(mean(cols[el.dataset.ca] || [])); });
    $$('#grid [data-cmax]').forEach((el) => { const a = cols[el.dataset.cmax]; el.textContent = a ? fmt(Math.max(...a)) : '–'; });
    $$('#grid [data-cmin]').forEach((el) => { const a = cols[el.dataset.cmin]; el.textContent = a ? fmt(Math.min(...a)) : '–'; });
    const g = $('#grand'); if (g) g.textContent = fmt(mean(rowAvgs));
    updateDirtyBadge();
  }

  function updateDirtyBadge() {
    const n = Object.keys(UI.nilaiDirty).length;
    const b = $('#dirty-n'), btn = $('#nilai-save');
    if (b) { b.textContent = n; b.classList.toggle('hidden', !n); }
    if (btn) { btn.classList.toggle('ring-4', n > 0); btn.classList.toggle('ring-indigo-200', n > 0); }
  }

  function onCell(inp) {
    if (inp.value !== '') { const n = parseFloat(inp.value); if (n > 100) inp.value = 100; if (n < 0) inp.value = 0; }
    UI.nilaiDirty[inp.dataset.u + '|' + inp.dataset.s] = { ujian_id: inp.dataset.u, siswa_id: inp.dataset.s, nilai: inp.value };
    recalcGrid();
  }

  function focusExamColumn() {
    if (!UI.nilaiFocus) return;
    const id = UI.nilaiFocus; UI.nilaiFocus = null;
    $$(`#grid [data-colhead="${id}"], #grid [data-col="${id}"]`).forEach((el) => el.classList.add('col-focus'));
    const first = $(`#grid input[data-u="${id}"]`);
    if (first) { first.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); setTimeout(() => first.focus({ preventScroll: true }), 350); }
  }

  async function saveNilai() {
    const rows = Object.values(UI.nilaiDirty);
    if (!rows.length) return toast('Tidak ada perubahan untuk disimpan');
    const res = await run(() => API.call('upsertMany', { table: 'nilai', rows }), `${rows.length} nilai tersimpan`);
    if (!res) return;
    res.forEach((r) => {
      const i = S.nilai.findIndex((n) => n.ujian_id === r.ujian_id && n.siswa_id === r.siswa_id);
      if (i >= 0) S.nilai[i] = r; else S.nilai.push(r);
    });
    UI.nilaiDirty = {};
    recalcGrid();
  }

  function exportNilai() {
    const ex = gridExams(), nm = nilaiMap();
    const head = ['No', 'Nama', 'NISN', ...ex.map((u) => `${u.mapel} (${JENIS_SHORT[u.jenis]} ${fmtDate(u.tanggal, { day: 'numeric', month: 'short' })})`), 'Rata-rata'];
    const rows = S.siswa.map((s, i) => {
      const vals = ex.map((u) => nm[u.id + '|' + s.id] ?? null);
      return [i + 1, s.nama, s.nisn, ...vals.map((v) => (v == null ? '' : v)), fmt(mean(vals.filter((v) => v != null)), 2)];
    });
    const colAvg = ex.map((u) => fmt(mean(S.siswa.map((s) => nm[u.id + '|' + s.id]).filter((v) => v != null)), 2));
    const grand = mean(S.siswa.map((s) => mean(ex.map((u) => nm[u.id + '|' + s.id]).filter((v) => v != null))).filter((v) => v != null));
    downloadCSV(`nilai-ujian-${today()}.csv`, [head, ...rows, ['', 'Rata-rata Kelas', '', ...colAvg, fmt(grand, 2)]]);
  }

  /** Navigasi keyboard & paste ala spreadsheet */
  function gridKeydown(e) {
    const t = e.target; if (!t.matches || !t.matches('input.cell')) return;
    const r = +t.dataset.r, c = +t.dataset.c;
    const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], Enter: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (!move) return;
    const next = $(`#grid input.cell[data-r="${r + move[0]}"][data-c="${c + move[1]}"]`);
    e.preventDefault();
    if (next) { next.focus(); next.select(); }
  }

  function gridPaste(e) {
    const t = e.target; if (!t.matches || !t.matches('input.cell')) return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!/[\n\t]/.test(text.trim())) return;
    e.preventDefault();
    const r0 = +t.dataset.r, c0 = +t.dataset.c;
    text.trim().split(/\r?\n/).forEach((line, i) => line.split('\t').forEach((val, j) => {
      const inp = $(`#grid input.cell[data-r="${r0 + i}"][data-c="${c0 + j}"]`);
      if (!inp) return;
      const n = parseFloat(val.replace(',', '.'));
      inp.value = isNaN(n) ? '' : Math.min(100, Math.max(0, n));
      onCell(inp);
    }));
    toast('Data berhasil ditempel');
  }

  /* ============================================================
   *  PENGATURAN
   * ========================================================== */
  function settingsForm() {
    const p = S.pengaturan;
    const f = (name, label, ph, extra = '') => `<div><label class="label">${label}</label><input name="${name}" class="input" placeholder="${ph}" value="${esc(p[name])}" ${extra} /></div>`;
    openModal(`
      ${modalHead('Pengaturan Kelas', 'Identitas sekolah dan batas ketuntasan', 'settings-2')}
      <form id="f-set" class="space-y-4 p-6">
        ${f('sekolah', 'Nama Sekolah', 'SD Negeri 1 Manado')}
        <div class="grid gap-4 sm:grid-cols-2">${f('kelas', 'Kelas', 'Kelas 4A')}${f('tahun_ajaran', 'Tahun Ajaran', '2026/2027')}</div>
        ${f('wali', 'Nama Wali Kelas', 'Nama lengkap & gelar')}
        <div class="grid gap-4 sm:grid-cols-2">
          ${f('kkm', 'KKM (batas ketuntasan)', '70', 'type="number" min="0" max="100"')}
          ${f('wa_grup', 'No. WA Grup Kelas', '62812xxxxxxxx', 'placeholder="62812xxxxxxxx"')}
        </div>
        <p class="text-xs text-slate-400 -mt-2">Nomor grup WhatsApp (format 62…) untuk kirim rekap absensi harian. Bisa dikosongkan.</p>
        ${API.demo ? `<div class="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 ring-1 ring-amber-200"><p class="font-bold">Mode Demo aktif</p><p class="mt-1">Data tersimpan di browser ini saja. Isi <code>API_URL</code> di <code>js/config.js</code> untuk terhubung ke Google Sheets.</p>
          <button type="button" class="mt-3 font-bold text-rose-600 underline" data-act="reset-demo">Reset data demo</button></div>` : ''}
        <div class="flex justify-end gap-3 pt-2"><button type="button" class="btn btn-ghost" data-act="modal-close">Batal</button>
          <button class="btn btn-primary"><i data-lucide="save" class="h-4 w-4"></i>Simpan</button></div>
      </form>`);
  }

  async function savePoin(form) {
    const fd = Object.fromEntries(new FormData(form));
    let deskripsi = fd.deskripsi;
    if (deskripsi === '__custom__') deskripsi = (fd.deskripsi_custom || '').trim();
    if (!deskripsi) return toast('Deskripsi wajib diisi', 'error');
    let poinVal = parseInt(fd.poin, 10);
    if (isNaN(poinVal) || poinVal === 0) return toast('Poin harus angka bukan nol', 'error');
    if (fd.jenis === 'sanksi' && poinVal > 0) poinVal = -poinVal;
    if (fd.jenis === 'reward' && poinVal < 0) poinVal = Math.abs(poinVal);

    const row = {
      tanggal: fd.tanggal,
      siswa_id: fd.siswa_id,
      jenis: fd.jenis,
      deskripsi,
      poin: String(poinVal),
      catatan: fd.catatan || '',
    };
    const saved = await run(() => API.call('upsert', { table: 'poin', row }), 'Poin berhasil dicatat');
    if (!saved) return;
    S.poin = S.poin || [];
    const i = S.poin.findIndex((p) => p.id === saved.id);
    if (i >= 0) S.poin[i] = saved; else S.poin.push(saved);
    closeModal();
    render();

    const siswa = S.siswa.find((x) => x.id === saved.siswa_id);
    if (siswa && toWaNumber(siswa.no_wa)) {
      const kirim = await confirmBox(
        'Kirim WhatsApp ke orang tua?',
        `Kirim pemberitahuan ${saved.jenis === 'reward' ? 'reward' : 'sanksi'} untuk ${siswa.nama}?`,
        'Kirim WA',
        false
      );
      if (kirim) {
        openWa(siswa.no_wa, pesanPoin(siswa, saved.jenis, saved.deskripsi, saved.poin, saved.tanggal));
      }
    }
  }

  async function saveSettings(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const res = await run(() => API.call('savePengaturan', { data }), 'Pengaturan disimpan');
    if (!res) return;
    S.pengaturan = res; closeModal(); render();
  }

  /* ============================================================
   *  EVENT DELEGATION
   * ========================================================== */
  const ACT = {
    go: (t) => go(t.dataset.go),
    'modal-close': closeModal,
    'confirm-yes': () => { const r = CONFIRM; CONFIRM = null; closeModal(); r && r(true); },
    'confirm-no': closeModal,
    settings: settingsForm,
    'reset-demo': async () => { if (await confirmBox('Reset data demo?', 'Semua perubahan akan hilang dan data contoh dimuat ulang.', 'Reset')) { API.resetDemo(); location.reload(); } },

    'siswa-new': () => siswaForm(),
    'siswa-edit': (t) => siswaForm(t.dataset.id),
    'siswa-del': (t) => deleteSiswa(t.dataset.id),
    'siswa-export': () => downloadCSV('data-siswa.csv', [['No', 'NISN', 'Nama', 'L/P', 'Tempat Lahir', 'Tanggal Lahir', 'Orang Tua/Wali', 'No. WA'], ...S.siswa.map((s, i) => [i + 1, s.nisn, s.nama, s.jk, s.tempat_lahir, s.tanggal_lahir, s.nama_ortu, s.no_wa || ''])]),

    'abs-tab': (t) => { UI.absTab = t.dataset.tab; render(); },
    'abs-set': (t) => { UI.absDraft[t.dataset.id] = t.dataset.st; UI.absDirty = true; renderAbsBody(); },
    'abs-all': () => { S.siswa.forEach((s) => { UI.absDraft[s.id] = 'H'; }); UI.absDirty = true; renderAbsBody(); },
    'abs-save': saveAbsensi,
    'abs-shift': (t) => changeAbsDate(shiftDate(UI.absDate, +t.dataset.n)),
    'abs-today': () => changeAbsDate(today()),
    'abs-export': exportRekap,

    'jurnal-tab': (t) => { UI.jurnalTab = t.dataset.tab; render(); },
    'jurnal-mapel': (t) => { UI.jurnalMapel = t.dataset.m; UI.jurnalTab = 'catatan'; render(); },
    'jurnal-mapel-go': (t) => { UI.jurnalMapel = t.dataset.m; UI.jurnalTab = 'catatan'; render(); },
    'jurnal-new': () => jurnalForm(),
    'jurnal-edit': (t) => jurnalForm(t.dataset.id),
    'jurnal-del': (t) => deleteJurnal(t.dataset.id),

    'ujian-new': () => ujianForm(),
    'ujian-edit': (t) => ujianForm(t.dataset.id),
    'ujian-del': (t) => deleteUjian(t.dataset.id),
    'ujian-filter': (t) => { UI.ujianFilter = t.dataset.f; render(); },
    'ujian-grade': (t) => { UI.nilaiFilter = 'Semua'; UI.nilaiFocus = t.dataset.id; go('nilai'); },

    'nilai-filter': (t) => { UI.nilaiFilter = t.dataset.f; render(); },
    'nilai-save': saveNilai,
    'nilai-export': exportNilai,

    'poin-new': () => { openModal(poinForm()); icons(); },
    'poin-rekap': () => { UI.poinRekap = true; render(); },
    'poin-tab': (t) => { UI.poinTab = t.dataset.tab; renderPoinBody(); },
    'poin-quick': (t) => {
      openModal(poinForm({ jenis: t.dataset.jenis, deskripsi: t.dataset.desc, poin: t.dataset.poin }));
      icons();
    },
    'poin-quick-siswa': (t) => {
      closeModal();
      openModal(poinForm({ siswa_id: t.dataset.id }));
      icons();
    },
    'poin-detail': (t) => poinDetail(t.dataset.id),
    'poin-del': async (t) => {
      if (!(await confirmBox('Hapus catatan poin?', 'Catatan ini akan dihapus permanen.', 'Hapus', true))) return;
      const ok = await run(() => API.call('remove', { table: 'poin', id: t.dataset.id }), 'Catatan dihapus');
      if (ok) {
        S.poin = (S.poin || []).filter((p) => p.id !== t.dataset.id);
        closeModal();
        render();
      }
    },

    'wa-absensi': (t) => {
      const s = S.siswa.find((x) => x.id === t.dataset.id);
      if (!s) return;
      openWa(s.no_wa, pesanAbsensi(s, t.dataset.st, UI.absDate));
    },
    'wa-poin': (t) => {
      const s = S.siswa.find((x) => x.id === t.dataset.siswa);
      if (!s) return;
      openWa(s.no_wa, pesanPoin(s, t.dataset.jenis, t.dataset.desc, t.dataset.poin, t.dataset.tgl));
    },
    'wa-absensi-all': async () => {
      const targets = S.siswa.filter((s) => {
        const st = UI.absDraft[s.id];
        return st && st !== 'H' && toWaNumber(s.no_wa);
      });
      if (!targets.length) return toast('Tidak ada siswa non-hadir yang punya nomor WA', 'error');
      if (!(await confirmBox(
        `Kirim WA ke ${targets.length} orang tua?`,
        'WhatsApp akan dibuka satu per satu. Siapkan jendela browser agar tidak diblokir.',
        'Mulai kirim'
      ))) return;
      for (const s of targets) {
        openWa(s.no_wa, pesanAbsensi(s, UI.absDraft[s.id], UI.absDate));
        await new Promise((r) => setTimeout(r, 600));
      }
    },
    'wa-absensi-grup': () => {
      const no = S.pengaturan.wa_grup;
      if (!toWaNumber(no)) {
        toast('Nomor WA Grup belum diisi. Buka Pengaturan untuk mengisi.', 'error');
        return;
      }
      openWa(no, pesanRekapAbsensi(UI.absDate));
    },
  };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (t && ACT[t.dataset.act]) { if (t.tagName === 'A') e.preventDefault(); ACT[t.dataset.act](t); }
  });
  document.addEventListener('submit', (e) => {
    const id = e.target.id;
    const h = { 'f-siswa': saveSiswa, 'f-ujian': saveUjian, 'f-set': saveSettings, 'f-poin': savePoin, 'f-jurnal': saveJurnal }[id];
    if (h) { e.preventDefault(); h(e.target); }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'q') { UI.q = t.value; renderSiswaRows(); }
    else if (t.matches && t.matches('input.cell')) onCell(t);
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'abs-date') changeAbsDate(t.value);
    if (t.id === 'rekap-month' && t.value) { UI.rekapMonth = t.value; renderRekapBody(); }
    if (t.name === 'jenis' && t.form && t.form.id === 'f-poin') {
      const list = t.value === 'sanksi' ? SANKSI_LIST : REWARD_LIST;
      const sel = t.form.querySelector('#poin-desc-select');
      const poinInput = t.form.querySelector('[name=poin]');
      if (sel) {
        sel.innerHTML = list.map((item) => `<option value="${esc(item.deskripsi)}" data-poin="${item.poin}">${esc(item.deskripsi)} (${item.poin > 0 ? '+' : ''}${item.poin})</option>`).join('') +
          '<option value="__custom__">Lainnya (tulis sendiri)…</option>';
        if (poinInput && list[0]) poinInput.value = list[0].poin;
      }
      t.form.querySelector('#poin-custom-wrap')?.classList.add('hidden');
    }
    if (t.id === 'poin-desc-select') {
      const wrap = t.form?.querySelector('#poin-custom-wrap');
      const poinInput = t.form?.querySelector('[name=poin]');
      if (t.value === '__custom__') {
        wrap?.classList.remove('hidden');
      } else {
        wrap?.classList.add('hidden');
        const opt = t.selectedOptions[0];
        if (opt && poinInput) poinInput.value = opt.dataset.poin || '';
      }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) closeModal();
    gridKeydown(e);
  });
  document.addEventListener('paste', gridPaste);
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', (e) => {
    if (UI.absDirty || Object.keys(UI.nilaiDirty).length) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ============================================================
   *  BOOT
   * ========================================================== */
  (async function boot() {
    showLoader(true);
    try {
      await loadAll();
      route();
    } catch (e) {
      $('#app').innerHTML = `<div class="card mx-auto mt-10 max-w-lg">${emptyState('wifi-off', 'Gagal memuat data', esc(e.message) + '. Periksa API_URL di js/config.js dan koneksi internet Anda.', `<button class="btn btn-primary" onclick="location.reload()">Coba Lagi</button>`)}</div>`;
      icons();
    } finally { showLoader(false); }
  })();
})();
