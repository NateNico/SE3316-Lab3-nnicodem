class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-btn');
        this.resultsList = document.getElementById('results-list');
        this.resultsPerPage = document.getElementById('results-count');
        this.currentPage = 1;

        // Event listeners for search and results per page
        this.searchButton.addEventListener('click', () => this.performSearch());
        this.resultsPerPage.addEventListener('change', () => this.performSearch());
    }

    async performSearch() {
        // Get search term and number of results per page
        const query = this.searchInput.value;
        const perPage = this.resultsPerPage.value;

        // Validate input (optional)
        const sanitizedQuery = InputValidator.sanitizeInput(query);

        // Build the API request URL with query parameters
        const url = `/api/search?field=name&pattern=${encodeURIComponent(sanitizedQuery)}&n=${perPage}&page=${this.currentPage}`;

        try {
            // Send a request to the server and wait for the response
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error: ${response.statusText}`);

            // Parse the JSON data
            const data = await response.json();

            // Display the results
            this.displayResults(data);
        } catch (error) {
            console.error("Failed to fetch search results:", error);
            this.resultsList.innerHTML = `<p>Could not retrieve search results. Please try again.</p>`;
        }
    }

    displayResults(results) {
        // Clear previous results
        this.resultsList.innerHTML = '';

        // Check if results exist
        if (results.length === 0) {
            this.resultsList.innerHTML = `<p>No results found.</p>`;
            return;
        }

        // Loop through results and create HTML elements for each
        results.forEach(result => {
            const item = document.createElement('div');
            item.classList.add('result-item');

            item.innerHTML = `
                <h3>${result.name}</h3>
                <p>Country: ${result.country}</p>
                <p>Region: ${result.region}</p>
                <button class="view-on-map-btn" data-lat="${result.latitude}" data-lng="${result.longitude}">View on Map</button>
            `;

            // Add a click event to the "View on Map" button to show the location
            item.querySelector('.view-on-map-btn').addEventListener('click', (event) => {
                const lat = event.target.getAttribute('data-lat');
                const lng = event.target.getAttribute('data-lng');
                this.showOnMap(lat, lng);
            });

            // Append each item to the results list
            this.resultsList.appendChild(item);
        });
    }

    showOnMap(lat, lng) {
        // Here, we assume MapManager is initialized globally, or you can pass it in as a parameter
        if (typeof mapManager !== 'undefined' && mapManager instanceof MapManager) {
            mapManager.displayLocation(lat, lng);
        } else {
            console.warn("MapManager is not defined.");
        }
    }
}
