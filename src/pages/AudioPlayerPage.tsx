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
    star,
    starOutline,
    shareSocialOutline,
    timeOutline,
    speedometerOutline,
    musicalNote,
    textOutline
} from 'ionicons/icons';
import { useAudio } from '../context/useAudio';
import { LocalAudioDataService } from '../services/audio/LocalAudioDataService';
import { AudioService } from '../services/audio/AudioService';
import './AudioPlayerPage.css';

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

    const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'queue' | 'info'>('player');
    const [isFav, setIsFav] = useState(false);
    const [lyrics, setLyrics] = useState<string>('');
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [showSpeedPopover, setShowSpeedPopover] = useState<{ show: boolean, event: any }>({ show: false, event: undefined });
    const [showTimerPopover, setShowTimerPopover] = useState<{ show: boolean, event: any }>({ show: false, event: undefined });

    useEffect(() => {
        if (currentTrack) {
            LocalAudioDataService.isFavorite(currentTrack.id).then(setIsFav);

            // Fetch lyrics
            setLyrics('');
            setIsLoadingLyrics(true);
            AudioService.getLyrics(currentTrack.id)
                .then(l => setLyrics(l))
                .catch(err => console.error('Failed to load lyrics', err))
                .finally(() => setIsLoadingLyrics(false));

            // Reset to player tab on new track usually
            if (activeTab === 'info') setActiveTab('player');
        }
    }, [currentTrack?.id]);

    const handleToggleFavorite = async () => {
        if (currentTrack) {
            const nowFav = await LocalAudioDataService.toggleFavorite(currentTrack);
            setIsFav(nowFav);
        }
    };

    if (!currentTrack) {
        return (
            <IonPage>
                <IonHeader className="ion-no-border" style={{ '--background': 'transparent' } as React.CSSProperties}>
                    <IonToolbar style={{ '--background': 'transparent' } as React.CSSProperties}>
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="/library" color="light" />
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding ion-text-center" style={{ '--background': '#121212' } as React.CSSProperties}>
                    <div style={{ marginTop: '40%', color: 'white' }}>
                        <IonIcon icon={musicalNote} style={{ fontSize: '4rem', opacity: 0.2 }} />
                        <p>No track is currently playing.</p>
                        <IonButton routerLink="/library" color="light" fill="outline">Browse Library</IonButton>
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
            {/* Blurred Background Layer */}
            <div
                className="player-background"
                style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
            />

            <IonHeader className="ion-no-border" style={{ position: 'relative', zIndex: 10 }}>
                <IonToolbar style={{ '--background': 'transparent', '--color': 'white' } as React.CSSProperties}>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/library" color="light" text="Back" />
                    </IonButtons>
                    <IonTitle style={{ fontSize: '0.9rem', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
                        NOW PLAYING
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton color="light">
                            <IonIcon icon={shareSocialOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding" style={{ '--background': 'transparent' } as React.CSSProperties}>
                <div style={{ padding: '0 8px', height: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Tabs / Segment */}
                    <div style={{ padding: '0 16px', marginBottom: '16px' }}>
                        <IonSegment
                            value={activeTab}
                            onIonChange={e => setActiveTab(e.detail.value as any)}
                            mode="ios"
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                '--background-checked': 'rgba(255,255,255,0.3)',
                                '--color-checked': 'white',
                                '--color': 'rgba(255,255,255,0.6)'
                            } as React.CSSProperties}
                        >
                            <IonSegmentButton value="player">
                                <IonLabel>Player</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="lyrics">
                                <IonLabel>Lyrics</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="queue">
                                <IonLabel>Up Next</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="info">
                                <IonLabel>Info</IonLabel>
                            </IonSegmentButton>
                        </IonSegment>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {activeTab === 'player' && (
                            <div className="player-view">
                                <div className="artwork-container">
                                    <img src={currentTrack.thumbnail} alt={currentTrack.title} />
                                </div>

                                <div className="track-info">
                                    <h1 className="track-title">{currentTrack.title}</h1>
                                    <p className="track-artist">{currentTrack.channelTitle}</p>
                                </div>

                                <div className="scrubber">
                                    <IonRange
                                        min={0}
                                        max={isNaN(duration) || !isFinite(duration) ? 100 : duration}
                                        value={currentTime}
                                        onIonChange={e => {
                                            if (isFinite(duration)) seek(e.detail.value as number);
                                        }}
                                        disabled={!isFinite(duration) || duration === 0}
                                    />
                                    <div className="time-display">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{(isNaN(duration) || !isFinite(duration)) ? '--:--' : formatTime(duration)}</span>
                                    </div>
                                </div>

                                <div className="controls">
                                    <IonButton fill="clear" onClick={() => previous()} color="light">
                                        <IonIcon icon={playSkipBack} size="large" />
                                    </IonButton>
                                    <div className="play-button-container" onClick={togglePlay}>
                                        <IonIcon icon={isPlaying ? pause : play} />
                                    </div>
                                    <IonButton fill="clear" onClick={() => next()} color="light">
                                        <IonIcon icon={playSkipForward} size="large" />
                                    </IonButton>
                                </div>

                                <div className="extra-controls">
                                    <IonButton
                                        fill="clear"
                                        onClick={(e) => setShowSpeedPopover({ show: true, event: e.nativeEvent })}
                                    >
                                        <div className="extra-btn-content">
                                            <IonIcon icon={speedometerOutline} style={{ fontSize: '1.4rem', color: 'white' }} />
                                            <span className="extra-label" style={{ color: 'white' }}>{playbackRate}x</span>
                                        </div>
                                    </IonButton>
                                    <IonButton
                                        fill="clear"
                                        onClick={(e) => setShowTimerPopover({ show: true, event: e.nativeEvent })}
                                    >
                                        <div className="extra-btn-content">
                                            <IonIcon icon={timeOutline} style={{ fontSize: '1.4rem', color: sleepTimer ? '#70e000' : 'white' }} />
                                            <span className="extra-label" style={{ color: sleepTimer ? '#70e000' : 'white' }}>{sleepTimer ? `${sleepTimer}m` : 'Timer'}</span>
                                        </div>
                                    </IonButton>
                                    <IonButton
                                        fill="clear"
                                        onClick={() => setActiveTab('lyrics')}
                                    >
                                        <div className="extra-btn-content">
                                            <IonIcon icon={textOutline} style={{ fontSize: '1.4rem', color: 'white' }} />
                                            <span className="extra-label" style={{ color: 'white' }}>Lyrics</span>
                                        </div>
                                    </IonButton>
                                    <IonButton
                                        fill="clear"
                                        onClick={handleToggleFavorite}
                                    >
                                        <div className="extra-btn-content">
                                            <IonIcon icon={isFav ? star : starOutline} style={{ fontSize: '1.4rem', color: isFav ? '#ffd60a' : 'white' }} />
                                            <span className="extra-label" style={{ color: isFav ? '#ffd60a' : 'white' }}>{isFav ? 'Saved' : 'Save'}</span>
                                        </div>
                                    </IonButton>
                                </div>
                            </div>
                        )}

                        {activeTab === 'lyrics' && (
                            <div className="lyrics-view">
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Lyrics</h3>
                                {isLoadingLyrics ? (
                                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                        <p style={{ opacity: 0.7 }}>Loading lyrics...</p>
                                    </div>
                                ) : lyrics ? (
                                    <div className="lyrics-text">
                                        {lyrics}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.7 }}>
                                        <IonIcon icon={textOutline} style={{ fontSize: '3rem', opacity: 0.5 }} />
                                        <p>No lyrics available for this track.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'queue' && (
                            <div className="queue-view">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Up Next</h3>
                                <IonList style={{ background: 'transparent' }}>
                                    {queue.map((track: any, index: number) => (
                                        <IonItem key={`${track.id}-${index}`} button detail={false} lines="none" style={{ '--padding-start': '0', marginBottom: '8px', '--background': 'transparent' } as React.CSSProperties}>
                                            <IonThumbnail slot="start" style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden' }}>
                                                <img src={track.thumbnail} alt={track.title} style={{ objectFit: 'cover' }} />
                                            </IonThumbnail>
                                            <IonLabel style={{ color: 'white' }}>
                                                <h2 style={{ fontSize: '0.9rem', fontWeight: track.id === currentTrack.id ? '700' : '500', color: track.id === currentTrack.id ? '#70e000' : 'white' }}>
                                                    {track.title}
                                                </h2>
                                                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{track.channelTitle}</p>
                                            </IonLabel>
                                            {track.id === currentTrack.id && <IonIcon icon={musicalNote} slot="end" color="success" />}
                                        </IonItem>
                                    ))}
                                </IonList>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="info-view">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>About this recording</h3>
                                <IonText>
                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', opacity: 0.9, color: 'white' }}>
                                        {currentTrack.description || 'No description available for this recording.'}
                                    </p>
                                </IonText>

                                <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.7rem', color: 'white' }}>
                                    <strong>Debug Info:</strong>
                                    <div>State Duration: {duration}</div>
                                    <div>Current Time: {currentTime.toFixed(2)}</div>
                                    <div>Track Duration: {currentTrack.duration}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <IonPopover
                    isOpen={showSpeedPopover.show}
                    event={showSpeedPopover.event}
                    onDidDismiss={() => setShowSpeedPopover({ show: false, event: undefined })}
                    style={{ '--background': '#222', '--color': 'white' } as React.CSSProperties}
                >
                    <IonList style={{ background: '#222' }}>
                        <IonListHeader style={{ color: 'white' }}>Playback Speed</IonListHeader>
                        {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                            <IonItem
                                key={rate}
                                button
                                onClick={() => { setPlaybackRate(rate); setShowSpeedPopover({ show: false, event: undefined }); }}
                                detail={false}
                                style={{ '--background': '#222', '--color': 'white' } as React.CSSProperties}
                            >
                                <IonLabel color={playbackRate === rate ? "primary" : undefined}>{rate}x</IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                </IonPopover>

                <IonPopover
                    isOpen={showTimerPopover.show}
                    event={showTimerPopover.event}
                    onDidDismiss={() => setShowTimerPopover({ show: false, event: undefined })}
                    style={{ '--background': '#222', '--color': 'white' } as React.CSSProperties}
                >
                    <IonList style={{ background: '#222' }}>
                        <IonListHeader style={{ color: 'white' }}>Sleep Timer</IonListHeader>
                        <IonItem button onClick={() => { setSleepTimer(null); setShowTimerPopover({ show: false, event: undefined }); }} style={{ '--background': '#222', '--color': 'white' } as React.CSSProperties}>
                            <IonLabel color={sleepTimer === null ? "primary" : undefined}>Off</IonLabel>
                        </IonItem>
                        {[15, 30, 45, 60].map(mins => (
                            <IonItem
                                key={mins}
                                button
                                onClick={() => { setSleepTimer(mins); setShowTimerPopover({ show: false, event: undefined }); }}
                                detail={false}
                                style={{ '--background': '#222', '--color': 'white' } as React.CSSProperties}
                            >
                                <IonLabel color={sleepTimer === mins ? "primary" : undefined}>{mins} minutes</IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                </IonPopover>
            </IonContent>
        </IonPage>
    );
};

export default AudioPlayerPage;
