import type { HoraSegment } from '../services/horaCalculator';
import { formatTime } from '../services/timeUtils';

interface HoraTableProps {
    horas: HoraSegment[];
    timezone?: string;
}

const HoraTable: React.FC<HoraTableProps> = ({ horas, timezone }) => {
    return (
        <div className="glass-card" style={{ padding: '0', margin: '16px 0' }}>
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
                            {formatTime(hora.startTime, timezone)} – {formatTime(hora.endTime, timezone)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HoraTable;
