const path = require('path');
const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Enable CORS for all routes (optional, for development purposes)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Adjust as needed for production
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

// Load destination data from CSV
let destinations = [];
fs.createReadStream(path.join(__dirname, 'data', 'europe-destinations.csv'))
    .pipe(csv())
    .on('data', (data) => {
        // Convert numerical fields only if they contain valid data
        data.ID = data.ID && !isNaN(data.ID) ? parseInt(data.ID) : destinations.length + 1;
        data.Latitude = data.Latitude && !isNaN(data.Latitude) ? parseFloat(data.Latitude) : null;
        data.Longitude = data.Longitude && !isNaN(data.Longitude) ? parseFloat(data.Longitude) : null;

        // Normalize field names (remove spaces and convert to underscores)
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

// Simple file-based storage for favorite lists
const listsFile = 'data/lists.json';

// Utility function to read lists
function readLists() {
    try {
        const data = fs.readFileSync(listsFile);
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Utility function to write lists
function writeLists(lists) {
    fs.writeFileSync(listsFile, JSON.stringify(lists));
}

// Root route
app.get('/', (req, res) => {
    res.send('Hello, World! This is the root route.');
});

// Search route
app.get('/destinations/search', (req, res) => {
    const { field, pattern, n } = req.query;
    const limit = parseInt(n) || destinations.length; // Default to all results if `n` is not provided

    if (!field || !pattern) {
        return res.status(400).json({ error: 'Field and pattern are required for search.' });
    }

    const filteredResults = destinations.filter(dest => {
        const value = dest[field];
        return value && value.toString().toLowerCase().includes(pattern.toLowerCase());
    });

    const limitedResults = filteredResults.slice(0, limit);
    res.json(limitedResults);
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

// Start the server (only one instance)
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

