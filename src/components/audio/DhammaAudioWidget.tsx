import React, { useState, useEffect } from 'react';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonText,
    IonThumbnail,
    IonItem,
    IonLabel,
    IonSkeletonText
} from '@ionic/react';
import { play, pause, musicalNotesOutline, chevronForwardOutline } from 'ionicons/icons';
import { useAudio } from '../../context/AudioContext';
import { LocalAudioDataService } from '../../services/audio/LocalAudioDataService';
import { AudioTrack } from '../../types/audio/AudioTypes';

const DhammaAudioWidget: React.FC = () => {
    const { currentTrack, isPlaying, togglePlay } = useAudio();
    const [recentTrack, setRecentTrack] = useState<AudioTrack | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRecent = async () => {
            const history = await LocalAudioDataService.getHistory();
            if (history.length > 0) {
                setRecentTrack(history[0].track);
            }
            setLoading(false);
        };
        loadRecent();
    }, [currentTrack]);

    const activeTrack = currentTrack || recentTrack;

    return (
        <IonCard className="dhamma-audio-widget" style={{ margin: '16px', borderRadius: '16px', overflow: 'hidden' }}>
            <IonCardHeader style={{ padding: '12px 16px', borderBottom: '1px solid rgba(var(--ion-color-step-200-rgb), 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <IonCardTitle style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                        <IonIcon icon={musicalNotesOutline} style={{ marginRight: '8px', color: 'var(--ion-color-primary)' }} />
                        DHAMMA AUDIO
                    </IonCardTitle>
                    <IonButton fill="clear" size="small" routerLink="/library" style={{ fontSize: '0.8rem', '--padding-end': '0' }}>
                        See All
                        <IonIcon icon={chevronForwardOutline} slot="end" />
                    </IonButton>
                </div>
            </IonCardHeader>
            <IonCardContent style={{ padding: '0' }}>
                {loading ? (
                    <IonItem lines="none" style={{ '--background': 'transparent' }}>
                        <IonThumbnail slot="start">
                            <IonSkeletonText animated style={{ borderRadius: '8px' }} />
                        </IonThumbnail>
                        <IonLabel>
                            <IonSkeletonText animated style={{ width: '80%' }} />
                            <IonSkeletonText animated style={{ width: '50%' }} />
                        </IonLabel>
                    </IonItem>
                ) : activeTrack ? (
                    <IonItem lines="none" style={{ '--background': 'transparent', padding: '8px 0' }}>
                        <IonThumbnail slot="start" style={{ width: '60px', height: '60px', marginLeft: '16px' }}>
                            <img alt={activeTrack.title} src={activeTrack.thumbnail} style={{ borderRadius: '8px', objectFit: 'cover' }} />
                        </IonThumbnail>
                        <IonLabel className="ion-text-wrap" style={{ margin: '0 8px' }}>
                            <h2 style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '4px' }}>{activeTrack.title}</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{activeTrack.channelTitle}</p>
                        </IonLabel>
                        <IonButton
                            slot="end"
                            fill="clear"
                            size="large"
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            style={{ '--padding-start': '0', '--padding-end': '16px' }}
                        >
                            <IonIcon icon={isPlaying && currentTrack?.id === activeTrack.id ? pause : play} style={{ fontSize: '2rem' }} />
                        </IonButton>
                    </IonItem>
                ) : (
                    <div style={{ padding: '24px', textAlign: 'center' }}>
                        <IonText color="medium">
                            <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>No recently played dhamma.</p>
                        </IonText>
                        <IonButton fill="outline" size="small" routerLink="/library" style={{ borderRadius: '8px' }}>
                            Explore Library
                        </IonButton>
                    </div>
                )}
            </IonCardContent>
        </IonCard>
    );
};

export default DhammaAudioWidget;
