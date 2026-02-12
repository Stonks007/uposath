
import React, { useMemo, useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    useIonViewWillEnter
} from '@ionic/react';
import { useParams } from 'react-router';
import { Observer } from '@ishubhamx/panchangam-js';
import { getUposathaStatus } from '../services/uposathaCalculator';
import { checkFestival } from '../services/buddhistFestivalService';
import { buildTimelineData } from '../services/panchangTimeline';
import { computeHoras } from '../services/horaCalculator';
import { getGrahaCards } from '../services/grahaPositionService';
import { getSavedLocation } from '../services/locationManager';
import { formatSanskritDate } from '../services/timeUtils';
import PanchangTimeline from '../components/PanchangTimeline';
import SunMoonVisualization from '../components/SunMoonVisualization';
import HoraTable from '../components/HoraTable';
import GrahaGrid from '../components/GrahaGrid';

const DayDetailPage: React.FC = () => {
    const { dateStr } = useParams<{ dateStr: string }>();
    const [activeTab, setActiveTab] = useState('timeline');
    const [location, setLocation] = useState<any>(null);
    const [observer, setObserver] = useState(new Observer(24.7914, 85.0002, 111)); // Default: Gaya

    useIonViewWillEnter(() => {
        loadLocation();
    });

    const loadLocation = async () => {
        const loc = await getSavedLocation();
        if (loc) {
            setObserver(new Observer(loc.latitude, loc.longitude, loc.altitude));
            setLocation(loc);
        }
    };

    const date = useMemo(() => new Date(dateStr), [dateStr]);

    const data = useMemo(() => {
        // 1. Uposatha Status
        const status = getUposathaStatus(date, observer);

        // 2. Festival
        const festival = checkFestival(date, observer, status.panchangam);

        // 3. Timeline Data -- needs panchangam from status
        const timeline = buildTimelineData(status.panchangam);

        // 4. Horas
        const horas = computeHoras(date, observer);

        // 5. Grahas
        const grahas = getGrahaCards(status.panchangam);

        return { status, festival, timeline, horas, grahas };
    }, [date, observer]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/calendar" />
                    </IonButtons>
                    <IonTitle>{formatSanskritDate(date)}</IonTitle>
                </IonToolbar>
                <IonToolbar color="light">
                    <IonSegment
                        value={activeTab}
                        scrollable={true}
                        onIonChange={e => setActiveTab(e.detail.value as string)}
                    >
                        <IonSegmentButton value="timeline">
                            <IonLabel>Timeline</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="hora">
                            <IonLabel>Hora</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="graha">
                            <IonLabel>Graha</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="info">
                            <IonLabel>Info</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding">

                {/* Header Info */}
                <div className="text-center" style={{ marginBottom: '16px' }}>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--ion-color-primary)' }}>
                        {data.status.tithiName}
                    </h2>
                    <p className="text-sm text-gray-500">{data.status.paksha} Paksha</p>

                    {data.status.isUposatha ? (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: 'rgba(var(--ion-color-secondary-rgb), 0.2)',
                            borderRadius: '8px',
                            color: 'var(--ion-color-secondary-shade)',
                            fontWeight: 'bold'
                        }}>
                            {data.status.label}
                        </div>
                    ) : data.status.isOptional ? (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: 'rgba(var(--ion-color-primary-rgb), 0.1)',
                            borderRadius: '8px',
                            color: 'var(--ion-color-primary)',
                            fontWeight: 'bold'
                        }}>
                            {data.status.label}
                        </div>
                    ) : (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            borderRadius: '8px',
                            color: 'var(--ion-color-medium)',
                            fontSize: '0.8rem'
                        }}>
                            No Uposatha Day
                        </div>
                    )}

                    {data.festival && (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#FFF3E0',
                            borderRadius: '8px',
                            color: '#E65100',
                            fontWeight: 'bold',
                            border: '1px solid #FFB74D'
                        }}>
                            ☸️ {data.festival.name}
                        </div>
                    )}
                </div>

                {/* Tab Content */}
                {activeTab === 'timeline' && (
                    <>
                        <SunMoonVisualization
                            sunrise={data.status.sunrise}
                            nextSunrise={data.timeline.nextSunrise}
                            sunset={data.status.sunset}
                            moonrise={data.status.panchangam.moonrise}
                            moonset={data.status.panchangam.moonset}
                            location={location}
                        />
                        <PanchangTimeline data={data.timeline} timezone={location?.timezone} />
                    </>
                )}

                {activeTab === 'hora' && (
                    <HoraTable horas={data.horas} timezone={location?.timezone} />
                )}

                {activeTab === 'graha' && (
                    <GrahaGrid grahas={data.grahas} />
                )}

                {activeTab === 'info' && (
                    <div className="glass-card" style={{ padding: '16px' }}>
                        <h3>About this Day</h3>
                        <p><strong>Tithi:</strong> {data.status.tithiNumber} - {data.status.tithiName}</p>
                        <p><strong>Uposatha:</strong> {data.status.isUposatha ? 'Yes' : 'No'}</p>
                        {data.status.paliLabel && <p><strong>Pali Name:</strong> {data.status.paliLabel}</p>}

                        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9rem', color: 'var(--ion-color-dark)' }}>Terminology & Calculations</h4>
                            <div style={{ fontSize: '0.8rem', opacity: 0.85, lineHeight: '1.5' }}>
                                <p style={{ marginBottom: '10px' }}>
                                    <strong>• Kshaya (Skipped Tithi):</strong> A lunar day is called <i>Kshaya</i> when its duration is shorter than usual (due to the moon's faster orbital speed relative to the sun), causing it to begin after one sunrise and end before the next. Because the calendar follows <i>Udaya Tithi</i> (the tithi at sunrise), this day is "skipped" in the standard count but remains an optional day for Uposatha observance.
                                </p>
                                <p style={{ marginBottom: 0 }}>
                                    <strong>• Vridhi (Extended Tithi):</strong> A lunar day is called <i>Vridhi</i> when its duration is longer than the interval between two sunrises. This results in the same tithi being present at two consecutive sunrises. Liturgically, the first day is typically the primary observance, while the second day is treated as an optional or secondary "extended" day.
                                </p>
                            </div>
                        </div>

                        {data.festival && (
                            <div style={{ marginTop: '16px' }}>
                                <h4>{data.festival.name}</h4>
                                <p>{data.festival.description}</p>
                                <p><em>Tradition: {data.festival.tradition}</em></p>
                            </div>
                        )}
                    </div>
                )}

            </IonContent>
        </IonPage>
    );
};

export default DayDetailPage;
