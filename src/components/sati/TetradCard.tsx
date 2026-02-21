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

    const getPaliText = (paliObj: { roman?: string; pali?: string;[key: string]: any }) => {
        // If exact script exists, use it
        if (paliObj[script]) return paliObj[script];

        // Use 'pali' or 'roman' as source for transliteration
        const source = paliObj.pali || paliObj.roman || (typeof paliObj === 'string' ? paliObj : '');
        if (source && script !== 'roman') {
            return PaliTransliterator.transliterate(source, script as any);
        }

        return source;
    };

    return (
        <div className="glass-card" style={{ marginBottom: '16px', overflow: 'hidden' }}>
            <div
                onClick={() => setExpanded(!expanded)}
                className="tetrad-header"
                style={{
                    borderLeft: `4px solid ${tetrad.color}`,
                    background: expanded ? `${tetrad.color}15` : 'transparent',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="icon-wrapper icon-wrapper--medium" style={{
                        borderColor: `${tetrad.color}40`,
                        background: `${tetrad.color}15`,
                        fontSize: '1.5rem'
                    }}>
                        {tetrad.icon}
                    </div>
                    <div>
                        <h3 style={{
                            margin: '0 0 4px 0',
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            color: 'var(--color-text-primary)'
                        }}>
                            {getPaliText(tetrad.title as any)}
                        </h3>
                        <div style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-secondary)'
                        }}>
                            {getLocalized(tetrad.title, language)}
                        </div>
                    </div>
                </div>
                <IonIcon
                    icon={expanded ? chevronUp : chevronDown}
                    style={{ color: 'var(--color-text-tertiary)', fontSize: '1.5rem' }}
                />
            </div>

            {expanded && (
                <div style={{ padding: '0 16px 16px 16px' }}>
                    <div style={{
                        height: '1px',
                        background: 'var(--glass-border)',
                        margin: '8px 0 16px',
                        opacity: 0.5
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {tetrad.steps.map(step => (
                            <div key={step.number} style={{
                                background: 'rgba(0,0,0,0.1)',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: tetrad.color,
                                        color: '#fff',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: `0 2px 8px ${tetrad.color}40`
                                    }}>
                                        {step.number}
                                    </div>
                                    <div style={{
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        color: 'var(--color-text-primary)'
                                    }}>
                                        {getLocalized(step.title, language)}
                                    </div>
                                </div>

                                <div style={{
                                    fontStyle: 'italic',
                                    color: 'var(--color-mahayana-accent)',
                                    fontSize: '0.95rem',
                                    marginBottom: '8px',
                                    paddingLeft: '40px',
                                    fontFamily: script !== 'roman' ? 'sans-serif' : 'var(--font-family-display)'
                                }}>
                                    "{getPaliText(step.pali)}"
                                </div>

                                <div style={{
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.95rem',
                                    paddingLeft: '40px',
                                    marginBottom: step.guidance ? '12px' : '0',
                                    lineHeight: '1.6'
                                }}>
                                    {getLocalized(step.translation, language)}
                                </div>

                                {step.guidance && (
                                    <div style={{
                                        paddingLeft: '40px',
                                        fontSize: '0.85rem',
                                        color: 'var(--color-text-tertiary)',
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'flex-start',
                                        paddingTop: '12px',
                                        borderTop: '1px dashed var(--glass-border)'
                                    }}>
                                        <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>💡</span>
                                        <span style={{ lineHeight: '1.5' }}>{getLocalized(step.guidance, language)}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
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
