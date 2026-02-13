import { AudioTrack, AudioChannel } from '../../types/audio/AudioTypes';

const API_BASE_URL = 'http://localhost:3001/api/audio';

export const AudioService = {
    async search(query: string, limit: number = 20): Promise<AudioTrack[]> {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to search audio');
        return response.json();
    },

    async getChannelVideos(channelId: string, limit: number = 20): Promise<AudioTrack[]> {
        const response = await fetch(`${API_BASE_URL}/channels/${channelId}/videos?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch channel videos');
        return response.json();
    },

    async getChannelInfo(channelId: string): Promise<AudioChannel> {
        const response = await fetch(`${API_BASE_URL}/channels/${channelId}`);
        if (!response.ok) throw new Error('Failed to fetch channel info');
        return response.json();
    },

    async getVideoInfo(videoId: string): Promise<AudioTrack> {
        const response = await fetch(`${API_BASE_URL}/video/${videoId}`);
        if (!response.ok) throw new Error('Failed to fetch video info');
        return response.json();
    },

    getStreamUrl(videoId: string): string {
        return `${API_BASE_URL}/stream/${videoId}`;
    }
};
