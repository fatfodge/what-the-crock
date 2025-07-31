import {initViewportResizeListener} from './resizeHandler.js';
import {initSwipeHandling} from './swipeHandler.js';
import {initUI} from './ui.js';
import {initFirebaseService} from './firebaseService.js';
import {initMap } from './map.js';
import {initAutocomplete} from './autocomplete.js'

document.addEventListener('DOMContentLoaded', async () => {

    initViewportResizeListener(window);
    initSwipeHandling();
    initUI();
    initFirebaseService();
    initMap();
    initAutocomplete();
    initServiceWorker();


    $(document).on({
        'DOMNodeInserted': function() {
            $('.pac-item, .pac-item span', this).addClass('needsclick');
        }
    }, '.pac-container');
    
    console.log("Main app initialized.");
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

