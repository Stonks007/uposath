
import React from 'react';
import type { GrahaCard } from '../services/grahaPositionService';

interface GrahaGridProps {
    grahas: GrahaCard[];
}

const GrahaGrid: React.FC<GrahaGridProps> = ({ grahas }) => {
    return (
        <div className="graha-grid">
            {grahas.map((g) => (
                <div key={g.id} className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{g.icon}</div>
                    <div className="text-xs font-bold">{g.sanskritName}</div>
                    <div className="text-xs text-gray-500">{g.englishName}</div>
                    <div style={{ margin: '8px 0', width: '100%', height: '1px', background: 'rgba(0,0,0,0.1)' }} />
                    <div style={{ fontSize: '1.2rem' }}>{g.rashiSymbol}</div>
                    <div className="text-xs">{g.rashiName}</div>
                    <div className="text-xs text-gray-400 mt-1">
                        {g.degree.toFixed(2)}° {g.isRetrograde ? 'ℛ' : ''}
                    </div>
                    {g.dignity !== 'neutral' && (
                        <div style={{
                            marginTop: '4px',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: g.dignity === 'exalted' ? '#E8F5E9' : '#FFEBEE',
                            color: g.dignity === 'exalted' ? '#2E7D32' : '#C62828'
                        }}>
                            {g.dignity.toUpperCase()}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default GrahaGrid;
