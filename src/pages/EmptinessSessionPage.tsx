import React, { useState, useEffect, useRef } from 'react';
import {
    IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
    IonIcon, IonRange, IonLabel
} from '@ionic/react';
import { close, play, pause, stop } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { EmptinessService } from '../services/EmptinessService';
import { MalaService } from '../services/MalaService';
import { EmptinessSession } from '../types/SatiTypes';

const EmptinessSessionPage: React.FC = () => {
    const history = useHistory();
    const [mode, setMode] = useState<'setup' | 'active' | 'summary'>('setup');
    const [focusId, setFocusId] = useState<string>('anatta');
    const [duration, setDuration] = useState<number>(30);

    // Session State
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Summary State
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [quality, setQuality] = useState(0);
    const [reflection, setReflection] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startBellRef = useRef(new Audio('/assets/audio/meditation-bell-start.mp3'));
    const endBellRef = useRef(new Audio('/assets/audio/meditation-bell-end.mp3'));

    const content = EmptinessService.getContent();
    const sections = content.sections;
    const currentSection = sections.find(s => s.id === focusId);

    useEffect(() => {
        loadData();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const loadData = async () => {
        // Here we could load default duration if we had settings for emptiness too
    };

    const startSession = () => {
        setStartTime(new Date().toISOString());
        setTimeLeft(duration * 60);
        setIsActive(true);
        setIsPaused(false);
        setMode('active');

        // Play start bell
        startBellRef.current.play().catch(e => console.log('Audio play failed:', e));

        // Setup timer
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endSession(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const pauseSession = () => {
        setIsPaused(true);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const resumeSession = () => {
        setIsPaused(false);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endSession(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const endSession = (completed: boolean) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setEndTime(new Date().toISOString());
        setMode('summary');

        // Play end bell
        endBellRef.current.play().catch(e => console.log('Audio play failed:', e));
    };

    const saveSession = async () => {
        if (!currentSection) return;

        const elapsedSeconds = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
        const session: EmptinessSession = {
            id: crypto.randomUUID(),
            timestamp: startTime,
            durationMinutes: Math.floor(elapsedSeconds / 60),
            durationSeconds: elapsedSeconds % 60,
            focus: focusId,
            tradition: currentSection.tradition,
            completed: mode === 'summary' && timeLeft === 0,
            quality: quality > 0 ? quality : undefined,
            reflection: reflection,
            tags: []
        };

        await EmptinessService.saveSession(session);
        history.goBack();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // --- RENDERERS ---

    const renderSetup = () => (
        <div className="ion-padding" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>Session Setup</h2>

            <div style={{ padding: '8px 4px', fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>PRACTICE FOCUS</div>
            <div className="glass-card" style={{ padding: '8px', marginBottom: '24px', maxHeight: '40vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sections.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => setFocusId(s.id)}
                            style={{
                                padding: '12px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                background: focusId === s.id ? `${s.color}20` : 'transparent',
                                border: `1px solid ${focusId === s.id ? s.color + '40' : 'transparent'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div className="icon-wrapper icon-wrapper--small" style={{ borderColor: `${s.color}40`, background: `${s.color}15`, marginRight: '16px', fontSize: '1.2rem' }}>
                                {s.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', color: focusId === s.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontSize: '1rem' }}>{s.title.pali || s.title.sanskrit}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{s.title.en}</div>
                            </div>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: `2px solid ${focusId === s.id ? s.color : 'var(--glass-border)'}`,
                                background: focusId === s.id ? s.color : 'transparent',
                                position: 'relative'
                            }}>
                                {focusId === s.id && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', marginBottom: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IonIcon icon={stop} style={{ color: 'var(--color-mahayana-accent)', fontSize: '1.2rem', transform: 'rotate(90deg)' }} />
                        <span style={{ fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Duration</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{duration} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>min</span></span>
                </div>
                <IonRange
                    min={5} max={60} step={5} snaps={true}
                    value={duration}
                    onIonChange={e => setDuration(e.detail.value as number)}
                    style={{ '--bar-background-active': 'var(--color-mahayana-accent)', padding: 0 }}
                />
            </div>

            <div style={{ paddingBottom: '24px', paddingTop: '24px' }}>
                <IonButton expand="block" onClick={startSession} className="premium-button premium-button--accent" style={{ height: '64px', fontSize: '1.2rem' }}>
                    <IonIcon icon={play} slot="start" />
                    Śūnyatā Bhāvanā
                </IonButton>
            </div>
        </div>
    );

    const renderActive = () => (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '60px 24px 40px'
        }}>
            <div style={{ width: '100%', textAlign: 'center' }}>
                <div className="icon-wrapper icon-wrapper--large" style={{ margin: '0 auto 24px', borderColor: `${currentSection?.color}40`, background: `${currentSection?.color}15`, fontSize: '3rem' }}>
                    {currentSection?.icon}
                </div>
                <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--color-text-primary)', margin: '0 0 8px', fontFamily: 'var(--font-family-display)' }}>
                    {currentSection?.title.pali || currentSection?.title.sanskrit}
                </h2>
                <p style={{ color: 'var(--color-mahayana-accent)', fontSize: '1.1rem', fontStyle: 'italic', fontWeight: '500' }}>{currentSection?.title.en}</p>
            </div>

            <div style={{
                fontSize: '5.5rem',
                fontWeight: '800',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family-display)',
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 8px 24px ${currentSection?.color}30`
            }}>
                {formatTime(timeLeft)}
            </div>

            <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '300px' }}>
                {isPaused ? (
                    <IonButton expand="block" style={{ flex: 1, height: '56px' }} onClick={resumeSession} className="premium-button premium-button--accent">
                        <IonIcon icon={play} slot="start" /> Resume
                    </IonButton>
                ) : (
                    <IonButton expand="block" fill="outline" style={{ flex: 1, height: '56px' }} onClick={pauseSession} className="premium-button">
                        <IonIcon icon={pause} slot="start" /> Pause
                    </IonButton>
                )}
                <IonButton expand="block" color="danger" fill="clear" onClick={() => endSession(false)} style={{ height: '56px' }}>
                    <IonIcon icon={stop} slot="icon-only" />
                </IonButton>
            </div>
        </div>
    );

    const renderSummary = () => (
        <div className="ion-padding" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '2.25rem', fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>Session Complete</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-mahayana-accent)', marginBottom: '32px', fontStyle: 'italic', fontSize: '1.1rem' }}>
                Well practiced! Sadhu!
            </p>

            <div className="glass-card" style={{
                padding: '24px 20px',
                marginBottom: '24px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-display)' }}>
                    {(() => {
                        const elapsed = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
                        const mins = Math.floor(elapsed / 60);
                        const secs = elapsed % 60;
                        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                    })()}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem', fontWeight: '700', marginTop: '8px' }}>Practice Time</div>
            </div>

            <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <IonLabel style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Reflections & Insights</IonLabel>
                <textarea
                    value={reflection}
                    onChange={e => setReflection(e.target.value)}
                    placeholder="What did you notice during this session?"
                    style={{
                        width: '100%',
                        height: '100px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '12px',
                        color: 'var(--color-text-primary)',
                        fontSize: '1rem',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit'
                    }}
                />
            </div>

            <div className="glass-card" style={{ padding: '24px', marginBottom: 'auto' }}>
                <IonLabel style={{ display: 'block', textAlign: 'center', marginBottom: '16px', fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '1.1rem' }}>How was the quality?</IonLabel>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '2rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <span
                            key={star}
                            onClick={() => setQuality(star === quality ? 0 : star)}
                            style={{
                                cursor: 'pointer',
                                color: star <= quality ? 'var(--color-mahayana-accent)' : 'rgba(255,255,255,0.05)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: star <= quality ? 'scale(1.15)' : 'scale(1)',
                                filter: star <= quality ? 'drop-shadow(0 0 12px rgba(var(--color-mahayana-accent-rgb), 0.5))' : 'none'
                            }}
                        >
                            ★
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ paddingBottom: '24px', paddingTop: '16px' }}>
                <IonButton expand="block" onClick={saveSession} className="premium-button premium-button--accent" style={{ height: '60px', marginBottom: '12px', fontSize: '1.1rem' }}>
                    Save Practice Log
                </IonButton>
                <IonButton expand="block" fill="clear" onClick={() => history.goBack()} style={{ height: '48px', color: 'var(--color-text-secondary)' }}>
                    Discard Session
                </IonButton>
            </div>
        </div>
    );

    return (
        <IonPage>
            {mode !== 'active' && (
                <IonHeader className="ion-no-border">
                    <IonToolbar style={{ '--background': 'transparent' }}>
                        <IonButtons slot="start">
                            <IonButton onClick={() => history.goBack()}>
                                <IonIcon icon={close} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
            )}

            <IonContent fullscreen style={{ '--background': 'var(--color-bg-primary)' }}>
                {mode === 'setup' && renderSetup()}
                {mode === 'active' && renderActive()}
                {mode === 'summary' && renderSummary()}
            </IonContent>
        </IonPage>
    );
};

export default EmptinessSessionPage;
