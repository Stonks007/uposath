
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
    IonSelect,
    IonSelectOption,
    IonBackButton
} from '@ionic/react';
import { ellipsisVertical } from 'ionicons/icons';
import { AVAILABLE_LANGUAGES, AVAILABLE_SCRIPTS, getTripleGemData, getLocalizedText, getPaliScriptText } from '../services/TripleGemService';
import { SatiPreferences, DEFAULT_PREFERENCES } from '../types/SatiTypes';
import { MalaService } from '../services/MalaService';
import TripleGemCard from '../components/sati/TripleGemCard';

const TripleGemPage: React.FC = () => {
    const [prefs, setPrefs] = useState<SatiPreferences>(DEFAULT_PREFERENCES);
    const data = getTripleGemData();

    // Initial load
    useEffect(() => {
        const load = async () => {
            const p = await MalaService.getPreferences();
            setPrefs(p);
        };
        load();
    }, []);

    // Handlers for header dropdowns
    const handleScriptChange = (e: CustomEvent) => {
        const newScript = e.detail.value;
        const newPrefs = { ...prefs, paliScript: newScript };
        setPrefs(newPrefs);
        MalaService.savePreferences(newPrefs);
    };

    const handleLanguageChange = (e: CustomEvent) => {
        const newLang = e.detail.value;
        const newPrefs = { ...prefs, translationLanguage: newLang };
        setPrefs(newPrefs);
        MalaService.savePreferences(newPrefs);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/sati" />
                    </IonButtons>
                    <IonTitle>Triple Gem</IonTitle>
                    <IonButtons slot="end">
                        {/* Script Selector */}
                        <IonSelect
                            value={prefs.paliScript}
                            interface="popover"
                            onIonChange={handleScriptChange}
                            placeholder="文 Script"
                        >
                            {AVAILABLE_SCRIPTS.map(s => (
                                <IonSelectOption key={s.code} value={s.code}>
                                    {s.label}
                                </IonSelectOption>
                            ))}
                        </IonSelect>

                        {/* Language Selector */}
                        <IonSelect
                            value={prefs.translationLanguage}
                            interface="popover"
                            onIonChange={handleLanguageChange}
                            placeholder="🌐 Lang"
                        >
                            {AVAILABLE_LANGUAGES.map(l => (
                                <IonSelectOption key={l.code} value={l.code}>
                                    {l.label}
                                </IonSelectOption>
                            ))}
                        </IonSelect>

                        <IonButton routerLink="/settings">
                            <IonIcon icon={ellipsisVertical} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding">
                {/* Title Card */}
                <div style={{ textAlign: 'center', marginBottom: '32px', padding: '16px 0' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                        {getLocalizedText(data.title, prefs.translationLanguage)}
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: '#555', fontStyle: 'italic', fontFamily: '"Noto Serif", serif' }}>
                        {getPaliScriptText(data.subtitle, prefs.paliScript)}
                    </p>
                </div>

                {/* Triple Gem Cards */}
                {data.recollections.map(rec => (
                    <TripleGemCard key={rec.id} recollection={rec} prefs={prefs} />
                ))}
            </IonContent>
        </IonPage>
    );
};

export default TripleGemPage;
