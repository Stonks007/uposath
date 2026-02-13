import playdl from 'play-dl';

const play = playdl as any;

export interface VideoInfo {
    id: string;
    title: string;
    description: string;
    duration: number; // in seconds
    thumbnail: string;
    channelId: string;
    channelTitle: string;
    uploadedAt: string;
    views: number;
}

export interface ChannelInfo {
    id: string;
    name: string;
    logo: string;
    videoCount: number;
}

export class YouTubeService {
    /**
     * Get basic info for a video.
     */
    static async getVideoInfo(videoId: string): Promise<VideoInfo | null> {
        try {
            const info: any = await play.video_basic_info(`https://www.youtube.com/watch?v=${videoId}`);
            const v = info.video_details;
            return {
                id: v.id || videoId,
                title: v.title || '',
                description: v.description || '',
                duration: v.durationInSec || 0,
                thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || '',
                channelId: v.channel?.id || '',
                channelTitle: v.channel?.name || '',
                uploadedAt: '',
                views: v.views || 0
            };
        } catch (error) {
            console.error('Error fetching video info:', error);
            return null;
        }
    }

    /**
     * Get stream URL for a video.
     */
    static async getStreamUrl(videoId: string) {
        try {
            const stream = await play.stream(`https://www.youtube.com/watch?v=${videoId}`);
            return stream;
        } catch (error) {
            console.error('Error getting stream URL:', error);
            return null;
        }
    }

    /**
     * Search for videos.
     */
    static async search(query: string, limit: number = 20): Promise<VideoInfo[]> {
        try {
            const results: any[] = await play.search(query, {
                limit: limit,
                source: { youtube: 'video' }
            });

            return results.map(v => ({
                id: v.id || '',
                title: v.title || '',
                description: v.description || '',
                duration: v.durationInSec || 0,
                thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || '',
                channelId: v.channel?.id || '',
                channelTitle: v.channel?.name || '',
                uploadedAt: '',
                views: v.views || 0
            }));
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    /**
     * Get videos from a channel.
     */
    static async getChannelVideos(channelIdOrUrl: string, limit: number = 20): Promise<VideoInfo[]> {
        try {
            const url = channelIdOrUrl.includes('youtube.com') || channelIdOrUrl.startsWith('@')
                ? (channelIdOrUrl.startsWith('@') ? `https://www.youtube.com/${channelIdOrUrl}` : channelIdOrUrl)
                : `https://www.youtube.com/channel/${channelIdOrUrl}`;

            const channel: any = await play.channel_info(url);
            const videos = await channel.videos;

            const results = Array.isArray(videos) ? videos : [];

            return results.slice(0, limit).map((v: any) => ({
                id: v.id || '',
                title: v.title || '',
                description: v.description || '',
                duration: v.durationInSec || 0,
                thumbnail: v.thumbnails?.[v.thumbnails.length - 1]?.url || '',
                channelId: channel.id || '',
                channelTitle: channel.name || '',
                uploadedAt: '',
                views: v.views || 0
            }));
        } catch (error) {
            console.error('Error fetching channel videos:', error);
            return [];
        }
    }

    /**
     * Get channel details.
     */
    static async getChannelInfo(channelIdOrUrl: string): Promise<ChannelInfo | null> {
        try {
            const url = channelIdOrUrl.includes('youtube.com') || channelIdOrUrl.startsWith('@')
                ? (channelIdOrUrl.startsWith('@') ? `https://www.youtube.com/${channelIdOrUrl}` : channelIdOrUrl)
                : `https://www.youtube.com/channel/${channelIdOrUrl}`;

            const channel: any = await play.channel_info(url);
            return {
                id: channel.id || '',
                name: channel.name || '',
                logo: channel.icon?.url || '',
                videoCount: 0
            };
        } catch (error) {
            console.error('Error fetching channel info:', error);
            return null;
        }
    }
}
