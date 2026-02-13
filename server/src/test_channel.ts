import { YouTubeService } from './services/youtubeService.js';

async function test() {
    const channelId = 'UC0ypu1lL-Srd4O7XHjtIQrg'; // The channel reported by user
    console.log(`Testing Channel Info for ${channelId}...`);
    try {
        const info = await YouTubeService.getChannelInfo(channelId);
        console.log('Channel Info:', info);
    } catch (e) {
        console.error('Channel Info Error:', e);
    }

    console.log(`Testing Channel Videos for ${channelId}...`);
    try {
        const videos = await YouTubeService.getChannelVideos(channelId, 5);
        console.log(`Found ${videos.length} videos.`);
        if (videos.length > 0) {
            console.log('First video:', videos[0].title);
        }
    } catch (e) {
        console.error('Channel Videos Error:', e);
    }
}

test();
