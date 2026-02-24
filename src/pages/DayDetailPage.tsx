
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
import { checkFestival, getTraditionColors } from '../services/buddhistFestivalService';
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
                <div className="text-center" style={{
                    marginBottom: '28px',
                    paddingTop: '12px'
                }}>
                    <div style={{
                        fontSize: '0.7rem',
                        fontWeight: '900',
                        color: 'var(--color-text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        marginBottom: '8px',
                        opacity: 0.8
                    }}>
                        {date.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                    <h2 className="text-3xl font-black" style={{
                        color: 'var(--ion-color-primary)',
                        lineHeight: '1',
                        margin: '12px 0'
                    }}>
                        {data.status.tithiName}
                    </h2>
                    <p className="text-xs" style={{
                        color: 'var(--color-text-secondary)',
                        fontWeight: '800',
                        marginTop: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        opacity: 0.7
                    }}>
                        {data.status.panchangam.masa.isAdhika ? 'Adhika ' : ''}{data.status.panchangam.masa.name} Masa • {data.status.paksha} Paksha
                    </p>

                    {data.status.isUposatha ? (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'var(--glass-backdrop)',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--ion-color-primary)',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-md)'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: '4px',
                                background: 'var(--ion-color-primary)'
                            }} />
                            {data.status.label}
                        </div>
                    ) : data.status.isOptional ? (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px 16px',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'var(--glass-backdrop)',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--color-text-secondary)',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: '4px',
                                background: 'var(--color-text-secondary)',
                                opacity: 0.5
                            }} />
                            {data.status.label}
                        </div>
                    ) : (
                        <div style={{
                            marginTop: '16px',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            — Ordinary Day —
                        </div>
                    )}

                    {data.festival && (
                        <div style={{
                            marginTop: '16px',
                            padding: '16px',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'var(--glass-backdrop)',
                            borderRadius: '20px',
                            border: '1px solid var(--glass-border)',
                            boxShadow: 'var(--shadow-lg)',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            {/* Tradition Accent line */}
                            <div style={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: '4px',
                                background: getTraditionColors(data.festival.tradition).primary
                            }} />

                            <span style={{ fontSize: '1.5rem' }}>☸️</span>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{
                                    color: getTraditionColors(data.festival.tradition).primary,
                                    fontSize: '0.7rem',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>
                                    {data.festival.tradition} Festival
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                    {data.festival.name}
                                </h3>
                            </div>
                        </div>
                    )}
                </div>

                {/* Observance Action Card */}
                {(data.status.isUposatha || (data.status.isOptional && !data.status.isVridhi)) && (
                    <ObservanceActionCard
                        date={date}
                        moonPhase={
                            data.status.isFullMoon ? 'full'
                                : data.status.isNewMoon ? 'new'
                                    : data.status.isChaturdashi ? 'chaturdashi'
                                        : 'quarter'
                        }
                        paksha={data.status.paksha as 'Shukla' | 'Krishna'}
                        tithi={`${data.status.paksha}: ${data.status.tithiName}`}
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
                            {/* Day Details Card */}
                            <div style={{
                                background: 'var(--glass-bg)',
                                backdropFilter: 'var(--glass-backdrop)',
                                borderRadius: '24px',
                                padding: '24px',
                                border: '1px solid var(--glass-border)',
                                boxShadow: 'var(--shadow-lg)'
                            }}>
                                <h3 style={{
                                    marginTop: 0,
                                    marginBottom: '24px',
                                    fontSize: '0.75rem',
                                    fontWeight: '900',
                                    color: 'var(--color-accent-primary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    opacity: 0.8
                                }}>
                                    Technical Parameters
                                </h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-tertiary)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                            <span>🌙</span> Tithi
                                        </div>
                                        <div style={{ fontWeight: '800', color: 'var(--color-text-primary)' }}>{data.status.tithiNumber} — {data.status.tithiName}</div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-tertiary)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                            <span>⚖️</span> Paksha
                                        </div>
                                        <div style={{ fontWeight: '800', color: 'var(--color-text-primary)' }}>{data.status.paksha} Paksha</div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-tertiary)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                            <span>📅</span> Masa
                                        </div>
                                        <div style={{ fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                            {data.status.panchangam.masa.isAdhika ? 'Adhika ' : ''}{data.status.panchangam.masa.name}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-tertiary)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                            <span>☸️</span> Uposatha
                                        </div>
                                        <div style={{ fontWeight: '800', color: data.status.isUposatha ? 'var(--ion-color-primary)' : 'var(--color-text-primary)' }}>
                                            {data.status.isUposatha ? 'YES' : 'NO'}
                                        </div>
                                    </div>

                                    {data.status.paliLabel && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-tertiary)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                                <span>📜</span> Pali Name
                                            </div>
                                            <div style={{ fontWeight: '800', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{data.status.paliLabel}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Festival Info ... (Already glass, keeping as is) */}
                            {data.festival && (
                                <div style={{
                                    background: 'var(--glass-bg)',
                                    backdropFilter: 'var(--glass-backdrop)',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    border: '1px solid var(--glass-border)',
                                    boxShadow: 'var(--shadow-lg)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0, top: 0, bottom: 0,
                                        width: '6px',
                                        background: getTraditionColors(data.festival.tradition).primary
                                    }} />

                                    <h3 style={{
                                        marginTop: 0,
                                        marginBottom: '12px',
                                        color: getTraditionColors(data.festival.tradition).primary,
                                        fontWeight: '800',
                                        fontSize: '1.25rem'
                                    }}>
                                        ✨ {data.festival.name}
                                    </h3>

                                    <p style={{
                                        margin: 0,
                                        color: 'var(--color-text-primary)',
                                        lineHeight: '1.6',
                                        fontSize: '0.95rem'
                                    }}>
                                        {data.festival.description}
                                    </p>

                                    <div style={{
                                        marginTop: '20px',
                                        fontSize: '0.7rem',
                                        fontWeight: '800',
                                        color: getTraditionColors(data.festival.tradition).primary,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        opacity: 0.8
                                    }}>
                                        Tradition: {data.festival.tradition}
                                    </div>
                                </div>
                            )}

                            {/* Terminology Card */}
                            <div style={{
                                background: 'rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '24px',
                                padding: '24px',
                                border: '1px dashed var(--glass-border)'
                            }}>
                                <h4 style={{
                                    marginTop: 0,
                                    marginBottom: '20px',
                                    fontSize: '0.7rem',
                                    color: 'var(--color-text-tertiary)',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em'
                                }}>
                                    Calculations Reference
                                </h4>
                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '14px' }}>
                                        <div style={{ fontSize: '1.2rem', opacity: 0.5 }}>•</div>
                                        <div>
                                            <h5 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>Kshaya <small style={{ fontWeight: '500', opacity: 0.5 }}>(Optional Tithi)</small></h5>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', fontWeight: '500' }}>
                                                Occurs when a Tithi starts after one sunrise and ends before the next. It's missing from standard count but valid for practice.
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '14px' }}>
                                        <div style={{ fontSize: '1.2rem', opacity: 0.5 }}>•</div>
                                        <div>
                                            <h5 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>Vridhi <small style={{ fontWeight: '500', opacity: 0.5 }}>(Extended Tithi)</small></h5>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', fontWeight: '500' }}>
                                                Tithi spans two sunrises. Counted twice (primary + extended). Skip, Do not Observe Uposatha.
                                            </p>
                                        </div>
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
