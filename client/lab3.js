document.addEventListener('DOMContentLoaded', () => {

    // Initialize variables
    let currentPage = 1;
    let resultsPerPage = 10;
    let totalPages = 1;
    let searchResults = [];
    let markers = L.layerGroup();

    // Initialize the map
    const map = L.map('map').setView([54.5260, 15.2551], 4); // Centered on Europe

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markers.addTo(map);

    // Perform search and display results
    async function performSearch() {
        const field = document.getElementById('search-field').value;
        const pattern = document.getElementById('search-bar').value.trim();
        const n = ''; // Fetch all matches first; we'll handle pagination

        if (!pattern) {
            alert('Please enter a search term.');
            return;
        }

        try {
            const response = await fetch(`/destinations/search?field=${encodeURIComponent(field)}&pattern=${encodeURIComponent(pattern)}&n=${n}`);
            if (response.ok) {
                const data = await response.json();
                searchResults = data;
                currentPage = 1;
                await displayResults();
            } else {
                const error = await response.json();
                alert(error.error);
                document.getElementById('search-results').innerHTML = '';
                markers.clearLayers();
            }
        } catch (error) {
            console.error('Error performing search:', error);
        }
    }

    // Replace your existing displayResults function with this updated version
    async function displayResults() {
        resultsPerPage = parseInt(document.getElementById('search-limit').value) || searchResults.length;
        totalPages = Math.ceil(searchResults.length / resultsPerPage);

        const sortField = document.getElementById('sort-field').value;

        // Use the searchResults directly
        let detailedResults = searchResults.slice();

        // Sort the detailed results
        detailedResults.sort((a, b) => {
            const fieldA = a[sortField] ? a[sortField].toLowerCase() : '';
            const fieldB = b[sortField] ? b[sortField].toLowerCase() : '';
            return fieldA.localeCompare(fieldB);
        });

        // Paginate the sorted results
        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        const currentResults = detailedResults.slice(startIndex, endIndex);

        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';
        markers.clearLayers();

        for (const dest of currentResults) {
            createDestinationElement(dest, resultsContainer);
            addMarker(dest);
        }

        document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    }
    

    // Fetch destination details by ID
    async function fetchDestinationById(id) {
        try {
            const response = await fetch(`/destinations/${id}`);
            if (response.ok) {
                return await response.json();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching destination:', error);
            return null;
        }
    }

    // Create destination element in the DOM
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

    // Add marker to the map
    function addMarker(dest) {
        const marker = L.marker([dest.Latitude, dest.Longitude])
            .bindPopup(`<b>${sanitizeText(dest.Destination)}</b><br>${sanitizeText(dest.Country)}`);
        markers.addLayer(marker);
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
    document.getElementById('sort-field').addEventListener('change', displayResults);

    // Search button
    document.getElementById('search-btn').addEventListener('click', performSearch);

    // Favorites functionality (unchanged from previous implementation)
    // ... [Keep the favorites functionality code as previously provided]

    // Input sanitization function
    function sanitizeText(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }
    // Initialize MapManager in your main script
    //document.addEventListener('DOMContentLoaded', () => {
        //const mapManager = new MapManager();
    //})

});