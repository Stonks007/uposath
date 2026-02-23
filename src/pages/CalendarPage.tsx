
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
    IonTitle,
    useIonViewWillEnter
} from '@ionic/react';
import {
    chevronBack,
    chevronForward,
    locationOutline,
    todayOutline,
    peopleOutline,
    checkmarkCircle,
    closeCircle,
    removeCircleOutline
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
import { UposathaObservance } from '../types/ObservanceTypes';
import { UposathaObservanceService } from '../services/UposathaObservanceService';
import PracticeCalendarCard from '../components/sati/PracticeCalendarCard';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
    const history = useHistory();
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [daysInMonth, setDaysInMonth] = useState<{ date: Date; uposatha: UposathaStatus; festival: BuddhistFestival | null }[]>([]);
    const [observanceHistory, setObservanceHistory] = useState<UposathaObservance[]>([]);
    const [locationName, setLocationName] = useState('Loading...');
    const [observer, setObserver] = useState(new Observer(24.7914, 85.0002, 111));
    const [showVerseCard, setShowVerseCard] = useState(true);
    const [primaryVerse, setPrimaryVerse] = useState<DhammapadaVerse | null>(null);
    const [currentVerse, setCurrentVerse] = useState<DhammapadaVerse | null>(null);

    useIonViewWillEnter(() => {
        loadLocation();
        loadVerseSettingsAndVerse();
        loadObservanceHistory();
    });

    const loadObservanceHistory = async () => {
        const history = await UposathaObservanceService.getHistory();
        setObservanceHistory(history);
    };

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

    const generateMonthData = async (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const data = [];

        for (let d = 1; d <= days; d++) {
            const dayDate = new Date(year, month, d, 12, 0, 0);
            const status = getUposathaStatus(dayDate, observer);
            const festival = checkFestival(dayDate, observer, status.panchangam);
            data.push({ date: dayDate, uposatha: status, festival });

            // Yield every 15 days
            if (d % 15 === 0) await new Promise(r => setTimeout(r, 0));
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
        if (status.isKshaya) return '🌙';
        if (status.isUposatha) {
            if (status.isFullMoon) return '🌕';
            if (status.isNewMoon) return '🌑';
            if (status.isChaturdashi) return '🌖';
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
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dayDate = new Date(day.date);
                    dayDate.setHours(0, 0, 0, 0);

                    const isToday = dayDate.toDateString() === today.toDateString();
                    const isFutureOrToday = dayDate >= today;

                    // Check Observance History
                    const observance = observanceHistory.find(o => {
                        const obsDate = new Date(o.date);
                        obsDate.setHours(0, 0, 0, 0);
                        return obsDate.getTime() === dayDate.getTime();
                    });

                    const isUpcomingUposatha = day.uposatha.isUposatha && !observance && isFutureOrToday;

                    const moon = getMoonIcon(day.uposatha);
                    const festivalColors = day.festival ? getTraditionColors(day.festival.tradition) : null;

                    return (
                        <div
                            key={i}
                            className={`day-cell ${isToday ? 'today' : ''} ${isUpcomingUposatha ? 'uposatha-day' : ''} ${isToday && day.uposatha.isUposatha ? 'today-uposatha' : ''}`}
                            onClick={() => handleDayClick(day.date)}
                        >
                            <span className="day-number">{day.date.getDate()}</span>
                            {moon && <span className={`moon-indicator ${moon === '○' ? 'moon-optional' : ''}`}>{moon}</span>}
                            {day.festival && (
                                <div
                                    className="festival-indicator"
                                    style={{ background: festivalColors?.primary }}
                                />
                            )}
                            {observance && (
                                <div style={{ position: 'absolute', bottom: '2px', right: '2px', fontSize: '1rem', zIndex: 2 }}>
                                    <IonIcon
                                        icon={observance.status === 'observed' ? checkmarkCircle : observance.status === 'skipped' ? closeCircle : removeCircleOutline}
                                        color={observance.status === 'observed' ? 'success' : observance.status === 'skipped' ? 'danger' : 'medium'}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <IonPage>
            <IonHeader className="calendar-header-wrapper">
                <IonToolbar className="calendar-toolbar">
                    <IonButtons slot="start">
                        <IonButton
                            size="small"
                            className={`premium-button ${viewMode === 'month' ? 'premium-button--active' : ''}`}
                            onClick={() => setViewMode('month')}
                        >
                            <IonLabel>Month</IonLabel>
                        </IonButton>
                        <IonButton
                            size="small"
                            className={`premium-button ${viewMode === 'year' ? 'premium-button--active' : ''}`}
                            onClick={() => setViewMode('year')}
                        >
                            <IonLabel>Year</IonLabel>
                        </IonButton>
                    </IonButtons>

                    <IonTitle>
                        <div className="header-date">
                            {viewMode === 'month'
                                ? currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })
                                : ''}
                        </div>
                    </IonTitle>

                    <IonButtons slot="end">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {viewMode === 'month' ? (
                                <>
                                    <IonButton fill="clear" onClick={() => changeMonth(-1)}>
                                        <IonIcon icon={chevronBack} />
                                    </IonButton>
                                    <IonButton
                                        onClick={goToToday}
                                        className="premium-button premium-button--accent"
                                    >
                                        <IonLabel>Today</IonLabel>
                                    </IonButton>
                                    <IonButton fill="clear" onClick={() => changeMonth(1)}>
                                        <IonIcon icon={chevronForward} />
                                    </IonButton>
                                </>
                            ) : (
                                <>
                                    <IonButton fill="clear" onClick={() => changeYear(-1)}>
                                        <IonIcon icon={chevronBack} />
                                    </IonButton>
                                    <div className="header-date" style={{ margin: '0 8px' }}>
                                        {currentDate.getFullYear()}
                                    </div>
                                    <IonButton fill="clear" onClick={() => changeYear(1)}>
                                        <IonIcon icon={chevronForward} />
                                    </IonButton>
                                </>
                            )}
                        </div>
                    </IonButtons>
                </IonToolbar>
                <div className="header-location-bar">
                    <div className="location-info">
                        <IonIcon icon={locationOutline} color="primary" />
                        <span>{locationName}</span>
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
                                            ? <><span className={todayData.u.isKshaya ? 'moon-indicator' : 'moon-optional'}>{getMoonIcon(todayData.u) || '○'}</span> {todayData.u.isKshaya ? 'Kshaya' : 'Vridhi'}</>
                                            : 'No Uposatha Day'}
                                </span>
                            </div>
                            {todayData.u.isOptional && (
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '8px', lineHeight: '1.3' }}>
                                    {todayData.u.isKshaya
                                        ? 'Note: Kshaya (Optional) — This tithi started and ended between sunrises, missing the standard calendar count.'
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

                        {renderMonthGrid()}
                    </>
                ) : (
                    <YearView year={currentDate.getFullYear()} observer={observer} />
                )}

                <div className="calendar-legend">
                    <div className="legend-section">
                        <div className="legend-title">Moon Phases</div>
                        <div className="legend-grid">
                            <div className="legend-item"><span>🌕</span> Purnima Uposatha</div>
                            <div className="legend-item"><span>🌑</span> Amavasya Uposatha</div>
                            <div className="legend-item"><span>🌗</span> Ashtami Uposatha</div>
                            <div className="legend-item"><span>🌖</span> Chaturdashi Uposatha</div>
                            <div className="legend-item"><span className="moon-indicator">🌙</span> Kshaya Uposatha</div>
                            <div className="legend-item"><span className="moon-optional">○</span> Vridhi (Extended Uposatha)</div>
                        </div>
                    </div>

                    <div className="legend-section">
                        <div className="legend-title">Traditions</div>
                        <div className="traditions-row">
                            <div className="legend-item">
                                <span className="tradition-dot dot-theravada"></span>
                                Theravada
                            </div>
                            <div className="legend-item">
                                <span className="tradition-dot dot-mahayana"></span>
                                Mahayana
                            </div>
                            <div className="legend-item">
                                <span className="tradition-dot dot-vajrayana"></span>
                                Vajrayana
                            </div>
                        </div>
                    </div>

                    <div className="liturgical-meanings">
                        <div className="legend-title">Liturgical Meanings</div>
                        <div className="liturgical-item">
                            <span className="bullet">•</span>
                            <span><strong>Kshaya:</strong> Occurs when a Tithi starts after one sunrise and ends before the next.</span>
                        </div>
                        <div className="liturgical-item">
                            <span className="bullet">•</span>
                            <span><strong>Vridhi (Extended):</strong> Tithi spans two sunrises. Counted twice (primary + extended). Skip, Do not Observe Uposatha</span>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default CalendarPage;
