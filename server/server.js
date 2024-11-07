const path = require('path');
const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

let destinations = [];
fs.createReadStream(path.join(__dirname, 'data', 'europe-destinations.csv'))
    .pipe(csv())
    .on('data', (data) => {
        data.ID = data.ID && !isNaN(data.ID) ? parseInt(data.ID) : destinations.length + 1;
        data.Latitude = data.Latitude && !isNaN(data.Latitude) ? parseFloat(data.Latitude) : null;
        data.Longitude = data.Longitude && !isNaN(data.Longitude) ? parseFloat(data.Longitude) : null;

        const normalizedData = {};
        for (const key in data) {
            const normalizedKey = key.replace(/\s+/g, '_');
            normalizedData[normalizedKey] = data[key];
        }

        destinations.push(normalizedData);
    })
    .on('end', () => {
        console.log('CSV file successfully processed.');
    });

const listsFile = path.join(__dirname, 'data', 'lists.json');

function readLists() {
    try {
        const data = fs.readFileSync(listsFile, 'utf8');
        return JSON.parse(data) || {};
    } catch (error) {
        return {};
    }
}

function writeLists(lists) {
    fs.writeFileSync(listsFile, JSON.stringify(lists, null, 2), 'utf8');
}
app.get('/', (req, res) => {
    res.send('Hello, World! This is the root route.');
});

// Search route with pagination
app.get('/destinations/search', (req, res) => {
    const { field, pattern, limit, page } = req.query;

    if (!field || !pattern) {
        return res.status(400).json({ error: 'Field and pattern are required for search.' });
    }
    const normalizedField = field.replace(/\s+/g, '_');

    const filteredResults = destinations.filter(dest => {
        const value = dest[normalizedField];

        if (normalizedField === 'ID') {
            return value === parseInt(pattern, 10);
        }

        return value && value.toString().toLowerCase().includes(pattern.toLowerCase());
    });

    if (filteredResults.length === 0) {
        return res.status(404).json({ error: 'No matching results found.' });
    }

    const resultLimit = parseInt(limit, 10) || filteredResults.length;
    const currentPage = parseInt(page, 10) || 1;
    const totalResults = filteredResults.length;
    const totalPages = Math.ceil(totalResults / resultLimit);

    // Calculate start and end indices
    const startIndex = (currentPage - 1) * resultLimit;
    const endIndex = startIndex + resultLimit;

    const paginatedResults = filteredResults.slice(startIndex, endIndex);

    res.json({
        currentPage,
        totalPages,
        totalResults,
        results: paginatedResults
    });
});

// Endpoint to get details by ID
app.get('/destinations/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const destination = destinations.find(dest => dest.ID === id);

    if (destination) {
        res.json(destination);
    } else {
        res.status(404).json({ error: 'Destination not found.' });
    }
});

// Route to get all destinations
app.get('/destinations', (req, res) => {
    res.json(destinations);
});

// Create a new favorite list
app.post('/lists/:name', (req, res) => {
    const listName = req.params.name;
    console.log(`Received request to create list: ${listName}`); 

    const lists = readLists();
    console.log('Current lists:', lists); 

    if (lists[listName]) {
        console.log(`List '${listName}' already exists.`); 
        return res.status(400).json({ error: 'List name already exists.' });
    }

    lists[listName] = [];
    console.log('Updated lists after adding new list:', lists); 

    writeLists(lists);
    console.log(`List '${listName}' created successfully.`); 

    res.status(201).json({ message: `List '${listName}' created.` });
});

// Save a list of destination IDs
app.put('/lists/:name', (req, res) => {
    console.log(`Updating list: ${req.params.name}`);
    console.log(`Received destination IDs:`, req.body.destinationIDs);

    const listName = req.params.name;
    const destinationIDs = req.body.destinationIDs;
    const lists = readLists();

    if (!lists[listName]) {
        return res.status(404).json({ error: 'List not found.' });
    }

    if (!Array.isArray(destinationIDs) || destinationIDs.some(id => isNaN(id))) {
        return res.status(400).json({ error: 'Invalid destination IDs.' });
    }

    lists[listName] = destinationIDs;
    writeLists(lists);
    res.json({ message: `List '${listName}' updated.` });
});

// Get a list of destination IDs
app.get('/lists/:name', (req, res) => {
    const listName = req.params.name;
    const lists = readLists();

    if (!lists[listName]) {
        return res.status(404).json({ error: 'List not found.' });
    }

    res.json(lists[listName]);
});

// Delete a list by name
app.delete('/lists/:name', (req, res) => {
    const listName = req.params.name;
    const lists = readLists();

    if (!lists[listName]) {
        return res.status(404).json({ error: 'List not found.' });
    }

    delete lists[listName];
    writeLists(lists);
    res.json({ message: `List '${listName}' deleted.` });
});

// Get detailed information for destinations in a list
app.get('/lists/:name/details', (req, res) => {
    const listName = req.params.name;
    const lists = readLists();

    if (!lists[listName]) {
        return res.status(404).json({ error: 'List not found.' });
    }

    const detailedList = lists[listName].map(id => {
        const destination = destinations.find(dest => dest.ID === id);
        return destination || { error: `Destination ID ${id} not found.` };
    });

    res.json(detailedList);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
