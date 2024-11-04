document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('results-container');
    const mapElement = document.getElementById('map');

    // Initialize map
    const map = L.map(mapElement).setView([51.505, -0.09], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    searchButton.addEventListener('click', async () => {
        const field = document.getElementById('search-field').value.trim();
        const pattern = document.getElementById('search-bar').value.trim();

        if (!field || !pattern) {
            alert('Please enter both a field and a search term.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/destinations/search?field=${encodeURIComponent(field)}&pattern=${encodeURIComponent(pattern)}`);
            if (response.ok) {
                const results = await response.json();
                resultsContainer.innerHTML = '';
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });

                if (results.length > 0) {
                    results.forEach(dest => {
                        const resultDiv = document.createElement('div');
                        resultDiv.textContent = `${dest._Destination} - ${dest.Country}`; 
                        resultsContainer.appendChild(resultDiv);

                        if (dest.Latitude && dest.Longitude) {
                            L.marker([dest.Latitude, dest.Longitude]).addTo(map)
                                .bindPopup(`<b>${dest._Destination}</b><br>${dest.Country}`)
                                .openPopup();
                        }
                    });
                    map.setView([results[0].Latitude, results[0].Longitude], 6); 
                } else {
                    resultsContainer.textContent = 'No matching results found.';
                }
            } else {
                resultsContainer.textContent = 'No matching results found.';
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            resultsContainer.textContent = 'An error occurred while fetching the data.';
        }
    });
});
