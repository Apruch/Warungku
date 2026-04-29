// ═══════════════════════════════════════════════════════
// WarungKu — Service Worker
// Repo: https://github.com/Apruch/Warungku
// Base path: /Warungku/
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'warungku-v67';
const BASE = '/Warungku/';

// Semua file yang akan di-cache untuk akses offline
const ASSETS_TO_CACHE = [
  BASE,
  BASE + 'index.html',
  BASE + 'css/style.css',
  BASE + 'js/app.js',
  BASE + 'js/db.js',
  BASE + 'manifest.json',

  // Seluruh halaman pages/
  BASE + 'pages/splash.html',
  BASE + 'pages/login.html',
  BASE + 'pages/signup.html',
  BASE + 'pages/data-pengguna.html',
  BASE + 'pages/login-sukses.html',
  BASE + 'pages/lupa-sandi.html',
  BASE + 'pages/daftar-sukses.html',
  BASE + 'pages/home.html',
  BASE + 'pages/katalog.html',
  BASE + 'pages/barang-detail.html',
  BASE + 'pages/info-barang.html',
  BASE + 'pages/tambah-barang.html',
  BASE + 'pages/barang-masuk.html',
  BASE + 'pages/barang-keluar.html',
  BASE + 'pages/filters.html',
  BASE + 'pages/laporan.html',
  BASE + 'pages/mitra.html',
  BASE + 'pages/profil-mitra.html',
  BASE + 'pages/tambah-mitra.html',
  BASE + 'pages/edit-mitra.html',
  BASE + 'pages/pengaturan.html',
  BASE + 'pages/ganti-nama.html',
  BASE + 'pages/ganti-warung.html',
  BASE + 'pages/scanner.html',
  BASE + 'pages/tutup-toko.html',
  BASE + 'pages/_overlays.html',

  // Ikon-ikon PWA
  BASE + 'icons/icon-72x72.png',
  BASE + 'icons/icon-96x96.png',
  BASE + 'icons/icon-128x128.png',
  BASE + 'icons/icon-144x144.png',
  BASE + 'icons/icon-152x152.png',
  BASE + 'icons/icon-192x192.png',
  BASE + 'icons/icon-384x384.png',
  BASE + 'icons/icon-512x512.png',
];

// ── INSTALL: simpan semua aset ke cache ──────────────────
self.addEventListener('install', function(event) {
  console.log('[SW] Install — caching semua aset...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      console.log('[SW] Semua aset berhasil di-cache.');
      return self.skipWaiting(); // aktifkan SW baru secepatnya
    }).catch(function(err) {
      console.error('[SW] Gagal cache aset:', err);
    })
  );
});

// ── ACTIVATE: hapus cache lama ───────────────────────────
self.addEventListener('activate', function(event) {
  console.log('[SW] Activate — membersihkan cache lama...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) {
            console.log('[SW] Menghapus cache lama:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      return self.clients.claim(); // ambil kendali semua tab
    })
  );
});

// ── FETCH: Cache-First, fallback ke network ──────────────
self.addEventListener('fetch', function(event) {
  // Abaikan request non-GET dan request ke CDN eksternal
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Biarkan request ke CDN (Google Fonts, cdnjs, dll) langsung ke network
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(function() {
        // Jika CDN offline, kembalikan response kosong (jangan crash)
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // Untuk aset lokal: Cache First → Network → Fallback ke index.html
  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse; // ✅ Ada di cache, langsung kembalikan
      }

      // Tidak ada di cache, ambil dari network dan simpan
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(function() {
        // Offline & tidak ada di cache → kembalikan index.html
        return caches.match(BASE + 'index.html');
      });
    })
  );
});
