# Wali Kelas SD — Aplikasi Administrasi Guru Wali Kelas

Aplikasi web responsif untuk wali kelas Sekolah Dasar: data siswa, absensi harian + rekap bulanan,
jurnal guru, daftar mata pelajaran, poin perilaku (reward & sanksi), agenda ujian, serta grid nilai
bergaya spreadsheet dengan rata-rata otomatis. Didukung notifikasi WhatsApp ke orang tua dan grup kelas.

**Stack:** HTML + Tailwind CSS (CDN) + Vanilla JS • Backend Google Apps Script • Database Google Sheets.

---

## 1. Struktur Folder

```
wali-kelas-sd/
├── README.md
├── backend/
│   └── Code.gs              ← Google Apps Script (API + akses Google Sheets)
└── frontend/
    ├── index.html           ← Layout: sidebar, header, bottom-nav, modal, toast
    └── js/
        ├── config.js        ← API_URL & TOKEN (kosong = Mode Demo)
        ├── api.js           ← Klien API + mesin Mode Demo (localStorage)
        └── app.js           ← Semua logika UI & bisnis
```

## 2. Struktur Database (Google Sheets)

Semua kolom berformat teks (`@`) agar NISN berawalan nol dan tanggal `yyyy-MM-dd` tidak berubah.

| Sheet | Kolom | Keterangan |
|---|---|---|
| **Siswa** | `id`, `nisn`, `nama`, `jk`, `tempat_lahir`, `tanggal_lahir`, `nama_ortu`, `no_wa`, `dibuat` | `jk` = L / P. NISN unik, 10 digit. `no_wa` = nomor WhatsApp orang tua. |
| **Absensi** | `id`, `tanggal`, `siswa_id`, `status` | `status` = H / S / I / A. Kunci unik: `tanggal + siswa_id`. |
| **Ujian** | `id`, `mapel`, `tanggal`, `jenis`, `keterangan` | `jenis` = Penilaian Harian / UTS / UAS. |
| **Nilai** | `id`, `ujian_id`, `siswa_id`, `nilai` | `nilai` 0–100. Kunci unik: `ujian_id + siswa_id`. |
| **Poin** | `id`, `tanggal`, `siswa_id`, `jenis`, `deskripsi`, `poin`, `catatan`, `dibuat` | `jenis` = reward / sanksi. `poin` bertanda (+/−). |
| **Jurnal** | `id`, `tanggal`, `mapel`, `materi`, `kegiatan`, `keterangan`, `dibuat` | Catatan mengajar harian per mapel. |
| **Pengaturan** | `kunci`, `nilai` | `sekolah`, `kelas`, `wali`, `tahun_ajaran`, `kkm`, `wa_grup`. |

Relasi: `Absensi.siswa_id → Siswa.id`, `Nilai.siswa_id → Siswa.id`, `Nilai.ujian_id → Ujian.id`.
Menghapus siswa/ujian otomatis menghapus data turunannya (cascade).

## 3. Alur Kerja

```
Browser (index.html + app.js)
   │  1. boot: POST {action:"getAll"} ───────────────► Apps Script doPost()
   │  ◄──────── {siswa, absensi, ujian, nilai, poin, jurnal, pengaturan}
   │  2. semua perhitungan (rekap, rata-rata) di sisi klien
   │  3. simpan: upsert / upsertMany / remove ────────────────┘
```

API hanya punya 5 aksi: `getAll`, `upsert`, `upsertMany`, `remove`, `savePengaturan`.
Absensi dan nilai disimpan sekali per tombol **Simpan** (satu request untuk seluruh kelas).

| Modul | Cara pakai |
|---|---|
| Data Siswa | Tambah/edit lewat modal, cari nama/NISN/orang tua secara langsung, hapus dengan konfirmasi. |
| Absensi | Pilih tanggal → klik Hadir/Sakit/Izin/Alpa per siswa (atau **Semua Hadir**) → Simpan. Tab **Rekap Bulanan** menampilkan jumlah H/S/I/A dan % kehadiran, bisa diekspor CSV. Tombol **WA Grup** mengirim rekap harian ke nomor grup yang diisi di Pengaturan. |
| Jurnal Guru | Catat hari/tanggal, mata pelajaran, materi, kegiatan, dan keterangan. Filter per mapel. Tab **Daftar Mapel** menampilkan ringkasan jurnal, ujian, dan rata-rata nilai per mata pelajaran. |
| Agenda Ujian | Form mapel, tanggal, jenis (PH/UTS/UAS), keterangan. Kartu menampilkan progres nilai terisi. |
| Nilai Ujian | Kolom = ujian terjadwal, baris = siswa. Ketik langsung, panah/Enter untuk berpindah, tempel dari Excel. Rata-rata siswa, rata-rata kelas, tertinggi, terendah terhitung otomatis; nilai di bawah KKM berwarna merah. |
| Poin Perilaku | Catat reward (+poin) dan sanksi (−poin) dari daftar perilaku. Rekap total per siswa, peringkat, capaian hadiah (30–50 poin), dan riwayat. |
| WhatsApp | Kirim notifikasi absensi (S/I/A) dan poin ke orang tua lewat wa.me. Rekap absensi harian ke **grup WA kelas** (isi `wa_grup` di Pengaturan, format 62…). |

## 4. Cara Menjalankan

**Coba dulu (Mode Demo, tanpa backend):** buka `frontend/index.html` di browser. Data contoh tersimpan di localStorage.

**Hubungkan ke Google Sheets:**
1. Buat Google Sheet baru → *Extensions → Apps Script*, tempel isi `backend/Code.gs`.
2. Jalankan fungsi `setup()` sekali dan setujui izin akses (membuat sheet beserta header, termasuk **Jurnal**).
3. *Deploy → New deployment → Web app* — Execute as **Me**, Who has access **Anyone**.
4. Salin URL berakhiran `/exec` ke `frontend/js/config.js` → `API_URL`.
5. Hosting frontend: Netlify, GitHub Pages, Cloudflare Pages, atau buka lokal.

Setelah mengubah `Code.gs`, buat **New version** pada deployment agar perubahan aktif.
Jika sebelumnya sudah punya sheet, jalankan ulang `setup()` agar sheet **Jurnal** dan kolom `wa_grup` tersinkron.

## 5. Keamanan & Catatan

- URL Web App bersifat "siapa pun yang tahu". Isi `TOKEN` di `Code.gs` dan `config.js` sebagai lapisan sederhana. Token di frontend tetap terlihat, jadi jangan simpan data yang sangat sensitif tanpa autentikasi tambahan (mis. login Google dan `Session.getActiveUser()`).
- Data siswa adalah data pribadi anak. Batasi akses ke Google Sheet hanya untuk guru dan sekolah.
- Penulisan memakai `LockService` sehingga aman bila dua orang menyimpan bersamaan.
- Untuk satu kelas (±30 siswa) `getAll` sangat cepat. Jika absensi menumpuk bertahun-tahun, arsipkan sheet per tahun ajaran.
- Nomor WA Grup: isi format internasional tanpa `+` (contoh `6281234567890`). WhatsApp Web/App akan terbuka dengan pesan rekap siap kirim.

## 6. Ide Pengembangan

Cetak rapor/leger (PDF), impor siswa dari Excel, login multi-guru, notifikasi WhatsApp otomatis via API resmi, lampiran foto di jurnal.
