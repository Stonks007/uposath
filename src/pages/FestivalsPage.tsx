
import React, { useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonItemDivider,
    useIonViewWillEnter
} from '@ionic/react';
import { Observer } from '@ishubhamx/panchangam-js';
import { getUpcomingFestivals, type FestivalMatch } from '../services/buddhistFestivalService';
import { getSavedLocation } from '../services/locationManager';

const FestivalsPage: React.FC = () => {
    const [festivals, setFestivals] = useState<FestivalMatch[]>([]);
    const [locationName, setLocationName] = useState('Loading...');

    // TODO: Global state for observer
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
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Upcoming Festivals</IonTitle>
                </IonToolbar>
                <IonToolbar color="light">
                    <IonLabel className="ion-padding-start text-xs">📍 {locationName}</IonLabel>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonList>
                    {festivals.length === 0 && (
                        <IonItem>
                            <IonLabel>No festivals found in next 365 days.</IonLabel>
                        </IonItem>
                    )}

                    {festivals.map((match, idx) => {
                        const isNext = idx === 0;
                        return (
                            <IonItem
                                key={idx}
                                routerLink={`/day/${match.date.toISOString().split('T')[0]}`}
                                lines={isNext ? 'full' : 'inset'}
                                style={isNext ? { '--background': '#FFF3E0' } : {}}
                            >
                                <IonLabel>
                                    <h2 style={{ fontWeight: 'bold', color: 'var(--festival-color)' }}>{match.festival.name}</h2>
                                    <p>{match.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>{match.festival.description}</p>
                                </IonLabel>
                                <IonNote slot="end" color="secondary" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    {match.daysRemaining} days
                                </IonNote>
                            </IonItem>
                        );
                    })}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default FestivalsPage;
