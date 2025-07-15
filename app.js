import {initViewportResizeListener} from './resizeHandler.js';
import {initSwipeHandling} from './swipeHandler.js';
import {initUI} from './ui.js';
import { initFirebaseService } from './firebaseService.js';

document.addEventListener('DOMContentLoaded', async () => {

    initViewportResizeListener(window);
    initSwipeHandling();
    initUI();
    initFirebaseService();


    console.log("Main app initialized.");
});

