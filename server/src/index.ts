import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Readable } from 'stream';
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
 * Optimized Audio Stream (Direct Proxy with Range Support)
 */
app.get('/api/audio/stream/:id', async (req, res) => {
    const { id } = req.params;
    const range = req.headers.range;

    try {
        console.log(`[Proxy] Requesting stream for ${id} (Range: ${range || 'none'})`);

        // Step 1: Get the direct GoogleVideo URL
        const streamInfo = await YouTubeService.getStreamUrlDirect(id);

        if (!streamInfo) {
            console.log(`[Proxy] Direct URL failed for ${id}, falling back to transcoded stream.`);
            // Fallback to legacy transcoded stream if direct fails
            const legacyStream = await YouTubeService.getStreamUrl(id);
            if (!legacyStream) return res.status(404).json({ error: 'Stream not found' });

            res.setHeader('Content-Type', 'audio/mpeg');
            legacyStream.stream.pipe(res);
            return;
        }

        // Step 2: Proxy the direct URL with Range support
        const headers: Record<string, string> = {};
        if (range) {
            headers['Range'] = range;
        }

        const fetchFn = (globalThis as any).fetch;
        if (!fetchFn) throw new Error('Native fetch not available');

        const response = await fetchFn(streamInfo.url, { headers });

        // Step 3: Forward appropriate headers back to client
        res.status(response.status);

        // Forward essential headers
        const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
        headersToForward.forEach(h => {
            const val = response.headers.get(h);
            if (val) res.setHeader(h, val);
        });

        // Ensure we have a mime type if YouTube didn't provide one or we guessed
        if (!res.getHeader('content-type')) {
            res.setHeader('Content-Type', streamInfo.mimeType);
        }

        if (!response.body) {
            throw new Error('Response body is empty');
        }

        // Step 4: Pipe the web stream to Node response
        const nodeStream = Readable.fromWeb(response.body as any);

        nodeStream.pipe(res);

        nodeStream.on('error', (err: any) => {
            console.error(`[Proxy] Pipe error for ${id}:`, err);
            if (!res.headersSent) res.status(500).end();
            else res.end();
        });

    } catch (error: any) {
        console.error(`[Proxy] Fatal error for ${id}:`, error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to stream audio', details: error.message });
        }
    }
});

/**
 * Get Lyrics/Captions
 */
app.get('/api/audio/lyrics/:id', async (req, res) => {
    const { id } = req.params;
    const lyrics = await YouTubeService.getCaptions(id);
    if (!lyrics) return res.json({ lyrics: '' });
    res.json({ lyrics });
});

// Start server
app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Dhamma Audio Proxy running on port ${PORT} (v3 - yt-dlp + ytpl)`);
});
