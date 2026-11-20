# aldyrains.github.io

Situs resmi Aldi Riansyah (developer game indie). HTML statis, langsung disajikan GitHub Pages tanpa build.

## Isi

- `index.html`: beranda (daftar game, tentang, kontak)
- `games/<slug>/index.html`: halaman tiap game, gambarnya di `games/<slug>/img/`
- `assets/style.css`: gaya bersama
- `app-ads.txt`: wajib untuk AdMob, jangan dihapus atau dipindah
- `assets/logo.webp`, `assets/logo-512.png`: logo; favicon di `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`
- `sitemap.xml`, `robots.txt`, `404.html`

## Menambah game baru

1. Salin folder `games/wni-life/` menjadi `games/<slug-baru>/` (huruf kecil, pakai tanda hubung).
2. Ganti gambar di `games/<slug-baru>/img/`:
   - `banner.webp` dan `banner.jpg` (1024×500, dari feature graphic Play)
   - `hero.webp` (2048×1000, versi besar feature graphic untuk latar atas)
   - gambar kartu beranda (misalnya `scenes.webp`, rasio sekitar 4:3)
   - `icon.webp` (256×256)
   - screenshot `.webp` (540×960)
3. Edit `games/<slug-baru>/index.html`: judul, deskripsi, `og:*`, `canonical`, link Play, fitur, info, dan link kebijakan privasi.
4. Di `index.html`, salin blok `<a class="card">` di antara komentar `<!-- GAME -->` dan `<!-- /GAME -->`, ganti isinya dan nomornya (`02`, `03`, ...). Kartu "Game berikutnya" bisa dihapus atau dinomori ulang.
5. Tambah alamat halaman baru di `sitemap.xml`.
6. Bila game memakai AdMob dengan akun lain, tambah barisnya di `app-ads.txt`.

Status game di label: `Tes tertutup` (kelas `live`), `Segera hadir`, atau `Tersedia di Google Play`.

Gaya: Instrument Serif untuk judul, Geist untuk teks, Geist Mono untuk label kecil (Google Fonts).
Saat sudah rilis publik, ganti tombol "Jadi penguji" dengan link Google Play dan hapus kotak `#penguji`.

## Cek lokal

```bash
python3 -m http.server 8000
```

Lalu buka http://localhost:8000.
