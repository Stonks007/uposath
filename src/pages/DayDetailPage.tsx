
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
import { getKundli } from '@ishubhamx/panchangam-js';
import KundaliChart from '../components/KundaliChart';
import { getSavedLocation } from '../services/locationManager';
import { getPanchangam } from '../services/panchangamService';
import { formatSanskritDate } from '../services/timeUtils';
import PanchangTimeline from '../components/PanchangTimeline';
import SunMoonVisualization from '../components/SunMoonVisualization';
import HoraTable from '../components/HoraTable';
import GrahaGrid from '../components/GrahaGrid';
import ObservanceActionCard from '../components/uposatha/ObservanceActionCard';

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
        // 1. Uposatha Status (Anchored to the date)
        const status = getUposathaStatus(date, observer);

        // 2. Festival
        const festival = checkFestival(date, observer, status.panchangam);

        // 3. Timeline Data -- needs panchangam from status
        const timeline = buildTimelineData(status.panchangam);

        // 4. Horas
        const horas = computeHoras(date, observer);

        // 5. Determine the "Calculation Moment" for Kundali & Grahas
        // If the date is TODAY in local time, use "now"
        // Otherwise use "sunrise" of that day.
        const today = new Date();
        const isToday = date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

        const momentDate = isToday ? today : (status.sunrise || date);

        // 6. Grahas (Dynamic for the moment)
        // We get a fresh panchangam for the exact moment to ensure accurate sub-day positions
        const momentPanchangam = getPanchangam(momentDate, observer);
        const grahas = getGrahaCards(momentPanchangam);

        // 7. Kundali
        const kundli = getKundli(momentDate, observer);

        return { status, festival, timeline, horas, grahas, kundli, momentDate };
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

                {/* Observance Action Card */}
                {(data.status.isUposatha || data.status.isOptional) && (
                    <ObservanceActionCard
                        date={date}
                        moonPhase={data.status.isFullMoon ? 'full' : data.status.isNewMoon ? 'new' : 'quarter'}
                    />
                )}

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
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '16px', opacity: 0.7, fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--ion-color-medium)' }}>Positions calculated for: </span>
                            <span style={{ fontWeight: 'bold', color: 'var(--ion-color-primary)' }}>
                                {data.momentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <KundaliChart
                            houses={data.kundli.houses}
                            ascendantRashi={data.kundli.ascendant.rashi}
                        />
                        <GrahaGrid grahas={data.grahas} />
                    </>
                )}

                {activeTab === 'info' && (
                    <div style={{ padding: '8px 0' }}>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {/* General Stats Card */}
                            <div style={{
                                background: 'var(--color-bg-card)',
                                borderRadius: '20px',
                                padding: '20px',
                                border: '1px solid var(--color-border)'
                            }}>
                                <h3 className="text-lg font-bold" style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-accent-primary)' }}>Day Details</h3>

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: '1.2rem', width: '32px', textAlign: 'center' }}>🌙</div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tithi</div>
                                            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{data.status.tithiNumber} — {data.status.tithiName}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: '1.2rem', width: '32px', textAlign: 'center' }}>⚖️</div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paksha</div>
                                            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{data.status.paksha} Paksha</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontSize: '1.2rem', width: '32px', textAlign: 'center' }}>{data.status.isUposatha ? '✅' : '⚪'}</div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uposatha</div>
                                            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{data.status.isUposatha ? 'Yes' : 'No'}</div>
                                        </div>
                                    </div>

                                    {data.status.paliLabel && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ fontSize: '1.2rem', width: '32px', textAlign: 'center' }}>🏛️</div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pali Name</div>
                                                <div style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{data.status.paliLabel}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Festival Info */}
                            {data.festival && (
                                <div style={{
                                    background: 'var(--color-festival)',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: 'var(--shadow-lg)'
                                }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'white', fontWeight: '800' }}>✨ {data.festival.name}</h3>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: '1.6' }}>{data.festival.description}</p>
                                    <div style={{
                                        marginTop: '16px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: 'rgba(255,255,255,0.8)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Tradition: {data.festival.tradition}
                                    </div>
                                </div>
                            )}

                            {/* Terminology Card */}
                            <div style={{
                                background: 'var(--glass-bg)',
                                backdropFilter: 'var(--glass-backdrop)',
                                borderRadius: '20px',
                                padding: '20px',
                                border: '1px dashed var(--color-border)'
                            }}>
                                <h4 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.9rem', color: 'var(--color-accent-primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}> Calculations Reference</h4>
                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div>
                                        <h5 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>• Kshaya <span style={{ fontWeight: 'normal', opacity: 0.6 }}>(Skipped Tithi)</span></h5>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                                            Occurs when a lunar day begins and ends between two consecutive sunrises. It's skipped in the standard count but remains an optional day for practice.
                                        </p>
                                    </div>
                                    <div>
                                        <h5 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>• Vridhi <span style={{ fontWeight: 'normal', opacity: 0.6 }}>(Extended Tithi)</span></h5>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                                            Occurs when a lunar day is present at two consecutive sunrises. The first day is primary, while the second is secondary.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </IonContent>
        </IonPage>
    );
};

export default DayDetailPage;
