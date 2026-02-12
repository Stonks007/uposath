
import React, { useMemo } from 'react';
import type { TimelineData, TimelineRow } from '../services/panchangTimeline';
import { formatTime } from '../services/timeUtils';
import { checkFestival, getTraditionColors } from '../services/buddhistFestivalService';
import { getObserver } from '../services/locationManager';
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
    // We visualize from Sunrise to next Sunrise (24 hour window)
    // Actually, usually it's easier to visualize from Sunrise to Sunrise+24h.
    // The library's `data` usually covers the current solar day (sunrise to next sunrise).

    const dayStart = data.sunrise || new Date(); // Fallback if null, though unlikely in logic
    // Define window duration in Ms
    const durationMs = 24 * 60 * 60 * 1000;

    // Helper: Time to %
    const getPercent = (time: Date): number => {
        let diff = time.getTime() - dayStart.getTime();
        // If diff is negative (e.g. time is before sunrise?)
        // In the context of "Panchangam", tithi data usually starts *at* sunrise.
        // But if we are displaying "Current Time" which might be before sunrise (if user checks at 4 AM),
        // we might have an issue if dayStart is "today's sunrise" (which is in future 6AM).
        // BUT `data` comes from `getUposathaStatus` which uses `getPanchangam(date)`.
        // If `date` is 4 AM, library shifts to *previous* day's sunrise.
        // So `dayStart` should be in the past compared to now (usually).

        // Handle wrap around next day
        if (diff < 0) {
            // This shouldn't happen if data matches current viewing context correctly.
            // But for safety:
            return 0;
        }

        return (diff / durationMs) * 100;
    };

    // Helper: Local wrapper for uniform formatting
    const localFormatTime = (date?: Date | null) => formatTime(date, timezone);

    const currentTimePercent = getPercent(currentTime);
    const sunsetPercent = data.sunset ? getPercent(data.sunset) : null;

    // Generate Hour Markers
    // Start from hour after sunrise
    const hourMarkers = [];
    const startHour = dayStart.getHours();
    const startMinute = dayStart.getMinutes();

    // We want to place markers at exact hours (e.g. 7:00, 8:00)
    // First hour mark:
    const firstMarkTime = new Date(dayStart);
    firstMarkTime.setMinutes(0, 0, 0);
    if (dayStart.getMinutes() > 0) {
        firstMarkTime.setHours(startHour + 1);
    }

    // Generate for next 24 hours
    for (let i = 0; i < 25; i++) {
        const mark = new Date(firstMarkTime);
        mark.setHours(firstMarkTime.getHours() + i);

        const pct = getPercent(mark);
        if (pct >= 0 && pct <= 100) {
            hourMarkers.push({
                time: mark,
                percent: pct,
                label: mark.getHours()
            });
        }
    }

    return (
        <div className="timeline-section glass-card">
            <div className="panchang-timeline">

                {/* Header */}
                <div className="timeline-header">
                    <div className="header-left">
                        <span className="timeline-icon">📊</span>
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
                    {/* Left Labels */}
                    <div className="labels-column">
                        <div className="label-spacer"></div>
                        {data.rows.map((row, i) => (
                            <div key={i} className={`row-label ${row.type === 'vara' ? 'weekday-label' : ''}`}>
                                <span className="row-icon">{row.icon}</span>
                                <span className="row-text">{row.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Timeline Content */}
                    <div className="timeline-content">

                        {/* Time Scale */}
                        <div className="time-scale">
                            <div className="timeline-baseline"></div>

                            {/* Sunrise Marker (0%) */}
                            <div className="sun-marker sunrise-marker" style={{ left: '0%' }}>
                                <div className="sun-icon-wrapper sunrise-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>
                                </div>
                                <span className="sun-time">{localFormatTime(dayStart)}</span>
                            </div>

                            {/* Hour Markers */}
                            {hourMarkers.map((m, i) => (
                                <div key={i} className={`hour-marker ${m.label === 12 ? 'noon' : ''}`} style={{ left: `${m.percent}%` }}>
                                    <span className="hour-tick"></span>
                                    <span className="hour-label">{m.label}</span>
                                </div>
                            ))}

                            {/* Sunset Marker */}
                            {sunsetPercent && (
                                <div className="sun-marker sunset-marker" style={{ left: `${sunsetPercent}%` }}>
                                    <div className="sun-icon-wrapper sunset-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>
                                    </div>
                                    <span className="sun-time">{localFormatTime(data.sunset)}</span>
                                </div>
                            )}

                            {/* Next Sunrise Marker (100%) */}
                            <div className="sun-marker sunrise-marker" style={{ left: '100%' }}>
                                <div className="sun-icon-wrapper sunrise-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path><circle cx="12" cy="12" r="4"></circle><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>
                                </div>
                                <span className="sun-time">Next Day</span>
                            </div>
                        </div>

                        {/* Rows */}
                        {data.rows.map((row, rIdx) => (
                            <div key={rIdx} className={`timeline-row ${row.type === 'vara' ? 'weekday-row' : ''}`}>
                                <div className="row-track">
                                    {row.segments.map((seg, sIdx) => {
                                        const startPct = Math.max(0, getPercent(seg.startTime));
                                        // If end time > next sunrise (which is durationMs away), clip to 100
                                        const endPct = Math.min(100, getPercent(seg.endTime));

                                        // Some segments might start before sunrise (shouldn't happen with our logic) or end way later.
                                        // Width
                                        const width = endPct - startPct;

                                        if (width <= 0) return null; // Off screen

                                        // Cycle classes
                                        const colorClass = sIdx % 2 === 0 ? 'primary' : 'secondary';

                                        // Tradition-specific styling for festivals
                                        const observer = getObserver({ name: '', latitude: 0, longitude: 0, altitude: 0 }); // Placeholder for getPercent logic
                                        // We need the ACTUAL observer from props or context eventually, 
                                        // but for now we detect the festival name and matching tradition.

                                        let customStyle: React.CSSProperties = {};
                                        if (row.type === 'tithi') {
                                            const festival = checkFestival(seg.startTime, {} as any, data.panchangam);
                                            if (festival) {
                                                const colors = getTraditionColors(festival.tradition);
                                                customStyle = {
                                                    background: colors.primary,
                                                    color: colors.text,
                                                    border: `1px solid ${colors.secondary}`,
                                                    boxShadow: `0 0 10px ${colors.accent}`
                                                };
                                            }
                                        }

                                        return (
                                            <div
                                                key={sIdx}
                                                className={`segment segment-${rIdx} ${colorClass} ${row.type === 'vara' ? 'segment-weekday' : ''}`}
                                                style={{ ...customStyle, left: `${startPct}%`, width: `${width}%` }}
                                            >
                                                {seg.isPrimary && <span className="primary-badge" style={customStyle.color ? { color: customStyle.color } : {}}>★</span>}
                                                <span className="segment-name" style={customStyle.color ? { color: customStyle.color } : {}}>{seg.name}</span>

                                                {/* Transition Time Marker (if not end of day) */}
                                                {(endPct < 99) && (
                                                    <div className="transition-marker">
                                                        <span className="transition-time">{localFormatTime(seg.endTime)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Current Time Indicator */}
                        {currentTimePercent >= 0 && currentTimePercent <= 100 && (
                            <div className="current-time-indicator" style={{ left: `${currentTimePercent}%` }}>
                                <div className="current-time-label">{localFormatTime(currentTime)}</div>
                                <div className="current-time-dot"></div>
                                <div className="current-time-line"></div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanchangTimeline;
