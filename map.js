import { getRestaurantsInBounds } from "./firebaseService.js";

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
    } catch { console.log('error initilizing map'); }
}

async function populateVisibleRestaurants() {
    //clear existing pis
    mapInstance.eachLayer(layer => {
        if (layer instanceof L.Marker && layer.options.isRestaurantMarker) {
            mapInstance.removeLayer(layer);
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
}

function createPin(restaurant) {
    if (restaurant.location && restaurant.location.lat && restaurant.location.lng) {
        const marker = L.marker([restaurant.location.lat, restaurant.location.lng], { isRestaurantMarker: true })
            .addTo(mapInstance)
        //.on('click', () => displayRestaurantDetails());
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
    li.appendChild(contentDiv);
    return li;
}