import { WebPlugin } from '@capacitor/core';
import type {
    DhammaAudioPlugin,
    ChannelInfo,
    VideoListResult,
    VideoInfo,
    PlaybackState,
    QueueResult,
    PlaylistInfo
} from './definitions';

export class DhammaAudioWeb extends WebPlugin implements DhammaAudioPlugin {
    private mockVideos: VideoInfo[] = [
        {
            id: 'mock-1',
            title: 'Buddhist Chant - Mangala Sutta',
            channelId: 'UC-panc-358',
            channelName: 'Pañcasikha',
            duration: 300,
            thumbnailUrl: 'https://images.unsplash.com/photo-1544413647-ad3482594cc1?auto=format&fit=crop&q=80&w=400',
            uploadDate: Date.now() - 86400000,
            viewCount: 1500,
            description: 'The Mangala Sutta, a protective chant of blessings.'
        },
        {
            id: 'mock-2',
            title: 'The Four Noble Truths - Guided Meditation',
            channelId: 'UC-panc-358',
            channelName: 'Pañcasikha',
            duration: 1200,
            thumbnailUrl: 'https://images.unsplash.com/photo-1512102438733-bfa4ed29aef7?auto=format&fit=crop&q=80&w=400',
            uploadDate: Date.now() - 604800000,
            viewCount: 5000,
            description: 'Understanding the core of Buddhist philosophy.'
        }
    ];

    private isPlaying = false;
    private currentVideo: VideoInfo | null = null;
    private position = 0;

    async getChannelInfo(options: { channelId: string }): Promise<ChannelInfo> {
        console.log('Web: getChannelInfo', options);
        return {
            id: options.channelId,
            name: 'Pañcasikha',
            avatarUrl: 'https://via.placeholder.com/150?text=PS',
            subscriberCount: 12500,
            description: 'Buddhist Chants and Dhamma Talks.'
        };
    }

    async getChannelVideos(options: { channelId: string; page: number }): Promise<VideoListResult> {
        console.log('Web: getChannelVideos', options);
        return {
            videos: this.mockVideos,
            hasMore: false
        };
    }

    async searchChannel(options: { channelId: string; query: string }): Promise<VideoListResult> {
        console.log('Web: searchChannel', options);
        return {
            videos: this.mockVideos.filter(v => v.title.toLowerCase().includes(options.query.toLowerCase())),
            hasMore: false
        };
    }

    async playVideo(options: { videoId: string }): Promise<{ success: boolean }> {
        console.log('Web: playVideo', options);
        this.currentVideo = this.mockVideos.find(v => v.id === options.videoId) || null;
        this.isPlaying = true;
        this.position = 0;
        this.notifyPlaybackState();
        return { success: true };
    }

    async pause(): Promise<{ success: boolean }> {
        this.isPlaying = false;
        this.notifyPlaybackState();
        return { success: true };
    }

    async resume(): Promise<{ success: boolean }> {
        this.isPlaying = true;
        this.notifyPlaybackState();
        return { success: true };
    }

    async stop(): Promise<{ success: boolean }> {
        this.isPlaying = false;
        this.currentVideo = null;
        this.notifyPlaybackState();
        return { success: true };
    }

    async seekTo(options: { position: number }): Promise<{ success: boolean }> {
        this.position = options.position;
        this.notifyPlaybackState();
        return { success: true };
    }

    async skipToNext(): Promise<{ success: boolean }> {
        return { success: true };
    }

    async skipToPrevious(): Promise<{ success: boolean }> {
        return { success: true };
    }

    async setQueue(options: { videoIds: string[] }): Promise<{ success: boolean }> {
        return { success: true };
    }

    async addToQueue(options: { videoId: string; position?: number }): Promise<{ success: boolean }> {
        return { success: true };
    }

    async removeFromQueue(options: { index: number }): Promise<{ success: boolean }> {
        return { success: true };
    }

    async getQueue(): Promise<QueueResult> {
        return { queue: this.mockVideos, currentIndex: 0 };
    }

    async clearQueue(): Promise<{ success: boolean }> {
        return { success: true };
    }

    async getPlaybackState(): Promise<PlaybackState> {
        return {
            isPlaying: this.isPlaying,
            isPaused: !this.isPlaying && this.currentVideo !== null,
            currentVideo: this.currentVideo,
            position: this.position,
            duration: this.currentVideo?.duration ? this.currentVideo.duration * 1000 : 0,
            queue: this.mockVideos,
            currentIndex: 0
        };
    }

    async getCurrentVideo(): Promise<{ video: VideoInfo | null }> {
        return { video: this.currentVideo };
    }

    async getPlaybackHistory(options: { limit: number }): Promise<{ history: VideoInfo[] }> {
        return { history: this.mockVideos };
    }

    async getPlaylists(): Promise<{ playlists: PlaylistInfo[] }> {
        return { playlists: [] };
    }

    async createPlaylist(options: { name: string; videoIds?: string[] }): Promise<{ playlist: PlaylistInfo }> {
        return { playlist: { id: 'new', name: options.name, videoCount: 0, createdAt: Date.now(), updatedAt: Date.now() } };
    }

    async addToPlaylist(options: { playlistId: string; videoId: string }): Promise<{ success: boolean }> {
        return { success: true };
    }

    async removeFromPlaylist(options: { playlistId: string; videoId: string }): Promise<{ success: boolean }> {
        return { success: true };
    }

    async deletePlaylist(options: { playlistId: string }): Promise<{ success: boolean }> {
        return { success: true };
    }

    async getPlaylistVideos(options: { playlistId: string }): Promise<{ videos: VideoInfo[] }> {
        return { videos: [] };
    }

    private async notifyPlaybackState() {
        const state = await this.getPlaybackState();
        this.notifyListeners('playbackStateChanged', state);
    }
}
