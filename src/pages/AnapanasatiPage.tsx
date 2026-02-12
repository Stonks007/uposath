import React, { useState, useEffect } from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    useIonViewWillEnter,
    IonPopover,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel
} from '@ionic/react';
import { barChartOutline, play, flame, settingsOutline, checkmark } from 'ionicons/icons';
import { AnapanasatiService } from '../services/AnapanasatiService';
import { MalaService } from '../services/MalaService';
import TetradCard from '../components/sati/TetradCard';

import './AnapanasatiPage.css';

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

const AnapanasatiPage: React.FC = () => {
    const [content, setContent] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [currentScript, setCurrentScript] = useState('roman');
    const [currentLanguage, setCurrentLanguage] = useState('en');


    useIonViewWillEnter(() => {
        loadData();
    });

    const loadData = async () => {
        try {
            const data = AnapanasatiService.getContent();
            setContent(data);

            const s = await AnapanasatiService.getStats();
            setStats(s);

            const prefs = await MalaService.getPreferences();
            if (prefs.paliScript) setCurrentScript(prefs.paliScript);
            if (prefs.translationLanguage) setCurrentLanguage(prefs.translationLanguage);
        } catch (error) {
            console.error('AnapanasatiPage: Error loading data', error);
        }
    };

    const handleScriptChange = async (script: string) => {
        setCurrentScript(script);
        const prefs = await MalaService.getPreferences();
        await MalaService.savePreferences({ ...prefs, paliScript: script });
    };

    const handleLanguageChange = async (language: string) => {
        setCurrentLanguage(language);
        const prefs = await MalaService.getPreferences();
        await MalaService.savePreferences({ ...prefs, translationLanguage: language });
    };

    if (!content) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton defaultHref="/sati" />
                        </IonButtons>
                        <IonTitle>Loading...</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    {/* Fallback loader */}
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/sati" />
                    </IonButtons>
                    <IonTitle>{content.title.pali}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton id="anapanasati-settings-btn">
                            <IonIcon icon={settingsOutline} />
                        </IonButton>
                        <IonButton routerLink="/sati/anapanasati/stats">
                            <IonIcon icon={barChartOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonPopover trigger="anapanasati-settings-btn" dismissOnSelect={false}>
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
                                {currentScript === script.code && <IonIcon icon={checkmark} slot="end" color="primary" />}
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
                                {currentLanguage === lang.code && <IonIcon icon={checkmark} slot="end" color="primary" />}
                            </IonItem>
                        ))}
                    </IonList>
                </IonContent>
            </IonPopover>

            <IonContent fullscreen className="ion-padding">
                {/* Header Card */}
                <div className="anapanasati-header-card">
                    <h2 className="anapanasati-title">
                        {content.title.pali}
                    </h2>
                    <p className="anapanasati-subtitle">
                        {content.title[currentLanguage] || content.title.en}
                    </p>
                </div>

                {/* Main Action - Start Session */}
                <div className="action-container">
                    <IonButton
                        expand="block"
                        routerLink="/sati/anapanasati/session"
                        className="start-session-button"
                    >
                        <IonIcon icon={play} slot="start" />
                        Start Practice Session
                    </IonButton>

                    {stats && stats.currentStreak > 0 && (
                        <div className="streak-badge">
                            <IonIcon icon={flame} />
                            {stats.currentStreak} Day Streak
                        </div>
                    )}
                </div>

                {/* Tetrads List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {content.tetrads.map((tetrad: any) => (
                        <TetradCard
                            key={tetrad.id}
                            tetrad={tetrad}
                            language={currentLanguage}
                            script={currentScript}
                        />
                    ))}
                </div>

                {/* Spacer */}
                <div style={{ height: '40px' }} />

            </IonContent>
        </IonPage>
    );
};

export default AnapanasatiPage;
