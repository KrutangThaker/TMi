// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import SpotifyWebApi from 'spotify-web-api-node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// When using ES modules, __dirname is not available by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI
});

// Initialize token refresh mechanism
let accessToken = null;
const refreshAccessToken = async () => {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        accessToken = data.body['access_token'];
        spotifyApi.setAccessToken(accessToken);
        console.log('Access token refreshed');
        
        // Set timer to refresh token before it expires
        setTimeout(refreshAccessToken, (data.body['expires_in'] - 60) * 1000);
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
};

// Initial token fetch
refreshAccessToken();

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api/token', (req, res) => {
    console.log('Token request received');
    if (accessToken) {
        console.log('Sending access token');
        res.json({ access_token: accessToken });
    } else {
        console.log('No access token available');
        res.status(500).json({ error: 'No access token available' });
    }
});

app.get('/api/playlist/:playlistId', async (req, res) => {
    console.log('Playlist request received for ID:', req.params.playlistId);
    try {
        const data = await spotifyApi.getPlaylist(req.params.playlistId);
        console.log('Playlist data retrieved successfully');
        const tracks = data.body.tracks.items.map(item => ({
            name: item.track.name,
            artist: item.track.artists[0].name,
            previewUrl: item.track.preview_url,
            duration: item.track.duration_ms
        }));
        
        res.json({ tracks });
    } catch (error) {
        console.error('Error fetching playlist:', error);
        res.status(500).json({ error: 'Failed to fetch playlist' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Create the public directory structure

    //const fs = require('fs'); ES module syntax doesn't support JS module syntax
const publicDir = path.join(__dirname, 'public');
const createPublicStructure = () => {
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }
};

createPublicStructure();

// Update your public directory with necessary files
const setupPublicFiles = () => {
    //const fs = require('fs');
    /*import{ promises as fs } from 'fs';
    
    // Move app.js and game-ui.js to public directory
    const files = {
        'app.js': path.join(publicDir, 'app.js'),
        'game-ui.js': path.join(publicDir, 'game-ui.js')
    };
    
    Object.entries(files).forEach(([file, dest]) => {
        if (!fs.existsSync(dest)) {
            console.log(`Please place ${file} in the public directory`);
        }
    });
};*/
    const files = {
        'app.js': path.join(publicDir, 'app.js'),
        'game-ui.js': path.join(publicDir, 'game-ui.js')
    };

    Object.entries(files).forEach(([file, dest]) => {
        if (!fs.existsSync(dest)) {
            console.log(`Please place ${file} in the public directory`);
        }
    });
};

setupPublicFiles();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});