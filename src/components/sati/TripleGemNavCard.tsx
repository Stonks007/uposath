import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { chevronForward, flame } from 'ionicons/icons';
import { MalaService } from '../../services/MalaService';
import { useHistory } from 'react-router-dom';

const TripleGemNavCard: React.FC = () => {
    const history = useHistory();
    const [todayTotal, setTodayTotal] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Load Stats Summary
        const total = await MalaService.getTodayTotal();
        const stats = await MalaService.getStats();
        setTodayTotal(total);
        setStreak(stats.overall.currentStreak);
    };

    return (
        <div onClick={() => history.push('/sati/triple-gem')}>
            <IonCard style={{ margin: '0 0 24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                <IonCardContent style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '2rem' }}>📿</div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary, #1f2937)' }}>Triple Gem</h2>
                                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary, #6b7280)' }}>Recollection Practice</p>
                            </div>
                        </div>
                        <IonIcon icon={chevronForward} style={{ color: 'var(--color-text-tertiary, #9ca3af)' }} />
                    </div>

                    <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary, #4b5563)', lineHeight: '1.5', marginBottom: '16px' }}>
                        Practice Buddha, Dhamma & Sangha recollections with mala counting.
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
                                {todayTotal} beads <span style={{ fontWeight: 'normal', color: 'var(--color-text-secondary, #6b7280)' }}>({(todayTotal / 108).toFixed(1)} malas)</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary, #6b7280)', marginBottom: '2px' }}>Streak</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary, #111827)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {streak} days <IonIcon icon={flame} style={{ color: '#F59E0B', fontSize: '0.9rem' }} />
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

export default TripleGemNavCard;
