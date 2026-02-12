import React, { useState } from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { chevronDown, chevronUp } from 'ionicons/icons';
import '../../pages/AnapanasatiPage.css';
import { PaliTransliterator } from '../../services/PaliTransliterator';

interface TetradStep {
    number: number;
    title: { [key: string]: string };
    pali: { roman: string;[key: string]: string };
    translation: { [key: string]: string };
    guidance: { [key: string]: string };
}

interface Tetrad {
    id: string;
    order: number;
    title: { [key: string]: string };
    icon: string;
    color: string;
    description: { [key: string]: string };
    steps: TetradStep[];
}

interface TetradCardProps {
    tetrad: Tetrad;
    language?: string; // e.g. 'en'
    script?: string;
}

const TetradCard: React.FC<TetradCardProps> = ({ tetrad, language = 'en', script = 'roman' }) => {
    const [expanded, setExpanded] = useState(false);

    const getLocalized = (obj: { [key: string]: string } | undefined, lang: string) => {
        if (!obj) return '';
        return obj[lang] || obj['en'] || Object.values(obj)[0];
    };

    const getPaliText = (paliObj: { roman: string;[key: string]: string }) => {
        // If exact script exists, use it
        if (paliObj[script]) return paliObj[script];

        // Otherwise, transliterate from Roman
        if (paliObj.roman) {
            return PaliTransliterator.transliterate(paliObj.roman, script as any);
        }

        return '';
    };

    return (
        <IonCard className="tetrad-card">
            <div
                onClick={() => setExpanded(!expanded)}
                className="tetrad-header"
                style={{
                    borderLeft: `6px solid ${tetrad.color} `,
                    background: expanded ? `rgba(${hexToRgb(tetrad.color)}, 0.08)` : undefined
                }}
            >
                <div className="tetrad-info">
                    <div className="tetrad-icon">{tetrad.icon}</div>
                    <div className="tetrad-text">
                        <h3>{getLocalized(tetrad.title, language)}</h3>
                        <div className="tetrad-desc">
                            {getLocalized(tetrad.description, language)}
                        </div>
                    </div>
                </div>
                <IonIcon icon={expanded ? chevronUp : chevronDown} style={{ color: 'var(--color-text-tertiary, #9ca3af)' }} />
            </div>

            {expanded && (
                <IonCardContent className="tetrad-content-wrapper" style={{ background: `rgba(${hexToRgb(tetrad.color)}, 0.03)` }}>
                    <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', marginBottom: '16px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {tetrad.steps.map(step => (
                            <div key={step.number} className="step-card">
                                <div className="step-header">
                                    <div
                                        className="step-number-badge"
                                        style={{ background: tetrad.color }}
                                    >
                                        {step.number}
                                    </div>
                                    <div className="step-title">
                                        {getLocalized(step.title, language)}
                                    </div>
                                </div>

                                <div className="step-pali" style={{ fontFamily: script !== 'roman' ? 'sans-serif' : '"Noto Serif", serif' }}>
                                    "{getPaliText(step.pali)}"
                                </div>

                                <div className="step-translation">
                                    {getLocalized(step.translation, language)}
                                </div>

                                {step.guidance && (
                                    <div className="step-guidance">
                                        <span>💡</span>
                                        <span>{getLocalized(step.guidance, language)}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </IonCardContent>
            )}
        </IonCard>
    );
};

// Helper: Hex to RGB for rgba usage
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)} `
        : '0,0,0';
}

export default TetradCard;
