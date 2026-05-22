'use strict';

// MotorIA Pro — Service Worker
// Responsibilities:
//   1. Web Share Target: intercept POST from OS share sheet, store image in Cache,
//      then redirect to /share-target so the React SPA can read it.
//   2. Activate immediately — no waiting for tabs to close.

const SHARE_CACHE = 'motoria-share-v1';

self.addEventListener('install', () => {
  // Skip the "waiting" phase — become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all open pages immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Web Share Target: the OS sends a POST to /share-target when the user
  // shares from a betting app. We intercept it here (before it reaches Vercel),
  // store the payload in CacheStorage, and redirect the browser to the SPA page.
  if (url.pathname === '/share-target' && request.method === 'POST') {
    event.respondWith(handleShareTargetPost(request));
  }
  // All other requests: let the browser handle normally (no offline cache for now)
});

async function handleShareTargetPost(request) {
  try {
    const formData = await request.formData();

    const title = String(formData.get('title') || '');
    const text  = String(formData.get('text')  || '');
    const url   = String(formData.get('url')   || '');
    const image = formData.get('image');

    const cache = await caches.open(SHARE_CACHE);

    // Clear any previous share payload before storing new one
    await Promise.all([
      cache.delete('/share-target-meta'),
      cache.delete('/share-target-image'),
    ]);

    if (image instanceof File && image.size > 0) {
      // Store the image blob so the SPA can reconstruct a File object
      await cache.put(
        '/share-target-image',
        new Response(image, {
          headers: { 'Content-Type': image.type || 'image/jpeg' },
        })
      );

      // Store metadata as JSON alongside the image
      await cache.put(
        '/share-target-meta',
        new Response(
          JSON.stringify({
            type: 'image',
            title,
            text,
            url,
            mime: image.type || 'image/jpeg',
            name: image.name || 'bilhete.jpg',
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      return Response.redirect('/share-target?shared=image', 303);
    }

    if (text || url) {
      // Text or link share — no image file
      await cache.put(
        '/share-target-meta',
        new Response(
          JSON.stringify({ type: 'text', title, text, url }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      );

      return Response.redirect('/share-target?shared=text', 303);
    }

    // Nothing useful received — fall back to the scanner page
    return Response.redirect('/importar', 303);
  } catch {
    return Response.redirect('/importar', 303);
  }
}
