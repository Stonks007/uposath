import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { YouTubeService } from './services/youtubeService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- API Routes ---

/**
 * Search videos
 */
app.get('/api/audio/search', async (req, res) => {
    const { q, limit } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });

    const results = await YouTubeService.search(q as string, parseInt(limit as string) || 20);
    res.json(results);
});

/**
 * Get channel videos
 */
app.get('/api/audio/channels/:id/videos', async (req, res) => {
    const { id } = req.params;
    const { limit } = req.query;

    const results = await YouTubeService.getChannelVideos(id, parseInt(limit as string) || 20);
    res.json(results);
});

/**
 * Get channel info
 */
app.get('/api/audio/channels/:id', async (req, res) => {
    const { id } = req.params;
    const info = await YouTubeService.getChannelInfo(id);
    if (!info) return res.status(404).json({ error: 'Channel not found' });
    res.json(info);
});

/**
 * Get video info
 */
app.get('/api/audio/video/:id', async (req, res) => {
    const { id } = req.params;
    const info = await YouTubeService.getVideoInfo(id);
    if (!info) return res.status(404).json({ error: 'Video not found' });
    res.json(info);
});

/**
 * Direct Audio Stream (Proxy)
 */
app.get('/api/audio/stream/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const stream = await YouTubeService.getStreamUrl(id);
        if (!stream) return res.status(404).json({ error: 'Stream not found' });

        // Set headers for audio streaming
        res.setHeader('Content-Type', 'audio/mpeg'); // or whatever play-dl provides
        // res.setHeader('Transfer-Encoding', 'chunked');

        stream.stream.pipe(res);
    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({ error: 'Failed to stream audio' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Dhamma Audio Proxy running on port ${PORT}`);
});
