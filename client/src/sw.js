import { precacheAndRoute } from 'workbox-precaching';

// Injeta o manifesto de assets do Vite
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST || []);

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
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { message: event.data.text() };
        }
    }

    const title = data.title || 'Nova Notificação';
    const options = {
        body: data.message || 'Você recebeu uma nova atualização.',
        icon: '/logo.jpg',
        badge: '/logo.jpg',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('install', (event) => {
    // @ts-ignore
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // @ts-ignore
    event.waitUntil(clients.claim());
});
