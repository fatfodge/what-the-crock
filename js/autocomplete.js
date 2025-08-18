//import { getMapInstance, centerOnCoordinates } from './map.js'
//import { closeKeyboard } from './resizeHandler.js';
//import { setBottomPanelState } from './swipeHandler.js';

let AutocompleteSessionToken;
let AutocompleteSuggestion;
let CurrentMapInstance;
let Geocoder;

export async function initAutocomplete() {
    const placesLib = await google.maps.importLibrary("places");
    AutocompleteSessionToken = placesLib.AutocompleteSessionToken;
    AutocompleteSuggestion = placesLib.AutocompleteSuggestion;
    CurrentMapInstance = getMapInstance()
    Geocoder = new google.maps.Geocoder();

    initListener();
}

function initListener() {
    const addressInput = document.getElementById('address-input');
    const debouncedGetSuggestions = debounce(getAutocompleteSuggestions, 500);
    addressInput.addEventListener('input', debouncedGetSuggestions);
}

function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}


async function getAutocompleteSuggestions() {
    console.log('search');
    const addressInput = this;
    const val = addressInput.value.trim();

    const searchResults = document.getElementById('search-results');

    if (val.length < 3) {
        searchResults.innerHTML = '';
        return;
    }

    if (!CurrentMapInstance) {
        console.error("Map instance not available for location bias.");
        searchResults.innerHTML = '<li>Error: Map not initialized.</li>';
        return;
    }
    if (!AutocompleteSuggestion) {
        console.error("AutocompleteSuggestion not initialized.");
        searchResults.innerHTML = '<li>Error: Autocomplete service not ready.</li>';
        return;
    }

    const mapCenter = CurrentMapInstance.getCenter();
    const locationBias = {
        north: mapCenter.lat + 0.09,
        south: mapCenter.lat - 0.09,
        east: mapCenter.lng + 0.09,
        west: mapCenter.lng - 0.09,
    };
    

    // Ensure AutocompleteSessionToken is available
    if (!AutocompleteSessionToken) {
        console.error("AutocompleteSessionToken not initialized.");
        searchResults.innerHTML = '<li>Error: Autocomplete session not ready.</li>';
        return;
    }
    const token = new AutocompleteSessionToken();
    const request = {
        input: val,
        sessionToken: token,
        locationBias: locationBias,
        // Add any other desired restrictions here, e.g., types, componentRestrictions
        // types: ['establishment'] // Example: only search for establishments
    };
    console.log('finding suggestions');
    try {
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        searchResults.innerHTML = '';
        for (const suggestion of suggestions) {
            console.log(suggestion);
            console.log(suggestion.placePrediction.text.text);
            const li = document.createElement('li');
            li.style.display = 'relative';
            li.classList.add('search-result-item');

            const fullText = suggestion.placePrediction.text.text;
            const [mainText, ...rest] = fullText.split(',');
            const secondaryText = rest.join(',').trim();

            const rateDiv = document.createElement('div');
            rateDiv.style.cssText = `
                    position: relative;
                    top: 0;
                    right: 0;
                `;
            rateDiv.innerHTML = `<button>Rate</button>`;

            const contentDiv = document.createElement('div');
            contentDiv.style.cssText = `
                    position: relative;
                    top: 0;
                    right: 0;
                    z-index: 10;
                    background-color: yellow;
                    height: 100%;
                `;
            contentDiv.innerHTML = `
                    <div class="main-text">${mainText.trim()}</div>
                    <div class="secondary-text">${secondaryText}</div>
                `;

                li.addEventListener('click', async () => {
                    const placeId = suggestion.placePrediction.placeId;
                    console.log("placeID",placeId);
                    Geocoder.geocode({ placeId: placeId})
                    .then(({results}) => {
                        console.log("results",results);
                        closeKeyboard();
                        setBottomPanelState("mid");
                        let coordinates = {};
                        coordinates.lat = results[0].geometry.location.lat();
                        coordinates.lng = results[0].geometry.location.lng();
                        centerOnCoordinates(coordinates);
                    });
                });
                let startX;
                li.addEventListener('touchstart', (e)  => {
                    startX = e.touches[0].clientX;
                    console.log('li touched');
                });
                li.addEventListener('touchmove', (e) => {
                    const currentX = e.touches[0].clientX;
                    const diffX = currentX - startX;
                    if(diffX < 0){
                        contentDiv.style.transform = `translateX(${diffX}px)`;
                    }
                    else{
                        contentDiv.style.transform = 'translateX(0)';
                    }
                });
                li.addEventListener('touchend',(e) =>{
                    const rect = contentDiv.getBoundingClientRect();
                    const swipeDistance = rect.left - contentDiv.parentElement.getBoundingClientRect().left;
                    console.log(swipeDistance);
                    if (swipeDistance < 0){
                        contentDiv.style.transform = 'translateX(0)';
                    }else{
                        console.log('no transform needed');
                    }
                });
                
            //li.appendChild(rateDiv);
            li.appendChild(contentDiv);

            searchResults.appendChild(li);
        }
    } catch (e) {
        console.error('Autocomplete error:', e);
        resultsBox.innerHTML = '<li>Error fetching suggestions</li>';
    }
}