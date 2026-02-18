export interface DhammaAudioPlugin {
    getChannelInfo(options: { channelId: string }): Promise<ChannelInfo>;
    getChannelVideos(options: { channelId: string; page: number }): Promise<VideoListResult>;
    searchChannel(options: { channelId: string; query: string }): Promise<VideoListResult>;
    search(options: { query: string }): Promise<VideoListResult>;

    playVideo(options: { video: VideoInfo }): Promise<{ success: boolean }>;
    pause(): Promise<{ success: boolean }>;
    resume(): Promise<{ success: boolean }>;
    stop(): Promise<{ success: boolean }>;
    seekTo(options: { position: number }): Promise<{ success: boolean }>;
    skipToNext(): Promise<{ success: boolean }>;
    skipToPrevious(): Promise<{ success: boolean }>;

    setQueue(options: { videoIds: string[] }): Promise<{ success: boolean }>;
    addToQueue(options: { videoId: string; position?: number }): Promise<{ success: boolean }>;
    removeFromQueue(options: { index: number }): Promise<{ success: boolean }>;
    getQueue(): Promise<QueueResult>;
    clearQueue(): Promise<{ success: boolean }>;

    getPlaybackState(): Promise<PlaybackState>;
    getCurrentVideo(): Promise<{ video: VideoInfo | null }>;
    getPlaybackHistory(options: { limit: number }): Promise<{ history: VideoInfo[] }>;

    getPlaylists(): Promise<{ playlists: PlaylistInfo[] }>;
    createPlaylist(options: { name: string; videoIds?: string[] }): Promise<{ playlist: PlaylistInfo }>;
    addToPlaylist(options: { playlistId: string; videoId: string }): Promise<{ success: boolean }>;
    removeFromPlaylist(options: { playlistId: string; videoId: string }): Promise<{ success: boolean }>;
    deletePlaylist(options: { playlistId: string }): Promise<{ success: boolean }>;
    getPlaylistVideos(options: { playlistId: string }): Promise<{ videos: VideoInfo[] }>;

    addListener(eventName: 'playbackStateChanged', listenerFunc: (state: PlaybackState) => void): Promise<any>;
    addListener(eventName: 'progressUpdate', listenerFunc: (data: { position: number, duration: number }) => void): Promise<any>;
}

export interface VideoInfo {
    id: string;
    title: string;
    channelId: string;
    channelName: string;
    duration: number; // seconds
    thumbnailUrl: string;
    uploadDate: number; // timestamp
    viewCount: number;
    description?: string;
}

export interface ChannelInfo {
    id: string;
    name: string;
    avatarUrl: string;
    subscriberCount: number;
    description: string;
}

export interface VideoListResult {
    videos: VideoInfo[];
    hasMore: boolean;
}

export interface PlaybackState {
    isPlaying: boolean;
    isPaused: boolean;
    currentVideo: VideoInfo | null;
    position: number; // milliseconds
    duration: number; // milliseconds
    queue: VideoInfo[];
    currentIndex: number;
}

export interface QueueResult {
    queue: VideoInfo[];
    currentIndex: number;
}

export interface PlaylistInfo {
    id: string;
    name: string;
    videoCount: number;
    createdAt: number;
    updatedAt: number;
}
