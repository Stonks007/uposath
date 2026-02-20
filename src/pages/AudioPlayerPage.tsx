import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonRange,
    IonSpinner
} from '@ionic/react';
import {
    play,
    pause,
    playSkipBack,
    playSkipForward,
    repeat,
    shuffle,
    musicalNotes
} from 'ionicons/icons';
import { DhammaAudio, PlaybackState } from '../plugins/dhamma-audio';
import './AudioPlayerPage.css';

const AudioPlayerPage: React.FC = () => {
    const [playerState, setPlayerState] = useState<PlaybackState | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState(0);

    useEffect(() => {
        loadState();

        const stateListener = DhammaAudio.addListener('playbackStateChanged', (stateEvt: any) => {
            const isPlaying = stateEvt.state === 'PLAYING' || stateEvt.isPlaying === true;
            const isPaused = stateEvt.state === 'PAUSED' || stateEvt.isPaused === true;
            setPlayerState(prev => {
                const merged = {
                    ...(prev || {}),
                    ...stateEvt,
                    isPlaying,
                    isPaused,
                    position: prev?.position ?? 0,
                    duration: prev?.duration ?? stateEvt.duration ?? 0
                };
                return merged;
            });
        });

        const progressListener = DhammaAudio.addListener('progressUpdate', (data) => {
            if (!isDragging) {
                setPlayerState(prev => prev ? { ...prev, position: data.position, duration: data.duration } : null);
            }
        });

        return () => {
            stateListener.then(l => l.remove());
            progressListener.then(l => l.remove());
        };
    }, [isDragging]);

    const loadState = async () => {
        try {
            const state = await DhammaAudio.getPlaybackState();
            setPlayerState(state);
        } catch (err) {
            console.error('Failed to load player state:', err);
        }
    };

    const handleSeek = async (value: number) => {
        setPlayerState(prev => prev ? { ...prev, position: value } : null);
        await DhammaAudio.seekTo({ position: value });
        setTimeout(() => setIsDragging(false), 500);
    };

    const togglePlay = async () => {
        if (!playerState) return;
        if (playerState.isPlaying) {
            await DhammaAudio.pause();
        } else {
            await DhammaAudio.resume();
        }
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Empty state
    if (!playerState?.currentVideo) {
        return (
            <IonPage>
                <IonHeader className="ion-no-border">
                    <IonToolbar>
                        <IonButtons slot="start"><IonBackButton defaultHref="/library" /></IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent fullscreen>
                    <div className="player-empty">
                        <IonIcon icon={musicalNotes} className="player-empty-icon" />
                        <span className="player-empty-text">No track playing</span>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const { currentVideo, isPlaying, position, duration } = playerState;

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar style={{ '--background': 'transparent' }}>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/library" />
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen scrollY={false}>
                <div className="player-container">
                    {/* Artwork */}
                    <div className="player-artwork-wrapper">
                        {currentVideo.thumbnailUrl ? (
                            <img
                                src={currentVideo.thumbnailUrl}
                                alt={currentVideo.title}
                                className="player-artwork"
                            />
                        ) : (
                            <div className="player-artwork-placeholder">
                                <IonIcon icon={musicalNotes} />
                            </div>
                        )}
                    </div>

                    {/* Track Info */}
                    <div className="player-info">
                        <h1 className="player-title">{currentVideo.title}</h1>
                        {currentVideo.channelName && (
                            <p className="player-artist">{currentVideo.channelName}</p>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="player-progress-section">
                        <IonRange
                            value={isDragging ? dragPosition : position}
                            max={duration || 1}
                            onIonKnobMoveStart={() => setIsDragging(true)}
                            onIonInput={(e: any) => setDragPosition(e.detail.value as number)}
                            onIonKnobMoveEnd={(e: any) => handleSeek(e.detail.value as number)}
                            className="player-progress-bar"
                        />
                        <div className="player-time-row">
                            <span className="player-time">{formatTime(isDragging ? dragPosition : position)}</span>
                            <span className="player-time">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="player-controls">
                        <IonButton fill="clear" className="player-control-btn player-control-btn--secondary">
                            <IonIcon icon={shuffle} />
                        </IonButton>
                        <IonButton fill="clear" className="player-control-btn">
                            <IonIcon icon={playSkipBack} />
                        </IonButton>
                        <IonButton
                            fill="clear"
                            className="player-play-btn"
                            onClick={togglePlay}
                        >
                            <IonIcon icon={isPlaying ? pause : play} />
                        </IonButton>
                        <IonButton fill="clear" className="player-control-btn">
                            <IonIcon icon={playSkipForward} />
                        </IonButton>
                        <IonButton fill="clear" className="player-control-btn player-control-btn--secondary">
                            <IonIcon icon={repeat} />
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AudioPlayerPage;
