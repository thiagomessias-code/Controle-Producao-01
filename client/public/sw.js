self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  // Define the action URL based on the notification data or default to root
  // We can pass data in the notification options
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function (windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If client is already open, focus it and navigate
        if (client.url && 'focus' in client) {
          return client.focus().then(function () {
            return client.navigate(urlToOpen);
          });
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    data = event.data.json();
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
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
