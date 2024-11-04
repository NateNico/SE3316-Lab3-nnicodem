document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('results-container');
    const mapElement = document.getElementById('map');
    const createListButton = document.getElementById('create-list-btn');
    const saveListButton = document.getElementById('save-list-btn');
    const viewListButton = document.getElementById('view-list-btn');
    const deleteListButton = document.getElementById('delete-list-btn');
    const listNameInput = document.getElementById('list-name');
    const favoritesContainer = document.getElementById('favorites-results');

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
                        resultDiv.classList.add('destination-item');
                        resultDiv.innerHTML = `
                            <input type="checkbox" value="${dest.ID}">
                            ${dest._Destination} - ${dest.Country}
                        `;
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

    // Function to create a new list
    createListButton.addEventListener('click', async () => {
        const listName = listNameInput.value.trim();
        if (!listName) {
            alert('Please enter a list name.');
            return;
        }

        try {
            await fetch(`http://localhost:3000/lists/${encodeURIComponent(listName)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });            

            if (response.ok) {
                alert(`List '${listName}' created successfully.`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error creating list:', error);
            alert('An error occurred while creating the list.');
        }
    });

        // Function to search within a favorites list
    const searchFavoritesButton = document.getElementById('search-favorites-btn');
    const favoritesSearchInput = document.getElementById('favorites-search-term');

    searchFavoritesButton.addEventListener('click', async () => {
        const listName = listNameInput.value.trim();
        const searchTerm = favoritesSearchInput.value.trim().toLowerCase();

        if (!listName) {
            alert('Please enter a list name.');
            return;
        }

        if (!searchTerm) {
            alert('Please enter a search term.');
            return;
        }

        try {
            const response = await fetch(`/lists/${encodeURIComponent(listName)}/details`);
            if (response.ok) {
                const destinations = await response.json();
                favoritesContainer.innerHTML = '';

                const filteredDestinations = destinations.filter(dest => {
                    return dest && dest._Destination && dest._Destination.toLowerCase().includes(searchTerm);
                });

                if (filteredDestinations.length > 0) {
                    filteredDestinations.forEach(dest => {
                        const destDiv = document.createElement('div');
                        destDiv.textContent = `${dest._Destination} - ${dest.Country}`;
                        favoritesContainer.appendChild(destDiv);
                    });
                } else {
                    favoritesContainer.textContent = 'No matching destinations found in this list.';
                }
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error searching within the list:', error);
            alert('An error occurred while searching the list.');
        }
    });


    // Function to save destinations to a list
    saveListButton.addEventListener('click', async () => {
        const listName = listNameInput.value.trim();
        if (!listName) {
            alert('Please enter a list name.');
            return;
        }

        const destinationIDs = Array.from(document.querySelectorAll('.destination-item input:checked'))
            .map(input => parseInt(input.value));

        if (destinationIDs.length === 0) {
            alert('Please select destinations to save.');
            return;
        }

        try {
            const response = await fetch(`/lists/${encodeURIComponent(listName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationIDs })
            });

            if (response.ok) {
                alert(`Destinations saved to '${listName}' successfully.`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving list:', error);
            alert('An error occurred while saving the list.');
        }
    });

    // Function to view a list
    viewListButton.addEventListener('click', async () => {
        const listName = listNameInput.value.trim();
        if (!listName) {
            alert('Please enter a list name.');
            return;
        }

        try {
            const response = await fetch(`/lists/${encodeURIComponent(listName)}/details`);
            if (response.ok) {
                const destinations = await response.json();
                favoritesContainer.innerHTML = '';
                destinations.forEach(dest => {
                    const destDiv = document.createElement('div');
                    if (dest.error) {
                        destDiv.textContent = dest.error;
                    } else {
                        destDiv.textContent = `${dest._Destination} - ${dest.Country}`;
                    }
                    favoritesContainer.appendChild(destDiv);
                });
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error viewing list:', error);
            alert('An error occurred while viewing the list.');
        }
    });

    // Function to delete a list
    deleteListButton.addEventListener('click', async () => {
        const listName = listNameInput.value.trim();
        if (!listName) {
            alert('Please enter a list name.');
            return;
        }

        try {
            const response = await fetch(`/lists/${encodeURIComponent(listName)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert(`List '${listName}' deleted successfully.`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error deleting list:', error);
            alert('An error occurred while deleting the list.');
        }
    });
});

