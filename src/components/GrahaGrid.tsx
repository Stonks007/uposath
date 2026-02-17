
import React from 'react';
import type { GrahaCard } from '../services/grahaPositionService';
import { IonIcon } from '@ionic/react';
import { starOutline } from 'ionicons/icons';

interface GrahaGridProps {
    grahas: GrahaCard[];
}

const getGrahaColor = (name: string) => {
    switch (name.toLowerCase()) {
        case 'surya': case 'sun': return '#F59E0B';
        case 'chandra': case 'moon': return '#60A5FA';
        case 'mangal': case 'mars': return '#EF4444';
        case 'budha': case 'mercury': return '#10B981';
        case 'guru': case 'jupiter': return '#8B5CF6';
        case 'shukra': case 'venus': return '#EC4899';
        case 'shani': case 'saturn': return '#4B5563';
        case 'rahu': return '#78350F';
        case 'ketu': return '#374151';
        default: return '#6B7280';
    }
};

const GrahaGrid: React.FC<GrahaGridProps> = ({ grahas }) => {
    return (
        <div style={{ padding: '8px 0' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                padding: '0 8px'
            }}>
                <IonIcon icon={starOutline} style={{ color: 'var(--color-accent-primary)', fontSize: '1.2rem' }} />
                <h3 className="text-lg font-bold" style={{ margin: 0, color: 'var(--color-text-primary)' }}>Celestial Positions (Graha)</h3>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
            }}>
                {grahas.map((g) => {
                    const color = getGrahaColor(g.englishName);

                    return (
                        <div
                            key={g.id}
                            style={{
                                background: 'var(--color-bg-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '24px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative',
                                boxShadow: 'var(--shadow-md)',
                                transition: 'transform 0.2s ease',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Intensity Glow Background */}
                            <div style={{
                                position: 'absolute',
                                top: '-20%',
                                right: '-20%',
                                width: '60%',
                                height: '60%',
                                background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
                                zIndex: 0
                            }} />

                            {/* Planet Icon/Symbol Header */}
                            <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '16px',
                                background: `${color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                marginBottom: '12px',
                                zIndex: 1
                            }}>
                                {g.icon}
                            </div>

                            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--color-text-primary)', zIndex: 1 }}>
                                {g.sanskritName}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', zIndex: 1 }}>
                                {g.englishName}
                            </div>

                            {/* Main Info Row */}
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '10px',
                                borderRadius: '14px',
                                width: '100%',
                                marginBottom: '12px',
                                zIndex: 1
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '1.1rem', color: color }}>{g.rashiSymbol}</span>
                                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{g.rashiName}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                                    {g.degree.toFixed(2)}° {g.isRetrograde ? <span style={{ color: '#EF4444' }}>℞</span> : ''}
                                </div>
                            </div>

                            {/* Nakshatra & Pada */}
                            <div style={{ width: '100%', marginBottom: '8px', zIndex: 1 }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nakshatra</div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-accent-primary)' }}>
                                    {g.nakshatraName}-{g.nakshatraPada}
                                </div>
                            </div>

                            {/* Avastha (Baladi) */}
                            <div style={{ width: '100%', marginBottom: '12px', zIndex: 1 }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Avastha</div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                                    {g.avastha}
                                </div>
                            </div>

                            {/* Dignity & Intuitive Intensity Scale */}
                            <div style={{ width: '100%', marginTop: 'auto', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                        Dignity
                                    </div>
                                    <div style={{
                                        fontSize: '0.65rem',
                                        fontWeight: '800',
                                        color: g.intensity > 70 ? '#10B981' : (g.intensity < 30 ? '#EF4444' : 'var(--color-text-secondary)'),
                                        textTransform: 'uppercase'
                                    }}>
                                        {g.intensity > 90 ? 'Deeply Exalted' :
                                            g.intensity > 70 ? 'Exalted' :
                                                g.intensity > 30 ? 'Neutral' :
                                                    g.intensity > 10 ? 'Debilitated' : 'Deeply Debilitated'}
                                    </div>
                                </div>

                                {/* Bipolar Intensity Scale */}
                                <div style={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '6px',
                                    background: 'linear-gradient(to right, #EF4444 0%, #4B5563 50%, #10B981 100%)',
                                    borderRadius: '3px',
                                    marginBottom: '4px'
                                }}>
                                    {/* Center Notch */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '2px',
                                        height: '10px',
                                        background: 'rgba(255,255,255,0.3)',
                                        zIndex: 1
                                    }} />

                                    {/* Indicator Pointer */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${g.intensity}%`,
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '10px',
                                        height: '10px',
                                        background: 'white',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                        border: '2px solid var(--color-bg-card)',
                                        zIndex: 2,
                                        transition: 'left 1s ease-out'
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--color-text-muted)', fontWeight: '700' }}>
                                    <span>DEB</span>
                                    <span>NEUTRAL</span>
                                    <span>EXA</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginTop: '16px',
                padding: '0 24px',
                lineHeight: '1.4',
                opacity: 0.8
            }}>
                Positions calculated using Sidereal (Lahiri) Ayanamsa for the given location and time. <br />
                Scale represents proximity to Deep Exaltation (EXA) or Deep Debilitation (DEB).
            </p>
        </div>
    );
};

export default GrahaGrid;
