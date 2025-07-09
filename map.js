// map.js

import { db } from './firebase.js'; // Assuming firebase.js exports db
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js';
import { getRestaurantsInBounds } from './firebaseService.js';

let mapInstance; // Module-scoped variable to hold the Leaflet map
let displayRestaurantDetailsCallback; // New: Callback for when a pin is clicked

/**
 * Initializes the Leaflet map.
 * @param {string} mapId The ID of the HTML element where the map should be rendered.
 * @param {Array<number>} initialView An array [lat, lng] for the initial map center.
 * @param {number} initialZoom The initial zoom level.
 * @returns {L.Map} The initialized Leaflet map instance.
 */
export function initializeMap(mapId, initialView, initialZoom) {
    if (mapInstance) {
        console.warn("Map already initialized.");
        return mapInstance;
    }
    mapInstance = L.map(mapId).setView(initialView, initialZoom);

    // Listen for the 'idle' event (map has stopped moving/zooming)
    mapInstance.on('moveend', async () => {
        const bounds = getMapBounds();
        const restaurants = await getRestaurantsInBounds(bounds);
        console.log("Found restaurants in bounds:", restaurants);
        // Dispatch a custom event that main.js can listen for
        const event = new CustomEvent(loadVisibilePins(restaurants));
        document.dispatchEvent(event);
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    console.log("Leaflet Map initialized.");
    return mapInstance;
}

function loadVisibilePins(restaurants) {

    mapInstance.eachLayer(layer => {
        if (layer instanceof L.Marker && layer.options.isRestaurantMarker) { // Add an option to identify these markers
            mapInstance.removeLayer(layer);
        }
    });
    const restaurantsInViewBox = document.getElementById('restaurants-in-view');
    restaurantsInViewBox.innerHTML = '';
    restaurants.forEach((r) => {
        const li = document.createElement('li');
        li.classList.add('result-item');
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
                    <div class="main-text">${r.name}</div>
                    <div class="secondary-text">${r.address}</div>
                `;
        li.appendChild(contentDiv);
        li.addEventListener('click', async () => {
            console.log("r",r);
            //const restaurantData = { id: r.id, ...r.data() };

            // Fetch reviews for this restaurant
            const reviewsRef = collection(db, 'restaurants', r.id, 'reviews');
            const reviewsSnapshot = await getDocs(reviewsRef);
            const reviewsData = [];
            reviewsSnapshot.forEach(doc => {
                reviewsData.push(doc.data());
            });

            // Use the new displayRestaurantDetailsCallback
            if (displayRestaurantDetailsCallback) {
                displayRestaurantDetailsCallback(r, reviewsData);
            } else {
                console.warn("displayRestaurantDetailsCallback not provided to firebaseService.");
            }
            console.log("Restaurant match found and details displayed.");
        })
        restaurantsInViewBox.appendChild(li);
        if (r.location && r.location.lat && r.location.lng) {
            const marker = L.marker([r.location.lat, r.location.lng], { isRestaurantMarker: true }) // Identify this marker
                .addTo(mapInstance)
                .bindPopup(`<b>${r.name}</b>`)
                .on('click', async () => {
                    // When a marker is clicked, use the callback to display details and reviews
                    if (displayRestaurantDetailsCallback) {
                        // Fetch reviews for this restaurant
                        const reviewsRef = collection(db, 'restaurants', r.id, 'reviews');
                        const reviewsSnapshot = await getDocs(reviewsRef);
                        const reviewsData = [];
                        reviewsSnapshot.forEach(doc => {
                            reviewsData.push(doc.data());
                        });
                        displayRestaurantDetailsCallback(r, reviewsData);
                    } else {
                        console.warn("displayRestaurantDetailsCallback not provided to firebaseService.");
                    }
                });
        }
    });
}

/**
 * Sets a callback function to be called when a map pin is clicked.
 * This function should take a restaurant ID as an argument.
 * @param {Function} callback The function to call when a pin is clicked.
 */
export function setdisplayRestaurantDetailsCb(callback) {
    displayRestaurantDetailsCallback = callback; // Assign the new callback
}

/**
 * Centers the map on the user's current geolocation.
 * @returns {Promise<Object>} A promise that resolves with user's lat/lng, or rejects with an error.
 */
export function centerMapOnUser() {
    return new Promise((resolve, reject) => {
        if (!mapInstance) {
            console.error("Map not initialized when attempting to center on user.");
            return reject(new Error("Map not initialized."));
        }
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by your browser.");
            return reject(new Error("Geolocation not supported."));
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLatLon = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                mapInstance.setView(userLatLon);
                console.log("Map centered on user location.");
                resolve(userLatLon);
            },
            (error) => {
                console.error("Error getting user location:", error);
                reject(error);
            }
        );
    });
}



/**
 * Fetches all restaurant data from Firestore.
 * @returns {Promise<Array<Object>>} A promise that resolves with an array of restaurant objects.
 */
/*async function fetchRestaurants() {
    try {
        const querySnapshot = await getDocs(collection(db, "restaurants"));
        const restaurants = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            restaurants.push({
                id: doc.id,
                name: data.name,
                address: data.address,
                location: data.location, // { lat: ..., lng: ... }
            });
        });
        return restaurants;
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        return [];
    }
}*/

/**
 * Loads restaurant pins onto the map.
 */
/*export async function loadRestaurantPins() {
    if (!mapInstance) {
        console.error("Map not initialized when attempting to load restaurant pins.");
        return;
    }
    const restaurants = await fetchRestaurants();

    // Clear existing restaurant markers if needed (optional, for dynamic updates)
    mapInstance.eachLayer(layer => {
        if (layer instanceof L.Marker && layer.options.isRestaurantMarker) { // Add an option to identify these markers
            mapInstance.removeLayer(layer);
        }
    });

    restaurants.forEach((r) => {
        if (r.location && r.location.lat && r.location.lng) {
            const marker = L.marker([r.location.lat, r.location.lng], { isRestaurantMarker: true }) // Identify this marker
                .addTo(mapInstance)
                .bindPopup(`<b>${r.name}</b>`)
                .on('click', async () => {
                    // When a marker is clicked, use the callback to display details and reviews
                    if (displayRestaurantDetailsCallback) {
                        // Fetch reviews for this restaurant
                        const reviewsRef = collection(db, 'restaurants', r.id, 'reviews');
                        const reviewsSnapshot = await getDocs(reviewsRef);
                        const reviewsData = [];
                        reviewsSnapshot.forEach(doc => {
                            reviewsData.push(doc.data());
                        });
                        displayRestaurantDetailsCallback(r, reviewsData);
                    } else {
                        console.warn("displayRestaurantDetailsCallback not provided to firebaseService.");
                    }
                });
        }
    });
    console.log(`Loaded ${restaurants.length} restaurant pins.`);
}*/

/**
 * Returns the current Leaflet map instance.
 * Useful if other modules need direct access (though passing as param is often better).
 * @returns {L.Map|undefined} The Leaflet map instance, or undefined if not initialized.
 */
export function getMapInstance() {
    return mapInstance;
}







/**
 * Adds restaurant markers to the map.
 * @param {Array<Object>} restaurants - An array of restaurant objects, each with lat, lng.
 */
/*export function displayRestaurantsOnMap(restaurants) {
    // Clear existing markers first
    markers.forEach(marker => marker.remove());
    markers = [];

    restaurants.forEach(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
            const marker = L.marker([restaurant.latitude, restaurant.longitude])
                .addTo(map)
                .bindPopup(`<b>${restaurant.name}</b><br>${restaurant.address}`);
            markers.push(marker);
        }
    });
    console.log(`Displayed ${restaurants.length} restaurants on map.`);
}*/

/**
 * Returns the current visible bounds of the map.
 * @returns {L.LatLngBounds | null} The Leaflet LatLngBounds object.
 */
export function getMapBounds() {
    if (mapInstance) {
        return mapInstance.getBounds(); // Returns a Leaflet LatLngBounds object
    }
    return null;
}