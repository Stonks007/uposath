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
        // Play bell if enabled
    };

    const saveSession = async () => {
        const session: AnapanasatiSession = {
            id: crypto.randomUUID(),
            timestamp: startTime,
            durationMinutes: Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000),
            plannedDurationMinutes: duration,
            focus: focus as any,
            completed: mode === 'summary' && timeLeft === 0, // Roughly check completion
            endedEarly: timeLeft > 0,
            quality: quality,
            reflection: reflection,
            tags: [] // TODO: Add tags logic
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
        <div className="ion-padding">
            <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>Start Session</h2>

            <div style={{ marginBottom: '24px' }}>
                <IonLabel style={{ fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>Focus</IonLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <IonButton
                        fill={focus === 'all_16' ? 'solid' : 'outline'}
                        onClick={() => setFocus('all_16')}
                        style={{ height: '50px' }}
                    >
                        All 16 Steps
                    </IonButton>
                    <IonButton
                        fill={focus === 'body' ? 'solid' : 'outline'}
                        onClick={() => setFocus('body')}
                        color="secondary"
                    >
                        Body (1-4)
                    </IonButton>
                    <IonButton
                        fill={focus === 'feelings' ? 'solid' : 'outline'}
                        onClick={() => setFocus('feelings')}
                        color="tertiary"
                    >
                        Feelings (5-8)
                    </IonButton>
                    <IonButton
                        fill={focus === 'mind' ? 'solid' : 'outline'}
                        onClick={() => setFocus('mind')}
                        color="pink"
                    >
                        Mind (9-12)
                    </IonButton>
                    <IonButton
                        fill={focus === 'dhammas' ? 'solid' : 'outline'}
                        onClick={() => setFocus('dhammas')}
                        color="warning"
                    >
                        Dhammas (13-16)
                    </IonButton>
                </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
                <IonLabel style={{ fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>Duration: {duration} min</IonLabel>
                <IonRange
                    min={5} max={60} step={5}
                    value={duration}
                    onIonChange={e => setDuration(e.detail.value as number)}
                    pin={true}
                    snaps={true}
                />
            </div>

            <IonButton expand="block" size="large" onClick={startSession}>
                Begin Session
            </IonButton>
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
                padding: '32px 16px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>
                        {formatTime(timeLeft)}
                    </div>
                    <div style={{ color: '#6b7280' }}>remaining</div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: '400px' }}>
                    {stepData && (
                        <div style={{
                            background: 'var(--color-bg-card, #fff)',
                            padding: '24px',
                            borderRadius: '24px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                            textAlign: 'center',
                            border: `2px solid ${tetradData?.color}`
                        }}>
                            <div style={{
                                color: tetradData?.color,
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                fontSize: '0.8rem',
                                letterSpacing: '0.05em',
                                marginBottom: '8px'
                            }}>
                                {getLocalized(tetradData?.title)}
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 'bold' }}>
                                {stepData.number}. {getLocalized(stepData.title)}
                            </h3>

                            {/* Pali Text */}
                            <p style={{
                                fontFamily: script !== 'roman' ? 'sans-serif' : '"Noto Serif", serif',
                                fontSize: '1.1rem',
                                color: '#1f2937',
                                marginBottom: '12px'
                            }}>
                                {getPaliText(stepData.pali)}
                            </p>

                            <p style={{ fontStyle: 'italic', color: '#4b5563', marginBottom: '16px' }}>
                                "{getLocalized(stepData.translation)}"
                            </p>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                💡 {getLocalized(stepData.guidance)}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '300px' }}>
                    {isPaused ? (
                        <IonButton expand="block" style={{ flex: 1 }} onClick={resumeSession}>
                            <IonIcon icon={play} slot="start" /> Resume
                        </IonButton>
                    ) : (
                        <IonButton expand="block" fill="outline" style={{ flex: 1 }} onClick={pauseSession}>
                            <IonIcon icon={pause} slot="start" /> Pause
                        </IonButton>
                    )}
                    <IonButton expand="block" color="danger" fill="clear" onClick={() => endSession(false)}>
                        <IonIcon icon={stop} slot="icon-only" />
                    </IonButton>
                </div>
            </div>
        );
    };

    const renderSummary = () => (
        <div className="ion-padding">
            <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Session Complete</h2>
            <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>
                Well practiced! Sadhu!
            </p>

            <div style={{
                background: 'var(--color-bg-card, #fff)',
                padding: '20px',
                borderRadius: '16px',
                marginBottom: '24px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)}m
                </div>
                <div style={{ color: '#6b7280' }}>Duration</div>
            </div>

            <div style={{ marginBottom: '32px' }}>
                <IonLabel style={{ display: 'block', textAlign: 'center', marginBottom: '12px' }}>How was the quality?</IonLabel>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '2rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <span
                            key={star}
                            onClick={() => setQuality(star)}
                            style={{
                                cursor: 'pointer',
                                color: star <= quality ? '#F59E0B' : '#D1D5DB',
                                transition: 'color 0.2s'
                            }}
                        >
                            ★
                        </span>
                    ))}
                </div>
            </div>

            <IonButton expand="block" onClick={saveSession} disabled={quality === 0}>
                Save Session
            </IonButton>
            <IonButton expand="block" fill="clear" onClick={() => history.goBack()}>
                Discard
            </IonButton>
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
