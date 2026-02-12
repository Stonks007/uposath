
import React, { useMemo } from 'react';
import { IonList, IonItem, IonLabel, IonNote, IonIcon, IonItemDivider } from '@ionic/react';
import { moon } from 'ionicons/icons';
import { getYearUposathaDays, type UposathaDay } from '../services/uposathaCalculator';
import { checkFestival, type BuddhistFestival } from '../services/buddhistFestivalService';
import { Observer } from '@ishubhamx/panchangam-js';

interface YearViewProps {
    year: number;
    observer: Observer;
}

const YearView: React.FC<YearViewProps> = ({ year, observer }) => {
    const uposathaDays = useMemo(() => {
        const days = getYearUposathaDays(year, observer);
        // Group by month
        const grouped: Record<string, UposathaDay[]> = {};
        days.forEach(day => {
            const monthKey = day.date.toLocaleString('default', { month: 'long' });
            if (!grouped[monthKey]) grouped[monthKey] = [];
            grouped[monthKey].push(day);
        });
        return grouped;
    }, [year, observer]);

    return (
        <IonList>
            {Object.entries(uposathaDays).map(([month, days]) => (
                <React.Fragment key={month}>
                    <IonItemDivider color="light">
                        <IonLabel><strong>{month}</strong></IonLabel>
                    </IonItemDivider>
                    {days.map((day, idx) => {
                        const festival = checkFestival(day.date, observer);
                        return (
                            <IonItem key={idx} routerLink={`/day/${day.date.toISOString().split('T')[0]}`}>
                                <IonIcon
                                    icon={moon}
                                    slot="start"
                                    style={{
                                        color: day.status.isFullMoon ? 'var(--uposatha-full-moon)' :
                                            day.status.isNewMoon ? 'var(--uposatha-new-moon)' :
                                                'var(--uposatha-half-moon)'
                                    }}
                                />
                                <IonLabel>
                                    <h2>{day.date.toLocaleDateString(undefined, { day: 'numeric', weekday: 'short' })}</h2>
                                    <p>{day.status.label}</p>
                                </IonLabel>
                                {festival && <IonNote slot="end" color="warning">☸️ {festival.name}</IonNote>}
                            </IonItem>
                        );
                    })}
                </React.Fragment>
            ))}
        </IonList>
    );
};

export default YearView;
