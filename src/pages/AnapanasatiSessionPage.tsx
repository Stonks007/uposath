import React, { useState, useEffect, useRef } from 'react';
import {
    IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
    IonIcon, IonRange, IonLabel, IonActionSheet
} from '@ionic/react';
import { close, play, pause, stop, settingsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { AnapanasatiService, AnapanasatiSession, AnapanasatiSettings } from '../services/AnapanasatiService';
import { MalaService } from '../services/MalaService';
import { PaliTransliterator } from '../services/PaliTransliterator';

const AnapanasatiSessionPage: React.FC = () => {
    const history = useHistory();
    const [mode, setMode] = useState<'setup' | 'active' | 'summary'>('setup');
    const [settings, setSettings] = useState<AnapanasatiSettings | null>(null);

    // Session State
    const [duration, setDuration] = useState(20);
    const [focus, setFocus] = useState('all_16');
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Preferences
    const [language, setLanguage] = useState('en');
    const [script, setScript] = useState('roman');

    // Summary State
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [quality, setQuality] = useState(0);
    const [reflection, setReflection] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startBellRef = useRef(new Audio('/assets/audio/meditation-bell-start.mp3'));
    const endBellRef = useRef(new Audio('/assets/audio/meditation-bell-end.mp3'));
    const content = AnapanasatiService.getContent();

    useEffect(() => {
        loadSettings();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const loadSettings = async () => {
        const s = await AnapanasatiService.getSettings();
        setSettings(s);
        setDuration(s.defaultDuration);
        setFocus(s.defaultFocus);

        const prefs = await MalaService.getPreferences();
        if (prefs.translationLanguage) setLanguage(prefs.translationLanguage);
        if (prefs.paliScript) setScript(prefs.paliScript);
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
        const elapsedSeconds = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
        const session: AnapanasatiSession = {
            id: crypto.randomUUID(),
            timestamp: startTime,
            durationMinutes: Math.floor(elapsedSeconds / 60),
            durationSeconds: elapsedSeconds % 60,
            plannedDurationMinutes: duration,
            focus: focus as any,
            completed: mode === 'summary' && timeLeft === 0,
            endedEarly: timeLeft > 0,
            quality: quality > 0 ? quality : undefined,
            reflection: reflection,
            tags: []
        };

        await AnapanasatiService.saveSession(session);
        history.goBack();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Calculate current step based on time and focus
    useEffect(() => {
        if (mode === 'active' && duration > 0) {
            const totalSteps = focus === 'all_16' ? 16 : 4;
            const timePerStep = (duration * 60) / totalSteps;
            const elapsedTime = (duration * 60) - timeLeft;
            const stepIndex = Math.floor(elapsedTime / timePerStep);

            // Map stepIndex to actual step number
            let startStep = 1;
            if (focus === 'feelings') startStep = 5;
            if (focus === 'mind') startStep = 9;
            if (focus === 'dhammas') startStep = 13;

            setCurrentStep(Math.min(startStep + stepIndex, startStep + totalSteps - 1));
        }
    }, [timeLeft, duration, focus, mode]);


    const getLocalized = (obj: any) => {
        if (!obj) return '';
        return obj[language] || obj['en'] || Object.values(obj)[0] || '';
    };

    const getPaliText = (paliObj: any) => {
        if (!paliObj) return '';
        // If specific script exists in data, use it (e.g. devanagari)
        if (paliObj[script]) return paliObj[script];

        // Otherwise transliterate from roman/pali
        const source = paliObj.pali || paliObj.roman || (typeof paliObj === 'string' ? paliObj : '');
        if (source && script !== 'roman') {
            return PaliTransliterator.transliterate(source, script as any);
        }
        return source;
    };


    // --- RENDERERS ---

    const renderSetup = () => (
        <div className="ion-padding" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>Bhāvanā Setup</h2>

            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                <IonLabel style={{ fontWeight: '700', display: 'block', marginBottom: '16px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Focus Area</IonLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <IonButton
                        fill={focus === 'all_16' ? 'solid' : 'outline'}
                        onClick={() => setFocus('all_16')}
                        className={focus === 'all_16' ? 'premium-button premium-button--accent' : ''}
                        style={{ height: '48px', margin: 0, '--border-radius': '12px' }}
                    >
                        Sabbasati
                    </IonButton>
                    <IonButton
                        fill={focus === 'body' ? 'solid' : 'outline'}
                        onClick={() => setFocus('body')}
                        color="secondary"
                        className={focus === 'body' ? 'premium-button premium-button--accent' : ''}
                        style={{ height: '48px', margin: 0, '--border-radius': '12px' }}
                    >
                        Kāya
                    </IonButton>
                    <IonButton
                        fill={focus === 'feelings' ? 'solid' : 'outline'}
                        onClick={() => setFocus('feelings')}
                        color="tertiary"
                        className={focus === 'feelings' ? 'premium-button premium-button--accent' : ''}
                        style={{ height: '48px', margin: 0, '--border-radius': '12px' }}
                    >
                        Vedanā
                    </IonButton>
                    <IonButton
                        fill={focus === 'mind' ? 'solid' : 'outline'}
                        onClick={() => setFocus('mind')}
                        color="medium"
                        className={focus === 'mind' ? 'premium-button premium-button--accent' : ''}
                        style={{ height: '48px', margin: 0, '--border-radius': '12px' }}
                    >
                        Citta
                    </IonButton>
                    <IonButton
                        fill={focus === 'dhammas' ? 'solid' : 'outline'}
                        onClick={() => setFocus('dhammas')}
                        color="warning"
                        className={focus === 'dhammas' ? 'premium-button premium-button--accent' : ''}
                        style={{ height: '48px', margin: 0, '--border-radius': '12px', gridColumn: 'span 2' }}
                    >
                        Dhamma
                    </IonButton>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', marginBottom: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <IonLabel style={{ fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' }}>Duration</IonLabel>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{duration} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>min</span></span>
                </div>
                <IonRange
                    min={5} max={60} step={5}
                    value={duration}
                    onIonChange={e => setDuration(e.detail.value as number)}
                    pin={true}
                    snaps={true}
                    style={{ '--bar-background-active': 'var(--color-mahayana-accent)', padding: 0 }}
                />
            </div>

            <div style={{ paddingBottom: '24px', paddingTop: '24px' }}>
                <IonButton expand="block" onClick={startSession} className="premium-button premium-button--accent" style={{ height: '64px', fontSize: '1.2rem' }}>
                    <IonIcon icon={play} slot="start" />
                    Bhāvanā Samādana
                </IonButton>
            </div>
        </div>
    );

    const renderActive = () => {
        // Find current step data
        let stepData = null;
        let tetradData = null;

        for (const t of content.tetrads) {
            const s = t.steps.find((s: any) => s.number === currentStep);
            if (s) {
                stepData = s;
                tetradData = t;
                break;
            }
        }

        return (
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '40px 16px 24px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '5.5rem',
                        fontWeight: '800',
                        fontVariantNumeric: 'tabular-nums',
                        fontFamily: 'var(--font-family-display)',
                        color: 'var(--color-text-primary)',
                        textShadow: `0 8px 24px ${tetradData?.color || 'var(--color-mahayana-accent)'}30`
                    }}>
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: '400px' }}>
                    {stepData && (
                        <div className="glass-card" style={{
                            padding: '32px 24px',
                            textAlign: 'center',
                            borderTop: `4px solid ${tetradData?.color}`,
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '100%',
                                background: `linear-gradient(180deg, ${tetradData?.color}10 0%, transparent 100%)`,
                                pointerEvents: 'none'
                            }}></div>

                            <div style={{
                                color: tetradData?.color,
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                fontSize: '0.85rem',
                                letterSpacing: '0.08em',
                                marginBottom: '12px',
                                position: 'relative'
                            }}>
                                {getLocalized(tetradData?.title)}
                            </div>

                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: tetradData?.color,
                                color: '#fff',
                                fontWeight: 'bold',
                                marginBottom: '12px',
                                position: 'relative'
                            }}>
                                {stepData.number}
                            </div>

                            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                {getLocalized(stepData.title)}
                            </h3>

                            {/* Pali Text */}
                            <p style={{
                                fontFamily: script !== 'roman' ? 'sans-serif' : 'var(--font-family-display)',
                                fontSize: '1.2rem',
                                color: 'var(--color-mahayana-accent)',
                                marginBottom: '16px',
                                fontStyle: 'italic',
                                fontWeight: '600'
                            }}>
                                "{getPaliText(stepData.pali)}"
                            </p>

                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
                                {getLocalized(stepData.translation)}
                            </p>

                            {stepData.guidance && (
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-tertiary)', padding: '16px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                                    <span style={{ display: 'block', marginBottom: '4px', fontSize: '1.2rem' }}>💡</span>
                                    {getLocalized(stepData.guidance)}
                                </div>
                            )}
                        </div>
                    )}
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
    };

    const renderSummary = () => (
        <div className="ion-padding" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>Session Complete</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-mahayana-accent)', marginBottom: '32px', fontStyle: 'italic' }}>
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

            <div style={{ paddingBottom: '24px' }}>
                <IonButton expand="block" onClick={saveSession} className="premium-button premium-button--accent" style={{ height: '56px', marginBottom: '12px' }}>
                    Save Log
                </IonButton>
                <IonButton expand="block" fill="clear" onClick={() => history.goBack()} style={{ height: '48px', color: 'var(--color-text-secondary)' }}>
                    Discard
                </IonButton>
            </div>
        </div>
    );

    return (
        <IonPage>
            {mode !== 'active' && (
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={() => history.goBack()}>
                                <IonIcon icon={close} />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
            )}

            <IonContent fullscreen>
                {mode === 'setup' && renderSetup()}
                {mode === 'active' && renderActive()}
                {mode === 'summary' && renderSummary()}
            </IonContent>
        </IonPage>
    );
};

export default AnapanasatiSessionPage;
