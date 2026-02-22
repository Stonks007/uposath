
import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonIcon, IonSkeletonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { moon, calendarNumber, timeOutline } from 'ionicons/icons';
import { getNextUposatha, UposathaDay } from '../../services/uposathaCalculator';
import { getSavedLocation } from '../../services/locationManager';
import { Observer } from '@ishubhamx/panchangam-js';
import { UposathaObservanceService } from '../../services/UposathaObservanceService';
import { UposathaStats } from '../../types/ObservanceTypes';
import './NextUposathaWidget.css';

const NextUposathaWidget: React.FC = () => {
    const history = useHistory();
    const [nextUposatha, setNextUposatha] = useState<UposathaDay | null>(null);
    const [daysUntil, setDaysUntil] = useState<number | null>(null);
    const [stats, setStats] = useState<UposathaStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const loc = await getSavedLocation();
        const observer = loc ? new Observer(loc.latitude, loc.longitude, loc.altitude) : new Observer(24.7914, 85.0002, 111);

        const today = new Date();
        const next = getNextUposatha(today, observer);
        setNextUposatha(next);

        if (next) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const target = new Date(next.date);
            target.setHours(0, 0, 0, 0);
            const diffTime = target.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysUntil(diffDays);
        }

        const s = await UposathaObservanceService.getStats();
        setStats(s);
        setLoading(false);
    };

    const handleCardClick = () => {
        if (nextUposatha) {
            history.push(`/day/${nextUposatha.date.toISOString().split('T')[0]}`);
        } else {
            history.push('/calendar');
        }
    };

    if (loading) {
        return (
            <IonCard style={{ margin: '16px', borderRadius: '16px' }}>
                <IonCardContent>
                    <IonSkeletonText animated style={{ width: '60%' }} />
                    <IonSkeletonText animated style={{ width: '40%' }} />
                </IonCardContent>
            </IonCard>
        );
    }

    if (!nextUposatha) return null;

    const getPhaseIcon = () => {
        if (nextUposatha.status.isFullMoon) return '🌕';
        if (nextUposatha.status.isNewMoon) return '🌑';
        if (nextUposatha.status.isChaturdashi) return '🌖';
        return '🌗';
    };

    const getPhaseLabel = () => {
        if (nextUposatha.status.isFullMoon) return 'Full Moon Uposatha';
        if (nextUposatha.status.isNewMoon) return 'New Moon Uposatha';
        if (nextUposatha.status.isAshtami) return 'Ashtami Uposatha';
        if (nextUposatha.status.isChaturdashi) return 'Chaturdashi Uposatha';
        return 'Uposatha Day';
    };

    // ─── Live Countdown ───
    const Countdown: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
        const [now, setNow] = useState(new Date());

        useEffect(() => {
            const interval = setInterval(() => setNow(new Date()), 1000);
            return () => clearInterval(interval);
        }, []);

        const diff = Math.max(0, targetDate.getTime() - now.getTime());
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const pad = (n: number) => n.toString().padStart(2, '0');

        if (diff === 0) {
            return <span className="countdown-today">🎉 Today!</span>;
        }

        return (
            <span className="countdown-live">
                <span className="countdown-segment">
                    <span className="countdown-value">{days}</span>
                    <span className="countdown-unit">d</span>
                </span>
                <span className="countdown-sep">:</span>
                <span className="countdown-segment">
                    <span className="countdown-value">{pad(hours)}</span>
                    <span className="countdown-unit">h</span>
                </span>
                <span className="countdown-sep">:</span>
                <span className="countdown-segment">
                    <span className="countdown-value">{pad(minutes)}</span>
                    <span className="countdown-unit">m</span>
                </span>
                <span className="countdown-sep">:</span>
                <span className="countdown-segment">
                    <span className="countdown-value">{pad(seconds)}</span>
                    <span className="countdown-unit">s</span>
                </span>
            </span>
        );
    };

    return (
        <IonCard
            button
            onClick={handleCardClick}
            className="next-uposatha-card"
        >
            <IonCardContent className="next-uposatha-content">
                <div>
                    <div className="next-uposatha-eyebrow">
                        Upcoming Uposatha
                    </div>
                    <div className="next-uposatha-title">
                        <span>{getPhaseIcon()}</span>
                        <span>{getPhaseLabel()}</span>
                    </div>
                    <div className="next-uposatha-date">
                        {nextUposatha.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        <div className="paksa-tag">Paksa: {nextUposatha.status.paksha}</div>
                    </div>
                </div>

                <div>
                    <div className="next-uposatha-badge">
                        <Countdown targetDate={nextUposatha.date} />
                    </div>
                    {stats && stats.rate > 0 && (
                        <div className="next-uposatha-rate">
                            Rate: {stats.rate.toFixed(0)}%
                        </div>
                    )}
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export default NextUposathaWidget;
