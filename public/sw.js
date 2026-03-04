// This service worker unregisters itself and clears all caches.
// It is used to clean up after removing the PWA plugin.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.navigate(c.url));
});
