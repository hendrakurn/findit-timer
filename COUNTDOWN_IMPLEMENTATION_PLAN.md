# Implementation Plan: FindIT Event Countdown

## Ringkasan

Tujuan proyek ini adalah mengganti halaman default Next.js menjadi website countdown event bertema FindIT. Countdown harus default siap untuk durasi 24 jam dalam format jam, tetapi tetap fleksibel supaya user bisa mengisi durasi sendiri.

Stack yang terdeteksi:

- Next.js `16.2.6` dengan App Router
- React `19.2.4`
- Tailwind CSS v4 lewat `@tailwindcss/postcss`
- Root page saat ini masih template default di `app/page.tsx`

Referensi yang dipakai:

- `refe/image copy.png`: palette biru FindIT.
- `refe/image.png`: arah tema visual, hero biru, glow kuning, objek teknologi, dan CTA kecil.
- `refe/Layer x0020 2.svg`, `refe/Layer x0020 3.svg`, `refe/Layer x0020 4.svg`: asset logo/mark lokal yang perlu dipakai ulang.
- `https://www.find-it.id/`: inspirasi struktur hero, gaya copy "ARE YOU READY TO COMPETE?", treatment countdown besar, dan tema "Radiance of Discoveries".
- `node_modules/next/dist/docs/01-app/...`: rujukan Next.js 16 lokal sesuai instruksi `AGENTS.md`.

## Arah Produk

Website harus terasa seperti event countdown display, bukan landing page panjang. Layar pertama langsung menampilkan timer besar, kontrol durasi, dan identitas FindIT.

Fitur inti:

- Default countdown 24 jam, ditampilkan sebagai `24 Hours : 00 Minutes : 00 Seconds`.
- Input durasi custom: jam, menit, detik. Tidak ada unit hari.
- Tombol `Start`, `Pause/Resume`, dan `Reset`.
- Input nama event atau label countdown, misalnya `Registration Closes In`.
- Status selesai saat timer mencapai nol, dengan background efek kelap-kelip merah.
- Timer tetap stabil saat tab berpindah atau halaman direfresh, jika persistence diaktifkan.

Fitur nice-to-have setelah versi inti:

- Mode target waktu spesifik, misalnya pilih tanggal dan jam event.
- Fullscreen display untuk dipakai saat acara.
- Preset durasi cepat: `15m`, `1h`, `6h`, `24h`.
- Share URL dengan durasi preset lewat query params.

## Arah Visual

Gunakan tema biru FindIT dengan aksen kuning/glow. Hindari tampilan template generik.

Palette utama dari `refe/image copy.png`:

| Token | Hex |
| --- | --- |
| `blue-50` | `#eaf0fb` |
| `blue-100` | `#bfcaf0` |
| `blue-200` | `#a0b4ee` |
| `blue-300` | `#7492e6` |
| `blue-400` | `#597de1` |
| `blue-500` | `#305cda` |
| `blue-600` | `#2c54c6` |
| `blue-700` | `#22419b` |
| `blue-800` | `#1a3378` |
| `blue-900` | `#14275c` |

Tambahkan token aksen:

- `findit-yellow`: untuk glow headline dan highlight angka.
- `findit-orange`: untuk indikator aktif/error ringan.
- `findit-cyan`: untuk objek dekoratif dan garis interaksi.
- Surface gelap transparan untuk panel input dan kartu angka.

Komposisi visual:

- Background full-bleed biru gelap dengan radial glow kuning/biru.
- Header kecil dengan logo FindIT dari asset lokal.
- Timer angka besar di tengah, memakai font mono untuk angka.
- Kartu angka punya batas tipis, blur ringan, dan glow subtle.
- Objek dekoratif dari SVG lokal diletakkan absolute, responsif, dan tidak mengganggu konten.
- Animasi ringan pada glow/decorative objects hanya jika `prefers-reduced-motion: no-preference`.
- Saat countdown selesai, aktifkan overlay/background merah berkedip sebagai state alarm. Efek harus jelas, tetapi tetap menjaga teks terbaca dan dimatikan/ditenangkan untuk `prefers-reduced-motion`.

## Struktur File yang Direncanakan

```text
app/
  page.tsx
  layout.tsx
  globals.css
  components/
    countdown-experience.tsx
    countdown-display.tsx
    duration-form.tsx
    event-header.tsx
    decorative-scene.tsx
  lib/
    countdown.ts
public/
  findit/
    logo-main.svg
    logo-mark.svg
    logo-orbit.svg
```

Catatan asset:

- Copy asset dari `refe/` ke `public/findit/` dengan nama bersih agar mudah dipakai oleh `next/image`.
- Jangan mengandalkan `refe/image.png` sebagai background produksi. Gunakan sebagai referensi desain, lalu bangun ulang scene dengan CSS, SVG lokal, dan token warna.

## Rencana Implementasi

### 1. Persiapan Project

- Baca panduan Next lokal yang relevan sebelum menulis kode: App Router, Server/Client Components, CSS, dan Images.
- Tambahkan dependency `lucide-react` jika kontrol timer memakai ikon.
- Pindahkan/copy asset SVG dari `refe` ke `public/findit`.
- Update metadata di `app/layout.tsx` menjadi nama dan deskripsi countdown FindIT.

### 2. Design Tokens dan Global CSS

- Update `app/globals.css`:
  - Tambahkan CSS variables untuk palette FindIT.
  - Mapping token ke `@theme inline` Tailwind v4.
  - Set body background ke biru gelap.
  - Tambahkan utility animation untuk glow/floating decorative assets.
  - Tambahkan reduced-motion guard.
