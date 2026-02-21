import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
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
        <div className="glass-card" onClick={() => history.push('/sati/triple-gem')} style={{
            margin: '0 0 24px',
            padding: '20px',
            cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="icon-wrapper icon-wrapper--medium" style={{ borderColor: 'var(--color-accent-primary)40', background: 'var(--color-accent-primary)10' }}>📿</div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Ti-ratana Anussati</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Triple Gem Recollection</p>
                    </div>
                </div>
                <IonIcon icon={chevronForward} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>

            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                Practice Buddha, Dhamma & Sangha recollections with mala counting.
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
                        {todayTotal} beads <span style={{ fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>({(todayTotal / 108).toFixed(1)} malas)</span>
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Streak</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {streak} days <IonIcon icon={flame} />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: '600', color: 'var(--color-accent-primary)', fontSize: '0.9rem' }}>
                Enter Practice →
            </div>
        </div>
    );
};

export default TripleGemNavCard;
