// sw.js

// Define a cache name with a version number.
// Increment this version number whenever you make changes to your static assets
// that you want the Service Worker to update.
const CACHE_NAME = 'my-restaurant-app-cache-V1.11.5'; // Increment for new app versions

// List of URLs to cache during installation.
// Include all essential static assets for your app.
const urlsToCache = [
    '/', // Cache the index.html or root path
    '/index.html',
    '/style.css', // Assuming your main CSS file
    '/app.js',    // Your main JavaScript file
    '/map.js',
    '/ui.js',
    '/autoComplete.js',
    '/firebase.js',
    '/firebaseService.js',
    '/swipeHandler.js',
    // Add any other critical assets like images, fonts, icons, etc.
    // e.g., '/images/logo.png', '/fonts/myfont.woff2'
    // Ensure these paths are correct relative to the root
];

/* --- Service Worker Lifecycle Events --- */

// 1. install event: Fired when the service worker is first installed.
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    // `waitUntil` ensures the installation is not complete until the promise resolves.
    event.waitUntil(
        caches.open(CACHE_NAME) // Open the named cache
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache); // Add all specified URLs to the cache
            })
            .catch((error) => {
                console.error('[Service Worker] Caching failed:', error);
            })
    );
});

// 2. activate event: Fired when the service worker becomes active.
// This is a good place to clean up old caches.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches that are not the current one.
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // This immediately takes control of existing clients (pages).
    // Otherwise, the new SW would only take control on the next page load.
    return self.clients.claim();
});

// 3. fetch event: Fired for every network request made by the controlled page.
self.addEventListener('fetch', (event) => {
    // Only intercept HTTP/HTTPS requests, not chrome-extension:// or other protocols
    if (event.request.url.startsWith('http') || event.request.url.startsWith('https')) {
        event.respondWith(
            caches.match(event.request) // Try to find the request in the cache
                .then((response) => {
                    // If a match is found in the cache, return it.
                    if (response) {
                        console.log('[Service Worker] Serving from cache:', event.request.url);
                        return response;
                    }
                    // If not found in cache, fetch from the network.
                    console.log('[Service Worker] Fetching from network:', event.request.url);
                    return fetch(event.request);
                })
                .catch((error) => {
                    console.error('[Service Worker] Fetch failed:', error);
                    // You might want to return an offline page here
                    // return caches.match('/offline.html');
                })
        );
    }
});