- Pertahankan font Geist Sans dan Geist Mono yang sudah ada.

### 3. Layout Halaman

- `app/page.tsx` tetap Server Component.
- Render shell utama:
  - `<EventHeader />`
  - `<DecorativeScene />`
  - `<CountdownExperience />`
- Gunakan layout full-bleed dengan konten terpusat dan aman di mobile.
- Tidak membuat landing page panjang; fokus pada timer dan kontrol.

### 4. Logika Countdown

Buat helper di `app/lib/countdown.ts`:

- `clampDurationInput`
- `durationToSeconds`
- `formatRemainingTime`
- `getRemainingMs`

State inti di `countdown-experience.tsx`:

- `durationSeconds`
- `endAt`
- `remainingMs`
- `status`: `idle | running | paused | complete`
- `eventLabel`

Perilaku:

- Default durasi `24:00:00` dalam format `Hours:Minutes:Seconds`.
- Saat `Start`, hitung `endAt = Date.now() + durationSeconds * 1000`.
- Saat running, hitung sisa waktu dari timestamp aktual, bukan hanya decrement counter.
- Saat `Pause`, simpan `remainingMs`.
- Saat `Resume`, buat `endAt` baru dari `Date.now() + remainingMs`.
- Saat nol, set status `complete`, tampilkan state selesai, dan aktifkan class visual alarm merah.
- Cleanup interval di `useEffect`.

Persistence:

- Simpan `eventLabel`, `durationSeconds`, `endAt`, `remainingMs`, dan `status` ke `localStorage`.
- Saat load, validasi apakah countdown masih aktif atau sudah selesai.
- Hindari akses `window/localStorage` di Server Component; hanya lakukan di Client Component.

### 5. Form Input Durasi

Gunakan `<form>` dengan field berlabel:

- Event label
- Hours
- Minutes
- Seconds

Aturan input:

- Gunakan `type="text"` + `inputMode="numeric"`, bukan `type="number"`.
- Validasi integer non-negatif.
- Hours menerima total jam, bukan jam dalam satu hari. Contoh: `24`, `36`, `72`.
- Tetapkan batas atas hours yang masuk akal untuk UI, misalnya `999`.
- Menit dan detik maksimal `59`.
- Total durasi minimal 1 detik.
- Beri error inline dengan `aria-invalid` dan `aria-describedby`.
- Fokus ke field invalid pertama saat submit gagal.

Kontrol:

- Preset buttons: `15m`, `1h`, `6h`, `24h`.
- Primary action: `Start`.
- Secondary action: `Pause/Resume`, `Reset`.
- Semua tombol memakai `<button>` asli dan visible focus ring.

### 6. Countdown Display

Tampilkan unit:

- Hours
- Minutes
- Seconds

Detail display:

- Gunakan font mono untuk angka.
- Hours menampilkan total jam tersisa, bukan dikonversi menjadi days. Contoh durasi 30 jam tampil sebagai `30 Hours`, bukan `1 Day 6 Hours`.
- Angka hours minimal 2 digit dan boleh 3 digit jika durasi panjang.
- Minutes dan seconds selalu 2 digit.
- Tambahkan `aria-live="polite"` pada area status, bukan pada setiap angka agar screen reader tidak terlalu ramai.
- Kartu angka punya ukuran stabil agar layout tidak bergeser saat angka berubah.
- State `complete` mengganti copy menjadi pesan selesai, misalnya `Countdown Complete`.
- State `complete` juga menambahkan background alarm merah berkedip. Jika user memakai reduced motion, tampilkan background merah statis atau pulse sangat ringan.

### 7. Responsive dan Accessibility

Target viewport:

- Mobile: 375px
- Tablet: 768px
- Desktop: 1280px

Checklist implementasi:

- Tab order mengikuti layout visual.
- Semua interactive element punya focus ring.
- Hit target minimal 40px.
- Kontras teks minimal WCAG AA.
- Decorative SVG diberi `alt=""` atau `aria-hidden="true"`.
- Timer/status punya teks yang bisa dibaca screen reader.
- Animasi dekoratif dan alarm selesai menghormati reduced motion.

### 8. Verifikasi

Jalankan:

```bash
pnpm lint
pnpm build
```

Manual test:

- Start default 24 jam dan pastikan tampil sebagai `24 Hours : 00 Minutes : 00 Seconds`.
- Start custom 10 detik dan pastikan complete state muncul.
- Start custom 30 jam dan pastikan tampil sebagai `30 Hours`, bukan `1 Day`.
- Saat complete, pastikan background merah berkedip di browser normal dan menjadi lebih tenang saat reduced motion aktif.
- Pause lalu resume tanpa kehilangan sisa waktu.
- Reset mengembalikan state idle.
- Refresh saat running dan pastikan countdown tetap sinkron.
- Cek mobile 375px: input dan timer tidak overflow.
- Cek desktop 1280px: dekorasi tidak menutup teks atau tombol.

## Acceptance Criteria

- Halaman utama bukan lagi template Next.js.
- Visual mengikuti palette dan tema FindIT dari folder `refe`.
- Asset `Layer x0020 2.svg`, `Layer x0020 3.svg`, dan `Layer x0020 4.svg` digunakan dalam UI.
- Countdown default 24 jam tersedia dalam format hours-only.
- User bisa mengisi durasi custom dengan `Hours`, `Minutes`, dan `Seconds`.
- Tidak ada tampilan atau input `Days`.
- Start, pause/resume, reset, dan complete state berfungsi.
- Complete state menampilkan efek background merah kelap-kelip.
- Build dan lint lolos.
- Layout rapi di mobile, tablet, dan desktop.
