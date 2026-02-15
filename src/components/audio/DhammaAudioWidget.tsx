import React, { useState, useEffect } from 'react';
import {
    IonCard,
    IonCardContent,
    IonIcon,
    IonText,
    IonButton,
    IonProgressBar,
    IonSpinner
} from '@ionic/react';
import {
    play,
    pause,
    playSkipForward,
    playSkipBack,
    musicalNotes,
    chevronForward,
    alertCircle
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { DhammaAudio, VideoInfo, PlaybackState } from '../../plugins/dhamma-audio';
import './DhammaAudioWidget.css';

const DhammaAudioWidget: React.FC = () => {
    const history = useHistory();
    const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadState();

        const stateListener = DhammaAudio.addListener('playbackStateChanged', (state) => {
            setPlaybackState(state);
        });

        const progressListener = DhammaAudio.addListener('progressUpdate', (data) => {
            setPlaybackState(prev => prev ? { ...prev, position: data.position } : null);
        });

        return () => {
            stateListener.then(l => l.remove());
            progressListener.then(l => l.remove());
        };
    }, []);

    const loadState = async () => {
        try {
            const state = await DhammaAudio.getPlaybackState();
            setPlaybackState(state);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load playback state:', err);
            // If plugin not found or error, it might be in an empty state
            setLoading(false);
        }
    };

    const togglePlay = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playbackState) return;

        if (playbackState.isPlaying) {
            await DhammaAudio.pause();
        } else {
            await DhammaAudio.resume();
        }
    };

    const openLibrary = () => {
        history.push('/library');
    };

    const openPlayer = () => {
        history.push('/player');
    };

    if (loading) {
        return (
            <div className="audio-widget-skeleton glass-card">
                <IonSpinner name="crescent" color="primary" />
                <IonText>Initializing Audio...</IonText>
            </div>
        );
    }

    if (playbackState?.currentVideo) {
        const { currentVideo, isPlaying, position, duration } = playbackState;
        const progress = duration > 0 ? position / duration : 0;

        return (
            <IonCard className="audio-widget playing glass-card" onClick={openPlayer}>
                <div className="audio-widget__artwork" style={{ backgroundImage: `url(${currentVideo.thumbnailUrl})` }}>
                    <div className="audio-widget__overlay"></div>
                </div>
                <IonCardContent>
                    <div className="audio-widget__content">
                        <div className="audio-widget__info">
                            <IonText className="audio-widget__title">{currentVideo.title}</IonText>
                            <IonText color="medium" className="audio-widget__subtitle">{currentVideo.channelName}</IonText>
                        </div>
                        <div className="audio-widget__controls">
                            <IonButton fill="clear" onClick={togglePlay} className="play-button">
                                <IonIcon icon={isPlaying ? pause : play} />
                            </IonButton>
                        </div>
                    </div>
                    <IonProgressBar value={progress} color="primary" className="audio-widget__progress" />
                </IonCardContent>
            </IonCard>
        );
    }

    return (
        <IonCard className="audio-widget empty glass-card" onClick={openLibrary}>
            <IonCardContent>
                <div className="audio-widget__empty-content">
                    <div className="audio-widget__icon-wrapper">
                        <IonIcon icon={musicalNotes} color="secondary" />
                    </div>
                    <div className="audio-widget__empty-info">
                        <IonText className="audio-widget__title">DHAMMA AUDIO</IonText>
                        <IonText color="medium" className="audio-widget__subtitle">Recent uploads from Pañcasikha</IonText>
                    </div>
                    <IonIcon icon={chevronForward} color="medium" className="audio-widget__arrow" />
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export default DhammaAudioWidget;
