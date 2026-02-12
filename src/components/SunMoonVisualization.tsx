
import React from 'react';

interface SunMoonVisualizationProps {
    sunrise: Date | null;
    sunset: Date | null;
    moonrise: Date | null;
    moonset: Date | null;
}

const SunMoonVisualization: React.FC<SunMoonVisualizationProps> = ({ sunrise, sunset, moonrise, moonset }) => {
    return (
        <div className="card-glass" style={{ padding: '16px', margin: '16px 0' }}>
            <h3 className="text-base font-bold">Sun & Moon</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                <div>
                    <div>🌅 Rise: {sunrise?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>🌇 Set: {sunset?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div>
                    <div>☾↑ Rise: {moonrise?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>☾↓ Set: {moonset?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        </div>
    );
};

export default SunMoonVisualization;
