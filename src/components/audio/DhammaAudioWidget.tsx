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
    musicalNotes,
    chevronForward
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { DhammaAudio, VideoInfo, PlaybackState } from '../../plugins/dhamma-audio';
import { getDefaultChannel } from '../../services/channelManager';
import './DhammaAudioWidget.css';

const decodeTitle = (text: string): string => {
    if (!text) return '';
    try {
        return text
            .replace(/\\u0026/g, '&')
            .replace(/\\u003c/g, '<')
            .replace(/\\u003e/g, '>')
            .replace(/\\u0022/g, '"')
            .replace(/\\u0027/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    } catch {
        return text;
    }
};

const DhammaAudioWidget: React.FC = () => {
    const history = useHistory();
    const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
    const [featuredVideo, setFeaturedVideo] = useState<VideoInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        loadState();

        const stateListener = DhammaAudio.addListener('playbackStateChanged', (state) => {
            setPlaybackState(state);
            setIsToggling(false);
        });

        const progressListener = DhammaAudio.addListener('progressUpdate', (data) => {
            setPlaybackState(prev => prev ? { ...prev, position: data.position, duration: data.duration } : null);
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

            // If nothing is playing, find a featured video from default channel
            if (!state.currentVideo) {
                const defChannel = await getDefaultChannel();
                if (defChannel) {
                    const result = await DhammaAudio.getChannelPage({ channelId: defChannel.id });
                    const firstVideo = result.sections?.[0]?.videos?.[0];
                    if (firstVideo) {
                        setFeaturedVideo(firstVideo);
                    }
                }
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to load playback state or featured content:', err);
            setLoading(false);
        }
    };

    const startFeaturedPlay = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (featuredVideo) {
            setIsToggling(true);
            await DhammaAudio.playVideo({ video: featuredVideo });
            history.push('/player');
        }
    };

    const togglePlay = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!playbackState || isToggling) return;

        setIsToggling(true);
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
                                {isToggling ? (
                                    <IonSpinner name="crescent" className="spinner-small" />
                                ) : (
                                    <IonIcon icon={isPlaying ? pause : play} />
                                )}
                            </IonButton>
                        </div>
                    </div>
                    <div className="audio-widget__footer">
                        <IonProgressBar value={progress} color="primary" className="audio-widget__progress" />
                    </div>
                </IonCardContent>
            </IonCard>
        );
    }

    return (
        <IonCard className={`audio-widget empty glass-card ${featuredVideo ? 'has-featured' : ''}`} onClick={featuredVideo ? openPlayer : openLibrary}>
            {featuredVideo && (
                <div className="audio-widget__artwork" style={{ backgroundImage: `url(${featuredVideo.thumbnailUrl})` }}>
                    <div className="audio-widget__overlay"></div>
                </div>
            )}
            <IonCardContent>
                <div className="audio-widget__content">
                    {featuredVideo && (
                        <div className="audio-widget__controls">
                            <IonButton fill="clear" onClick={startFeaturedPlay} className="play-button primary-button">
                                {isToggling ? (
                                    <IonSpinner name="crescent" className="spinner-small" />
                                ) : (
                                    <IonIcon icon={play} />
                                )}
                            </IonButton>
                        </div>
                    )}

                    {!featuredVideo && (
                        <div className="icon-wrapper icon-wrapper--medium icon-wrapper--primary">
                            <IonIcon icon={musicalNotes} color="primary" />
                        </div>
                    )}

                    <div className="audio-widget__info">
                        <IonText className="audio-widget__title">
                            {featuredVideo ? decodeTitle(featuredVideo.title) : 'DHAMMA AUDIO'}
                        </IonText>
                        <IonText color="medium" className="audio-widget__subtitle">
                            {featuredVideo ? featuredVideo.channelName : 'Recent uploads from Pañcasikha'}
                        </IonText>
                    </div>

                    <IonIcon icon={chevronForward} color="medium" className="audio-widget__arrow" />
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export default DhammaAudioWidget;
