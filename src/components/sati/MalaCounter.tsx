
import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { add, remove, timeOutline } from 'ionicons/icons';
import { MalaService } from '../../services/MalaService';
import { MalaEntry, MalaStats, SatiPreferences, PracticeType, PracticeStats } from '../../types/SatiTypes';

interface MalaCounterProps {
    practiceType: PracticeType;
    prefs: SatiPreferences;
}

const MalaCounter: React.FC<MalaCounterProps> = ({ practiceType, prefs }) => {
    const [beadsInput, setBeadsInput] = useState<number>(108);
    const [todayTotal, setTodayTotal] = useState<number>(0);
    const [todaySessions, setTodaySessions] = useState<MalaEntry[]>([]);
    const [stats, setStats] = useState<PracticeStats | null>(null);
    const [isLogging, setIsLogging] = useState(false);

    const loadData = async () => {
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
    }, [practiceType]);

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

    return (
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#555', fontWeight: 'bold' }}>
                {capitalize(practiceType)} Mala Practice
            </h4>

            {/* Stats Summary Row using user's simple summary example or similar */}
            {stats && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.9rem', color: '#666' }}>
                    <div>Streak: <strong>{stats.currentStreak} days</strong> 🔥</div>
                    <div>Total: <strong>{stats.totalBeads.toLocaleString()}</strong></div>
                </div>
            )}

            {/* Input Control */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
            }}>
                <IonButton fill="outline" size="small" shape="round" onClick={() => adjustInput(-1)}>
                    <IonIcon icon={remove} />
                </IonButton>

                <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    width: '60px',
                    textAlign: 'center',
                    borderBottom: '2px solid #e5e7eb'
                }}>
                    {beadsInput}
                </div>

                <IonButton fill="outline" size="small" shape="round" onClick={() => adjustInput(1)}>
                    <IonIcon icon={add} />
                </IonButton>

                <IonButton
                    color="primary"
                    shape="round"
                    onClick={logPractice}
                    disabled={isLogging}
                    size="small"
                >
                    {isLogging ? 'Logging...' : `LOG ${practiceType.toUpperCase()}`}
                </IonButton>
            </div>

            {/* Quick Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {prefs.quickButtons.map(amount => (
                    <IonButton
                        key={amount}
                        size="small"
                        fill="outline"
                        color="medium"
                        onClick={() => handleQuickAdd(amount)}
                        style={{ borderRadius: '8px', minWidth: '40px', height: '28px', fontSize: '0.8rem' }}
                    >
                        {amount}
                    </IonButton>
                ))}
            </div>

            {/* Today's Brief List */}
            {todaySessions.length > 0 && (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>Today's Sessions:</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {todaySessions.map(session => (
                            <li key={session.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                                <span style={{ color: '#666' }}>
                                    {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span style={{ fontWeight: '600', color: '#333' }}>
                                    {session.beads} beads
                                </span>
                            </li>
                        ))}
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1px dashed #eee', marginTop: '4px', fontWeight: 'bold' }}>
                            <span>Total Today</span>
                            <span>{todayTotal} beads</span>
                        </li>
                    </ul>
                </div>
            )}
            {/* View Stats Link */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <IonButton
                    fill="clear"
                    size="small"
                    routerLink="/sati/stats"
                    style={{ fontSize: '0.85rem', fontWeight: '600' }}
                >
                    View {capitalize(practiceType)} Statistics
                </IonButton>
            </div>
        </div>
    );
};

export default MalaCounter;
