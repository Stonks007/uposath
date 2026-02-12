
import React from 'react';
import type { HoraSegment } from '../services/horaCalculator';

interface HoraTableProps {
    horas: HoraSegment[];
}

const HoraTable: React.FC<HoraTableProps> = ({ horas }) => {
    return (
        <div className="card-glass" style={{ padding: '0', margin: '16px 0' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <h3 className="text-base font-bold" style={{ margin: 0 }}>Planetary Hours</h3>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {horas.map((hora, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 1fr',
                            padding: '8px 12px',
                            backgroundColor: hora.isCurrent ? 'rgba(var(--ion-color-secondary-rgb), 0.1)' : 'transparent',
                            borderLeft: hora.isCurrent ? '4px solid var(--ion-color-secondary)' : '4px solid transparent'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', color: '#666' }}>{hora.horaNumber}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{hora.planetSymbol}</span>
                            <span>{hora.planet}</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#666' }}>
                            {hora.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {hora.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HoraTable;
