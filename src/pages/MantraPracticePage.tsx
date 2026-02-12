import React, { useState, useEffect } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonButton,
    IonTitle, IonContent, IonIcon, useIonAlert, useIonToast,
    useIonViewWillEnter, IonProgressBar,
    IonPopover, IonList, IonListHeader, IonItem, IonLabel
} from '@ionic/react';
import { close, volumeHigh, volumeMute, pause, play, settingsOutline, checkmark } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { MantraService } from '../services/MantraService';
import { MalaService } from '../services/MalaService';
import { PaliTransliterator } from '../services/PaliTransliterator';
import { Mantra, MantraSession, SatiPreferences, DEFAULT_PREFERENCES } from '../types/SatiTypes';
import MalaCounter from '../components/sati/MalaCounter';
import './MantraPracticePage.css';

const SUPPORTED_SCRIPTS = [
    { code: 'roman', label: 'Roman (Default)' },
    { code: 'devanagari', label: 'Devanagari (देवनागरी)' },
    { code: 'sinhala', label: 'Sinhala (සිංහල)' },
    { code: 'thai', label: 'Thai (ไทย)' },
    { code: 'burmese', label: 'Burmese (မြန်မာ)' }
];

const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi (हिंदी)' },
    { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' }
];

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
        } else {
            history.goBack();
        }
        const p = await MalaService.getPreferences();
        setPrefs(p);
    };

    const handleScriptChange = async (script: string) => {
        const newPrefs = { ...prefs, paliScript: script };
        setPrefs(newPrefs);
        await MalaService.savePreferences(newPrefs);
    };

    const handleLanguageChange = async (language: string) => {
        const newPrefs = { ...prefs, translationLanguage: language };
        setPrefs(newPrefs);
        await MalaService.savePreferences(newPrefs);
    };

    const handleComplete = async () => {
        setSessionState('completed');
        if (bellEnabled) {
            console.log('🔔 Ding!');
            // Play sound?
        }
        await saveSession();
    };

    const saveSession = async () => {
        if (!mantra) return;

        const durationMinutes = Math.ceil(elapsedSeconds / 60);
        const session: MantraSession = {
            id: crypto.randomUUID(),
            mantraId: mantra.id,
            timestamp: new Date().toISOString(),
            durationMinutes: durationMinutes,
            reps: count,
            completed: count >= mantra.practice.defaultReps
        };

        await MantraService.saveSession(session);

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
    };

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
                        <IonButton id="mantra-practice-settings-btn">
                            <IonIcon icon={settingsOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonPopover trigger="mantra-practice-settings-btn" dismissOnSelect={false}>
                <IonContent class="ion-padding-vertical">
                    <IonList lines="none">
                        <IonListHeader>
                            <IonLabel>Pali Script</IonLabel>
                        </IonListHeader>
                        {SUPPORTED_SCRIPTS.map(script => (
                            <IonItem
                                key={script.code}
                                button
                                detail={false}
                                onClick={() => handleScriptChange(script.code)}
                            >
                                <IonLabel>{script.label}</IonLabel>
                                {prefs.paliScript === script.code && <IonIcon icon={checkmark} slot="end" color="primary" />}
                            </IonItem>
                        ))}

                        <IonListHeader>
                            <IonLabel>Translation Language</IonLabel>
                        </IonListHeader>
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <IonItem
                                key={lang.code}
                                button
                                detail={false}
                                onClick={() => handleLanguageChange(lang.code)}
                            >
                                <IonLabel>{lang.label}</IonLabel>
                                {prefs.translationLanguage === lang.code && <IonIcon icon={checkmark} slot="end" color="primary" />}
                            </IonItem>
                        ))}
                    </IonList>
                </IonContent>
            </IonPopover>

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

                        <div className="mala-container">
                            <MalaCounter
                                mode="active"
                                count={count}
                                target={mantra.practice.defaultReps}
                                onIncrement={() => {
                                    if (sessionState !== 'completed') {
                                        setCount(c => c + 1);
                                        if (sessionState === 'paused') setSessionState('running');
                                    }
                                }}
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

                            <IonButton color="medium" fill="clear" onClick={saveSession}>
                                End Session
                            </IonButton>
                        </div>
                    </>
                )}
            </IonContent>
        </IonPage>
    );
};

export default MantraPracticePage;
