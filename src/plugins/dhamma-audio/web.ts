import { WebPlugin } from '@capacitor/core';
import type {
    DhammaAudioPlugin,
    ChannelInfo,
    VideoListResult,
    VideoInfo,
    PlaybackState,
    QueueResult,
    PlaylistInfo,
    ChannelPageResult
} from './definitions';

export class DhammaAudioWeb extends WebPlugin implements DhammaAudioPlugin {
    private mockVideos: VideoInfo[] = [
        {
            id: 'mock-1',
            title: 'Pañcasikha - Morning Chant',
            channelId: 'UC0ypu1lL-Srd4O7XHjtIQrg',
            channelName: 'Pañcasikha',
            duration: 360,
            thumbnailUrl: 'https://images.unsplash.com/photo-1544413647-ad3482594cc1?auto=format&fit=crop&q=80&w=400',
            uploadDate: Date.now() - 86400000,
            viewCount: 1500,
            description: 'A beautiful morning chant.'
        },
        {
            id: 'mock-2',
            title: 'Dhamma Talk on Mindfulness',
            channelId: 'UC0ypu1lL-Srd4O7XHjtIQrg',
            channelName: 'Pañcasikha',
            duration: 1800,
            thumbnailUrl: 'https://images.unsplash.com/photo-1512102438733-bfa4ed29aef7?auto=format&fit=crop&q=80&w=400',
            uploadDate: Date.now() - 604800000,
            viewCount: 5000,
            description: 'Guided meditation and talk.'
        }
    ];

    private isPlaying = false;
    private currentVideo: VideoInfo | null = null;
    private position = 0;
    private playbackInterval: any = null;

    async getChannelInfo(options: { channelId: string }): Promise<ChannelInfo> {
        return {
            id: 'UC0ypu1lL-Srd4O7XHjtIQrg',
            name: 'Pañcasikha',
            avatarUrl: 'https://via.placeholder.com/150?text=PS',
            subscriberCount: 12500,
            description: 'Buddhist Chants and Dhamma Talks.'
        };
    }

    async getChannelVideos(options: { channelId: string; page: number }): Promise<VideoListResult> {
        return {
            videos: this.mockVideos,
            hasMore: false
        };
    }

    async searchChannel(options: { channelId: string; query: string }): Promise<VideoListResult> {
        return {
            videos: this.mockVideos.filter(v => v.title.toLowerCase().includes(options.query.toLowerCase())),
            hasMore: false
        };
    }

    async search(options: { query: string }): Promise<VideoListResult> {
        return {
            videos: this.mockVideos.filter(v => v.title.toLowerCase().includes(options.query.toLowerCase())),
            hasMore: false
        };
    }

    async resolveChannelUrl(options: { url: string }): Promise<ChannelInfo> {
        return {
            id: 'UC0ypu1lL-Srd4O7XHjtIQrg',
            name: 'Mock Channel',
            avatarUrl: '',
        };
    }

    async getChannelPage(options: { channelId: string }): Promise<ChannelPageResult> {
        return {
            channelName: 'Mock Channel',
            channelAvatar: null,
            sections: [{ title: 'Videos', videos: this.mockVideos, continuation: null }]
        };
    }

    async setPlaybackSpeed(options: { speed: number }): Promise<{ success: boolean }> {
        return { success: true };
    }

    async playVideo(options: { video: VideoInfo }): Promise<{ success: boolean }> {
        this.currentVideo = options.video;
        this.isPlaying = true;
        this.position = 0;
        this.startMockPlayback();
        this.notifyPlaybackState();
        return { success: true };
    }

    async pause(): Promise<{ success: boolean }> {
        this.isPlaying = false;
        this.stopMockPlayback();
        this.notifyPlaybackState();
        return { success: true };
    }

    async resume(): Promise<{ success: boolean }> {
        this.isPlaying = true;
        this.startMockPlayback();
        this.notifyPlaybackState();
        return { success: true };
    }

    async stop(): Promise<{ success: boolean }> {
        this.isPlaying = false;
        this.currentVideo = null;
        this.stopMockPlayback();
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
        return { playlists: [{ id: 'p1', name: 'Favorites', videoCount: 2, createdAt: Date.now(), updatedAt: Date.now() }] };
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
        return { videos: this.mockVideos };
    }

    private startMockPlayback() {
        this.stopMockPlayback();
        this.playbackInterval = setInterval(() => {
            if (this.isPlaying && this.currentVideo) {
                this.position += 1000;
                this.notifyListeners('progressUpdate', { position: this.position });
                if (this.position >= this.currentVideo.duration * 1000) {
                    this.stop();
                }
            }
        }, 1000);
    }

    private stopMockPlayback() {
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }

    private async notifyPlaybackState() {
        const state = await this.getPlaybackState();
        this.notifyListeners('playbackStateChanged', state);
    }
}
