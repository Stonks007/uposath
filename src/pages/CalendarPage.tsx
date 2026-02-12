
import React, { useState, useEffect, useMemo } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonLabel,
    useIonViewWillEnter
} from '@ionic/react';
import {
    chevronBack,
    chevronForward,
    locationOutline,
    todayOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import { Preferences } from '@capacitor/preferences';
import { getUposathaStatus, type UposathaStatus } from '../services/uposathaCalculator';
import { checkFestival, type BuddhistFestival, getTraditionColors } from '../services/buddhistFestivalService';
import { Observer, getPanchangam } from '@ishubhamx/panchangam-js';
import YearView from '../components/YearView';
import { getSavedLocation } from '../services/locationManager';
import DhammapadaVerseCard from '../components/DhammapadaVerseCard';
import { DhammapadaVerse, getVerseForDate, getRandomVerse } from '../services/dhammapadaService';
import PracticeCalendarCard from '../components/sati/PracticeCalendarCard';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
    const history = useHistory();
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [daysInMonth, setDaysInMonth] = useState<{ date: Date; uposatha: UposathaStatus; festival: BuddhistFestival | null }[]>([]);
    const [locationName, setLocationName] = useState('Loading...');
    const [observer, setObserver] = useState(new Observer(24.7914, 85.0002, 111));
    const [showVerseCard, setShowVerseCard] = useState(true);
    const [primaryVerse, setPrimaryVerse] = useState<DhammapadaVerse | null>(null);
    const [currentVerse, setCurrentVerse] = useState<DhammapadaVerse | null>(null);

    useIonViewWillEnter(() => {
        loadLocation();
        loadVerseSettingsAndVerse();
    });

    const loadLocation = async () => {
        const loc = await getSavedLocation();
        if (loc) {
            setObserver(new Observer(loc.latitude, loc.longitude, loc.altitude));
            setLocationName(loc.name);
        }
    };

    const loadVerseSettingsAndVerse = async () => {
        const { value } = await Preferences.get({ key: 'settings_show_daily_verse' });
        // Default: on
        const enabled = value === null || value === '' || value === 'true';
        setShowVerseCard(enabled);

        const today = new Date();
        const verse = getVerseForDate(today);
        setPrimaryVerse(verse);
        setCurrentVerse(verse);
    };

    useEffect(() => {
        if (viewMode === 'month') {
            generateMonthData(currentDate);
        }
    }, [currentDate, viewMode, observer]);

    const generateMonthData = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const data = [];

        for (let d = 1; d <= days; d++) {
            const dayDate = new Date(year, month, d, 12, 0, 0);
            const status = getUposathaStatus(dayDate, observer);
            const festival = checkFestival(dayDate, observer, status.panchangam);
            data.push({ date: dayDate, uposatha: status, festival });
        }
        setDaysInMonth(data);
    };

    const todayData = useMemo(() => {
        const now = new Date();
        const p = getPanchangam(now, observer);
        const f = checkFestival(now, observer, p);
        const u = getUposathaStatus(now, observer);
        return { p, f, u };
    }, [observer]);

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const changeYear = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(newDate.getFullYear() + delta);
        setCurrentDate(newDate);
    };

    const handleShowAnotherVerse = () => {
        if (!primaryVerse) return;
        const next = getRandomVerse(primaryVerse.globalVerseNumber);
        setCurrentVerse(next);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setViewMode('month');
    };

    const handleDayClick = (date: Date) => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        history.push(`/day/${date.toISOString().split('T')[0]}`);
    };

    const getMoonIcon = (status: UposathaStatus) => {
        if (status.isUposatha) {
            if (status.isFullMoon) return '🌕';
            if (status.isNewMoon) return '🌑';
            return '🌗';
        }
        if (status.isOptional) return '○';
        return null;
    };

    const renderMonthGrid = () => {
        const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const emptySlots = Array(startDay).fill(null);

        return (
            <div className="calendar-grid">
                {['Rav', 'Som', 'Man', 'Bud', 'Gur', 'Shu', 'Sha'].map(d => (
                    <div key={d} className="weekday-header">{d}</div>
                ))}

                {emptySlots.map((_, i) => <div key={`empty-${i}`} />)}

                {daysInMonth.map((day, i) => {
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const moon = getMoonIcon(day.uposatha);
                    const festivalColors = day.festival ? getTraditionColors(day.festival.tradition) : null;

                    return (
                        <div
                            key={i}
                            className={`day-cell ${isToday ? 'today' : ''}`}
                            onClick={() => handleDayClick(day.date)}
                        >
                            <span className="day-number">{day.date.getDate()}</span>
                            {moon && <span className="moon-indicator">{moon}</span>}
                            {day.festival && (
                                <div
                                    className="festival-indicator"
                                    style={{ background: festivalColors?.primary }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton
                            size="small"
                            fill="clear"
                            className={`mode-toggle-button ${viewMode === 'month' ? 'mode-toggle-button--active' : ''}`}
                            onClick={() => {
                                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                setViewMode('month');
                            }}
                            aria-pressed={viewMode === 'month'}
                            aria-label="Switch to month view"
                        >
                            <IonLabel>Month</IonLabel>
                        </IonButton>
                        <IonButton
                            size="small"
                            fill="clear"
                            className={`mode-toggle-button ${viewMode === 'year' ? 'mode-toggle-button--active' : ''}`}
                            onClick={() => {
                                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                setViewMode('year');
                            }}
                            aria-pressed={viewMode === 'year'}
                            aria-label="Switch to year view"
                        >
                            <IonLabel>Year</IonLabel>
                        </IonButton>
                    </IonButtons>
                    <IonButtons slot="end">
                        {viewMode === 'month' ? (
                            <IonButton
                                onClick={goToToday}
                                fill="clear"
                                className="header-today-button"
                                aria-label="Go to today"
                            >
                                <IonLabel>Today</IonLabel>
                            </IonButton>
                        ) : (
                            <>
                                <IonButton
                                    fill="clear"
                                    size="small"
                                    onClick={() => {
                                        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                        changeYear(-1);
                                    }}
                                    aria-label="Previous year"
                                >
                                    <IonIcon icon={chevronBack} />
                                </IonButton>
                                <span
                                    style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        opacity: 0.8,
                                        margin: '0 4px',
                                        minWidth: '3.5rem',
                                        textAlign: 'center',
                                    }}
                                >
                                    {currentDate.getFullYear()}
                                </span>
                                <IonButton
                                    fill="clear"
                                    size="small"
                                    onClick={() => {
                                        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                        changeYear(1);
                                    }}
                                    aria-label="Next year"
                                >
                                    <IonIcon icon={chevronForward} />
                                </IonButton>
                            </>
                        )}
                    </IonButtons>
                </IonToolbar>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px 8px', background: 'var(--ion-toolbar-background)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={locationOutline} color="primary" style={{ fontSize: '0.8rem' }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{locationName}</span>
                    </div>
                </div>
            </IonHeader>

            <IonContent fullscreen className="calendar-container">
                {viewMode === 'month' ? (
                    <>
                        <div className="insight-card">
                            <div className="insight-header">
                                <span className="insight-masa">{todayData.p.masa.name} Masa</span>
                                <span className="insight-tithi">{todayData.p.masa.index + 1}th Masa</span>
                            </div>
                            <div className="insight-tithi" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{todayData.p.tithi + 1} Tithi — {todayData.p.paksha} Paksha</span>
                                <span style={{
                                    color: todayData.u.isUposatha ? 'var(--color-accent-primary)' : 'inherit',
                                    fontWeight: todayData.u.isUposatha ? 'bold' : 'normal'
                                }}>
                                    {todayData.u.isUposatha
                                        ? `✨ ${todayData.u.paliLabel || 'Uposatha'}`
                                        : todayData.u.isOptional
                                            ? `○ ${todayData.u.isKshaya ? 'Kshaya' : 'Vridhi'}`
                                            : 'No Uposatha Day'}
                                </span>
                            </div>
                            {todayData.u.isOptional && (
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '8px', lineHeight: '1.3' }}>
                                    {todayData.u.isKshaya
                                        ? 'Note: Kshaya (Skipped) — This tithi started and ended between sunrises, missing the standard calendar count.'
                                        : 'Note: Vridhi (Extended) — This tithi spans across two sunrises, making today an additional observance day.'}
                                </div>
                            )}
                            {todayData.f && (
                                <div className="insight-festival">
                                    <span style={{ fontSize: '1.2rem' }}>☸️</span>
                                    <span>{todayData.f.name}</span>
                                </div>
                            )}
                        </div>

                        <PracticeCalendarCard />

                        {showVerseCard && currentVerse && (
                            <div className="ion-padding-horizontal" style={{ marginBottom: '12px' }}>
                                <DhammapadaVerseCard
                                    verse={currentVerse}
                                    isPrimaryForDay={primaryVerse !== null && currentVerse.globalVerseNumber === primaryVerse.globalVerseNumber}
                                    onShowAnother={handleShowAnotherVerse}
                                />
                            </div>
                        )}

                        <div className="ion-padding-horizontal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <IonButton fill="clear" size="small" onClick={() => {
                                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                changeMonth(-1);
                            }}>
                                <IonIcon icon={chevronBack} />
                            </IonButton>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.6 }}>
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <IonButton fill="clear" size="small" onClick={() => {
                                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                changeMonth(1);
                            }}>
                                <IonIcon icon={chevronForward} />
                            </IonButton>
                        </div>

                        {renderMonthGrid()}
                    </>
                ) : (
                    <YearView year={currentDate.getFullYear()} observer={observer} />
                )}

                <div className="calendar-legend">
                    <div className="legend-title">Moon & Tradition Legend</div>
                    <div className="legend-grid">
                        <div className="legend-item"><span>🌕</span> Purnima Uposatha</div>
                        <div className="legend-item"><span>🌑</span> Amavasya Uposatha</div>
                        <div className="legend-item"><span>🌗</span> Ashtami / Chaturdashi</div>
                        <div className="legend-item"><span>○</span> Kshaya / Vridhi (Optional)</div>
                    </div>

                    <div className="traditions-row">
                        <div className="legend-item">
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9933' }} />
                            Theravada
                        </div>
                        <div className="legend-item">
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E34234' }} />
                            Mahayana
                        </div>
                        <div className="legend-item">
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1E3A5F' }} />
                            Vajrayana
                        </div>
                    </div>

                    <div className="liturgical-meanings">
                        <div style={{ marginBottom: '4px' }}><strong>Liturgical Meanings:</strong></div>
                        <div style={{ marginBottom: '4px', display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                            <span>•</span>
                            <span><strong>Kshaya (Skipped):</strong> Occurs when a Tithi starts after one sunrise and ends before the next. It never exists at the moment of sunrise, causing it to be "skipped" in the primary udaya-based count. These are marked as optional observances.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                            <span>•</span>
                            <span><strong>Vridhi (Extended):</strong> Occurs when a Tithi is long enough to span across two consecutive sunrises. The same Tithi is counted twice; the first is the primary day, and the second is marked as an optional/extended day.</span>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default CalendarPage;
