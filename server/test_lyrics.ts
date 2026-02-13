
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const YTDlpWrap = require('yt-dlp-wrap').default;
import path from 'path';

const binaryPath = path.resolve('./yt-dlp.exe');
const yt = new YTDlpWrap(binaryPath);

// A known video with captions (e.g., a Dhamma talk or popular song)
// Let's use a common one or just a random ID if we can't think of one.
// Using a generic ID from previous logs if possible, or just a dummy one.
// Let's use the ID 'dQw4w9WgXcQ' (Rick Roll) usually has captions, or a specific endpoint.
// Better, let's use the one from the user's history if visible... 
// I'll use a known video ID that likely has subs: 'jNQXAC9IVRw' (Me at the zoo - might not)
// Let's try 'M7lc1UVf-VE' (YouTube Developers)
const videoId = 'M7lc1UVf-VE';

async function test() {
    console.log('Fetching metadata for:', videoId);
    try {
        const metadata = await yt.getVideoInfo(`https://www.youtube.com/watch?v=${videoId}`);
        console.log('Subtitles:', Object.keys(metadata.subtitles || {}));
        console.log('Auto Captions:', Object.keys(metadata.automatic_captions || {}));

        if (metadata.automatic_captions && metadata.automatic_captions.en) {
            console.log('English Auto Caption URL:', metadata.automatic_captions.en[0].url);
        }
    } catch (e) {
        console.error(e);
    }
}

test();
