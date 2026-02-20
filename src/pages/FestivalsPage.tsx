import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    useIonViewWillEnter,
    IonIcon
} from '@ionic/react';
import { Observer } from '@ishubhamx/panchangam-js';
import {
    type FestivalMatch,
    type FestivalEvent,
    type BuddhistTradition,
    getTraditionColors
} from '../services/buddhistFestivalService';
import { getSavedLocation, getObserver } from '../services/locationManager';
import { getPersistentFestivals } from '../services/festivalCacheService';
import {
    calendarOutline,
    locationOutline,
    timeOutline,
    chevronForwardOutline,
    chevronDownOutline,
    chevronUpOutline,
    bookOutline,
    leafOutline
} from 'ionicons/icons';
import './FestivalsPage.css';

type FilterOption = 'All' | BuddhistTradition;

const FestivalsPage: React.FC = () => {
    const [festivals, setFestivals] = useState<FestivalMatch[]>([]);
    const [filteredFestivals, setFilteredFestivals] = useState<FestivalMatch[]>([]);
    const [locationName, setLocationName] = useState('Loading...');
    const [observer, setObserver] = useState(new Observer(24.7914, 85.0002, 111));
    const [filter, setFilter] = useState<FilterOption>('All');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [showHindi, setShowHindi] = useState(false);

    useIonViewWillEnter(() => {
        loadData();
    });

    const loadData = async () => {
        const loc = await getSavedLocation();
        const currentObserver = getObserver(loc);
        setObserver(currentObserver);
        setLocationName(loc.name);

        // Fetch using persistent cache (includes fresh scan if invalid)
        const upcoming = await getPersistentFestivals(currentObserver);
        setFestivals(upcoming);
        setFilteredFestivals(upcoming);
    };

    const handleFilterChange = (value: FilterOption) => {
        setFilter(value);
        if (value === 'All') {
            setFilteredFestivals(festivals);
        } else {
            setFilteredFestivals(festivals.filter(m => m.festival.tradition === value));
        }
    };

    // ─── Live Countdown Component ───
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
            return <span className="countdown-live">🎉 Today!</span>;
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

    const toggleExpand = (key: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const renderEvent = (event: FestivalEvent, idx: number) => {
        if (event.note && !event.eventEn) {
            return (
                <div key={idx} className="event-note">
                    <IonIcon icon={leafOutline} />
                    <span>{event.note}</span>
                </div>
            );
        }

        return (
            <div key={idx} className="event-item">
                <div className="event-bullet">●</div>
                <div className="event-content">
                    <p className="event-text-en">{event.eventEn}</p>
                    {showHindi && event.eventHindi && (
                        <p className="event-text-hindi">{event.eventHindi}</p>
                    )}
                    {event.paliReference && (
                        <span className="pali-badge">
                            <IonIcon icon={bookOutline} />
                            {event.paliReference}
                        </span>
                    )}
                    {event.suttaCited && (
                        <span className="pali-badge sutta-badge">
                            <IonIcon icon={bookOutline} />
                            {event.suttaCited}
                        </span>
                    )}
                    {event.relic && (
                        <span className="relic-badge">🏛️ {event.relic}</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>

                    <IonTitle>Dharma Calendar</IonTitle>
                </IonToolbar>
                <IonToolbar color="translucent" style={{ '--background': 'transparent' }}>
                    <div className="ion-padding-horizontal" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
                        <IonIcon icon={locationOutline} color="primary" />
                        <IonLabel style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                            {locationName}
                        </IonLabel>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="festivals-container">
                {/* ─── Tradition Filter ─── */}
                <div className="filter-container">
                    <IonSegment
                        value={filter}
                        onIonChange={e => handleFilterChange(e.detail.value as FilterOption)}
                        className="tradition-segment"
                    >
                        <IonSegmentButton value="All">
                            <IonLabel>All</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="Theravada">
                            <IonLabel>Theravāda</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="Mahayana">
                            <IonLabel>Mahāyāna</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="Vajrayana">
                            <IonLabel>Vajrayāna</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>

                    {filter === 'Theravada' && (
                        <button
                            className={`hindi-toggle ${showHindi ? 'active' : ''}`}
                            onClick={() => setShowHindi(!showHindi)}
                        >
                            {showHindi ? 'Hide Hindi' : 'हिन्दी'}
                        </button>
                    )}
                </div>

                {filteredFestivals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🗓️</div>
                        <h3>No Upcoming Festivals</h3>
                        <p>No {filter !== 'All' ? filter + ' ' : ''}Buddhist events found in the next 365 days.</p>
                    </div>
                ) : (
                    <div className="festivals-list">
                        {filteredFestivals.map((match, idx) => {
                            const colors = getTraditionColors(match.festival.tradition);
                            const cardKey = `${match.festival.id}-${idx}`;
                            const isExpanded = expandedCards.has(cardKey);
                            const hasEvents = match.festival.events && match.festival.events.length > 0;

                            return (
                                <div
                                    key={idx}
                                    className={`festival-card ${isExpanded ? 'expanded' : ''}`}
                                    style={{
                                        '--tradition-glow': colors.background,
                                        borderColor: isExpanded ? colors.primary : undefined,
                                    } as React.CSSProperties}
                                >
                                    <div
                                        className="festival-card-content"
                                        onClick={() => !hasEvents && (window.location.href = `/day/${match.date.toISOString().split('T')[0]}`)}
                                    >
                                        <div className="festival-header">
                                            <div style={{ flex: 1 }}>
                                                <h2 className="festival-name" style={{ color: colors.primary }}>
                                                    {match.festival.name}
                                                </h2>
                                                {match.festival.alsoKnownAs && (
                                                    <div className="festival-aka">
                                                        {match.festival.alsoKnownAs}
                                                    </div>
                                                )}
                                                {match.festival.region && (
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--color-text-muted)',
                                                        fontWeight: 600,
                                                        letterSpacing: '0.06em',
                                                        textTransform: 'uppercase' as const,
                                                        marginTop: '4px'
                                                    }}>
                                                        {match.festival.region}
                                                    </div>
                                                )}
                                            </div>
                                            <span
                                                className="tradition-badge"
                                                style={{
                                                    background: match.festival.tradition === 'Theravada' ? 'rgba(255, 153, 51, 0.15)'
                                                        : match.festival.tradition === 'Mahayana' ? 'rgba(227, 66, 52, 0.15)'
                                                            : 'rgba(107, 143, 191, 0.15)',
                                                    color: colors.primary,
                                                    borderColor: match.festival.tradition === 'Theravada' ? 'rgba(255, 153, 51, 0.3)'
                                                        : match.festival.tradition === 'Mahayana' ? 'rgba(227, 66, 52, 0.3)'
                                                            : 'rgba(107, 143, 191, 0.3)',
                                                }}
                                            >
                                                {match.festival.tradition}
                                            </span>
                                        </div>

                                        <div className="festival-date">
                                            <IonIcon icon={calendarOutline} style={{ color: colors.primary, opacity: 0.7 }} />
                                            <span>{match.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>

                                        <p className="festival-description">
                                            {match.festival.description}
                                        </p>

                                        <div className="festival-footer">
                                            <div className="days-count" style={{ color: colors.primary }}>
                                                <IonIcon icon={timeOutline} />
                                                <Countdown targetDate={match.date} />
                                            </div>

                                            <div className="festival-footer-actions">
                                                {hasEvents && (
                                                    <button
                                                        className="expand-btn"
                                                        onClick={(e) => { e.stopPropagation(); toggleExpand(cardKey); }}
                                                    >
                                                        <span>{isExpanded ? 'Less' : 'Events'}</span>
                                                        <IonIcon icon={isExpanded ? chevronUpOutline : chevronDownOutline} />
                                                    </button>
                                                )}
                                                <div
                                                    className="view-details"
                                                    onClick={(e) => { e.stopPropagation(); window.location.href = `/day/${match.date.toISOString().split('T')[0]}`; }}
                                                >
                                                    <span>View Day</span>
                                                    <IonIcon icon={chevronForwardOutline} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ─── Expandable Events Panel ─── */}
                                    {isExpanded && hasEvents && (
                                        <div className="events-panel">
                                            <h4 className="events-panel-title">
                                                Historical Significance
                                            </h4>
                                            {match.festival.events!.map((event, eIdx) => renderEvent(event, eIdx))}

                                            {match.festival.paliReferences && match.festival.paliReferences.length > 0 && (
                                                <div className="pali-references">
                                                    <strong>Pāli References:</strong>
                                                    {match.festival.paliReferences.map((ref, rIdx) => (
                                                        <span key={rIdx} className="pali-ref-tag">{ref}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Left accent strip */}
                                    <div
                                        className="festival-accent-strip"
                                        style={{
                                            background: colors.primary,
                                            '--strip-color': colors.primary,
                                        } as React.CSSProperties}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default FestivalsPage;
