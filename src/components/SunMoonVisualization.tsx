
import React, { useMemo } from 'react';
import './SunMoonVisualization.css';

interface SunMoonVisualizationProps {
    sunrise: Date | null;
    sunset: Date | null;
    moonrise: Date | null;
    moonset: Date | null;
    currentTime?: Date;
}

const SunMoonVisualization: React.FC<SunMoonVisualizationProps> = ({
    sunrise,
    sunset,
    moonrise,
    moonset,
    currentTime = new Date()
}) => {
    // Canvas dimensions
    const width = 800;
    const height = 280;
    const horizonY = 180;
    const peakY = 40;

    // Helper: Time to X coordinate (0..800)
    const timeToX = (date: Date): number => {
        const h = date.getHours();
        const m = date.getMinutes();
        const totalMinutes = h * 60 + m;
        return (totalMinutes / 1440) * width;
    };

    // Helper: Generate path curve
    // We use a quadratic bezier.
    // Start: (startX, horizonY)
    // End: (endX, horizonY)
    // Control: (midX, peakY)
    const generatePath = (start: Date, end: Date): string => {
        let startX = timeToX(start);
        let endX = timeToX(end);

        // Handle wrapping (if end < start, it implies crossing midnight, but for single-day visualization we handle simple cases)
        // If endX < startX, it usually means it sets the next day.
        // In that case, we might want to extend the curve off-screen.
        // For simplicity, if end is "tomorrow", we project X > width.

        if (end.getDate() !== start.getDate() && end.getHours() < start.getHours()) {
            endX += width; // Approximate next day projection
        }

        const midX = (startX + endX) / 2;
        // Peak Y is lowest (SVG coords)
        return `M ${startX} ${horizonY} Q ${midX} ${peakY} ${endX} ${horizonY}`;
    };

    // Helper: Get point on curve at current time
    const getPointOnCurve = (start: Date, end: Date, current: Date): { x: number, y: number } | null => {
        const startMs = start.getTime();
        const endMs = end.getTime();
        const currMs = current.getTime();

        if (currMs < startMs || currMs > endMs) return null;

        const t = (currMs - startMs) / (endMs - startMs); // 0 to 1

        // Quadratic Bezier Formula:
        // P = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
        const startX = timeToX(start);
        let endX = timeToX(end);
        if (end.getDate() !== start.getDate() && end.getHours() < start.getHours()) endX += width;

        const midX = (startX + endX) / 2;

        const P0 = { x: startX, y: horizonY };
        const P1 = { x: midX, y: peakY }; // Control point
        const P2 = { x: endX, y: horizonY };

        const x = Math.pow(1 - t, 2) * P0.x + 2 * (1 - t) * t * P1.x + Math.pow(t, 2) * P2.x;
        const y = Math.pow(1 - t, 2) * P0.y + 2 * (1 - t) * t * P1.y + Math.pow(t, 2) * P2.y;

        // Clip if x is wildly off-screen (though SVG handles it)
        return { x, y };
    };

    // --- Graph Logic ---

    // Sun: Simple single arc
    const sunStart = sunrise || new Date(new Date().setHours(6, 0, 0, 0));
    const sunEnd = sunset || new Date(new Date().setHours(18, 0, 0, 0));
    const sunPathD = generatePath(sunStart, sunEnd);
    const sunPos = getPointOnCurve(sunStart, sunEnd, currentTime);

    // Moon: Complex logic
    // We define up to 2 curves to handle split days (set in morning, rise in evening)
    const moonCurves: { start: Date; end: Date; path: string }[] = [];

    // Heuristic:
    if (moonrise && moonset) {
        if (moonrise < moonset) {
            // Rise then Set (Day/Night transit)
            moonCurves.push({ start: moonrise, end: moonset, path: generatePath(moonrise, moonset) });
        } else {
            // Set then Rise (Morning set, Evening rise)
            // Curve 1: Start of day -> Set (approximate start as set - 12h)
            const simulatedRise = new Date(moonset.getTime() - 12 * 60 * 60 * 1000);
            moonCurves.push({ start: simulatedRise, end: moonset, path: generatePath(simulatedRise, moonset) });

            // Curve 2: Rise -> End of day (approximate end as rise + 12h)
            const simulatedSet = new Date(moonrise.getTime() + 12 * 60 * 60 * 1000);
            moonCurves.push({ start: moonrise, end: simulatedSet, path: generatePath(moonrise, simulatedSet) });
        }
    } else if (moonrise && !moonset) {
        // Rises, doesn't set today
        const simulatedSet = new Date(moonrise.getTime() + 12 * 60 * 60 * 1000);
        moonCurves.push({ start: moonrise, end: simulatedSet, path: generatePath(moonrise, simulatedSet) });
    } else if (moonset && !moonrise) {
        // Sets, didn't rise today
        const simulatedRise = new Date(moonset.getTime() - 12 * 60 * 60 * 1000);
        moonCurves.push({ start: simulatedRise, end: moonset, path: generatePath(simulatedRise, moonset) });
    }

    // Determine Moon Position
    let moonPos: { x: number, y: number } | null = null;
    for (const curve of moonCurves) {
        const pos = getPointOnCurve(curve.start, curve.end, currentTime);
        if (pos) {
            moonPos = pos;
            break;
        }
    }

    const currentX = timeToX(currentTime);

    // Grid lines labels
    const gridTimes = [0, 3, 6, 9, 12, 15, 18, 21]; // hours

    return (
        <div className="sunrise-timeline-container">
            <div className="timeline-header">
                <div className="header-left">
                    <span className="timeline-icon">🌅</span>
                    <span className="timeline-title">Sun & Moon Timeline</span>
                </div>
                <div className="header-right">
                    <span className="current-time-badge">
                        🕐 {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="timeline-graph-wrapper">
                <svg viewBox={`0 0 ${width} ${height}`} className="timeline-svg" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="sunGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(255, 200, 50, 0.6)" />
                            <stop offset="100%" stopColor="rgba(255, 150, 0, 0.1)" />
                        </linearGradient>
                        <linearGradient id="moonGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(200, 200, 255, 0.4)" />
                            <stop offset="100%" stopColor="rgba(150, 150, 200, 0.05)" />
                        </linearGradient>
                        <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="skyGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="rgba(135, 206, 250, 0.15)" />
                            <stop offset="100%" stopColor="rgba(25, 25, 50, 0)" />
                        </linearGradient>
                        <clipPath id="moonClip">
                            <circle r="12" />
                        </clipPath>
                    </defs>

                    {/* Background */}
                    <rect x="0" y="0" width={width} height={horizonY} fill="url(#skyGradient)" />

                    {/* Random Stars - Static positions for consistency */}
                    {[...Array(20)].map((_, i) => (
                        <circle
                            key={i}
                            cx={Math.random() * width}
                            cy={Math.random() * (horizonY - 20)}
                            r={Math.random() * 1.5 + 0.5}
                            fill="white"
                            opacity={Math.random() * 0.5 + 0.2}
                            className="star"
                        />
                    ))}

                    {/* Horizon */}
                    <line x1="0" y1={horizonY} x2={width} y2={horizonY} className="horizon-line" />
                    <rect x="0" y={horizonY} width={width} height={height - horizonY} fill="rgba(40, 60, 40, 0.3)" rx="4" />

                    {/* Sun Path */}
                    <path d={sunPathD} fill="url(#sunGradient)" className="sun-path-fill" />
                    <path d={sunPathD} stroke="#FFD700" strokeWidth="3" strokeLinecap="round" className="sun-path-stroke" />

                    {/* Moon Path(s) */}
                    {moonCurves.map((curve, i) => (
                        <g key={i}>
                            <path d={curve.path} fill="url(#moonGradient)" className="moon-path-fill" />
                            <path d={curve.path} stroke="rgba(200, 200, 255, 0.8)" strokeWidth="2" strokeDasharray="8 4" className="moon-path-stroke" />
                        </g>
                    ))}

                    {/* Time Grid Lines */}
                    {gridTimes.map(hour => {
                        const x = (hour / 24) * width;
                        return (
                            <g key={hour}>
                                <line x1={x} y1="50" x2={x} y2={horizonY + 5} stroke="rgba(255,255,255,0.1)" strokeDasharray="2 4" />
                                <text x={x} y={horizonY + 20} textAnchor="middle" className="time-grid-label">
                                    {hour === 0 ? '12AM' : hour === 12 ? '12PM' : hour > 12 ? `${hour - 12}PM` : `${hour}AM`}
                                </text>
                            </g>
                        );
                    })}

                    {/* Current Time Line */}
                    <line x1={currentX} y1="20" x2={currentX} y2={horizonY + 10} className="current-time-line" />

                    {/* Sunrise Marker */}
                    {sunrise && (
                        <g className="event-marker sunrise-marker" transform={`translate(${timeToX(sunrise)}, 0)`}>
                            <line x1="0" y1={horizonY - 10} x2="0" y2={horizonY + 45} stroke="#FF9933" strokeWidth="2" strokeDasharray="4 2" />
                            <circle cx="0" cy={horizonY} r="6" fill="#FF9933" />
                            <text x="0" y={horizonY + 60} textAnchor="middle" className="event-label">🌅 {sunrise.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</text>
                        </g>
                    )}

                    {/* Sunset Marker */}
                    {sunset && (
                        <g className="event-marker sunset-marker" transform={`translate(${timeToX(sunset)}, 0)`}>
                            <line x1="0" y1={horizonY - 10} x2="0" y2={horizonY + 45} stroke="#E65C00" strokeWidth="2" strokeDasharray="4 2" />
                            <circle cx="0" cy={horizonY} r="6" fill="#E65C00" />
                            <text x="0" y={horizonY + 60} textAnchor="middle" className="event-label">🌇 {sunset.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</text>
                        </g>
                    )}

                    {/* Moon Markers */}
                    {moonrise && (
                        <g className="event-marker moonrise-marker" transform={`translate(${timeToX(moonrise)}, 0)`}>
                            {/* Short line just to mark axis if needed, or just dot */}
                            <circle cx="0" cy={horizonY} r="5" fill="#9090FF" />
                            <text x="0" y={horizonY + 75} textAnchor="middle" className="event-label moon-label">🌙↑ {moonrise.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</text>
                        </g>
                    )}
                    {moonset && (
                        <g className="event-marker moonset-marker" transform={`translate(${timeToX(moonset)}, 0)`}>
                            <circle cx="0" cy={horizonY} r="5" fill="#7070CC" />
                            <text x="0" y={horizonY + 75} textAnchor="middle" className="event-label moon-label">🌙↓ {moonset.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</text>
                        </g>
                    )}

                    {/* Sun Icon (animated position) */}
                    {sunPos && (
                        <g transform={`translate(${sunPos.x}, ${sunPos.y})`} filter="url(#sunGlow)" className="sun-icon">
                            <circle r="20" fill="rgba(255, 200, 50, 0.3)" />
                            <circle r="14" fill="rgba(255, 180, 0, 0.5)" />
                            <circle r="10" fill="#FFD700" />
                            <text y="4" textAnchor="middle" fontSize="14" className="celestial-emoji">☀️</text>
                        </g>
                    )}

                    {/* Moon Icon (animated position) */}
                    {moonPos && (
                        <g transform={`translate(${moonPos.x}, ${moonPos.y})`} filter="url(#moonGlow)" className="moon-icon" opacity="0.9">
                            <circle r="16" fill="rgba(200, 200, 255, 0.2)" />
                            <circle r="12" fill="#E8E8F0" />
                            {/* Simple crescent - using clip for now or just circle */}
                            <text y="4" textAnchor="middle" fontSize="14" className="celestial-emoji">🌙</text>
                        </g>
                    )}

                </svg>
            </div>

            <div className="timeline-legend">
                <div className="legend-item sun-legend">
                    <span className="legend-line sun-line"></span>
                    <span>Sun Path</span>
                </div>
                <div className="legend-item moon-legend">
                    <span className="legend-line moon-line"></span>
                    <span>Moon Path</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot current-dot"></span>
                    <span>Current Time</span>
                </div>
            </div>
        </div>
    );
};

export default SunMoonVisualization;
