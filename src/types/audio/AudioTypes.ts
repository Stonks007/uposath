export interface AudioTrack {
    id: string;
    title: string;
    description: string;
    duration: number; // in seconds
    thumbnail: string;
    channelId: string;
    channelTitle: string;
    uploadedAt: string;
    views: number;
    url?: string;
}

export interface AudioChannel {
    id: string;
    name: string;
    logo: string;
    videoCount: number;
}

export interface AudioPlaylist {
    id: string;
    name: string;
    description: string;
    trackIds: string[];
    createdAt: string;
    updatedAt: string;
    thumbnail?: string;
}

export interface AudioPlaybackState {
    isPlaying: boolean;
    currentTrack: AudioTrack | null;
    currentTime: number;
    duration: number;
    volume: number;
    playbackRate: number;
    isMuted: boolean;
    repeatMode: 'off' | 'one' | 'all';
    isShuffle: boolean;
    queue: AudioTrack[];
    currentIndex: number;
}

export interface UserAudioStats {
    totalHours: number;
    recordingsCompleted: number;
    streakCount: number;
    lastListeningDate: string;
}
