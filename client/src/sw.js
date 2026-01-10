import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// @ts-ignore
const manifest = self.__WB_MANIFEST;
if (manifest) {
    precacheAndRoute(manifest);
}

cleanupOutdatedCaches();

// Cache de imagens
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images',
    })
);

// Cache de fontes
registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
        cacheName: 'fonts',
    })
);

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url || '/');
        })
    );
});

self.addEventListener('push', function (event) {
    let data = { title: 'Nova Notificação', message: 'Você recebeu uma nova atualização.' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { ...data, message: event.data.text() };
        }
    }

    const options = {
        body: data.message,
        icon: '/logo.jpg',
        badge: '/logo.jpg',
        vibrate: [200, 100, 200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('install', (event) => {
    // @ts-ignore
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // @ts-ignore
    event.waitUntil(clients.claim());
});
