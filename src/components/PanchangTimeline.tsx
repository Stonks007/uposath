
import React from 'react';
import type { TimelineData } from '../services/panchangTimeline';

interface PanchangTimelineProps {
    data: TimelineData;
}

const PanchangTimeline: React.FC<PanchangTimelineProps> = ({ data }) => {
    // Simple rendering for now to validate data flow
    return (
        <div className="card-glass" style={{ padding: '16px', margin: '16px 0', overflowX: 'auto' }}>
            <h3 className="text-base font-bold">Panchang Timeline</h3>
            {data.rows.map((row, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{row.icon} {row.label}</div>
                    {row.segments.map((seg, j) => (
                        <div key={j} style={{ display: 'flex', fontSize: '0.8rem', marginLeft: '16px' }}>
                            <span style={{ width: '100px', fontWeight: (seg.isPrimary ? 'bold' : 'normal') }}>{seg.name}</span>
                            <span>{seg.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {seg.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default PanchangTimeline;
