export class MapManager {
    constructor() {
        this.map = L.map('map').setView([51.505, -0.09], 5); // Set initial coordinates and zoom level

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
    }

    displayLocation(lat, lng) {
        this.map.setView([lat, lng], 10); // Zoom to a specific location
        L.marker([lat, lng]).addTo(this.map); // Add a marker to the map
    }
}
