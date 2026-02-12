import React, { useState, useEffect } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonContent, IonButton, IonIcon,
    IonPopover, IonList, IonListHeader, IonItem, IonLabel,
    useIonViewWillEnter
} from '@ionic/react';
import { play, bookOutline, timeOutline, chevronDown, chevronUp, warningOutline, settingsOutline, checkmark } from 'ionicons/icons';
import { EmptinessService } from '../services/EmptinessService';
import { MalaService } from '../services/MalaService';
import { PaliTransliterator } from '../services/PaliTransliterator';
import EmptinessSessionModal from '../components/sati/EmptinessSessionModal';
import { EmptinessSection, EmptinessStats, SatiPreferences, DEFAULT_PREFERENCES } from '../types/SatiTypes';
import './EmptinessPage.css';

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

const EmptinessPage: React.FC = () => {
    const [stats, setStats] = useState<EmptinessStats | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [prefs, setPrefs] = useState<SatiPreferences>(DEFAULT_PREFERENCES);

    const content = EmptinessService.getContent();

    useIonViewWillEnter(() => {
        loadData();
    });

    const loadData = async () => {
        const s = await EmptinessService.getStats();
        setStats(s);
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

    const toggleSection = (id: string) => {
        if (expandedSections.includes(id)) {
            setExpandedSections(expandedSections.filter(s => s !== id));
        } else {
            setExpandedSections([...expandedSections, id]);
        }
    };

    const getLocalized = (obj: any) => {
        if (!obj) return '';
        return obj[prefs.translationLanguage] || obj['en'] || '';
    };

    const getScriptText = (text: string) => {
        if (!text) return '';
        if (prefs.paliScript === 'roman') return text;
        return PaliTransliterator.transliterate(text, prefs.paliScript as any);
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/sati" />
                    </IonButtons>
                    <IonTitle>Suññatā</IonTitle>
                    <IonButtons slot="end">
                        <IonButton id="emptiness-settings-btn">
                            <IonIcon icon={settingsOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonPopover trigger="emptiness-settings-btn" dismissOnSelect={false}>
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

            <IonContent fullscreen className="ion-padding">
                <div className="emptiness-header">
                    <h1>{getScriptText(content.title.pali)}</h1>
                    <p>{getLocalized(content.title)}</p>
                </div>

                {/* Theravada Sections */}
                <div className="tradition-header">THERAVADA (Pali Canon)</div>

                {content.sections.filter(s => s.tradition === 'theravada').map(section => (
                    <div key={section.id} className="content-card">
                        <div
                            className="card-header"
                            onClick={() => toggleSection(section.id)}
                            style={{ borderLeft: `6px solid ${section.color}` }}
                        >
                            <div className="card-icon">{section.icon}</div>
                            <div className="card-title-group">
                                <h3>{getLocalized(section.title)}</h3>
                                <p style={{
                                    fontFamily: prefs.paliScript === 'roman' ? 'inherit' : 'sans-serif'
                                }}>
                                    {getScriptText(section.title.pali)}
                                </p>
                            </div>
                            <IonIcon icon={expandedSections.includes(section.id) ? chevronUp : chevronDown} />
                        </div>

                        {expandedSections.includes(section.id) && (
                            <div className="card-body">
                                <div className="source-tag">Source: {section.source.reference}</div>
                                {section.steps.map(step => (
                                    <div key={step.number} className="step-item">
                                        <div className="step-num">{step.number}</div>
                                        <div className="step-content">
                                            <h4>{getLocalized(step.title)}</h4>
                                            <p className="pali-text" style={{
                                                fontFamily: prefs.paliScript === 'roman' ? '"Noto Serif", serif' : 'sans-serif',
                                                fontSize: prefs.paliScript === 'roman' ? '1rem' : '1.1rem'
                                            }}>
                                                {getScriptText(step.pali)}
                                            </p>
                                            <p className="translation">{getLocalized(step.translation)}</p>
                                            <div className="guidance">
                                                <span>💡</span> {getLocalized(step.guidance)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Mahayana Sections */}
                <div className="tradition-header" style={{ marginTop: '32px' }}>MAHAYANA</div>

                {content.sections.filter(s => s.tradition === 'mahayana').map(section => (
                    <div key={section.id} className="content-card">
                        <div
                            className="card-header"
                            onClick={() => toggleSection(section.id)}
                            style={{ borderLeft: `6px solid ${section.color}` }}
                        >
                            <div className="card-icon">{section.icon}</div>
                            <div className="card-title-group">
                                <h3>{getLocalized(section.title)}</h3>
                                <p style={{
                                    fontFamily: prefs.paliScript === 'roman' ? 'inherit' : 'sans-serif'
                                }}>
                                    {getScriptText(section.title.sanskrit)}
                                </p>
                            </div>
                            <IonIcon icon={expandedSections.includes(section.id) ? chevronUp : chevronDown} />
                        </div>

                        {expandedSections.includes(section.id) && (
                            <div className="card-body">
                                {section.disclaimer && (
                                    <div className="disclaimer-box">
                                        <IonIcon icon={warningOutline} />
                                        <p>{getLocalized(section.disclaimer)}</p>
                                    </div>
                                )}
                                <div className="source-tag">Source: {section.source.reference}</div>
                                {section.steps.map(step => (
                                    <div key={step.number} className="step-item">
                                        <div className="step-num">{step.number}</div>
                                        <div className="step-content">
                                            <h4>{getLocalized(step.title)}</h4>
                                            <p className="pali-text" style={{
                                                fontFamily: prefs.paliScript === 'roman' ? '"Noto Serif", serif' : 'sans-serif',
                                                fontSize: prefs.paliScript === 'roman' ? '1rem' : '1.1rem'
                                            }}>
                                                {getScriptText(step.pali)}
                                            </p>
                                            <p className="translation">{getLocalized(step.translation)}</p>
                                            <div className="guidance">
                                                <span>💡</span> {getLocalized(step.guidance)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Practice Logger / Stats */}
                <div className="stats-container">
                    <div className="stats-header">
                        <IonIcon icon={timeOutline} />
                        <h3>Practice Logger</h3>
                    </div>

                    <div className="stats-summary">
                        <div className="stat-box">
                            <span className="value">{stats?.totalSessions || 0}</span>
                            <span className="label">Sessions</span>
                        </div>
                        <div className="stat-box">
                            <span className="value">{stats?.currentStreak || 0}</span>
                            <span className="label">Day Streak</span>
                        </div>
                    </div>

                    <IonButton expand="block" onClick={() => setIsModalOpen(true)} className="start-btn">
                        <IonIcon slot="start" icon={play} />
                        Start New Session
                    </IonButton>
                </div>

                <div style={{ height: '40px' }} />

                <EmptinessSessionModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); loadData(); }}
                />
            </IonContent>
        </IonPage>
    );
};

export default EmptinessPage;
