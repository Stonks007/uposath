
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

import { formatSanskritDate } from '../services/timeUtils';

const YearView: React.FC<YearViewProps> = ({ year, observer }) => {
    const uposathaDays = useMemo(() => {
        const days = getYearUposathaDays(year, observer);
        // Group by month
        const grouped: Record<string, UposathaDay[]> = {};
        days.forEach(day => {
            const gregorianMonth = day.date.toLocaleString('default', { month: 'long' });
            const masaName = day.status.panchangam.masa.name;
            const key = `${gregorianMonth} (${masaName} Masa)`;

            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(day);
        });
        return grouped;
    }, [year, observer]);

    return (
        <IonList>
            {Object.entries(uposathaDays).map(([monthKey, days]) => (
                <React.Fragment key={monthKey}>
                    <IonItemDivider color="light">
                        <IonLabel><strong>{monthKey}</strong></IonLabel>
                    </IonItemDivider>
                    {days.map((day, idx) => {
                        const festival = checkFestival(day.date, observer, day.status.panchangam);
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
                                    <h2>{formatSanskritDate(day.date)}</h2>
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
