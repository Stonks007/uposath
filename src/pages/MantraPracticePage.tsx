import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonButton,
    IonTitle, IonContent, IonIcon, useIonAlert,
    useIonViewWillEnter, IonProgressBar,
    IonSegment, IonSegmentButton, IonLabel
} from '@ionic/react';
import { close, volumeHigh, volumeMute, pause, play, add, remove } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { MantraService } from '../services/MantraService';
import { MalaService } from '../services/MalaService';
import { PaliTransliterator } from '../services/PaliTransliterator';
import { Mantra, MantraSession, SatiPreferences, DEFAULT_PREFERENCES } from '../types/SatiTypes';
import MalaCounter from '../components/sati/MalaCounter';
import './MantraPracticePage.css';

const MantraPracticePage: React.FC = () => {
    const history = useHistory();
    const { id } = useParams<{ id: string }>();
    const [mantra, setMantra] = useState<Mantra | null>(null);
    const [count, setCount] = useState(0);
    const [sessionState, setSessionState] = useState<'running' | 'paused' | 'completed'>('running');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [bellEnabled, setBellEnabled] = useState(true);
    const [prefs, setPrefs] = useState<SatiPreferences>(DEFAULT_PREFERENCES);
    const [presentAlert] = useIonAlert();

    // New state for Manual Mode & History
    const [practiceMode, setPracticeMode] = useState<'interactive' | 'manual'>('interactive');
    const [manualCount, setManualCount] = useState(108);
    const [isLogging, setIsLogging] = useState(false);
    const [todaySessions, setTodaySessions] = useState<MantraSession[]>([]);

    useIonViewWillEnter(() => {
        loadData();
    });

    useEffect(() => {
        let interval: any;
        if (sessionState === 'running') {
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [sessionState]);

    const loadData = async () => {
        const mantras = await MantraService.getMantras();
        const found = mantras.find(m => m.id === id);
        if (found) {
            setMantra(found);
            setBellEnabled(found.practice.bellAtCompletion);

            // Only set manual count if it hasn't been touched or is default (optional logic, keeping simple for now)
            if (manualCount === 108 && found.practice.defaultReps !== 108) {
                setManualCount(found.practice.defaultReps);
            }
        } else {
            history.goBack();
            return;
        }

        // Load sessions for history
        const allSessions = await MantraService.getSessions();
        const todayStr = new Date().toISOString().split('T')[0];
        const todays = allSessions.filter(s =>
            s.mantraId === id &&
            s.timestamp.startsWith(todayStr)
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTodaySessions(todays);

        const p = await MalaService.getPreferences();
        setPrefs(p);
    };

    const handleManualLog = async () => {
        if (!mantra || manualCount <= 0) return;
        setIsLogging(true);

        const session: MantraSession = {
            id: crypto.randomUUID(),
            mantraId: mantra.id,
            timestamp: new Date().toISOString(),
            durationMinutes: 0, // Manual logs don't track duration precisely
            reps: manualCount,
            completed: manualCount >= mantra.practice.defaultReps
        };

        await MantraService.saveSession(session);
        setIsLogging(false);
        setManualCount(mantra.practice.defaultReps); // Reset to default

        presentAlert({
            header: 'Session Logged',
            message: `Logged ${manualCount} repetitions.`,
            buttons: ['OK']
        });

        await loadData(); // Refresh stats and history
    };

    const isCompletedRef = useRef(false);
    const isSaving = useRef(false);
    const saveSessionInternal = useCallback(async () => {
        if (!mantra || isSaving.current) return;
        isSaving.current = true;

        const durationMinutes = Math.ceil(elapsedSeconds / 60);
        const session: MantraSession = {
            id: crypto.randomUUID(),
            mantraId: mantra.id,
            timestamp: new Date().toISOString(),
            durationMinutes: durationMinutes,
            reps: count,
            completed: count >= mantra.practice.defaultReps
        };

        try {
            await MantraService.saveSession(session);
            await loadData(); // Refresh stats

            presentAlert({
                header: 'Session Complete',
                subHeader: `${count} repetitions`,
                message: `Duration: ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`,
                buttons: [
                    {
                        text: 'Done',
                        role: 'confirm',
                        handler: () => {
                            history.goBack();
                        }
                    }
                ]
            });
        } catch (err) {
            console.error('Failed to save session:', err);
            isSaving.current = false;
            isCompletedRef.current = false; // Allow retry
        } finally {
            isSaving.current = false;
        }
    }, [mantra, elapsedSeconds, count, history, presentAlert, loadData]);

    const handleComplete = useCallback(async () => {
        if (sessionState === 'completed' || isCompletedRef.current) return;
        isCompletedRef.current = true;

        setSessionState('completed');
        if (bellEnabled) {
            console.log('🔔 Ding!');
        }
        await saveSessionInternal();
    }, [sessionState, bellEnabled, saveSessionInternal]);

    const handleIncrement = useCallback(() => {
        if (sessionState !== 'completed') {
            setCount(c => c + 1);
            if (sessionState === 'paused') setSessionState('running');
        }
    }, [sessionState]);

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Helper to transliterate if script is not roman
    const getDisplayText = (text: string) => {
        if (!text) return '';
        if (prefs.paliScript === 'roman') return text;
        return PaliTransliterator.transliterate(text, prefs.paliScript as any);
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => history.goBack()}>
                            <IonIcon icon={close} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Practice</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setBellEnabled(!bellEnabled)}>
                            <IonIcon icon={bellEnabled ? volumeHigh : volumeMute} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="practice-content">
                {!mantra ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <IonProgressBar type="indeterminate" />
                        <p style={{ marginTop: '20px', color: 'var(--color-text-secondary)' }}>Preparing your practice...</p>
                    </div>
                ) : (
                    <>
                        <div className="practice-header">
                            <div className="practice-icon">{mantra.basic.icon}</div>
                            {mantra.basic.deity && <h2 className="practice-deity">{mantra.basic.deity}</h2>}
                            <h3 className="practice-name">{mantra.basic.name}</h3>
                        </div>

                        {/* Mode Switcher */}
                        <div style={{ padding: '0 20px 20px' }}>
                            <IonSegment value={practiceMode} onIonChange={e => setPracticeMode(e.detail.value as any)}>
                                <IonSegmentButton value="interactive">
                                    <IonLabel>Interactive</IonLabel>
                                </IonSegmentButton>
                                <IonSegmentButton value="manual">
                                    <IonLabel>Manual Log</IonLabel>
                                </IonSegmentButton>
                            </IonSegment>
                        </div>

                        <div className="practice-mantra-text">
                            <p className="primary" style={{
                                fontFamily: prefs.paliScript === 'roman' ? 'inherit' : 'sans-serif',
                                fontSize: prefs.paliScript === 'roman' ? '1.5rem' : '1.6rem'
                            }}>
                                {getDisplayText(mantra.text.primaryText)}
                            </p>
                            {mantra.text.transliteration && (
                                <p className="secondary">{getDisplayText(mantra.text.transliteration)}</p>
                            )}
                        </div>

                        {practiceMode === 'interactive' ? (
                            <>
                                <div className="mala-container">
                                    <MalaCounter
                                        mode="active"
                                        count={count}
                                        target={mantra.practice.defaultReps}
                                        onIncrement={handleIncrement}
                                        onComplete={handleComplete}
                                        haptic={true}
                                        bell={bellEnabled}
                                    />
                                </div>

                                <div className="timer-display">
                                    ⏱️ {formatTime(elapsedSeconds)}
                                </div>

                                <div className="controls">
                                    {sessionState === 'running' ? (
                                        <IonButton fill="outline" onClick={() => setSessionState('paused')}>
                                            <IonIcon slot="start" icon={pause} /> Pause
                                        </IonButton>
                                    ) : sessionState === 'paused' ? (
                                        <IonButton fill="outline" onClick={() => setSessionState('running')}>
                                            <IonIcon slot="start" icon={play} /> Resume
                                        </IonButton>
                                    ) : (
                                        <IonButton disabled>Completed</IonButton>
                                    )}

                                    <IonButton color="medium" fill="clear" onClick={saveSessionInternal}>
                                        End Session
                                    </IonButton>
                                </div>
                            </>
                        ) : (
                            <div className="manual-log-container" style={{ padding: '0 20px' }}>
                                <div className="mala-counter-logging" style={{ padding: '20px', backgroundColor: 'var(--color-bg-card, #fff)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                    <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 'bold', textAlign: 'center' }}>
                                        Log Repetitions
                                    </h4>

                                    {/* Stats Display */}
                                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--color-text-secondary)', justifyContent: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Streak: <strong>{mantra.stats.currentStreak} days</strong> 🔥</div>
                                        <div>Total: <strong>{mantra.stats.totalReps.toLocaleString()}</strong></div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                        <IonButton fill="outline" size="small" shape="round" onClick={() => setManualCount(Math.max(1, manualCount - 1))} style={{ '--border-radius': '12px' }}>
                                            <IonIcon icon={remove} />
                                        </IonButton>

                                        <div style={{ fontSize: '1.4rem', fontWeight: '800', width: '70px', textAlign: 'center', color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-accent-primary, #2563eb)', paddingBottom: '4px' }}>
                                            {manualCount}
                                        </div>

                                        <IonButton fill="outline" size="small" shape="round" onClick={() => setManualCount(manualCount + 1)} style={{ '--border-radius': '12px' }}>
                                            <IonIcon icon={add} />
                                        </IonButton>

                                        <IonButton color="primary" onClick={handleManualLog} disabled={isLogging} style={{ flexGrow: 1, fontWeight: 'bold', height: '40px', '--border-radius': '12px' }}>
                                            {isLogging ? 'Logging...' : 'Log Session'}
                                        </IonButton>
                                    </div>

                                    {/* Quick Buttons */}
                                    {prefs && prefs.quickButtons && (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {prefs.quickButtons.map(amount => (
                                                <IonButton
                                                    key={amount}
                                                    size="small"
                                                    fill="outline"
                                                    color="medium"
                                                    onClick={() => setManualCount(amount)}
                                                    style={{ '--border-radius': '8px', minWidth: '45px', height: '30px', fontSize: '0.85rem' }}
                                                >
                                                    {amount}
                                                </IonButton>
                                            ))}
                                        </div>
                                    )}

                                    {/* Today's Sessions */}
                                    {todaySessions.length > 0 && (
                                        <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px', marginTop: '10px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Today's Sessions</div>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {todaySessions.map(session => (
                                                    <li key={session.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem' }}>
                                                        <span style={{ color: 'var(--color-text-secondary)' }}>
                                                            {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                                                            {session.reps} reps
                                                        </span>
                                                    </li>
                                                ))}
                                                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '1px dashed rgba(0,0,0,0.1)', marginTop: '6px', fontWeight: 'bold', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                                                    <span>Total Today</span>
                                                    <span>{todaySessions.reduce((sum, s) => sum + s.reps, 0)}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </IonContent>
        </IonPage>
    );
};

export default MantraPracticePage;
