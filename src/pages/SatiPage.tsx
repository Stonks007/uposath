
import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon
} from '@ionic/react';
import { ellipsisVertical, chevronForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AnapanasatiCard from '../components/sati/AnapanasatiCard';
import TripleGemNavCard from '../components/sati/TripleGemNavCard';
import EmptinessNavCard from '../components/sati/EmptinessNavCard';
import MantraNavCard from '../components/sati/MantraNavCard';
import { getUposathaStatus } from '../services/uposathaCalculator';
import { Observer } from '@ishubhamx/panchangam-js';
import { getSavedLocation } from '../services/locationManager';


const SatiPage: React.FC = () => {
    const history = useHistory();
    const [uposathaLabel, setUposathaLabel] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        const load = async () => {
            const loc = await getSavedLocation();
            const observer = loc ? new Observer(loc.latitude, loc.longitude, loc.altitude) : new Observer(24.7914, 85.0002, 111);
            const status = getUposathaStatus(new Date(), observer);

            if (status.isUposatha) {
                const icon = status.isFullMoon ? '🌕' : status.isNewMoon ? '🌑' : status.isChaturdashi ? '🌖' : '🌗';
                setUposathaLabel(`${icon} ${status.paliLabel || 'Uposatha'} Day — Practice Triple Gem Recollection`);
            }
        };
        load();
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Sati</IonTitle>
                    <IonButtons slot="end">
                        <IonButton routerLink="/settings">
                            <IonIcon icon={ellipsisVertical} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding">
                {/* Uposatha Banner */}
                {uposathaLabel && (
                    <div className="glass-card" style={{
                        padding: '16px',
                        marginBottom: '24px',
                        textAlign: 'center',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        fontSize: '0.95rem',
                        lineHeight: '1.4',
                        background: 'rgba(255, 198, 112, 0.15)',
                        borderColor: 'rgba(255, 198, 112, 0.3)',
                        color: 'var(--color-accent-primary)'
                    }}>
                        <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 8px rgba(255,198,112,0.6))' }}>✨</span>
                        {uposathaLabel}
                    </div>
                )}

                {/* Statistics Card — top of page */}
                <div className="glass-card" onClick={() => history.push('/sati/stats')} style={{
                    marginBottom: '24px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="icon-wrapper icon-wrapper--large" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            📈
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                View Statistics
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                Track your practice progress
                            </p>
                        </div>
                    </div>
                    <IonIcon icon={chevronForward} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>

                {/* Triple Gem Recollection Card */}
                <TripleGemNavCard />

                {/* Emptiness Contemplation Card */}
                <EmptinessNavCard />

                {/* Custom Mantras Card */}
                <MantraNavCard />

                {/* Anapanasati Card */}
                <AnapanasatiCard />

                {/* Placeholder for future features */}
                {/* <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontStyle: 'italic' }}>
                     More mindfulness tools coming soon...
                 </div> */}

            </IonContent>
        </IonPage>
    );
};

export default SatiPage;
