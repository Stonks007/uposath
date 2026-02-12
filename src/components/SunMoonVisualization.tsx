import React, { useMemo } from 'react';
import type { SavedLocation } from '../services/locationManager';
import { formatTime } from '../services/timeUtils';
import './SunMoonVisualization.css';

interface SunMoonVisualizationProps {
    sunrise: Date | null;
    nextSunrise: Date | null;
    sunset: Date | null;
    moonrise: Date | null;
    moonset: Date | null;
    currentTime?: Date;
    location?: SavedLocation;
}

const SunMoonVisualization: React.FC<SunMoonVisualizationProps> = ({
    sunrise,
    nextSunrise,
    sunset,
    moonrise,
    moonset,
    currentTime = new Date(),
    location
}) => {
    // Standardized durations
    const dayStart = sunrise || new Date(new Date(currentTime).setHours(6, 0, 0, 0));
    const dayEnd = nextSunrise || new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const durationMs = dayEnd.getTime() - dayStart.getTime();

    // Canvas dimensions
    const width = 800;
    const height = 220; // Reduced from 240
    const horizonY = 160;
    const minPeakY = 30; // Max height in sky (lowest Y value)

    const paddingX = 40; // Horizontal padding to prevent edge clipping

    // Helper: Time to X coordinate (relative to sunrise window)
    const timeToX = (date: Date): number => {
        let diff = date.getTime() - dayStart.getTime();
        // If it's before sunrise (very early morning), we still want to map it if possible, 
        // but for this visualization we strictly map from sunrise (0..100%)
        let pct = diff / durationMs;
        return paddingX + pct * (width - 2 * paddingX);
    };

    // Helper: Calculate peak Y based on duration (longer transit = higher arc)
    const getPeakY = (start: Date, end: Date): number => {
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const heightFactor = Math.min(1.2, Math.max(0.4, durationHours / 12));
        const peakHeight = (horizonY - minPeakY) * heightFactor;
        return horizonY - peakHeight;
    };

    const canvasWidth = width - 2 * paddingX;

    // Helper: Generate path curve
    // Note: We only care about the part of the arc that intersects our display window (dayStart to dayEnd)
    const generatePath = (start: Date, end: Date): string => {
        const startX = timeToX(start);
        const endX = timeToX(end);
        const peakY = getPeakY(start, end);
        const midX = (startX + endX) / 2;
        return `M ${startX} ${horizonY} Q ${midX} ${peakY} ${endX} ${horizonY}`;
    };

    // Helper: Get point on curve at current time
    const getPointOnCurve = (start: Date, end: Date, current: Date): { x: number, y: number } | null => {
        const startMs = start.getTime();
        const endMs = end.getTime();
        const currMs = current.getTime();

        // Object must be between its rise and set
        if (currMs < startMs || currMs > endMs) return null;

        // And it must be within our visualization window (dayStart to dayEnd)
        // Actually, let's just return the point, and the SVG clipping or parent logic will handle it.
        // But for "current time dot", it must be in the window.
        if (currMs < dayStart.getTime() || currMs > dayEnd.getTime()) return null;

        const t = (currMs - startMs) / (endMs - startMs);
        const startX = timeToX(start);
        const endX = timeToX(end);
        const peakY = getPeakY(start, end);
        const midX = (startX + endX) / 2;

        const P0 = { x: startX, y: horizonY };
        const P1 = { x: midX, y: peakY };
        const P2 = { x: endX, y: horizonY };

        const x = Math.pow(1 - t, 2) * P0.x + 2 * (1 - t) * t * P1.x + Math.pow(t, 2) * P2.x;
        const y = Math.pow(1 - t, 2) * P0.y + 2 * (1 - t) * t * P1.y + Math.pow(t, 2) * P2.y;

        return { x, y };
    };

    // Memoize Stars to prevent flickering
    const stars = useMemo(() => {
        return [...Array(40)].map((_, i) => ({
            id: i,
            x: Math.random() * width,
            y: Math.random() * (horizonY - 20),
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.7 + 0.3,
            delay: Math.random() * 5
        }));
    }, []);

    // --- Graph Logic ---
    const sunStart = dayStart; // Sunrise
    const sunEnd = sunset || new Date(dayStart.getTime() + 12 * 60 * 60 * 1000);
    const sunPathD = generatePath(sunStart, sunEnd);
    const sunPos = getPointOnCurve(sunStart, sunEnd, currentTime);

    // Moon:
    const moonCurves: { start: Date; end: Date; path: string }[] = [];
    if (moonrise && moonset) {
        if (moonrise < moonset) {
            // Moon rises and sets on same 24h block? 
            // Or more likely, we just show the part in our window.
            moonCurves.push({ start: moonrise, end: moonset, path: generatePath(moonrise, moonset) });
        } else {
            // Wraps around - handle two potential arcs hitting our window
            const yesterdayRise = new Date(moonrise.getTime() - 24.8 * 60 * 60 * 1000);
            const tomorrowSet = new Date(moonset.getTime() + 24.8 * 60 * 60 * 1000);

            // Previous day's moon that is setting today
            moonCurves.push({ start: yesterdayRise, end: moonset, path: generatePath(yesterdayRise, moonset) });
            // Today's moon that rises and sets tomorrow
            moonCurves.push({ start: moonrise, end: tomorrowSet, path: generatePath(moonrise, tomorrowSet) });
        }
    } else if (moonrise) {
        const estSet = new Date(moonrise.getTime() + 12 * 60 * 60 * 1000);
        moonCurves.push({ start: moonrise, end: estSet, path: generatePath(moonrise, estSet) });
    } else if (moonset) {
        const estRise = new Date(moonset.getTime() - 12 * 60 * 60 * 1000);
        moonCurves.push({ start: estRise, end: moonset, path: generatePath(estRise, moonset) });
    }

    let moonPos: { x: number, y: number } | null = null;
    for (const curve of moonCurves) {
        const pos = getPointOnCurve(curve.start, curve.end, currentTime);
        if (pos) {
            moonPos = pos;
            break;
        }
    }

    const currentX = timeToX(currentTime);
    const localFormatTime = (date?: Date | null) => formatTime(date, location?.timezone);

    // Grid: Hour ticks relative to sunrise
    const hourMarkers = useMemo(() => {
        const markers = [];
        const firstHour = new Date(dayStart);
        firstHour.setMinutes(0, 0, 0);
        if (dayStart.getMinutes() > 0) firstHour.setHours(dayStart.getHours() + 1);

        for (let i = 0; i < 28; i++) {
            const mTime = new Date(firstHour);
            mTime.setHours(firstHour.getHours() + i);
            if (mTime.getTime() > dayEnd.getTime()) break;

            const h = mTime.getHours();
            if (h % 3 === 0) { // Show every 3 hours to keep mobile clean
                markers.push({
                    x: timeToX(mTime),
                    label: h === 12 ? 'Noon' : h === 0 ? 'Mid' : h > 12 ? `${h - 12}p` : `${h}a`
                });
            }
        }
        return markers;
    }, [dayStart, dayEnd, durationMs]);

    return (
        <div className="sunrise-timeline-container glass-card">
            <div className="timeline-header">
                <div className="header-left">
                    <span className="timeline-icon">🌌</span>
                    <span className="timeline-title">Sky Chart</span>
                </div>
                <div className="header-right">
                    <span className="location-badge">
                        {location?.name || 'Local Sky'}
                    </span>
                </div>
            </div>

            <div className="timeline-graph-wrapper">
                <svg viewBox={`0 0 ${width} ${height}`} className="timeline-svg" preserveAspectRatio="xMidYMin meet">
                    <defs>
                        <linearGradient id="sunGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(255, 220, 100, 0.45)" />
                            <stop offset="100%" stopColor="rgba(255, 150, 0, 0)" />
                        </linearGradient>
                        <linearGradient id="moonGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(200, 210, 255, 0.3)" />
                            <stop offset="100%" stopColor="rgba(150, 160, 220, 0)" />
                        </linearGradient>
                        <filter id="sunGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <filter id="moonGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(15, 20, 45, 0.6)" />
                            <stop offset="100%" stopColor="rgba(10, 10, 20, 0.2)" />
                        </linearGradient>
                    </defs>

                    <rect x="0" y="0" width={width} height={horizonY} fill="url(#skyGradient)" rx="12" />

                    {stars.map(star => (
                        <circle
                            key={star.id}
                            cx={star.x}
                            cy={star.y}
                            r={star.size}
                            fill="white"
                            opacity={star.opacity}
                            className="star"
                            style={{ animationDelay: `${star.delay}s` }}
                        />
                    ))}

                    {/* Accurate Grid */}
                    {hourMarkers.map((m, i) => (
                        <g key={i}>
                            <line x1={m.x} y1="20" x2={m.x} y2={horizonY} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
                            <text x={m.x} y={horizonY + 20} textAnchor="middle" className="time-grid-label">
                                {m.label}
                            </text>
                        </g>
                    ))}

                    {/* Sun Path */}
                    <path d={sunPathD} fill="url(#sunGradient)" className="sun-path-fill" />
                    <path d={sunPathD} stroke="rgba(255, 215, 0, 0.5)" strokeWidth="2" strokeDasharray="6 4" fill="none" />

                    {/* Moon Paths */}
                    {moonCurves.map((curve, i) => (
                        <path key={i} d={curve.path} fill="url(#moonGradient)" stroke="rgba(170, 180, 255, 0.4)" strokeWidth="1.5" strokeDasharray="3 4" />
                    ))}

                    {/* Horizon */}
                    <line x1="0" y1={horizonY} x2={width} y2={horizonY} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

                    {/* Events */}
                    <g transform={`translate(${timeToX(dayStart)}, ${horizonY})`}>
                        <circle r="4" fill="#FF9F43" />
                        <text y="42" textAnchor="middle" className="event-label-tiny">RISE {localFormatTime(sunStart)}</text>
                    </g>
                    {sunset && (
                        <g transform={`translate(${timeToX(sunset)}, ${horizonY})`}>
                            <circle r="4" fill="#FF4757" />
                            <text y="42" textAnchor="middle" className="event-label-tiny">SET {localFormatTime(sunset)}</text>
                        </g>
                    )}
                    <g transform={`translate(${timeToX(dayEnd)}, ${horizonY})`}>
                        <circle r="4" fill="#FF9F43" />
                        <text y="42" textAnchor="middle" className="event-label-tiny">NEXT {localFormatTime(dayEnd)}</text>
                    </g>

                    {/* Now Line */}
                    {currentX >= paddingX && currentX <= width - paddingX && (
                        <g>
                            <line x1={currentX} y1="0" x2={currentX} y2={horizonY + 45} className="current-time-line" />
                            <text x={currentX} y="15" textAnchor="middle" className="current-time-label">NOW</text>
                        </g>
                    )}

                    {/* Sun Icon */}
                    {sunPos && (
                        <g transform={`translate(${sunPos.x}, ${sunPos.y})`} filter="url(#sunGlow)">
                            <circle r="14" fill="#FFD700" />
                            <circle r="18" fill="rgba(255, 215, 0, 0.25)" />
                        </g>
                    )}

                    {/* Moon Icon */}
                    {moonPos && (
                        <g transform={`translate(${moonPos.x}, ${moonPos.y})`} filter="url(#moonGlow)">
                            <circle r="12" fill="#E8E8F0" />
                            <circle r="16" fill="rgba(200, 210, 255, 0.15)" />
                        </g>
                    )}
                </svg>
            </div>

            <div className="timeline-legend">
                <div className="legend-item"><span className="dot sun-dot"></span> Sun</div>
                <div className="legend-item"><span className="dot moon-dot"></span> Moon</div>
                <div className="legend-item"><span className="dot time-dot"></span> Time</div>
            </div>
        </div>
    );
};

export default SunMoonVisualization;
