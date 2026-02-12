import React, { useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonLabel,
    useIonViewWillEnter,
    IonButtons,
    IonBackButton,
    IonIcon
} from '@ionic/react';
import { Observer } from '@ishubhamx/panchangam-js';
import { getUpcomingFestivals, type FestivalMatch, getTraditionColors } from '../services/buddhistFestivalService';
import { getSavedLocation } from '../services/locationManager';
import { calendarOutline, locationOutline, timeOutline, chevronForwardOutline } from 'ionicons/icons';
import './FestivalsPage.css';

const FestivalsPage: React.FC = () => {
    const [festivals, setFestivals] = useState<FestivalMatch[]>([]);
    const [locationName, setLocationName] = useState('Loading...');
    const [observer, setObserver] = useState(new Observer(24.7914, 85.0002, 111));

    useIonViewWillEnter(() => {
        loadData();
    });

    const loadData = async () => {
        const loc = await getSavedLocation();
        let currentObserver = observer;
        if (loc) {
            currentObserver = new Observer(loc.latitude, loc.longitude, loc.altitude);
            setObserver(currentObserver);
            setLocationName(loc.name);
        }

        const upcoming = getUpcomingFestivals(new Date(), currentObserver, 365);
        setFestivals(upcoming);
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/today" />
                    </IonButtons>
                    <IonTitle>Dharma Calendar</IonTitle>
                </IonToolbar>
                <IonToolbar color="translucent" style={{ '--background': 'transparent' }}>
                    <div className="ion-padding-horizontal" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
                        <IonIcon icon={locationOutline} color="primary" />
                        <IonLabel style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                            {locationName}
                        </IonLabel>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="festivals-container">
                {festivals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🗓️</div>
                        <h3>No Upcoming Festivals</h3>
                        <p>No major Buddhist events found in the next 365 days for this location.</p>
                    </div>
                ) : (
                    <div className="festivals-list">
                        {festivals.map((match, idx) => {
                            const colors = getTraditionColors(match.festival.tradition);
                            // Convert hex to rgb for rgba usage if needed, or use CSS variables
                            return (
                                <div
                                    key={idx}
                                    className="festival-card"
                                    onClick={() => window.location.href = `/day/${match.date.toISOString().split('T')[0]}`}
                                    style={{
                                        '--background': colors.background,
                                    } as React.CSSProperties}
                                >
                                    <div className="festival-card-content">
                                        <div className="festival-header">
                                            <div style={{ flex: 1 }}>
                                                <h2 className="festival-name" style={{ color: colors.primary }}>
                                                    {match.festival.name}
                                                </h2>
                                                {match.festival.region && (
                                                    <div style={{
                                                        fontSize: '0.7rem',
                                                        color: colors.primary,
                                                        opacity: 0.8,
                                                        fontWeight: 'bold',
                                                        letterSpacing: '0.05em',
                                                        textTransform: 'uppercase',
                                                        marginTop: '2px'
                                                    }}>
                                                        {match.festival.region}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="tradition-badge" style={{ background: colors.primary, color: colors.background }}>
                                                {match.festival.tradition}
                                            </span>
                                        </div>

                                        <div className="festival-date">
                                            <IonIcon icon={calendarOutline} style={{ color: colors.primary }} />
                                            <span style={{ color: colors.text }}>{match.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>

                                        <p className="festival-description" style={{ color: colors.text }}>
                                            {match.festival.description}
                                        </p>

                                        <div className="festival-footer">
                                            <div className="days-count" style={{ color: colors.primary }}>
                                                <IonIcon icon={timeOutline} />
                                                <span>{match.daysRemaining} <span className="days-label">days left</span></span>
                                            </div>
                                            <div className="view-details" style={{ color: colors.primary }}>
                                                <span>View Day</span>
                                                <IonIcon icon={chevronForwardOutline} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '6px',
                                        background: colors.primary
                                    }}></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default FestivalsPage;
