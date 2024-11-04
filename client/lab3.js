// MapManager class to manage map-related functionalities
export class MapManager {
    constructor() {
        this.map = L.map('map').setView([51.505, -0.09], 5); // Set initial coordinates and zoom level

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        this.markers = L.layerGroup().addTo(this.map);
    }

    displayLocation(lat, lng) {
        this.map.setView([lat, lng], 10); // Zoom to a specific location
        L.marker([lat, lng]).addTo(this.map); // Add a marker to the map
    }

    clearMarkers() {
        this.markers.clearLayers();
    }

    addMarker(lat, lng, popupText = '') {
        const marker = L.marker([lat, lng]);
        if (popupText) {
            marker.bindPopup(popupText);
        }
        this.markers.addLayer(marker);
    }

    adjustZoomToFitMarkers() {
        if (this.markers.getLayers().length > 0) {
            this.map.fitBounds(this.markers.getBounds());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const mapManager = new MapManager();

    // Initialize variables
    let currentPage = 1;
    let resultsPerPage = 10;
    let totalPages = 1;
    let searchResults = [];

    // Perform search and display results
    async function performSearch() {
        const field = document.getElementById('search-field').value;
        const pattern = document.getElementById('search-bar').value.trim();
        const n = document.getElementById('search-limit').value || ''; // Fetch the limit if provided

        if (field === 'None' || !pattern) {
            alert('Please select a valid search field and enter a search term.');
            return;
        }

        try {
            // Ensure the full URL for testing if necessary
            const response = await fetch(`http://localhost:3000/destinations/search?field=${encodeURIComponent(field)}&pattern=${encodeURIComponent(pattern)}&n=${n}`);
            if (response.ok) {
                const data = await response.json();
                searchResults = data;
                currentPage = 1;
                await displayResults();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Unexpected error occurred.'}`);
                document.getElementById('search-results').innerHTML = '';
                document.getElementById('no-results-message').style.display = 'block';
                mapManager.clearMarkers();
            }
        } catch (error) {
            console.error('Error performing search:', error);
            alert('A network error occurred. Please try again later.');
        }
    }

    // Display results on the page and map
    async function displayResults() {
        document.getElementById('no-results-message').style.display = 'none';
        resultsPerPage = parseInt(document.getElementById('search-limit').value) || searchResults.length;
        totalPages = Math.ceil(searchResults.length / resultsPerPage);

        if (searchResults.length === 0) {
            document.getElementById('no-results-message').style.display = 'block';
            document.getElementById('search-results').innerHTML = '';
            mapManager.clearMarkers();
            return;
        }

        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        const currentResults = searchResults.slice(startIndex, endIndex);

        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';
        mapManager.clearMarkers();

        for (const dest of currentResults) {
            createDestinationElement(dest, resultsContainer);
            mapManager.addMarker(dest.Latitude, dest.Longitude, `<b>${sanitizeText(dest.Destination)}</b><br>${sanitizeText(dest.Country)}`);
        }

        mapManager.adjustZoomToFitMarkers();
        document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    }

    // Create a destination element in the DOM
    function createDestinationElement(dest, container) {
        const destinationElement = document.createElement('section');
        destinationElement.classList.add('destination');

        destinationElement.innerHTML = `
            <h3>${sanitizeText(dest.Destination)}</h3>
            <ul>
                <li><strong>Name:</strong> ${sanitizeText(dest.Destination)}</li>
                <li><strong>Country:</strong> ${sanitizeText(dest.Country)}</li>
                <li><strong>Region:</strong> ${sanitizeText(dest.Region)}</li>
                <li><strong>Category:</strong> ${sanitizeText(dest.Category)}</li>
                <li><strong>Description:</strong> ${sanitizeText(dest.Description)}</li>
                <li><strong>Coordinates:</strong> Latitude: ${dest.Latitude}, Longitude: ${dest.Longitude}</li>
                <li><strong>Tourists:</strong> ${sanitizeText(dest.Tourists)}</li>
                <li><strong>Currency:</strong> ${sanitizeText(dest.Currency)}</li>
                <li><strong>Religion:</strong> ${sanitizeText(dest.Religion)}</li>
                <li><strong>Famous Foods:</strong> ${sanitizeText(dest.Foods)}</li>
                <li><strong>Language:</strong> ${sanitizeText(dest.Language)}</li>
                <li><strong>Best Time to Visit:</strong> ${sanitizeText(dest.Visit_Time)}</li>
                <li><strong>Cost of Living:</strong> ${sanitizeText(dest.Living_Cost)}</li>
                <li><strong>Safety:</strong> ${sanitizeText(dest.Safety)}</li>
                <li><strong>Cultural Significance:</strong> ${sanitizeText(dest.Culture)}</li>
            </ul>
        `;

        container.appendChild(destinationElement);
    }

    // Pagination controls
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayResults();
        }
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayResults();
        }
    });

    // Sort control for search results
    document.getElementById('sort-field').addEventListener('change', () => {
        const sortField = document.getElementById('sort-field').value;
        if (sortField !== 'None') {
            searchResults.sort((a, b) => {
                if (a[sortField] < b[sortField]) return -1;
                if (a[sortField] > b[sortField]) return 1;
                return 0;
            });
            currentPage = 1;
            displayResults();
        }
    });

    // Search button
    document.getElementById('search-btn').addEventListener('click', performSearch);

    // Input sanitization function
    function sanitizeText(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }
});
