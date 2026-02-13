"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const youtubeService_1 = require("./src/services/youtubeService");
async function test() {
    try {
        console.log('--- Testing Search (ytsr) ---');
        const results = await youtubeService_1.YouTubeService.search('dhamma');
        console.log(`Found ${results.length} results.`);
        if (results.length > 0) {
            console.log('First result:', results[0].title, results[0].id);
            const videoId = results[0].id; // Use first result ID
            console.log('\n--- Testing Get Video Info (@distube/ytdl-core) ---');
            const info = await youtubeService_1.YouTubeService.getVideoInfo(videoId);
            console.log('Video Info:', info ? info.title : 'Failed');
            console.log('\n--- Testing Get Stream (youtube-audio-stream) ---');
            const streamInfo = await youtubeService_1.YouTubeService.getStreamUrl(videoId);
            if (streamInfo && streamInfo.stream) {
                console.log('Stream Promise resolved.');
                console.log('MIME Type:', streamInfo.mimeType);
                // Check if it's a readable stream
                if (streamInfo.stream.pipe) {
                    console.log('Stream is a valid Readable stream.');
                }
                else {
                    console.log('Stream object:', streamInfo.stream);
                }
            }
            else {
                console.error('Failed to get stream.');
            }
        }
        else {
            console.log('No results found, skipping detailed tests.');
        }
    }
    catch (error) {
        console.error('Test failed:', error);
    }
}
test();
