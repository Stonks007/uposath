
import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    useIonViewWillEnter
} from '@ionic/react';
import { chevronBack, chevronForward, calendarNumber, list } from 'ionicons/icons';
import { useHistory } from 'react-router';
import { getUposathaStatus, type UposathaStatus } from '../services/uposathaCalculator';
import { checkFestival, type BuddhistFestival } from '../services/buddhistFestivalService';
import { Observer } from '@ishubhamx/panchangam-js';
import YearView from '../components/YearView';
import { getSavedLocation } from '../services/locationManager';

const CalendarPage: React.FC = () => {
    const history = useHistory();
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [daysInMonth, setDaysInMonth] = useState<{ date: Date; uposatha: UposathaStatus; festival: BuddhistFestival | null }[]>([]);
    const [locationName, setLocationName] = useState('Loading...');

    // TODO: Use a real hook for observer
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
            // Use 12:00 PM to avoid timezone edge cases for pure date display
            const dayDate = new Date(year, month, d, 12, 0, 0);
            // For calculation, pass a time closer to sunrise/morning if needed, 
            // but getUposathaStatus handles its own sunrise calc internally based on date.
            // However, to ensure we target the right "civil day", we pass the date.
            const status = getUposathaStatus(dayDate, observer);
            const festival = checkFestival(dayDate, observer);
            data.push({ date: dayDate, uposatha: status, festival });
        }
        setDaysInMonth(data);
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const handleDayClick = (date: Date) => {
        history.push(`/day/${date.toISOString().split('T')[0]}`);
    };

    const renderMonthGrid = () => {
        const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0=Sun
        const emptySlots = Array(startDay).fill(null);

        return (
            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
                ))}

                {emptySlots.map((_, i) => <div key={`empty-${i}`} />)}

                {daysInMonth.map((day, i) => {
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    return (
                        <div
                            key={i}
                            className={`day-cell ${isToday ? 'today' : ''}`}
                            onClick={() => handleDayClick(day.date)}
                        >
                            <span>{day.date.getDate()}</span>

                            {/* Uposatha Dot */}
                            {day.uposatha.isUposatha && (
                                <div className={`moon-dot ${day.uposatha.isFullMoon ? 'moon-full' :
                                    day.uposatha.isNewMoon ? 'moon-new' : 'moon-half'
                                    }`} />
                            )}

                            {/* Festival Icon */}
                            {day.festival && <div className="festival-dot" />}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}>
                            <IonIcon icon={viewMode === 'month' ? list : calendarNumber} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle>
                        {viewMode === 'month'
                            ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                            : currentDate.getFullYear()
                        }
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => changeMonth(-1)} disabled={viewMode === 'year'}>
                            <IonIcon icon={chevronBack} />
                        </IonButton>
                        <IonButton onClick={() => changeMonth(1)} disabled={viewMode === 'year'}>
                            <IonIcon icon={chevronForward} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
                <IonToolbar color="light">
                    <IonLabel className="ion-padding-start text-xs">📍 {locationName}</IonLabel>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {viewMode === 'month' ? renderMonthGrid() : <YearView year={currentDate.getFullYear()} observer={observer} />}
            </IonContent>
        </IonPage>
    );
};

export default CalendarPage;
