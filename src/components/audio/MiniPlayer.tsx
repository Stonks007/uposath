import React from 'react';
import {
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonLabel,
    IonProgressBar,
    IonThumbnail,
    IonItem
} from '@ionic/react';
import { play, pause as pauseIcon, playSkipForward, playSkipBack, closeCircleOutline } from 'ionicons/icons';
import { useAudio } from '../../context/AudioContext';

import { useHistory } from 'react-router-dom';

const MiniPlayer: React.FC = () => {
    const history = useHistory();
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        next,
        currentTime,
        duration,
        pause
    } = useAudio();

    if (!currentTrack) return null;

    const progress = duration > 0 ? currentTime / duration : 0;

    return (
        <div
            onClick={() => history.push('/player')}
            style={{
                position: 'fixed',
                bottom: 'var(--ion-safe-area-bottom, 0)',
                width: '100%',
                zIndex: 1000,
                background: 'var(--ion-color-light)',
                borderTop: '1px solid rgba(var(--ion-color-step-200-rgb), 0.5)',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
                cursor: 'pointer'
            }}
        >
            <IonProgressBar value={progress} color="primary" style={{ height: '2px' }} />
            <IonItem lines="none" className="ion-no-padding" style={{ '--background': 'transparent' }}>
                <IonThumbnail slot="start" style={{ width: '40px', height: '40px', margin: '8px' }}>
                    <img alt={currentTrack.title} src={currentTrack.thumbnail} style={{ borderRadius: '4px' }} />
                </IonThumbnail>
                <IonLabel className="ion-text-wrap" style={{ margin: '0' }}>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: '500', margin: '0 0 2px 0' }}>{currentTrack.title}</h2>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '0' }}>{currentTrack.channelTitle}</p>
                </IonLabel>
                <IonButtons slot="end">
                    <IonButton onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                        <IonIcon icon={isPlaying ? pauseIcon : play} />
                    </IonButton>
                    <IonButton onClick={(e) => { e.stopPropagation(); next(); }}>
                        <IonIcon icon={playSkipForward} />
                    </IonButton>
                </IonButtons>
            </IonItem>
        </div>
    );
};

export default MiniPlayer;
