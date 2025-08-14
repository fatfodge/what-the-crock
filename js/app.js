import { initUI } from "./ui.js";
import { initSwipeHandler } from "./swipehandler.js";

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  initSwipeHandler();
  initUI();
});