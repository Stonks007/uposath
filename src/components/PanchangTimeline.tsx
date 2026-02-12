import React, { useMemo } from 'react';
import type { TimelineData } from '../services/panchangTimeline';
import { formatTime } from '../services/timeUtils';
import { checkFestival, getTraditionColors } from '../services/buddhistFestivalService';
import './PanchangTimeline.css';

interface PanchangTimelineProps {
    data: TimelineData;
    currentTime?: Date;
    timezone?: string;
}

const PanchangTimeline: React.FC<PanchangTimelineProps> = ({
    data,
    currentTime = new Date(),
    timezone
}) => {
    const dayStart = data.sunrise || new Date();
    const nextSunrise = data.nextSunrise || new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const durationMs = nextSunrise.getTime() - dayStart.getTime();

    const getPercent = (time: Date): number => {
        let diff = time.getTime() - dayStart.getTime();
        if (diff < 0) return 0;
        return Math.min(100, (diff / durationMs) * 100);
    };

    const localFormatTime = (date?: Date | null) => {
        if (!date) return '--:--';
        return formatTime(date, timezone);
    };

    const currentTimePercent = getPercent(currentTime);
    const sunsetPercent = data.sunset ? getPercent(data.sunset) : null;

    const hourMarkers = useMemo(() => {
        const markers = [];
        const firstMarkTime = new Date(dayStart);
        firstMarkTime.setMinutes(0, 0, 0);
        if (dayStart.getMinutes() > 0) {
            firstMarkTime.setHours(dayStart.getHours() + 1);
        }

        // Generate markers until we reach nextSunrise
        for (let i = 0; i < 30; i++) { // Increase limit slightly just in case
            const mark = new Date(firstMarkTime);
            mark.setHours(firstMarkTime.getHours() + i);
            if (mark.getTime() > nextSunrise.getTime()) break;

            const pct = getPercent(mark);
            if (pct >= 0 && pct <= 100) {
                markers.push({
                    time: mark,
                    percent: pct,
                    label: mark.getHours()
                });
            }
        }
        return markers;
    }, [dayStart, nextSunrise, durationMs]);

    return (
        <div className="timeline-section glass-card">
            <div className="panchang-timeline">
                <div className="timeline-header">
                    <div className="header-left">
                        <span className="timeline-icon">🌒</span>
                        <h3 className="timeline-title">Panchang Timeline</h3>
                    </div>
                    <div className="timeline-legend">
                        <span className="legend-item primary">
                            <span className="legend-star">★</span>
                            <span>At Sunrise</span>
                        </span>
                    </div>
                </div>

                <div className="timeline-wrapper">
                    <div className="labels-column">
                        <div className="label-spacer"></div>
                        {data.rows.map((row, i) => (
                            <div key={i} className={`row-label row-type-${row.type}`}>
                                <span className="row-icon">{row.icon}</span>
                                <span className="row-text">{row.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="timeline-content">
                        <div className="timeline-scroll-area">
                            <div className="time-scale">
                                <div className="time-gradient-bar"></div>
                                <div className="coordinate-system">
                                    <div className="sun-marker sunrise-marker" style={{ left: '0%' }}>
                                        <div className="sun-icon-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>
                                        </div>
                                        <span className="sun-time">{localFormatTime(dayStart)}</span>
                                    </div>

                                    {hourMarkers.map((m, i) => (
                                        <div key={i} className={`hour-tick ${m.label === 12 ? 'noon' : ''}`} style={{ left: `${m.percent}%` }}>
                                            <div className="tick-mark"></div>
                                            <span className="hour-label">{m.label}</span>
                                        </div>
                                    ))}

                                    {sunsetPercent && (
                                        <div className="sun-marker sunset-marker" style={{ left: `${sunsetPercent}%` }}>
                                            <div className="sun-icon-wrapper sunset-glow">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>
                                            </div>
                                            <span className="sun-time">{localFormatTime(data.sunset)}</span>
                                        </div>
                                    )}

                                    <div className="sun-marker sunrise-marker" style={{ left: '100%' }}>
                                        <div className="sun-icon-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>
                                        </div>
                                        <span className="sun-time">{localFormatTime(nextSunrise)}</span>
                                    </div>
                                </div>
                            </div>

                            {data.rows.map((row, rIdx) => (
                                <div key={rIdx} className={`timeline-row row-type-${row.type}`}>
                                    <div className="coordinate-system row-track">
                                        {row.segments.map((seg, sIdx) => {
                                            const startPct = getPercent(seg.startTime);
                                            const endPct = getPercent(seg.endTime);
                                            const width = endPct - startPct;
                                            if (width <= 0) return null;

                                            let customStyle: React.CSSProperties = {};
                                            if (row.type === 'tithi') {
                                                const festival = checkFestival(seg.startTime, {} as any, data.panchangam);
                                                if (festival) {
                                                    const colors = getTraditionColors(festival.tradition);
                                                    customStyle = {
                                                        background: colors.primary,
                                                        border: `1px solid ${colors.secondary}`
                                                    };
                                                }
                                            }

                                            return (
                                                <div
                                                    key={sIdx}
                                                    className={`segment ${sIdx % 2 === 0 ? 'even' : 'odd'}`}
                                                    style={{ ...customStyle, left: `${startPct}%`, width: `${width}%` }}
                                                >
                                                    <div className="segment-content">
                                                        {seg.isPrimary && <span className="primary-star">★</span>}
                                                        <span className="segment-name">{seg.name}</span>
                                                    </div>
                                                    {endPct < 98 && (
                                                        <div className="segment-end-time">
                                                            {localFormatTime(seg.endTime)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="current-time-container">
                                <div className="coordinate-system">
                                    {currentTimePercent >= 0 && currentTimePercent <= 100 && (
                                        <div className="current-time-indicator" style={{ left: `${currentTimePercent}%` }}>
                                            <div className="time-pill">
                                                {localFormatTime(currentTime)}
                                            </div>
                                            <div className="indicator-line">
                                                <div className="indicator-dot"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanchangTimeline;
