
import React, { useMemo } from 'react';
import { IonList, IonItem, IonLabel, IonNote, IonIcon, IonItemDivider } from '@ionic/react';
import { moon } from 'ionicons/icons';
import { getYearUposathaDays, type UposathaDay, type UposathaStatus } from '../services/uposathaCalculator';
import { checkFestival, type BuddhistFestival } from '../services/buddhistFestivalService';
import { Observer } from '@ishubhamx/panchangam-js';

interface YearViewProps {
    year: number;
    observer: Observer;
}

import { formatSanskritDate } from '../services/timeUtils';

import './YearView.css';

const getMoonIcon = (status: UposathaStatus) => {
    if (status.isKshaya) return '🌙';
    if (status.isFullMoon) return '🌕';
    if (status.isNewMoon) return '🌑';
    if (status.isChaturdashi) return '🌖';
    if (status.isAshtami) return '🌗';
    if (status.isOptional && status.isVridhi) return '○';
    return '•';
};

const getMoonPhaseClass = (status: UposathaStatus) => {
    if (status.isFullMoon) return 'full-moon';
    if (status.isNewMoon) return 'new-moon';
    if (status.isChaturdashi) return 'chaturdashi';
    if (status.isAshtami) return 'ashtami';
    return 'default';
};

const YearView: React.FC<YearViewProps> = ({ year, observer }) => {
    const uposathaDays = useMemo(() => {
        const days = getYearUposathaDays(year, observer);
        // Group by month
        const grouped: { gregorianMonth: string; masaName: string; days: UposathaDay[] }[] = [];

        days.forEach(day => {
            const gregorianMonth = day.date.toLocaleString('default', { month: 'long' });
            const masaName = day.status.panchangam.masa.name;

            let group = grouped.find(g => g.gregorianMonth === gregorianMonth);
            if (!group) {
                group = { gregorianMonth, masaName, days: [] };
                grouped.push(group);
            }
            group.days.push(day);
        });
        return grouped;
    }, [year, observer]);

    return (
        <IonList className="year-view-list" lines="none">
            {uposathaDays.map((group, groupIdx) => (
                <div key={groupIdx} className="year-month-group">
                    <div className="year-month-card glass-card">
                        <div className="month-card-accent" />
                        <div className="month-card-content">
                            <div className="month-card-masa">{group.masaName} Masa</div>
                            <div className="month-card-gregorian">{group.gregorianMonth}</div>
                        </div>
                    </div>
                    {group.days.map((day, idx) => {
                        const festival = checkFestival(day.date, observer, day.status.panchangam);
                        const isToday = new Date().toDateString() === day.date.toDateString();
                        return (
                            <IonItem
                                key={idx}
                                routerLink={`/day/${day.date.toISOString().split('T')[0]}`}
                                className={`year-uposatha-item ${isToday ? 'today-item' : ''}`}
                                detail={false}
                            >
                                <div slot="start" className="year-moon-wrapper">
                                    <span className={`year-moon-icon phase-${getMoonPhaseClass(day.status)}`} style={{
                                        color: day.status.isFullMoon ? 'var(--uposatha-full-moon)' :
                                            day.status.isNewMoon ? 'var(--uposatha-new-moon)' :
                                                day.status.isAshtami || day.status.isChaturdashi ? 'var(--uposatha-half-moon)' :
                                                    'var(--color-text-muted)'
                                    }}>
                                        {getMoonIcon(day.status)}
                                    </span>
                                </div>
                                <IonLabel>
                                    <h2 className="year-date-title">{formatSanskritDate(day.date)}</h2>
                                    <p className="year-uposatha-label">{day.status.label}</p>
                                </IonLabel>
                                {isToday && (
                                    <div className="today-dot" slot="end" title="Today" />
                                )}
                                {festival && (
                                    <IonNote slot="end" className="year-festival-note">
                                        ☸️ {festival.name}
                                    </IonNote>
                                )}
                            </IonItem>
                        );
                    })}
                </div>
            ))}
        </IonList>
    );
};

export default YearView;
