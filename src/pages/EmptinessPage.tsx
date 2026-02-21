import React, { useState, useEffect } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonContent, IonButton, IonIcon,
    IonPopover, IonList, IonListHeader, IonItem, IonLabel,
    useIonViewWillEnter, useIonRouter
} from '@ionic/react';
import { play, bookOutline, timeOutline, chevronDown, chevronUp, warningOutline, settingsOutline, checkmark } from 'ionicons/icons';
import { EmptinessService } from '../services/EmptinessService';
import { MalaService } from '../services/MalaService';
import { PaliTransliterator } from '../services/PaliTransliterator';
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
    { code: 'mr', label: 'Marathi (मराठी)' },
    { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' }
];

const EmptinessPage: React.FC = () => {
    const router = useIonRouter();
    const [stats, setStats] = useState<EmptinessStats | null>(null);
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
                <div className="glass-card" style={{ textAlign: 'center', marginBottom: '24px', padding: '32px 16px' }}>
                    <div className="icon-wrapper icon-wrapper--large" style={{
                        margin: '0 auto 16px',
                        borderColor: 'var(--color-mahayana-primary)40',
                        background: 'var(--color-mahayana-primary)10'
                    }}>
                        🧘
                    </div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        color: 'var(--color-text-primary)',
                        margin: '0 0 8px',
                        fontFamily: 'var(--font-family-display)'
                    }}>
                        {getScriptText(content.title.pali)}
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: 'var(--color-text-secondary)',
                        margin: '0 auto',
                        lineHeight: '1.5',
                        maxWidth: '600px'
                    }}>
                        {getLocalized(content.title)}
                    </p>
                </div>

                {/* Theravada Sections */}
                <div style={{ padding: '8px 4px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>THERAVADA</div>

                {content.sections.filter(s => s.tradition === 'theravada').map(section => (
                    <div key={section.id} className="glass-card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
                        <div
                            onClick={() => toggleSection(section.id)}
                            style={{
                                borderLeft: `4px solid ${section.color}`,
                                background: expandedSections.includes(section.id) ? `${section.color}15` : 'transparent',
                                padding: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="icon-wrapper icon-wrapper--medium" style={{
                                    borderColor: `${section.color}40`,
                                    background: `${section.color}15`,
                                    fontSize: '1.5rem'
                                }}>
                                    {section.icon}
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                                        {getLocalized(section.title)}
                                    </h3>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontFamily: prefs.paliScript === 'roman' ? 'inherit' : 'sans-serif' }}>
                                        {getScriptText(section.title.pali)}
                                    </div>
                                </div>
                            </div>
                            <IonIcon icon={expandedSections.includes(section.id) ? chevronUp : chevronDown} style={{ color: 'var(--color-text-tertiary)' }} />
                        </div>

                        {expandedSections.includes(section.id) && (
                            <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0 16px', opacity: 0.5 }} />
                                <div className="source-tag" style={{ marginBottom: '16px', color: 'var(--color-mahayana-accent)', fontSize: '0.8rem', fontWeight: '600' }}>SOURCE: {section.source.reference}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {section.steps.map(step => (
                                        <div key={step.number} style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '12px', padding: '16px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: section.color, color: '#fff', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.number}</div>
                                                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: 'var(--color-text-primary)' }}>{getLocalized(step.title)}</h4>
                                            </div>
                                            <p style={{
                                                fontFamily: prefs.paliScript === 'roman' ? 'var(--font-family-display)' : 'sans-serif',
                                                fontSize: '1rem', fontStyle: 'italic', color: 'var(--color-mahayana-accent)', marginBottom: '8px', paddingLeft: '40px'
                                            }}>{getScriptText(step.pali)}</p>
                                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', paddingLeft: '40px', marginBottom: '12px' }}>{getLocalized(step.translation)}</p>
                                            <div style={{ paddingLeft: '40px', fontSize: '0.85rem', color: 'var(--color-text-tertiary)', display: 'flex', gap: '8px', borderTop: '1px dashed var(--glass-border)', paddingTop: '12px' }}>
                                                <span>💡</span> {getLocalized(step.guidance)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Mahayana Sections */}
                <div style={{ padding: '8px 4px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '32px' }}>MAHAYANA</div>

                {content.sections.filter(s => s.tradition === 'mahayana').map(section => (
                    <div key={section.id} className="glass-card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
                        <div
                            onClick={() => toggleSection(section.id)}
                            style={{
                                borderLeft: `4px solid ${section.color}`,
                                background: expandedSections.includes(section.id) ? `${section.color}15` : 'transparent',
                                padding: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="icon-wrapper icon-wrapper--medium" style={{
                                    borderColor: `${section.color}40`,
                                    background: `${section.color}15`,
                                    fontSize: '1.5rem'
                                }}>
                                    {section.icon}
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                                        {getLocalized(section.title)}
                                    </h3>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontFamily: prefs.paliScript === 'roman' ? 'inherit' : 'sans-serif' }}>
                                        {getScriptText(section.title.sanskrit)}
                                    </div>
                                </div>
                            </div>
                            <IonIcon icon={expandedSections.includes(section.id) ? chevronUp : chevronDown} style={{ color: 'var(--color-text-tertiary)' }} />
                        </div>

                        {expandedSections.includes(section.id) && (
                            <div style={{ padding: '0 16px 16px 16px' }}>
                                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '8px 0 16px', opacity: 0.5 }} />
                                <div className="source-tag" style={{ marginBottom: '16px', color: 'var(--color-mahayana-accent)', fontSize: '0.8rem', fontWeight: '600' }}>SOURCE: {section.source.reference}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {section.steps.map(step => (
                                        <div key={step.number} style={{ background: 'rgba(0,0,0,0.1)', borderRadius: '12px', padding: '16px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: section.color, color: '#fff', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.number}</div>
                                                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: 'var(--color-text-primary)' }}>{getLocalized(step.title)}</h4>
                                            </div>
                                            <p style={{
                                                fontFamily: prefs.paliScript === 'roman' ? 'var(--font-family-display)' : 'sans-serif',
                                                fontSize: '1rem', fontStyle: 'italic', color: 'var(--color-mahayana-accent)', marginBottom: '8px', paddingLeft: '40px'
                                            }}>{getScriptText(step.pali)}</p>
                                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', paddingLeft: '40px', marginBottom: '12px' }}>{getLocalized(step.translation)}</p>
                                            <div style={{ paddingLeft: '40px', fontSize: '0.85rem', color: 'var(--color-text-tertiary)', display: 'flex', gap: '8px', borderTop: '1px dashed var(--glass-border)', paddingTop: '12px' }}>
                                                <span>💡</span> {getLocalized(step.guidance)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Status / Actions Area */}
                <div style={{ marginTop: '32px' }}>
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{stats?.totalSessions || 0}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Sessions</div>
                        </div>
                        <div style={{ width: '1px', background: 'var(--glass-border)' }}></div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-mahayana-accent)' }}>{stats?.currentStreak || 0}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>Day Streak</div>
                        </div>
                    </div>

                    <IonButton expand="block" routerLink="/sati/emptiness/session" className="premium-button premium-button--accent" style={{ height: '64px', fontSize: '1.1rem' }}>
                        <IonIcon slot="start" icon={play} />
                        Start Practice Session
                    </IonButton>
                </div>

                <div style={{ height: '40px' }} />

            </IonContent>
        </IonPage>
    );
};

export default EmptinessPage;
