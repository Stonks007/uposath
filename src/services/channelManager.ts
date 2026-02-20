/**
 * Channel Manager Service
 * 
 * Manages saved YouTube channels for the Dhamma Library.
 * Channels are stored locally in Capacitor Preferences as a JSON array.
 */
import { Preferences } from '@capacitor/preferences';

const CHANNELS_KEY = 'dhamma_library_channels';
const SEEDED_KEY = 'dhamma_library_seeded';

export interface SavedChannel {
    id: string;          // YouTube channel ID (UCxxx or browse ID)
    name: string;
    avatarUrl: string;
    isDefault: boolean;
}

// Pre-seeded channels for first launch
const SEED_CHANNELS: SavedChannel[] = [
    {
        id: 'UC0ypu1lL-Srd4O7XHjtIQrg',
        name: 'Pañcasikha',
        avatarUrl: '',
        isDefault: true,
    },
    {
        id: 'UCAHMOyFb4gCMuIMnNOGacfQ',
        name: 'dhammatalks.org',
        avatarUrl: '',
        isDefault: false,
    },
    {
        id: 'UC9aktCHGbnM2CnGB9dQfSfA',
        name: 'Buddha Rashmi',
        avatarUrl: '',
        isDefault: false,
    },
];

export async function getChannels(): Promise<SavedChannel[]> {
    const { value } = await Preferences.get({ key: CHANNELS_KEY });
    if (value) {
        try {
            return JSON.parse(value) as SavedChannel[];
        } catch {
            return [];
        }
    }
    return [];
}

export async function saveChannels(channels: SavedChannel[]): Promise<void> {
    await Preferences.set({ key: CHANNELS_KEY, value: JSON.stringify(channels) });
}

export async function ensureSeeded(): Promise<SavedChannel[]> {
    const { value: seeded } = await Preferences.get({ key: SEEDED_KEY });
    if (seeded === 'true') {
        return getChannels();
    }
    // First launch — seed channels
    await saveChannels(SEED_CHANNELS);
    await Preferences.set({ key: SEEDED_KEY, value: 'true' });
    return SEED_CHANNELS;
}

export async function addChannel(channel: SavedChannel): Promise<SavedChannel[]> {
    const channels = await getChannels();
    // Deduplicate
    if (channels.some(c => c.id === channel.id)) return channels;
    // If this is the first channel, make it default
    if (channels.length === 0) channel.isDefault = true;
    channels.push(channel);
    await saveChannels(channels);
    return channels;
}

export async function removeChannel(id: string): Promise<SavedChannel[]> {
    let channels = await getChannels();
    const wasDefault = channels.find(c => c.id === id)?.isDefault;
    channels = channels.filter(c => c.id !== id);
    // If removed channel was default, make first remaining default
    if (wasDefault && channels.length > 0) {
        channels[0].isDefault = true;
    }
    await saveChannels(channels);
    return channels;
}

export async function setDefault(id: string): Promise<SavedChannel[]> {
    const channels = await getChannels();
    channels.forEach(c => { c.isDefault = c.id === id; });
    await saveChannels(channels);
    return channels;
}

export async function getDefaultChannel(): Promise<SavedChannel | null> {
    const channels = await getChannels();
    return channels.find(c => c.isDefault) || channels[0] || null;
}
