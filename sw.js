/* МОЯ КОЖА PRO — офлайн-оболочка для GitHub Pages.
   При публикации новой версии приложения измените CACHE_NAME (v1 -> v2 ...).
   Данные пользователя в localStorage не затрагиваются. */

const CACHE_NAME = 'moya-kozha-pro-pwa-v1';
const CACHE_PREFIX = 'moya-kozha-pro-pwa-';

// Все ресурсы, без которых приложение не сможет полноценно открываться офлайн.
// Все пути относительны к текущей подпапке репозитория.
const APP_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const OFFLINE_HOME = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Не вмешиваемся в другие сайты и соседние приложения GitHub Pages.
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  if (request.mode === 'navigate') {
    // Стартовую страницу обновляем при наличии сети; в офлайне отдаём сохранённую.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) || (await caches.match(OFFLINE_HOME)) || Response.error();
        })
    );
    return;
  }

  // Все основные стили, скрипты, иконки и манифест уже сохранены при установке.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
