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


    console.log("Main app initialized.");
});

