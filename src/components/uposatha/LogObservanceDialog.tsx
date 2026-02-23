
import React, { useState, useEffect } from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon
} from '@ionic/react';
import { star, starOutline, trashOutline, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { UposathaObservance } from '../../types/ObservanceTypes';

interface LogObservanceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<UposathaObservance>) => void;
    onDelete?: (id: string) => void;
    date: Date;
    tithi?: string;
    existingRecord?: UposathaObservance;
    initialStatus?: 'observed' | 'skipped';
}

const LogObservanceDialog: React.FC<LogObservanceDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    date,
    tithi,
    existingRecord,
    initialStatus = 'observed'
}) => {
    const [status, setStatus] = useState<'observed' | 'skipped'>(existingRecord?.status || initialStatus);

    // Observed state
    const [level, setLevel] = useState<'full' | 'partial' | 'minimal'>(existingRecord?.level || 'full');
    const [precepts, setPrecepts] = useState<string[]>(existingRecord?.precepts || ['8_precepts']);
    const [meditation, setMeditation] = useState<number>(existingRecord?.practiceMinutes?.meditation || 0);
    const [chanting, setChanting] = useState<number>(existingRecord?.practiceMinutes?.chanting || 0);
    const [study, setStudy] = useState<number>(existingRecord?.practiceMinutes?.study || 0);
    const [quality, setQuality] = useState<number>(existingRecord?.quality || 3);
    const [reflection, setReflection] = useState<string>(existingRecord?.reflection || '');

    // Skipped state
    const [reason, setReason] = useState<string>(existingRecord?.skipReason || 'work');
    const [note, setNote] = useState<string>(existingRecord?.skipNote || '');

    useEffect(() => {
        if (isOpen) {
            const currentStatus = (existingRecord?.status as 'observed' | 'skipped') || initialStatus;
            setStatus(currentStatus);

            setLevel(existingRecord?.level || 'full');
            setPrecepts(existingRecord?.precepts || ['8_precepts']);
            setMeditation(existingRecord?.practiceMinutes?.meditation || 0);
            setChanting(existingRecord?.practiceMinutes?.chanting || 0);
            setStudy(existingRecord?.practiceMinutes?.study || 0);
            setQuality(existingRecord?.quality || 3);
            setReflection(existingRecord?.reflection || '');

            setReason(existingRecord?.skipReason || 'work');
            setNote(existingRecord?.skipNote || '');
        }
    }, [isOpen, existingRecord, initialStatus]);

    const handleSave = () => {
        const baseData = {
            status,
            tithi,
            date: date.toISOString().split('T')[0]
        };

        if (status === 'observed') {
            onSave({
                ...baseData,
                level,
                precepts,
                practiceMinutes: { meditation, chanting, study },
                quality,
                reflection
            });
        } else {
            onSave({
                ...baseData,
                skipReason: reason as any,
                skipNote: note
            });
        }
        onClose();
    };

    const handleDelete = () => {
        if (existingRecord && onDelete) {
            onDelete(existingRecord.id);
            onClose();
        }
    };

    const togglePrecept = (val: string) => {
        if (precepts.includes(val)) {
            setPrecepts(precepts.filter(p => p !== val));
        } else {
            setPrecepts([...precepts, val]);
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'observed': return '#10B981';
            case 'skipped': return '#EF4444';
            default: return 'var(--ion-color-primary)';
        }
    };

    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={onClose}
            style={{ '--background': 'transparent', '--border-radius': '24px' }}
            className="glass-modal"
        >
            <IonHeader className="ion-no-border">
                <IonToolbar style={{ '--background': 'transparent', padding: '12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: 'var(--color-text-primary)' }}>Log Day</h3>
                        <IonButtons>
                            {existingRecord && onDelete && (
                                <IonButton onClick={handleDelete} color="danger" style={{ marginRight: '8px' }}>
                                    <IonIcon icon={trashOutline} slot="icon-only" />
                                </IonButton>
                            )}
                            <IonButton onClick={onClose} color="medium" style={{ fontWeight: '600' }}>CANCEL</IonButton>
                            <IonButton onClick={handleSave} style={{ fontWeight: '800', '--color': getStatusColor(status) }}>SAVE</IonButton>
                        </IonButtons>
                    </div>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{ '--background': 'transparent' }}>
                {/* Header Date Info */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h2>
                    {tithi && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-accent-primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tithi}</p>}
                </div>

                {/* Status Switcher */}
                <div style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '20px',
                    padding: '6px',
                    backdropFilter: 'var(--glass-backdrop)',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                            { id: 'observed', label: 'Observed', icon: checkmarkCircle },
                            { id: 'skipped', label: 'Skipped', icon: closeCircle }
                        ].map(s => (
                            <div
                                key={s.id}
                                onClick={() => setStatus(s.id as any)}
                                style={{
                                    flex: 1,
                                    padding: '10px 4px',
                                    borderRadius: '14px',
                                    textAlign: 'center',
                                    background: status === s.id ? getStatusColor(s.id) : 'transparent',
                                    color: status === s.id ? 'black' : 'var(--color-text-secondary)',
                                    fontWeight: '800',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <IonIcon icon={s.icon} style={{ fontSize: '1rem' }} />
                                {s.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                    {status === 'observed' && (
                        <>
                            {/* Level Selection Section */}
                            <div style={{
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '20px',
                                padding: '16px',
                                backdropFilter: 'var(--glass-backdrop)'
                            }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                                    Observance Intensity
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    {(['full', 'partial', 'minimal'] as const).map((l) => (
                                        <div
                                            key={l}
                                            onClick={() => setLevel(l)}
                                            style={{
                                                padding: '12px 4px',
                                                borderRadius: '12px',
                                                textAlign: 'center',
                                                background: level === l ? 'var(--ion-color-primary)' : 'rgba(255,255,255,0.05)',
                                                color: level === l ? 'black' : 'var(--color-text-secondary)',
                                                fontWeight: '800',
                                                fontSize: '0.75rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                transition: 'all 0.2s ease',
                                                border: `1px solid ${level === l ? 'transparent' : 'var(--glass-border)'}`
                                            }}
                                        >
                                            {l}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Practices Section */}
                            <div style={{
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '20px',
                                padding: '16px',
                                backdropFilter: 'var(--glass-backdrop)'
                            }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                                    Practices Fulfilled
                                </div>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {[
                                        { id: '8_precepts', label: '8 Precepts', icon: '📜' },
                                        { id: '5_precepts', label: '5 Precepts', icon: 'shield' },
                                        { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
                                        { id: 'celibacy', label: 'Celibacy', icon: 'heart' }
                                    ].map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => togglePrecept(item.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 14px',
                                                background: precepts.includes(item.id) ? 'rgba(255, 198, 112, 0.1)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: '14px',
                                                border: `1px solid ${precepts.includes(item.id) ? 'var(--color-accent-primary)' : 'transparent'}`,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>{
                                                    item.id === '8_precepts' ? '📜' :
                                                        item.id === '5_precepts' ? '🛡️' :
                                                            item.id === 'vegetarian' ? '🌿' : '🕊️'
                                                }</span>
                                                <span style={{ fontWeight: '600', color: precepts.includes(item.id) ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                                    {item.label}
                                                </span>
                                            </div>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '6px',
                                                border: '2px solid var(--color-accent-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: precepts.includes(item.id) ? 'var(--color-accent-primary)' : 'transparent'
                                            }}>
                                                {precepts.includes(item.id) && <span style={{ color: 'black', fontSize: '0.7rem', fontWeight: '900' }}>✓</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Time Tracking Section */}
                            <div style={{
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '20px',
                                padding: '16px',
                                backdropFilter: 'var(--glass-backdrop)'
                            }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                                    Time Commitment (Min)
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    {[
                                        { label: 'Meditation', value: meditation, setter: setMeditation },
                                        { label: 'Chanting', value: chanting, setter: setChanting },
                                        { label: 'Study', value: study, setter: setStudy }
                                    ].map(item => (
                                        <div key={item.label} style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>{item.label}</div>
                                            <input
                                                type="number"
                                                value={item.value || ''}
                                                onChange={e => item.setter(parseInt(e.target.value || '0'))}
                                                placeholder="0"
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '12px',
                                                    padding: '10px 4px',
                                                    textAlign: 'center',
                                                    color: 'var(--color-text-primary)',
                                                    fontWeight: '800',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quality Section */}
                            <div style={{
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '20px',
                                padding: '16px',
                                backdropFilter: 'var(--glass-backdrop)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                                    Overall Quality
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                    {[1, 2, 3, 4, 5].map(starIdx => (
                                        <IonIcon
                                            key={starIdx}
                                            icon={starIdx <= quality ? star : starOutline}
                                            style={{
                                                fontSize: '2.2rem',
                                                color: starIdx <= quality ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                                                opacity: starIdx <= quality ? 1 : 0.4,
                                                transition: 'all 0.2s ease'
                                            }}
                                            onClick={() => setQuality(starIdx)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {status === 'skipped' && (
                        <div style={{
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '20px',
                            padding: '16px',
                            backdropFilter: 'var(--glass-backdrop)'
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                                Why was it skipped?
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {[
                                    { id: 'work', label: 'Work/Busy', icon: '💼' },
                                    { id: 'travel', label: 'Traveling', icon: '✈️' },
                                    { id: 'health', label: 'Illness', icon: '🤒' },
                                    { id: 'forgot', label: 'Forgot', icon: '🧠' },
                                    { id: 'other', label: 'Other', icon: '⚙️' }
                                ].map(r => (
                                    <div
                                        key={r.id}
                                        onClick={() => setReason(r.id as any)}
                                        style={{
                                            padding: '12px 8px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: reason === r.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${reason === r.id ? '#EF4444' : 'transparent'}`,
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{ fontSize: '1rem' }}>{r.icon}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: reason === r.id ? 'white' : 'var(--color-text-secondary)' }}>{r.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Common Note/Reflection Section */}
                    <div style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '20px',
                        padding: '16px',
                        backdropFilter: 'var(--glass-backdrop)'
                    }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                            {status === 'observed' ? 'Reflections & Insights' : 'Additional Notes'}
                        </div>
                        <textarea
                            rows={3}
                            value={status === 'observed' ? reflection : note}
                            onChange={e => status === 'observed' ? setReflection(e.target.value) : setNote(e.target.value)}
                            placeholder={status === 'observed' ? "How do you feel after today's practice?" : "Add any context here..."}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid var(--glass-border)',
                                color: 'var(--color-text-primary)',
                                fontWeight: '500',
                                outline: 'none',
                                resize: 'none',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>
                </div>
                <div style={{ height: '40px' }} />
            </IonContent>
        </IonModal>
    );
};

export default LogObservanceDialog;
