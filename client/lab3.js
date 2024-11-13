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
    const destinationIdInput = document.getElementById('destination-id');


    const prevPageButton = document.getElementById('prev-page-btn');
    const nextPageButton = document.getElementById('next-page-btn');

    // Initialize map
    const map = L.map(mapElement).setView([51.505, -0.09], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    let currentSearchParams = {};
    let currentMarkers = [];

    // Add search functionality
    searchButton.addEventListener('click', async () => {
        currentPage = 1; 
        await performSearch();
    });

    // Next Page functionality
    nextPageButton.addEventListener('click', async () => {
        if (currentPage < totalPages) {
            currentPage += 1;
            await performSearch();
        }
    });

    // Previous Page functionality
    prevPageButton.addEventListener('click', async () => {
        if (currentPage > 1) {
            currentPage -= 1;
            await performSearch();
        }
    });

    async function performSearch() {
        const field = document.getElementById('search-field').value.trim();
        const pattern = document.getElementById('search-bar').value.trim();
        const limit = parseInt(document.getElementById('search-limit').value.trim(), 10);

        const validFields = ['_Destination', 'Region', 'Country', 'Category', 'Latitude', 'Longitude', 'ID', 'Approximate_Annual_Tourists', 'Currency', 'Majority_Religion', 'Famous_Foods', 'Language', 'Best_Time_to_Visit', 'Cost_of_Living', 'Safety', 'Cultural_Significance', 'Description'];

        const normalizedField = field.replace(/\s+/g, '_');
        if (!validFields.includes(normalizedField)) {
            alert('Invalid field selected. Please choose a valid field.');
            return;
        }

        if (!field || !pattern) {
            alert('Please enter both a field and a search term.');
            return;
        }

        if (isNaN(limit) || limit <= 0) {
            alert('Please enter a valid number for the search limit.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/destinations/search?field=${encodeURIComponent(normalizedField)}&pattern=${encodeURIComponent(pattern)}&limit=${limit}&page=${currentPage}`);
            if (response.ok) {
                const data = await response.json();
                const results = data.results;
                currentPage = data.currentPage;
                totalPages = data.totalPages;
                const totalResults = data.totalResults;
                currentSearchParams = { field, pattern, limit };
                updatePaginationButtons();
                resultsContainer.innerHTML = '';
                clearMapMarkers();

                if (results.length > 0) {
                    results.forEach(dest => {
                        const resultDiv = document.createElement('div');
                        resultDiv.classList.add('destination-item');
                        resultDiv.innerHTML = `
                            <div class="checkbox-container">
                                <input type="checkbox" value="${dest.ID}" class="destination-checkbox">
                                <label>Select for Favorites</label>
                            </div>
                            <h3 style="font-size: 1.5em; font-weight: bold; margin-bottom: 10px;">${dest._Destination}</h3>
                            <p><strong>Region:</strong> ${dest.Region}</p>
                            <p><strong>Country:</strong> ${dest.Country}</p>
                            <p><strong>Category:</strong> ${dest.Category}</p>
                            <p><strong>Latitude:</strong> ${dest.Latitude}</p>
                            <p><strong>Longitude:</strong> ${dest.Longitude}</p>
                            <p><strong>Approximate Annual Tourists:</strong> ${dest.Approximate_Annual_Tourists}</p>
                            <p><strong>Currency:</strong> ${dest.Currency}</p>
                            <p><strong>Majority Religion:</strong> ${dest.Majority_Religion}</p>
                            <p><strong>Famous Foods:</strong> ${dest.Famous_Foods}</p>
                            <p><strong>Language:</strong> ${dest.Language}</p>
                            <p><strong>Best Time to Visit:</strong> ${dest.Best_Time_to_Visit}</p>
                            <p><strong>Cost of Living:</strong> ${dest.Cost_of_Living}</p>
                            <p><strong>Safety:</strong> ${dest.Safety}</p>
                            <p><strong>Cultural Significance:</strong> ${dest.Cultural_Significance}</p>
                            <p><strong>Description:</strong> ${dest.Description}</p>
                            <p><strong>ID:</strong> ${dest.ID}</p>
                            <hr style="border-top: 1px solid #ccc; margin: 15px 0;">
                        `;

                        resultsContainer.appendChild(resultDiv);

                        if (dest.Latitude && dest.Longitude) {
                            const marker = L.marker([dest.Latitude, dest.Longitude]).addTo(map);
                            marker.bindPopup(`<b>${dest._Destination}</b><br>${dest.Country}`);
                            currentMarkers.push({ marker, id: dest.ID });
                            const checkbox = resultDiv.querySelector('input[type="checkbox"]');
                            checkbox.addEventListener('change', (e) => {
                                if (e.target.checked) {
                                    marker.bindPopup(`<b>${dest._Destination}</b><br>${dest.Country}`).openPopup();
                                } else {
                                    marker.closePopup();
                                }
                            });
                        }
                    });
                    map.setView([results[0].Latitude, results[0].Longitude], 6);
                } else {
                    resultsContainer.textContent = 'No matching results found.';
                }
            } else {
                const errorData = await response.json();
                resultsContainer.textContent = errorData.error || 'No matching results found.';
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            resultsContainer.textContent = 'An error occurred while fetching the data.';
            }
        }



    // List of countries to display
    const countries = [
        "Italy", "Spain", "France", "Austria", "Belgium", "Denmark", 
        "Germany", "Monaco", "Russia", "Greece", "Portugal", "Norway", 
        "Sweden", "Switzerland", "Turkey", "Ukraine", "United Kingdom", 
        "Luxembourg", "Malta", "Iceland", "Serbia"
    ];

    function displayCountries() {
        const countryList = document.getElementById("countries");

        if (countryList.children.length === 0) {
            countries.forEach(country => {
                const li = document.createElement("li");
                li.textContent = country;
                countryList.appendChild(li);
            });
        }

        countryList.style.display = countryList.style.display === "none" ? "block" : "none";
    }

    document.getElementById("view-countries-btn").addEventListener("click", displayCountries);





    function updatePaginationButtons() {
        if (currentPage <= 1) {
            prevPageButton.disabled = true;
            prevPageButton.style.opacity = 0.5;
            prevPageButton.style.cursor = 'not-allowed';
        } else {
            prevPageButton.disabled = false;
            prevPageButton.style.opacity = 1;
            prevPageButton.style.cursor = 'pointer';
        }

        if (currentPage >= totalPages) {
            nextPageButton.disabled = true;
            nextPageButton.style.opacity = 0.5;
            nextPageButton.style.cursor = 'not-allowed';
        } else {
            nextPageButton.disabled = false;
            nextPageButton.style.opacity = 1;
            nextPageButton.style.cursor = 'pointer';
        }
    }

    function clearMapMarkers() {
        currentMarkers.forEach(({ marker }) => {
            map.removeLayer(marker);
        });
        currentMarkers = [];
    }

    saveListButton.addEventListener('click', async () => {
        const listName = listNameInput.value.trim();
        const enteredID = parseInt(destinationIdInput.value.trim(), 10);
        const selectedIDs = Array.from(document.querySelectorAll('.destination-checkbox:checked'))
            .map(input => parseInt(input.value, 10));
    
        // Combine entered ID and selected IDs, removing duplicates
        const destinationIDs = new Set();
    
        if (!listName) {
            alert('Please enter a list name.');
            return;
        }
    
        if (!isNaN(enteredID)) {
            destinationIDs.add(enteredID); // Add entered ID if it's valid
        }
    
        selectedIDs.forEach(id => destinationIDs.add(id)); // Add all selected IDs
    
        if (destinationIDs.size === 0) {
            alert('Please enter a destination ID or select destinations to save.');
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:3000/lists/${encodeURIComponent(listName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationIDs: Array.from(destinationIDs) })
            });
    
            if (response.ok) {
                alert(`Destinations saved to '${listName}' successfully.`);
                // Clear the input after saving
                destinationIdInput.value = '';
                document.querySelectorAll('.destination-checkbox:checked').forEach(checkbox => checkbox.checked = false);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving destinations:', error);
            alert('An error occurred while saving the destinations.');
        }
    });


    // Function to save selected results to a favorites list
    async function saveToFavoritesList(listName, destinationIDs) {
        try {
            const response = await fetch(`http://localhost:3000/lists/${encodeURIComponent(listName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destinationIDs })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Error saving list:', error);
                alert(`Error saving list: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving list:', error);
            alert('An error occurred while saving the list.');
        }
    }

    // Create a new list
    createListButton.addEventListener('click', async () => {
        console.log("Create List button clicked");
        const listName = listNameInput.value.trim();
        if (!listName) {
            alert('Please enter a list name.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/lists/${encodeURIComponent(listName)}`, {
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

        // View a list
    viewListButton.addEventListener('click', async () => {
        const listName = listNameInput.value.trim();
        if (!listName) {
            alert('Please enter a list name.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/lists/${encodeURIComponent(listName)}/details`);
            if (response.ok) {
                const destinations = await response.json();
                favoritesContainer.innerHTML = '';
                clearMapMarkers(); 

                destinations.forEach(dest => {
                    const destDiv = document.createElement('div');
                    destDiv.classList.add('destination-item');
                    if (dest.error) {
                        destDiv.textContent = dest.error;
                    } else {
                        destDiv.innerHTML = `
                            <h3 style="font-size: 1.5em; font-weight: bold; margin-bottom: 10px;">${dest._Destination}</h3>
                            <p><strong>Region:</strong> ${dest.Region}</p>
                            <p><strong>Country:</strong> ${dest.Country}</p>
                            <p><strong>Category:</strong> ${dest.Category}</p>
                            <p><strong>Latitude:</strong> ${dest.Latitude}</p>
                            <p><strong>Longitude:</strong> ${dest.Longitude}</p>
                            <p><strong>Approximate Annual Tourists:</strong> ${dest.Approximate_Annual_Tourists}</p>
                            <p><strong>Currency:</strong> ${dest.Currency}</p>
                            <p><strong>Majority Religion:</strong> ${dest.Majority_Religion}</p>
                            <p><strong>Famous Foods:</strong> ${dest.Famous_Foods}</p>
                            <p><strong>Language:</strong> ${dest.Language}</p>
                            <p><strong>Best Time to Visit:</strong> ${dest.Best_Time_to_Visit}</p>
                            <p><strong>Cost of Living:</strong> ${dest.Cost_of_Living}</p>
                            <p><strong>Safety:</strong> ${dest.Safety}</p>
                            <p><strong>Cultural Significance:</strong> ${dest.Cultural_Significance}</p>
                            <p><strong>Description:</strong> ${dest.Description}</p>
                            <p><strong>ID:</strong> ${dest.ID}</p>
                            <hr style="border-top: 1px solid #ccc; margin: 15px 0;">
                        `;
                        
                        if (dest.Latitude && dest.Longitude) {
                            const marker = L.marker([dest.Latitude, dest.Longitude]).addTo(map)
                                .bindPopup(`<b>${dest._Destination}</b><br>${dest.Country}`)
                                .openPopup();
                            currentMarkers.push({ marker, id: dest.ID });
                        }
                    }
                    favoritesContainer.appendChild(destDiv);
                });

                if (destinations.length > 0) {
                    map.setView([destinations[0].Latitude, destinations[0].Longitude], 6);
                }
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error viewing list:', error);
            alert('An error occurred while viewing the list.');
        }
    });


    // Delete a list
    deleteListButton.addEventListener('click', async () => {
        const listName = listNameInput.value.trim();
        if (!listName) {
            alert('Please enter a list name.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/lists/${encodeURIComponent(listName)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert(`List '${listName}' deleted successfully.`);
                favoritesContainer.innerHTML = ''; 
                clearMapMarkers(); 
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
