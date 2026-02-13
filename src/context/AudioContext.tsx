import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AudioTrack, AudioPlaybackState } from '../types/audio/AudioTypes';
import { AudioService } from '../services/audio/AudioService';
import { LocalAudioDataService } from '../services/audio/LocalAudioDataService';

interface AudioContextType extends AudioPlaybackState {
    playTrack: (track: AudioTrack, queue?: AudioTrack[]) => void;
    pause: () => void;
    resume: () => void;
    togglePlay: () => void;
    next: () => void;
    previous: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    setPlaybackRate: (rate: number) => void;
    toggleMute: () => void;
    setRepeatMode: (mode: 'off' | 'one' | 'all') => void;
    toggleShuffle: () => void;
    sleepTimer: number | null; // minutes remaining
    setSleepTimer: (minutes: number | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AudioPlaybackState>({
        isPlaying: false,
        currentTrack: null,
        currentTime: 0,
        duration: 0,
        volume: 1,
        playbackRate: 1,
        isMuted: false,
        repeatMode: 'off',
        isShuffle: false,
        queue: [],
        currentIndex: -1
    });

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio();

        const audio = audioRef.current;

        const updateProgress = () => {
            setState(s => ({ ...s, currentTime: audio.currentTime, duration: audio.duration || 0 }));
        };

        const handleEnded = () => {
            next();
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', () => setState(s => ({ ...s, isPlaying: true })));
        audio.addEventListener('pause', () => setState(s => ({ ...s, isPlaying: false })));

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
        };
    }, []);

    // Periodically save progress
    useEffect(() => {
        if (state.currentTrack && state.isPlaying && audioRef.current) {
            const interval = setInterval(() => {
                LocalAudioDataService.saveProgress(state.currentTrack!.id, audioRef.current!.currentTime);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [state.currentTrack, state.isPlaying]);

    const playTrack = async (track: AudioTrack, queue: AudioTrack[] = []) => {
        if (!audioRef.current) return;
        try {
            // Save to history
            LocalAudioDataService.addToHistory(track);

            // Get resume position
            const progress = await LocalAudioDataService.getProgress(track.id);

            const streamUrl = await AudioService.getStreamUrl(track.id);
            if (!streamUrl) throw new Error('Failed to get stream URL');

            audioRef.current.src = streamUrl;
            audioRef.current.playbackRate = state.playbackRate;
            audioRef.current.currentTime = progress || 0;
            audioRef.current.play();

            const newQueue = queue.length > 0 ? queue : [track];
            const newIndex = newQueue.findIndex(t => t.id === track.id);

            setState(s => ({
                ...s,
                currentTrack: track,
                isPlaying: true,
                queue: newQueue,
                currentIndex: newIndex !== -1 ? newIndex : 0
            }));
        } catch (error) {
            console.error('Playback error:', error);
        }
    };

    const pause = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            if (state.currentTrack) {
                LocalAudioDataService.saveProgress(state.currentTrack.id, audioRef.current.currentTime);
            }
        }
    };

    const resume = () => audioRef.current?.play();

    const togglePlay = () => {
        if (state.isPlaying) pause();
        else resume();
    };

    const next = () => {
        if (state.queue.length === 0) return;
        let nextIndex = state.currentIndex + 1;
        if (nextIndex >= state.queue.length) {
            if (state.repeatMode === 'all') nextIndex = 0;
            else return;
        }
        playTrack(state.queue[nextIndex]);
    };

    const previous = () => {
        if (state.queue.length === 0) return;
        let prevIndex = state.currentIndex - 1;
        if (prevIndex < 0) {
            if (state.repeatMode === 'all') prevIndex = state.queue.length - 1;
            else return;
        }
        playTrack(state.queue[prevIndex]);
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setState(s => ({ ...s, currentTime: time }));
        }
    };

    const setVolume = (volume: number) => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            setState(s => ({ ...s, volume }));
        }
    };

    const setPlaybackRate = (rate: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            setState(s => ({ ...s, playbackRate: rate }));
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            const newMuted = !state.isMuted;
            audioRef.current.muted = newMuted;
            setState(s => ({ ...s, isMuted: newMuted }));
        }
    };

    const [sleepTimer, setSleepTimerState] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const setSleepTimer = (minutes: number | null) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSleepTimerState(minutes);

        if (minutes !== null) {
            timerRef.current = setInterval(() => {
                setSleepTimerState(prev => {
                    if (prev === null || prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        pause();
                        return null;
                    }
                    return prev - 1;
                });
            }, 60000);
        }
    };

    const setRepeatMode = (mode: 'off' | 'one' | 'all') => setState(s => ({ ...s, repeatMode: mode }));
    const toggleShuffle = () => setState(s => ({ ...s, isShuffle: !s.isShuffle }));

    return (
        <AudioContext.Provider value={{
            ...state,
            playTrack,
            pause,
            resume,
            togglePlay,
            next,
            previous,
            seek,
            setVolume,
            setPlaybackRate,
            toggleMute,
            setRepeatMode,
            toggleShuffle,
            sleepTimer,
            setSleepTimer
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error('useAudio must be used within an AudioProvider');
    return context;
};
