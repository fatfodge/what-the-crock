//import { getRestaurantsInBounds } from "./firebaseService.js";
//import { displayRestaurantDetails, toggleBPSections } from "./ui.js";
//import { getPanelState, getStateTransform } from './swipehandler.js';
//import { getBottomPanelMinHt } from './resizehandler.js';

let mapInstance;

export function getMapInstance(){
    return mapInstance;
}

export function initMap() {
    try {
        console.log("init map");
        let mapElementID = "map";
        let initCoords = [27.964157, -82.452606];
        let initZoom = 11;

        mapInstance = L.map(mapElementID).setView(initCoords, initZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 100);

       // mapInstance.on('moveend', async () => populateVisibleRestaurants());

        //populateVisibleRestaurants();
    } catch { console.log('error initilizing map'); }
}

export function focusOnUser() {
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
                centerOnCoordinates(userLatLon);
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

export function centerOnCoordinates(coordinates) {
    const mapContainer = document.getElementById('map-container');
    const mapRect = mapContainer.getBoundingClientRect();
    const VVH = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    console.log('coordinates',coordinates);

    const bottomPanelTopViewport = getPanelState() === 'min'
        ? VVH - getBottomPanelMinHt()
        : getStateTransform(getPanelState());

    const targetScreenPixelX = mapRect.width / 2;

    const visibleMapHeightInContainer = bottomPanelTopViewport - mapRect.top;
    const targetScreenPixelY = visibleMapHeightInContainer / 2;

    const currentTargetScreenPoint = mapInstance.latLngToContainerPoint(coordinates);

    const deltaX = targetScreenPixelX - currentTargetScreenPoint.x;
    const deltaY = targetScreenPixelY - currentTargetScreenPoint.y;

    const currentCenterScreenPoint = mapInstance.latLngToContainerPoint(mapInstance.getCenter());

    const newCenterScreenX = currentTargetScreenPoint.x;
    const newCenterScreenY = currentCenterScreenPoint.y - deltaY;

    const newCenterLatLng = mapInstance.containerPointToLatLng([newCenterScreenX, newCenterScreenY]);

    const newNewCenterLatLng = {lat: newCenterLatLng.lat, lng: coordinates.lng};

    console.log(newNewCenterLatLng);

    mapInstance.panTo(newNewCenterLatLng);

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