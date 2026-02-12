
import React, { useState, useEffect, useMemo } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
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
    calendarNumber,
    list,
    locationOutline,
    todayOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router';
import { getUposathaStatus, type UposathaStatus } from '../services/uposathaCalculator';
import { checkFestival, type BuddhistFestival, getTraditionColors } from '../services/buddhistFestivalService';
import { Observer, getPanchangam } from '@ishubhamx/panchangam-js';
import YearView from '../components/YearView';
import { getSavedLocation } from '../services/locationManager';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
    const history = useHistory();
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [daysInMonth, setDaysInMonth] = useState<{ date: Date; uposatha: UposathaStatus; festival: BuddhistFestival | null }[]>([]);
    const [locationName, setLocationName] = useState('Loading...');
    const [observer, setObserver] = useState(new Observer(24.7914, 85.0002, 111));

    useIonViewWillEnter(() => {
        loadLocation();
    });

    const loadLocation = async () => {
        const loc = await getSavedLocation();
        if (loc) {
            setObserver(new Observer(loc.latitude, loc.longitude, loc.altitude));
            setLocationName(loc.name);
        }
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
            const festival = checkFestival(dayDate, observer);
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
        if (!status.isUposatha) return null;
        if (status.isFullMoon) return '🌕';
        if (status.isNewMoon) return '🌑';
        return '🌗';
    };

    const renderMonthGrid = () => {
        const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const emptySlots = Array(startDay).fill(null);

        return (
            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
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
                        <IonButton onClick={() => {
                            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                            setViewMode(viewMode === 'month' ? 'year' : 'month');
                        }}>
                            <IonIcon icon={viewMode === 'month' ? list : calendarNumber} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle style={{ textAlign: 'center' }}>
                        {viewMode === 'month'
                            ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                            : currentDate.getFullYear()
                        }
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={goToToday}>
                            <IonIcon icon={todayOutline} />
                        </IonButton>
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
                                <span className="insight-tithi">{todayData.p.masa.index + 1}th Month</span>
                            </div>
                            <div className="insight-tithi" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Day {todayData.p.tithi + 1} — {todayData.p.paksha} Paksha</span>
                                <span style={{
                                    color: todayData.u.isUposatha ? 'var(--color-accent-primary)' : 'inherit',
                                    fontWeight: todayData.u.isUposatha ? 'bold' : 'normal'
                                }}>
                                    {todayData.u.isUposatha ? `✨ ${todayData.u.paliLabel || 'Uposatha'}` : 'Regular Day'}
                                </span>
                            </div>
                            {todayData.f && (
                                <div className="insight-festival">
                                    <span style={{ fontSize: '1.2rem' }}>☸️</span>
                                    <span>{todayData.f.name}</span>
                                </div>
                            )}
                        </div>

                        <div className="ion-padding-horizontal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <IonButton fill="clear" size="small" onClick={() => {
                                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                changeMonth(-1);
                            }}>
                                <IonIcon icon={chevronBack} />
                            </IonButton>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.6 }}>LUNAR CALENDAR</span>
                            <IonButton fill="clear" size="small" onClick={() => {
                                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                                changeMonth(1);
                            }}>
                                <IonIcon icon={chevronForward} />
                            </IonButton>
                        </div>

                        {renderMonthGrid()}

                        <div className="calendar-legend">
                            <div className="legend-title">Moon & Tradition Legend</div>
                            <div className="legend-grid">
                                <div className="legend-item"><span>🌕</span> Full Moon (Purnima)</div>
                                <div className="legend-item"><span>🌑</span> New Moon (Amavasya)</div>
                                <div className="legend-item"><span>🌗</span> 8th / 14th Day (Uposatha)</div>
                                <div className="legend-item">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF9933' }} />
                                    Theravada
                                </div>
                                <div className="legend-item">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E34234' }} />
                                    Mahayana
                                </div>
                                <div className="legend-item">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E3A5F' }} />
                                    Vajrayana
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <YearView year={currentDate.getFullYear()} observer={observer} />
                )}
            </IonContent>
        </IonPage>
    );
};

export default CalendarPage;
