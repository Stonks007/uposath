
import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon
} from '@ionic/react';
import { ellipsisVertical, chevronForward } from 'ionicons/icons';
import { MalaService } from '../services/MalaService';
import AnapanasatiCard from '../components/sati/AnapanasatiCard';
import TripleGemNavCard from '../components/sati/TripleGemNavCard';
import EmptinessNavCard from '../components/sati/EmptinessNavCard';
import MantraNavCard from '../components/sati/MantraNavCard';
import { getUposathaStatus } from '../services/uposathaCalculator';
import { Observer } from '@ishubhamx/panchangam-js';
import { getSavedLocation } from '../services/locationManager';


const SatiPage: React.FC = () => {
    const [uposathaLabel, setUposathaLabel] = useState<string | null>(null);
    const [todayTotal, setTodayTotal] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);
    const [isUposatha, setIsUposatha] = useState(false);

    // Initial load
    useEffect(() => {
        const load = async () => {
            const loc = await getSavedLocation();
            const observer = loc ? new Observer(loc.latitude, loc.longitude, loc.altitude) : new Observer(24.7914, 85.0002, 111);
            const status = getUposathaStatus(new Date(), observer);

            setIsUposatha(status.isUposatha);
            if (status.isUposatha) {
                const icon = status.isFullMoon ? '🌕' : (status.isNewMoon ? '🌑' : '🌗');
                setUposathaLabel(`${icon} ${status.paliLabel || 'Uposatha'} Day — Practice Triple Gem Recollection`);
            }

            // Load Stats Summary
            const total = await MalaService.getTodayTotal();
            const stats = await MalaService.getStats();
            setTodayTotal(total);
            setStreak(stats.overall.currentStreak);
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
                    <div style={{
                        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                        border: '1px solid #FDE68A',
                        color: '#92400E',
                        padding: '16px',
                        borderRadius: '16px',
                        marginBottom: '24px',
                        textAlign: 'center',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.12)',
                        fontSize: '0.95rem',
                        lineHeight: '1.4'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>✨</span>
                        {uposathaLabel}
                    </div>
                )}

                {/* Triple Gem Recollection Card */}
                <TripleGemNavCard />

                {/* Emptiness Contemplation Card */}
                <EmptinessNavCard />

                {/* Custom Mantras Card */}
                <MantraNavCard />

                {/* Anapanasati Card */}
                <AnapanasatiCard />

                {/* Statistics Card */}
                <IonCard routerLink="/sati/stats" style={{
                    borderRadius: '16px',
                    margin: '16px 0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    background: 'var(--color-bg-card, #ffffff)',
                    overflow: 'hidden'
                }}>
                    <IonCardContent style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    fontSize: '1.8rem',
                                    width: '48px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--ion-color-primary-tint, #e0f2fe)',
                                    borderRadius: '50%'
                                }}>
                                    📈
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-primary, #111827)' }}>
                                        View Statistics
                                    </h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                                        Track your practice progress
                                    </p>
                                </div>
                            </div>
                            <IonIcon icon={chevronForward} color="medium" />
                        </div>
                    </IonCardContent>
                </IonCard>

                {/* Placeholder for future features */}
                {/* <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontStyle: 'italic' }}>
                     More mindfulness tools coming soon...
                 </div> */}

            </IonContent>
        </IonPage>
    );
};

export default SatiPage;
