/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

interface PushPayload {
	title: string;
	body: string;
	url?: string;
}

self.addEventListener('push', (event) => {
	if (!event.data) return;

	let payload: PushPayload;
	try {
		payload = event.data.json();
	} catch {
		payload = { title: 'RabattTracker', body: event.data.text() };
	}

	event.waitUntil(
		self.registration.showNotification(payload.title, {
			body: payload.body,
			icon: '/icons/icon-192.png',
			badge: '/icons/icon-192.png',
			data: { url: payload.url ?? '/' }
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = (event.notification.data?.url as string) ?? '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if ('focus' in client && client.url.endsWith(url)) return client.focus();
			}
			return self.clients.openWindow?.(url);
		})
	);
});
