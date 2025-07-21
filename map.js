import { getRestaurantsInBounds } from "./firebaseService.js";
import { displayRestaurantDetails, toggleBPSections } from "./ui.js";

let mapInstance;

export function initMap() {
    try {
        let mapElementID = "map";
        let initCoords = [27.964157, -82.452606];
        let initZoom = 11;

        mapInstance = L.map(mapElementID).setView(initCoords, initZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        mapInstance.on('moveend', async () => populateVisibleRestaurants());

        populateVisibleRestaurants();
    } catch { console.log('error initilizing map'); }
}

export function focusOnUser(){
    new Promise((resolve, reject) => {
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
    toggleBPSections("in_view");
}

async function populateVisibleRestaurants() {
    let oldPins = [];
    mapInstance.eachLayer(layer => {
        if (layer instanceof L.Marker && layer.options.isRestaurantMarker) {
            oldPins.push(layer);
        }
    });

    const restaurantsInView = document.getElementById("restaurants-in-view");

    const bounds = mapInstance.getBounds();
    const restaurants = await getRestaurantsInBounds(bounds);
    restaurantsInView.innerHTML = '';
    restaurants.forEach(restaurant => {
        createPin(restaurant);
        restaurantsInView.appendChild(createRestaurantLI(restaurant));
    });

    //clear old pins
    oldPins.forEach(layer => mapInstance.removeLayer(layer));
}


function createPin(restaurant) {
    if (restaurant.location && restaurant.location.lat && restaurant.location.lng) {
        const marker = L.marker([restaurant.location.lat, restaurant.location.lng], { isRestaurantMarker: true })
            .addTo(mapInstance)
        .on('click', () => displayRestaurantDetails(restaurant));
    }
}

function createRestaurantLI(restaurant) {
    const li = document.createElement('li');
    li.classList.add('visible-restaurant');
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
                    <div class="main-text">${restaurant.name}</div>
                    <div class="secondary-text">${restaurant.address}</div>
                `;
    li.addEventListener('click', () => displayRestaurantDetails(restaurant))
    li.appendChild(contentDiv);
    return li;
}