
const stream = require('youtube-audio-stream');
const fs = require('fs');

async function test() {
    const url = 'https://www.youtube.com/watch?v=rdBFXc6hV6I';
    console.log(`Testing stream for ${url}`);
    try {
        const s = await stream(url);
        console.log('Stream created');
        s.on('data', (chunk) => {
            // just read a bit
            console.log('Received chunk of size', chunk.length);
            s.destroy();
        });
        s.on('error', (err) => {
            console.error('Stream Error:', err);
        });
    } catch (e) {
        console.error('Catch Error:', e);
    }
}

test();
