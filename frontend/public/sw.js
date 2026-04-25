/* Install new service worker immediately */
self.addEventListener("install", () => self.skipWaiting());

/* Take control of all open tabs */
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/* Handle push notifications */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/jjuclub.png",
      badge: data.icon || "/jjuclub.png",
      vibrate: [100, 50, 100],
      data: data.data || {},
    })
  );
});

/* Optional: handle notification click */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
