import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonRange,
    IonText
} from '@ionic/react';
import {
    play,
    pause,
    playSkipBack,
    playSkipForward,
    repeat,
    shuffle
} from 'ionicons/icons';
import { DhammaAudio, PlaybackState } from '../plugins/dhamma-audio';

const AudioPlayerPage: React.FC = () => {
    const [playerState, setPlayerState] = useState<PlaybackState | null>(null);

    useEffect(() => {
        loadState();
        const interval = setInterval(loadState, 1000);
        return () => clearInterval(interval);
    }, []);

    const loadState = async () => {
        try {
            const state = await DhammaAudio.getPlaybackState();
            setPlayerState(state);
        } catch (err) {
            console.error('Failed to load player state:', err);
        }
    };

    const togglePlay = async () => {
        if (!playerState) return;
        if (playerState.isPlaying) {
            await DhammaAudio.pause();
        } else {
            await DhammaAudio.resume();
        }
        loadState();
    };

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!playerState?.currentVideo) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start"><IonBackButton /></IonButtons>
                        <IonTitle>Player</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding ion-text-center">
                    <IonText color="medium">No track playing</IonText>
                </IonContent>
            </IonPage>
        );
    }

    const { currentVideo, isPlaying, position, duration } = playerState;

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/library" />
                    </IonButtons>
                    <IonTitle>Now Playing</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}>
                        <img
                            src={currentVideo.thumbnailUrl}
                            alt="Art"
                            style={{ width: '85%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                        />
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <h1 style={{ fontWeight: 700, margin: 0, fontSize: '1.5rem' }}>{currentVideo.title}</h1>
                        <p style={{ color: 'var(--ion-color-medium)', marginTop: '8px', fontSize: '1.1rem' }}>{currentVideo.channelName}</p>
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <IonRange
                            value={position}
                            max={duration}
                            onIonChange={(e: any) => DhammaAudio.seekTo({ position: e.detail.value as number })}
                            className="player-range"
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 15px' }}>
                            <IonText color="medium">{formatTime(position)}</IonText>
                            <IonText color="medium">{formatTime(duration)}</IonText>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginTop: '20px' }}>
                        <IonButton fill="clear" color="medium"><IonIcon icon={shuffle} /></IonButton>
                        <IonButton fill="clear" color="dark" style={{ fontSize: '1.8rem' }}><IonIcon icon={playSkipBack} /></IonButton>
                        <IonButton
                            fill="solid"
                            color="primary"
                            style={{ width: '80px', height: '80px', '--border-radius': '50%', fontSize: '2rem' }}
                            onClick={togglePlay}
                        >
                            <IonIcon icon={isPlaying ? pause : play} />
                        </IonButton>
                        <IonButton fill="clear" color="dark" style={{ fontSize: '1.8rem' }}><IonIcon icon={playSkipForward} /></IonButton>
                        <IonButton fill="clear" color="medium"><IonIcon icon={repeat} /></IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AudioPlayerPage;
