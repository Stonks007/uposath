import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { chevronForward, flame } from 'ionicons/icons';
import { AnapanasatiService } from '../../services/AnapanasatiService';
import { useHistory } from 'react-router-dom';

const AnapanasatiCard: React.FC = () => {
    const history = useHistory();
    const [stats, setStats] = useState<any>(null);
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
        <div onClick={() => history.push('/sati/anapanasati')}>
            <IonCard style={{ margin: '0 0 24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                <IonCardContent style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '2rem' }}>🧘</div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary, #1f2937)' }}>Ānāpānasati</h2>
                                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary, #6b7280)' }}>Mindfulness of Breathing</p>
                            </div>
                        </div>
                        <IonIcon icon={chevronForward} style={{ color: 'var(--color-text-tertiary, #9ca3af)' }} />
                    </div>

                    <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary, #4b5563)', lineHeight: '1.5', marginBottom: '16px' }}>
                        16 contemplations across 4 tetrads to develop concentration and insight.
                    </p>

                    <div style={{
                        backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary, #6b7280)', marginBottom: '2px' }}>Today</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary, #111827)' }}>
                                {todaySummary.count} sessions • {todaySummary.minutes}m
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary, #6b7280)', marginBottom: '2px' }}>Streak</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary, #111827)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {stats?.currentStreak || 0} days <IonIcon icon={flame} style={{ color: '#F59E0B', fontSize: '0.9rem' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-accent-primary, #2563eb)', fontSize: '0.9rem' }}>
                        Enter Practice →
                    </div>
                </IonCardContent>
            </IonCard>
        </div>
    );
};

export default AnapanasatiCard;
