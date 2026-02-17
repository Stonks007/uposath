import React, { useEffect, useRef } from 'react';
import type { HoraSegment } from '../services/horaCalculator';
import { formatTime } from '../services/timeUtils';
import { IonIcon } from '@ionic/react';
import { timeOutline } from 'ionicons/icons';

interface HoraTableProps {
    horas: HoraSegment[];
    timezone?: string;
}

const getPlanetColor = (planet: string) => {
    switch (planet.toLowerCase()) {
        case 'sun': return '#F59E0B'; // Amber
        case 'moon': return '#60A5FA'; // Blue
        case 'mars': return '#EF4444'; // Red
        case 'mercury': return '#10B981'; // Emerald
        case 'jupiter': return '#8B5CF6'; // Violet
        case 'venus': return '#EC4899'; // Pink
        case 'saturn': return '#6B7280'; // Gray
        default: return '#6B7280';
    }
};

const HoraTable: React.FC<HoraTableProps> = ({ horas, timezone }) => {
    const currentHoraRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Delay slightly to ensure tab animation finishes
        const timer = setTimeout(() => {
            if (currentHoraRef.current) {
                currentHoraRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [horas]); // Re-run if horas change (e.g. date change)

    return (
        <div style={{ padding: '0', margin: '8px 0' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                padding: '0 8px'
            }}>
                <IonIcon icon={timeOutline} style={{ color: 'var(--color-accent-primary)', fontSize: '1.2rem' }} />
                <h3 className="text-lg font-bold" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Planetary Hours (Hora)</h3>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
                {horas.map((hora, i) => {
                    const planetColor = getPlanetColor(hora.planet);
                    const isCurrent = hora.isCurrent;

                    return (
                        <div
                            key={i}
                            ref={isCurrent ? currentHoraRef : null}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: isCurrent ? 'var(--color-bg-card-hover)' : 'var(--color-bg-card)',
                                borderRadius: '16px',
                                border: isCurrent ? `2px solid ${planetColor}` : '1px solid var(--color-border)',
                                boxShadow: isCurrent ? `0 8px 20px -6px ${planetColor}40` : 'none',
                                transition: 'all 0.3s ease',
                                transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isCurrent && (
                                <div style={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: planetColor,
                                    boxShadow: `0 0 10px ${planetColor}`
                                }} />
                            )}

                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: `${planetColor}20`,
                                color: planetColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '0.9rem',
                                marginRight: '16px'
                            }}>
                                {hora.horaNumber}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '1.4rem' }}>{hora.planetSymbol}</span>
                                    <span style={{ fontWeight: '700', fontSize: '1rem', color: isCurrent ? planetColor : 'var(--color-text-primary)' }}>
                                        {hora.planet}
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                    {formatTime(hora.startTime, timezone)} – {formatTime(hora.endTime, timezone)}
                                </div>
                            </div>

                            {isCurrent && (
                                <div style={{
                                    fontSize: '0.65rem',
                                    fontWeight: '800',
                                    color: planetColor,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    background: `${planetColor}15`,
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}>
                                    Now
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <p style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginTop: '16px',
                padding: '0 24px',
                lineHeight: '1.4'
            }}>
                The planetary horas change with sunset and sunrise. <br />
                Day Horas: 1-12 | Night Horas: 13-24
            </p>
        </div>
    );
};

export default HoraTable;
