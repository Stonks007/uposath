
import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonBackButton,
    IonPopover,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    useIonViewWillEnter
} from '@ionic/react';
import { settingsOutline, checkmark } from 'ionicons/icons';
import { getTripleGemData, getLocalizedText, getPaliScriptText } from '../services/TripleGemService';
import { MalaService } from '../services/MalaService';
import { SatiPreferences, DEFAULT_PREFERENCES } from '../types/SatiTypes';
import TripleGemCard from '../components/sati/TripleGemCard';
import './TripleGemPage.css';

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

const TripleGemPage: React.FC = () => {
    // Maintain full preferences state to pass down to children
    const [prefs, setPrefs] = useState<SatiPreferences>(DEFAULT_PREFERENCES);
    const data = getTripleGemData();

    useIonViewWillEnter(() => {
        loadSettings();
    });

    const loadSettings = async () => {
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

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/sati" />
                    </IonButtons>
                    <IonTitle>Triple Gem</IonTitle>
                    <IonButtons slot="end">
                        <IonButton id="triple-gem-settings-btn">
                            <IonIcon icon={settingsOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonPopover trigger="triple-gem-settings-btn" dismissOnSelect={false}>
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
                {/* Title Section */}
                <div className="triple-gem-header-card">
                    <h1 className="triple-gem-title">
                        {getPaliScriptText(data.subtitle, prefs.paliScript)}
                    </h1>
                    <p className="triple-gem-subtitle">
                        {getLocalizedText(data.title, prefs.translationLanguage)}
                    </p>
                </div>

                {/* Triple Gem Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.recollections.map(rec => (
                        <TripleGemCard
                            key={`${rec.id}-${prefs.translationLanguage}-${prefs.paliScript}`}
                            recollection={rec}
                            prefs={prefs}
                        />
                    ))}
                </div>

                <div style={{ height: '40px' }} />
            </IonContent>
        </IonPage>
    );
};

export default TripleGemPage;
