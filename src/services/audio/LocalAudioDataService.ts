import { Preferences } from '@capacitor/preferences';
import { AudioTrack, AudioPlaylist, UserAudioStats } from '../../types/audio/AudioTypes';

const STORE_KEYS = {
    PLAYLISTS: 'dhamma_audio_playlists',
    FAVORITES: 'dhamma_audio_favorites',
    HISTORY: 'dhamma_audio_history',
    PROGRESS: 'dhamma_audio_progress',
    CHANNELS: 'dhamma_audio_subscribed_channels',
    STATS: 'dhamma_audio_user_stats'
};

export const LocalAudioDataService = {
    // --- Playlists ---
    async getPlaylists(): Promise<AudioPlaylist[]> {
        const { value } = await Preferences.get({ key: STORE_KEYS.PLAYLISTS });
        return value ? JSON.parse(value) : [];
    },

    async savePlaylist(playlist: AudioPlaylist): Promise<void> {
        const playlists = await this.getPlaylists();
        const index = playlists.findIndex(p => p.id === playlist.id);
        if (index > -1) {
            playlists[index] = { ...playlist, updatedAt: new Date().toISOString() };
        } else {
            playlists.push({ ...playlist, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
        await Preferences.set({ key: STORE_KEYS.PLAYLISTS, value: JSON.stringify(playlists) });
    },

    async deletePlaylist(id: string): Promise<void> {
        let playlists = await this.getPlaylists();
        playlists = playlists.filter(p => p.id !== id);
        await Preferences.set({ key: STORE_KEYS.PLAYLISTS, value: JSON.stringify(playlists) });
    },

    // --- Favorites ---
    async getFavorites(): Promise<AudioTrack[]> {
        const { value } = await Preferences.get({ key: STORE_KEYS.FAVORITES });
        return value ? JSON.parse(value) : [];
    },

    async toggleFavorite(track: AudioTrack): Promise<boolean> {
        let favorites = await this.getFavorites();
        const index = favorites.findIndex(f => f.id === track.id);
        let isNowFavorite = false;

        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(track);
            isNowFavorite = true;
        }

        await Preferences.set({ key: STORE_KEYS.FAVORITES, value: JSON.stringify(favorites) });
        return isNowFavorite;
    },

    async isFavorite(trackId: string): Promise<boolean> {
        const favorites = await this.getFavorites();
        return favorites.some(f => f.id === trackId);
    },

    // --- History ---
    async getHistory(): Promise<{ track: AudioTrack; playedAt: string }[]> {
        const { value } = await Preferences.get({ key: STORE_KEYS.HISTORY });
        return value ? JSON.parse(value) : [];
    },

    async addToHistory(track: AudioTrack): Promise<void> {
        let history = await this.getHistory();
        // Remove existing duplicate to move to top
        history = history.filter(h => h.track.id !== track.id);
        history.unshift({ track, playedAt: new Date().toISOString() });

        // Limit history to 100 items
        if (history.length > 100) history = history.slice(0, 100);

        await Preferences.set({ key: STORE_KEYS.HISTORY, value: JSON.stringify(history) });
    },

    // --- Progress ---
    async saveProgress(trackId: string, position: number): Promise<void> {
        const { value } = await Preferences.get({ key: STORE_KEYS.PROGRESS });
        const progress = value ? JSON.parse(value) : {};
        progress[trackId] = { position, lastPlayedAt: new Date().toISOString() };
        await Preferences.set({ key: STORE_KEYS.PROGRESS, value: JSON.stringify(progress) });
    },

    async getProgress(trackId: string): Promise<number> {
        const { value } = await Preferences.get({ key: STORE_KEYS.PROGRESS });
        const progress = value ? JSON.parse(value) : {};
        return progress[trackId]?.position || 0;
    },

    // --- Subscribed Channels ---
    async getSubscribedChannels(): Promise<string[]> {
        const { value } = await Preferences.get({ key: STORE_KEYS.CHANNELS });
        // Default to Pancasikha channel
        return value ? JSON.parse(value) : ['@Pancasikha-358'];
    },

    async toggleChannelSubscription(channelId: string): Promise<void> {
        let channels = await this.getSubscribedChannels();
        if (channels.includes(channelId)) {
            channels = channels.filter(id => id !== channelId);
        } else {
            channels.push(channelId);
        }
        await Preferences.set({ key: STORE_KEYS.CHANNELS, value: JSON.stringify(channels) });
    }
};
