import React, { useState } from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { chevronDown, chevronUp } from 'ionicons/icons';
import { Recollection, SatiPreferences, PracticeType } from '../../types/SatiTypes';
import { getLocalizedText, getPaliScriptText } from '../../services/TripleGemService';
import MalaCounter from './MalaCounter';

interface TripleGemCardProps {
    recollection: Recollection;
    prefs: SatiPreferences;
}

const TripleGemCard: React.FC<TripleGemCardProps> = ({ recollection, prefs }) => {
    const [showTranslation, setShowTranslation] = useState(prefs.showTranslations);
    const [showQualities, setShowQualities] = useState(false);

    const title = getLocalizedText(recollection.title, prefs.translationLanguage);
    const verse = getPaliScriptText(recollection.verse, prefs.paliScript);
    const translation = getLocalizedText(recollection.translation, prefs.translationLanguage);

    const toggleTranslation = () => setShowTranslation(!showTranslation);
    const toggleQualities = () => setShowQualities(!showQualities);

    // Font size classes or styles based on prefs
    const getFontSize = () => {
        switch (prefs.paliTextSize) {
            case 'small': return '16px';
            case 'large': return '20px';
            case 'xl': return '24px';
            default: return '18px'; // medium
        }
    };

    return (
        <div style={{ marginBottom: '24px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* Header / Divider */}
            <div style={{
                background: `linear-gradient(90deg, ${recollection.color} 0%, rgba(255,255,255,0) 100%)`,
                padding: '12px 16px',
                color: '#fff', // Ideally text color should contrast, but for now assuming dark colors or white text
                // Adjust text color based on background logic or fixed
                // The blueprint says "Gold gradient divider", "Blue gradient", "Saffron gradient"
                // Let's use a solid border top style or a header block
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <span style={{ fontSize: '24px' }}>{recollection.icon}</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333', textShadow: '0 0 2px rgba(255,255,255,0.8)' }}>
                    {title}
                </h3>
            </div>

            <div style={{ padding: '16px' }}>
                {/* Pali Verse */}
                <div style={{
                    textAlign: 'center',
                    fontSize: getFontSize(),
                    lineHeight: '1.8',
                    marginBottom: '16px',
                    fontFamily: '"Noto Serif", serif', // Fallback
                    color: '#2c3e50'
                }}>
                    {verse}
                </div>

                {/* Translation Toggle */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <IonButton
                        fill="clear"
                        size="small"
                        onClick={toggleTranslation}
                        style={{ textTransform: 'none', fontWeight: 'normal' }}
                    >
                        {showTranslation ? 'Hide Translation' : 'Show Translation'}
                        <IonIcon slot="end" icon={showTranslation ? chevronUp : chevronDown} />
                    </IonButton>

                    <IonButton
                        fill="clear"
                        size="small"
                        onClick={toggleQualities}
                        style={{ textTransform: 'none', fontWeight: 'normal' }}
                    >
                        {showQualities ? 'Hide Qualities' : `View ${recollection.qualities.length} Qualities`}
                        <IonIcon slot="end" icon={showQualities ? chevronUp : chevronDown} />
                    </IonButton>
                </div>

                {/* Translation Content */}
                {showTranslation && (
                    <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${recollection.color}`,
                        animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                        <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: '#4b5563' }}>
                            {translation}
                        </p>
                    </div>
                )}

                {/* Qualities Content */}
                {showQualities && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#555', fontStyle: 'italic' }}>
                            {recollection.qualities.length} Qualities
                        </h4>
                        {recollection.qualities.map(q => (
                            <div key={q.number} style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: `3px solid ${recollection.color}30` }}>
                                <div style={{ marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', color: recollection.color, marginRight: '8px' }}>{q.number}.</span>
                                    <span style={{ fontWeight: '600', color: '#333' }}>{getPaliScriptText(q.pali, prefs.paliScript)}</span>
                                    <span style={{ color: '#666' }}> — {getLocalizedText(q.name, prefs.translationLanguage)}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#555', lineHeight: '1.5' }}>
                                    {getLocalizedText(q.explanation, prefs.translationLanguage)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <MalaCounter
                    practiceType={recollection.id as PracticeType}
                    prefs={prefs}
                />
            </div>
        </div>
    );
};

// Helper to access script text inside component if not passed as prop
const getTypeScriptText = (obj: any, script: string) => {
    return getPaliScriptText(obj, script);
};

export default TripleGemCard;
