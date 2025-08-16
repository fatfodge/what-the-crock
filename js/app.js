import { initUI } from "./ui.js";
import { initSwipeHandler } from "./swipehandler.js";
import { initFirebaseService } from "./firebaseService.js";
import { initMap } from "./map.js";

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  initServiceWorker();
  initSwipeHandler();
  initUI();
  initFirebaseService();
  initMap();
});

function initServiceWorker(){
    if ('serviceWorker' in navigator) {
        console.log("serviceworker loading");
        window.addEventListener('load', () => { // Use 'load' to ensure everything is ready
            navigator.serviceWorker.register('./sw.js') // Path to your service worker file
                .then((registration) => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    } else {
        console.warn('Service Workers are not supported in this browser.');
    }
}