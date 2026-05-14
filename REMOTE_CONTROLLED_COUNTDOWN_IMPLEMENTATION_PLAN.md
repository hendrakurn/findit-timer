# Remote-Controlled Countdown for FindIT

Last updated: 2026-05-14

## Summary

Ubah aplikasi dari state lokal-per-browser menjadi countdown berbasis room yang bisa dikontrol dari HP dan ditampilkan bersih di layar utama.

Target flow:

- Layar utama membuka halaman display-only dan hanya menampilkan countdown besar.
- Operator membuka halaman remote dari HP untuk set label, durasi, start, pause/resume, dan reset.
- Kedua device sinkron lewat backend ringan berbasis room.
- Remote dilindungi PIN statis per session yang diberikan admin.

## Key Changes

### Shared timer model

- Ganti penyimpanan `localStorage` sebagai source of truth utama dengan state timer bersama per room.
- Tambahkan model state terpusat yang tetap memakai shape inti saat ini:
  - `roomId`
  - `eventLabel`
  - `durationSeconds`
  - `status`
  - `endAt`
  - `remainingMs`
  - `updatedAt`
- Pertahankan perhitungan display berbasis `endAt` di client agar countdown tetap halus tanpa polling ketat setiap detik.
- Batasi session ke dua identifier tetap:
  - `main-stage`
  - `pitch`
- Masing-masing session memiliki state countdown terpisah dan PIN statis yang berbeda.

### Routing and page behavior

- Halaman `/` menjadi display-only default.
  - Hapus CTA konfigurasi dari layar utama.
  - Default route diarahkan ke session display utama, yaitu `main-stage`, atau menampilkan display untuk session default yang dikonfigurasi.
  - Jika belum ada state session, tampilkan idle display yang tetap bersih.
- Tambahkan halaman display berbasis session, misalnya `/display/[sessionId]`, untuk dua session tetap yang didukung.
- Tambahkan halaman remote khusus, misalnya `/remote/[sessionId]`.
  - Form mobile-first untuk label + HH/MM/SS + preset.
  - Saat pertama dibuka, halaman menampilkan form PIN dulu.
  - Tombol `Start`, `Pause`, `Resume`, `Reset`.
  - Status sinkronisasi singkat: `Connected`, `Updating`, `Error`.
- Session yang valid hanya `main-stage` dan `pitch`; session lain harus ditolak dengan `not found` atau response API invalid session.

### Backend sync

- Tambahkan Route Handlers di `app/api/...` untuk operasi room:
  - `GET` state session
  - `PUT` update penuh / action timer
  - `POST` auth PIN untuk sesi remote
- Backend ringan yang dipilih dalam implementasi harus mendukung lintas-device dan deployment web biasa.
  - Rekomendasi implementasi: satu store sederhana per session dengan PIN static server-side dan polling client interval ringan.
- Simpan dua PIN statis berbeda di environment server, satu untuk `main-stage` dan satu untuk `pitch`.
  - `FINDIT_MAIN_STAGE_PIN` untuk `main-stage`
  - `FINDIT_PITCH_PIN` untuk `pitch`
  - `FINDIT_REMOTE_AUTH_SECRET` untuk signing cookie auth remote
- Endpoint auth memvalidasi PIN berdasarkan session yang sedang diakses.
- Setelah PIN valid, server membuat cookie/session auth scoped ke session tersebut.
- API update timer hanya menerima request dari remote yang memiliki auth valid untuk session terkait.
- Display page melakukan refresh state berkala dari backend.
- Remote page menulis action ke backend lalu optimistically refresh state lokal.
- Local development memakai in-memory store server-side sebagai fallback.
- Production implementation memakai persistent storage via Vercel KV/Upstash Redis REST jika env storage tersedia:
  - `KV_REST_API_URL` + `KV_REST_API_TOKEN`
  - atau `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- In-memory store hanya fallback untuk local development. Production tanpa persistent storage harus dianggap misconfigured karena countdown dapat kembali ke default 24 jam.

### UI and UX

- Pertahankan visual direction dari `DESIGN.md`: command-room, digit amber, mono labels.
- Display dibuat lebih bersih daripada sekarang:
  - hanya header event
  - digit besar
  - status kecil seperti `Ready`, `Paused`, `Complete`
  - tanpa tombol konfigurasi
- Remote dibuat jelas sebagai control surface di HP:
  - touch target minimum 44px
  - form satu kolom di mobile
  - quick presets tetap dipakai
  - layar PIN tampil sederhana dan cepat diakses sebelum control panel muncul
  - feedback validasi dan status koneksi eksplisit
- Complete state tetap memakai alarm visual, tetapi remote tetap bisa `Reset` dan `Start` ulang tanpa menyentuh layar display.

## Public Interfaces / API Changes

- Tambah route page display: `/display/[sessionId]`
- Tambah route page remote: `/remote/[sessionId]`
- Tambah route API untuk session countdown, dengan kontrak request/response JSON untuk:
  - fetch current session state
  - authenticate remote access by static PIN
  - start/pause/resume/reset timer
- Route final:
  - `GET /api/sessions/[sessionId]`
  - `PUT /api/sessions/[sessionId]`
  - `GET /api/sessions/[sessionId]/auth`
  - `POST /api/sessions/[sessionId]/auth`
  - `DELETE /api/sessions/[sessionId]/auth`
- Perlu type baru untuk shared session state dan action payload agar display dan remote memakai kontrak yang sama.
- Perlu daftar session valid yang dibatasi ke `main-stage` dan `pitch`.

## Test Plan

- HP start timer 24 jam pada `main-stage`, layar display `main-stage` langsung menampilkan countdown aktif.
- HP pause timer pada `main-stage`, layar `main-stage` berhenti di nilai yang sama.
- HP resume timer pada `main-stage`, layar lanjut dari sisa waktu terakhir.
- HP reset timer pada `main-stage`, layar kembali ke idle/default state.
- Ulangi skenario start/pause/resume/reset yang sama untuk session `pitch`.
- Pastikan `main-stage` dan `pitch` tidak saling memengaruhi state countdown.
- PIN `main-stage` ditolak jika dipakai login ke `pitch`, dan sebaliknya.
- PIN salah ditolak di remote; display tetap bisa dibuka tanpa PIN.
- Refresh halaman HP saat running tetap memuat state room yang benar.
- Refresh layar display saat running tetap sinkron ke `endAt` yang sama.
- Countdown 10 detik mencapai `complete` di kedua device dengan status konsisten.
- Mobile width 375px: remote form tidak overflow dan tetap nyaman dipakai.
- Display page tidak lagi menampilkan kontrol atau link setup.
- Session selain `main-stage` dan `pitch` ditolak.

## Assumptions

- Sinkronisasi lintas-device menggunakan backend room-based, bukan `localStorage` atau same-Wi-Fi-only transport.
- Layar utama harus display-only.
- Session yang didukung hanya `main-stage` dan `pitch`.
- Remote dilindungi PIN statis yang berbeda untuk tiap session, bukan auth penuh user account.
- Polling ringan cukup untuk v1; realtime socket bukan kebutuhan awal.
