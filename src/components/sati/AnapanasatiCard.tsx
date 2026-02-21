import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForward, flame } from 'ionicons/icons';
import { AnapanasatiService, AnapanasatiStats } from '../../services/AnapanasatiService';
import { useHistory } from 'react-router-dom';

const AnapanasatiCard: React.FC = () => {
    const history = useHistory();
    const [stats, setStats] = useState<AnapanasatiStats | null>(null);
    const [todaySummary, setTodaySummary] = useState({ count: 0, minutes: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const s = await AnapanasatiService.getStats();
        const t = await AnapanasatiService.getTodaySummary();
        setStats(s);
        setTodaySummary(t);
    };

    return (
        <div className="glass-card" onClick={() => history.push('/sati/anapanasati')} style={{
            margin: '0 0 24px',
            padding: '20px',
            cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="icon-wrapper icon-wrapper--medium" style={{ borderColor: 'var(--color-mahayana-accent)40', background: 'var(--color-mahayana-accent)10' }}>🧘</div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Ānāpānasati</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Mindfulness of Breathing</p>
                    </div>
                </div>
                <IonIcon icon={chevronForward} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                16 contemplations across 4 tetrads to develop concentration and insight.
            </p>

            <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--glass-border)'
            }}>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Today</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                        {todaySummary.count} sessions • {todaySummary.minutes}m
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Streak</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-mahayana-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {stats?.currentStreak || 0} days <IonIcon icon={flame} />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-mahayana-accent)', fontSize: '0.9rem' }}>
                Enter Practice →
            </div>
        </div>
    );
};

export default AnapanasatiCard;
