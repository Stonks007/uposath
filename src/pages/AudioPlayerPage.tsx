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
    IonTitle,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonSegment,
    IonSegmentButton,
    IonPopover,
    IonListHeader
} from '@ionic/react';
import {
    play,
    pause,
    playSkipForward,
    playSkipBack,
    refresh,
    star,
    starOutline,
    listOutline,
    informationCircleOutline,
    shareSocialOutline,
    timeOutline,
    speedometerOutline,
    musicalNote
} from 'ionicons/icons';
import { useAudio } from '../context/AudioContext';
import { LocalAudioDataService } from '../services/audio/LocalAudioDataService';

const AudioPlayerPage: React.FC = () => {
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        next,
        previous,
        currentTime,
        duration,
        seek,
        playbackRate,
        setPlaybackRate,
        queue,
        sleepTimer,
        setSleepTimer
    } = useAudio();

    const [activeTab, setActiveTab] = useState<'player' | 'queue' | 'info'>('player');
    const [isFav, setIsFav] = useState(false);
    const [showSpeedPopover, setShowSpeedPopover] = useState<{ show: boolean, event: any }>({ show: false, event: undefined });
    const [showTimerPopover, setShowTimerPopover] = useState<{ show: boolean, event: any }>({ show: false, event: undefined });

    useEffect(() => {
        if (currentTrack) {
            LocalAudioDataService.isFavorite(currentTrack.id).then(setIsFav);
        }
    }, [currentTrack]);

    const handleToggleFavorite = async () => {
        if (currentTrack) {
            const nowFav = await LocalAudioDataService.toggleFavorite(currentTrack);
            setIsFav(nowFav);
        }
    };

    if (!currentTrack) {
        return (
            <IonPage>
                <IonHeader className="ion-no-border">
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="/library" />
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding ion-text-center">
                    <div style={{ marginTop: '40%' }}>
                        <IonIcon icon={musicalNote} style={{ fontSize: '4rem', opacity: 0.2 }} />
                        <p>No track is currently playing.</p>
                        <IonButton routerLink="/library">Browse Library</IonButton>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/library" />
                    </IonButtons>
                    <IonTitle style={{ fontSize: '0.9rem', fontWeight: '600' }}>NOW PLAYING</IonTitle>
                    <IonButtons slot="end">
                        <IonButton>
                            <IonIcon icon={shareSocialOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <div style={{ padding: '0 8px' }}>
                    <IonSegment value={activeTab} onIonChange={e => setActiveTab(e.detail.value as any)} mode="ios" style={{ marginBottom: '24px' }}>
                        <IonSegmentButton value="player">
                            <IonLabel>Player</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="queue">
                            <IonLabel>Up Next</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="info">
                            <IonLabel>About</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>

                    {activeTab === 'player' && (
                        <div className="player-view ion-text-center">
                            <div className="artwork-container" style={{
                                width: '100%',
                                aspectRatio: '1',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                marginBottom: '32px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                            }}>
                                <img src={currentTrack.thumbnail} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            <div className="track-info" style={{ marginBottom: '32px' }}>
                                <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 8px 0', lineHeight: '1.3' }}>{currentTrack.title}</h1>
                                <p style={{ fontSize: '1.1rem', opacity: 0.6, margin: '0' }}>{currentTrack.channelTitle}</p>
                            </div>

                            <div className="scrubber" style={{ marginBottom: '16px' }}>
                                <IonRange
                                    min={0}
                                    max={duration}
                                    value={currentTime}
                                    onIonChange={e => seek(e.detail.value as number)}
                                    color="primary"
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.5 }}>
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            <div className="controls" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '40px' }}>
                                <IonButton fill="clear" onClick={() => previous()}>
                                    <IonIcon icon={playSkipBack} style={{ fontSize: '1.8rem' }} />
                                </IonButton>
                                <IonButton fill="clear" size="large" onClick={togglePlay} style={{ '--padding-start': '20px', '--padding-end': '20px' }}>
                                    <div style={{
                                        background: 'var(--ion-color-primary)',
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 15px rgba(var(--ion-color-primary-rgb), 0.4)'
                                    }}>
                                        <IonIcon icon={isPlaying ? pause : play} style={{ color: 'white', fontSize: '2.4rem' }} />
                                    </div>
                                </IonButton>
                                <IonButton fill="clear" onClick={() => next()}>
                                    <IonIcon icon={playSkipForward} style={{ fontSize: '1.8rem' }} />
                                </IonButton>
                            </div>

                            <div className="extra-controls" style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
                                <IonButton
                                    fill="clear"
                                    color="medium"
                                    onClick={(e) => setShowSpeedPopover({ show: true, event: e.nativeEvent })}
                                    style={{ display: 'flex', flexDirection: 'column', height: 'auto' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <IonIcon icon={speedometerOutline} style={{ fontSize: '1.4rem' }} />
                                        <span style={{ fontSize: '0.6rem', marginTop: '4px' }}>{playbackRate}x</span>
                                    </div>
                                </IonButton>
                                <IonButton
                                    fill="clear"
                                    color={sleepTimer ? "primary" : "medium"}
                                    onClick={(e) => setShowTimerPopover({ show: true, event: e.nativeEvent })}
                                    style={{ display: 'flex', flexDirection: 'column', height: 'auto' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <IonIcon icon={timeOutline} style={{ fontSize: '1.4rem' }} />
                                        <span style={{ fontSize: '0.6rem', marginTop: '4px' }}>{sleepTimer ? `${sleepTimer}m` : 'Timer'}</span>
                                    </div>
                                </IonButton>
                                <IonButton fill="clear" color={isFav ? "primary" : "medium"} onClick={handleToggleFavorite} style={{ display: 'flex', flexDirection: 'column', height: 'auto' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <IonIcon icon={isFav ? star : starOutline} style={{ fontSize: '1.4rem' }} />
                                        <span style={{ fontSize: '0.6rem', marginTop: '4px' }}>{isFav ? 'Saved' : 'Save'}</span>
                                    </div>
                                </IonButton>
                            </div>
                        </div>
                    )}

                    {activeTab === 'queue' && (
                        <div className="queue-view">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Up Next</h3>
                            <IonList lines="none">
                                {queue.map((track, index) => (
                                    <IonItem key={`${track.id}-${index}`} button style={{ '--padding-start': '0', marginBottom: '8px' }}>
                                        <IonThumbnail slot="start" style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden' }}>
                                            <img src={track.thumbnail} alt={track.title} style={{ objectFit: 'cover' }} />
                                        </IonThumbnail>
                                        <IonLabel>
                                            <h2 style={{ fontSize: '0.9rem', fontWeight: track.id === currentTrack.id ? '700' : '500' }}>
                                                {track.title}
                                            </h2>
                                            <p style={{ fontSize: '0.75rem' }}>{track.channelTitle}</p>
                                        </IonLabel>
                                        {track.id === currentTrack.id && <IonIcon icon={musicalNote} slot="end" color="primary" />}
                                    </IonItem>
                                ))}
                            </IonList>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="info-view">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>About this recording</h3>
                            <IonText color="medium">
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                    {currentTrack.description || 'No description available for this recording.'}
                                </p>
                            </IonText>
                        </div>
                    )}
                </div>

                <IonPopover
                    isOpen={showSpeedPopover.show}
                    event={showSpeedPopover.event}
                    onDidDismiss={() => setShowSpeedPopover({ show: false, event: undefined })}
                >
                    <IonList>
                        <IonListHeader>Playback Speed</IonListHeader>
                        {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                            <IonItem
                                key={rate}
                                button
                                onClick={() => { setPlaybackRate(rate); setShowSpeedPopover({ show: false, event: undefined }); }}
                                detail={false}
                            >
                                <IonLabel color={playbackRate === rate ? "primary" : "none"}>{rate}x</IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                </IonPopover>

                <IonPopover
                    isOpen={showTimerPopover.show}
                    event={showTimerPopover.event}
                    onDidDismiss={() => setShowTimerPopover({ show: false, event: undefined })}
                >
                    <IonList>
                        <IonListHeader>Sleep Timer</IonListHeader>
                        <IonItem button onClick={() => { setSleepTimer(null); setShowTimerPopover({ show: false, event: undefined }); }}>
                            <IonLabel color={sleepTimer === null ? "primary" : "none"}>Off</IonLabel>
                        </IonItem>
                        {[15, 30, 45, 60].map(mins => (
                            <IonItem
                                key={mins}
                                button
                                onClick={() => { setSleepTimer(mins); setShowTimerPopover({ show: false, event: undefined }); }}
                                detail={false}
                            >
                                <IonLabel color={sleepTimer === mins ? "primary" : "none"}>{mins} minutes</IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                </IonPopover>
            </IonContent>
        </IonPage>
    );
};

export default AudioPlayerPage;
