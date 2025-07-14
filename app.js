import {initViewportResizeListener} from './resizeHandler.js';
import {initSwipeHandling} from './swipeHandler.js';
import {initUI} from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {

    initViewportResizeListener(window);
    initSwipeHandling();
    initUI();

    console.log("Main app initialized.");
});

