import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForward, flame } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { MantraService } from '../../services/MantraService';
import { Mantra } from '../../types/SatiTypes';

const MantraNavCard: React.FC = () => {
    const history = useHistory();
    const [summary, setSummary] = useState({ count: 0, recentMantra: '', streak: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const mantras = await MantraService.getMantras();

        let totalStreak = 0;
        let mostRecent: Mantra | null = null;

        mantras.forEach(m => {
            if (m.stats.currentStreak > totalStreak) {
                totalStreak = m.stats.currentStreak;
            }

            if (m.stats.lastPracticeDate) {
                if (!mostRecent || new Date(m.stats.lastPracticeDate) > new Date(mostRecent.stats.lastPracticeDate!)) {
                    mostRecent = m;
                }
            }
        });

        setSummary({
            count: mantras.length,
            recentMantra: mostRecent ? (mostRecent as Mantra).basic.name : 'No practice yet',
            streak: totalStreak
        });
    };

    return (
        <div className="glass-card" onClick={() => history.push('/sati/mantras')} style={{
            margin: '0 0 24px',
            padding: '20px',
            cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="icon-wrapper icon-wrapper--medium" style={{ borderColor: 'var(--color-mahayana-secondary)40', background: 'var(--color-mahayana-secondary)10' }}>🕉️</div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Custom Mantras</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Personal Collection</p>
                    </div>
                </div>
                <IonIcon icon={chevronForward} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                {summary.count} mantras in your collection.
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
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Most Recent</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                        {summary.recentMantra}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Best Streak</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-mahayana-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {summary.streak} days <IonIcon icon={flame} />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-mahayana-secondary)', fontSize: '0.9rem' }}>
                Manage & Practice →
            </div>
        </div>
    );
};

export default MantraNavCard;
