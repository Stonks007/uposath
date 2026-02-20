import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { add, remove } from 'ionicons/icons';
import { MalaService } from '../../services/MalaService';
import { MalaEntry, SatiPreferences, PracticeType, PracticeStats } from '../../types/SatiTypes';

interface MalaCounterProps {
    practiceType?: PracticeType;
    prefs?: SatiPreferences;
    mode?: 'logging' | 'active';
    count?: number;
    target?: number;
    onIncrement?: () => void;
    onComplete?: () => void;
    haptic?: boolean;
    bell?: boolean;
}

const MalaCounter: React.FC<MalaCounterProps> = ({
    practiceType = 'buddha',
    prefs,
    mode = 'logging',
    count = 0,
    target = 108,
    onIncrement,
    onComplete,
    haptic = true,
    bell = true
}) => {
    const [beadsInput, setBeadsInput] = useState<number>(108);
    const [todayTotal, setTodayTotal] = useState<number>(0);
    const [todaySessions, setTodaySessions] = useState<MalaEntry[]>([]);
    const [stats, setStats] = useState<PracticeStats | null>(null);
    const [isLogging, setIsLogging] = useState(false);

    // For active mode haptics
    useEffect(() => {
        if (mode === 'active' && count > 0 && haptic) {
            if (navigator.vibrate) navigator.vibrate(10);
        }

        // Completion check with guard
        if (mode === 'active' && count >= target && onComplete) {
            // We rely on the parent (MantraPracticePage) to handle the 
            // state transition to 'completed' which will prevent 
            // multiple triggers via props change.
            onComplete();
        }
    }, [count, mode, haptic, target, onComplete]);

    const loadData = async () => {
        if (mode !== 'logging') return;
        const entries = await MalaService.getEntries();
        const allStats = await MalaService.getStats();

        // Filter today's sessions for THIS type
        const todayStr = new Date().toISOString().split('T')[0];
        const todays = entries.filter(e =>
            e.timestamp.startsWith(todayStr) &&
            (e.practiceType || 'buddha') === practiceType
        );

        const total = todays.reduce((sum, e) => sum + e.beads, 0);

        setTodaySessions(todays);
        setTodayTotal(total);

        // Set stats for THIS type
        if (allStats.byType && allStats.byType[practiceType]) {
            setStats(allStats.byType[practiceType]);
        }
    };

    useEffect(() => {
        loadData();
    }, [practiceType, mode]);

    const handleQuickAdd = (amount: number) => {
        setBeadsInput(amount);
    };

    const adjustInput = (delta: number) => {
        setBeadsInput(Math.max(1, beadsInput + delta));
    };

    const logPractice = async () => {
        if (beadsInput <= 0) return;
        setIsLogging(true);

        const newEntry: MalaEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            beads: beadsInput,
            practiceType: practiceType
        };

        await MalaService.saveEntry(newEntry);
        await loadData();

        setBeadsInput(108); // Reset to default
        setIsLogging(false);
    };

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    if (mode === 'active') {
        const progress = Math.min(100, (count / target) * 100);
        return (
            <div className="active-mala-counter" style={{ textAlign: 'center', width: '100%', padding: '20px 0' }}>
                <div
                    onClick={onIncrement}
                    style={{
                        width: '240px',
                        height: '240px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 35% 35%, #ffffff, #e5e7eb)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1), inset 0 -10px 20px rgba(0,0,0,0.05)',
                        margin: '0 auto 40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        border: '8px solid white',
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent'
                    }}
                >
                    <div style={{ fontSize: '4rem', fontWeight: '900', color: '#111827' }}>
                        {count}
                    </div>
                    {/* Progress Ring */}
                    <svg style={{ position: 'absolute', top: -14, left: -14, width: '268px', height: '268px', transform: 'rotate(-90deg)', pointerEvents: 'none' }}>
                        <circle
                            cx="134" cy="134" r="126"
                            fill="transparent"
                            stroke="rgba(0,0,0,0.05)"
                            strokeWidth="12"
                        />
                        <circle
                            cx="134" cy="134" r="126"
                            fill="transparent"
                            stroke="var(--color-accent-primary, #2563eb)"
                            strokeWidth="12"
                            strokeDasharray={2 * Math.PI * 126}
                            strokeDashoffset={2 * Math.PI * 126 * (1 - progress / 100)}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.2s ease-out' }}
                        />
                    </svg>
                </div>

                <div style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', fontWeight: '700', letterSpacing: '0.05em' }}>
                    TARGET: {target}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                    Tap center to increment
                </div>
            </div>
        );
    }

    return (
        <div className="mala-counter-logging" style={{ marginTop: '24px', padding: '20px', backgroundColor: 'var(--color-bg-card, #fff)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                {capitalize(practiceType)} Mala Practice
            </h4>

            {stats && (
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Streak: <strong>{stats.currentStreak} days</strong> 🔥</div>
                    <div>Total: <strong>{stats.totalBeads.toLocaleString()}</strong></div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <IonButton fill="outline" size="small" shape="round" onClick={() => adjustInput(-1)} style={{ '--border-radius': '12px' }}>
                    <IonIcon icon={remove} />
                </IonButton>

                <div style={{ fontSize: '1.4rem', fontWeight: '800', width: '70px', textAlign: 'center', color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-accent-primary, #2563eb)', paddingBottom: '4px' }}>
                    {beadsInput}
                </div>

                <IonButton fill="outline" size="small" shape="round" onClick={() => adjustInput(1)} style={{ '--border-radius': '12px' }}>
                    <IonIcon icon={add} />
                </IonButton>

                <IonButton color="primary" onClick={logPractice} disabled={isLogging} style={{ flexGrow: 1, fontWeight: 'bold', height: '40px', '--border-radius': '12px' }}>
                    {isLogging ? 'Logging...' : 'Log Practice'}
                </IonButton>
            </div>

            {prefs && prefs.quickButtons && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {prefs.quickButtons.map(amount => (
                        <IonButton
                            key={amount}
                            size="small"
                            fill="outline"
                            color="medium"
                            onClick={() => handleQuickAdd(amount)}
                            style={{ '--border-radius': '8px', minWidth: '45px', height: '30px', fontSize: '0.85rem' }}
                        >
                            {amount}
                        </IonButton>
                    ))}
                </div>
            )}

            {todaySessions.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Today's Sessions</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {todaySessions.map(session => (
                            <li key={session.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                    {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                                    {session.beads} beads
                                </span>
                            </li>
                        ))}
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px dashed rgba(0,0,0,0.1)', marginTop: '6px', fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                            <span>Total Today</span>
                            <span>{todayTotal}</span>
                        </li>
                    </ul>
                </div>
            )}

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <IonButton fill="clear" size="small" routerLink="/sati/stats" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-accent-primary)' }}>
                    View Detailed Statistics →
                </IonButton>
            </div>
        </div>
    );
};

export default MalaCounter;
