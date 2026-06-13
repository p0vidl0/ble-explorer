import { manifest, version } from '@parcel/service-worker';

async function precache() {
    const cache = await caches.open(version);
    await cache.addAll(manifest);
}

addEventListener('install', (event) => {
    event.waitUntil(precache());
});

addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.map((key) => key !== version && caches.delete(key)))
        )
    );
});

addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
