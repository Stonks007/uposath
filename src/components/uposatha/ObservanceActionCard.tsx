
import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonButton, IonIcon, IonChip, useIonAlert } from '@ionic/react';
import { checkmarkCircle, closeCircle, timeOutline, ribbonOutline, removeCircleOutline } from 'ionicons/icons';
import { UposathaObservance } from '../../types/ObservanceTypes';
import { UposathaObservanceService } from '../../services/UposathaObservanceService';
import LogObservanceDialog from './LogObservanceDialog';

interface ObservanceActionCardProps {
    date: Date;
    moonPhase?: 'full' | 'new' | 'quarter' | 'chaturdashi';
    paksha?: 'Shukla' | 'Krishna';
    tithi?: string;
    onUpdate?: () => void;
}

const ObservanceActionCard: React.FC<ObservanceActionCardProps> = ({ date, moonPhase = 'full', paksha, tithi, onUpdate }) => {
    const [observance, setObservance] = useState<UposathaObservance | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [initialStatus, setInitialStatus] = useState<'observed' | 'skipped'>('observed');
    const [presentAlert] = useIonAlert();

    useEffect(() => {
        loadObservance();
    }, [date]);

    const loadObservance = async () => {
        const obs = await UposathaObservanceService.getObservance(date);
        setObservance(obs);
    };

    const handleSave = async (data: Partial<UposathaObservance>) => {
        const newObservance: UposathaObservance = {
            id: observance?.id || crypto.randomUUID(),
            date: date.toISOString().split('T')[0],
            moonPhase,
            paksha,
            timestamp: new Date().toISOString(),
            status: data.status || 'observed', // Default, should be passed
            ...data
        } as UposathaObservance;

        await UposathaObservanceService.saveObservance(newObservance);
        loadObservance();
        if (onUpdate) onUpdate();
    };

    const handleDelete = () => {
        presentAlert({
            header: 'Remove Entry?',
            message: 'Are you sure you want to delete this observance record?',
            buttons: [
                'Cancel',
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: async () => {
                        if (observance) {
                            await UposathaObservanceService.deleteObservance(observance.id);
                            setObservance(null);
                            if (onUpdate) onUpdate();
                        }
                    }
                }
            ]
        });
    };

    if (observance) {
        const isObserved = observance.status === 'observed';
        const isSkipped = observance.status === 'skipped';

        return (
            <div style={{
                margin: '20px 0',
                padding: '20px',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-backdrop)',
                borderRadius: '24px',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Status indicator line */}
                <div style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: '6px',
                    background: isObserved ? '#10B981' : '#EF4444'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isObserved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isObserved ? '#10B981' : '#EF4444'
                        }}>
                            <IonIcon
                                icon={isObserved ? checkmarkCircle : closeCircle}
                                style={{ fontSize: '1.5rem' }}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: '2px' }}>
                                Observance Status
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                {isObserved ? 'Observed' : 'Skipped'}
                            </div>
                        </div>
                    </div>

                    <IonButton fill="clear" color="medium" onClick={handleDelete} className="premium-button-small">
                        Change
                    </IonButton>
                </div>

                {isObserved && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingLeft: '54px' }}>
                        <div style={{
                            padding: '4px 10px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            <IonIcon icon={ribbonOutline} /> {observance.level?.toUpperCase()}
                        </div>
                        {observance.practiceMinutes && ((observance.practiceMinutes.meditation || 0) + (observance.practiceMinutes.chanting || 0) + (observance.practiceMinutes.study || 0)) > 0 && (
                            <div style={{
                                padding: '4px 10px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: '#60A5FA',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <IonIcon icon={timeOutline} /> {(observance.practiceMinutes.meditation || 0) + (observance.practiceMinutes.chanting || 0) + (observance.practiceMinutes.study || 0)}m
                            </div>
                        )}
                    </div>
                )}

                {isSkipped && observance.skipReason && (
                    <div style={{ marginTop: '12px', paddingLeft: '54px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ fontWeight: '700', color: '#EF4444' }}>Reason:</span> {observance.skipReason.charAt(0).toUpperCase() + observance.skipReason.slice(1)}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{
            margin: '20px 0',
            padding: '24px',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-backdrop)',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center'
        }}>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--ion-color-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px', opacity: 0.8 }}>
                    Action Required
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
                    Uposatha Observance
                </h3>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: '500' }}>
                    Have you observed the precepts today?
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <button
                    onClick={() => {
                        setInitialStatus('observed');
                        setShowDialog(true);
                    }}
                    style={{
                        padding: '14px',
                        background: '#10B981',
                        color: 'white',
                        borderRadius: '16px',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <IonIcon icon={checkmarkCircle} />
                    OBSERVED
                </button>

                <button
                    onClick={() => {
                        setInitialStatus('skipped');
                        setShowDialog(true);
                    }}
                    style={{
                        padding: '14px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        borderRadius: '16px',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <IonIcon icon={closeCircle} />
                    SKIPPED
                </button>
            </div>

            <LogObservanceDialog
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
                onSave={handleSave}
                date={date}
                tithi={tithi}
                initialStatus={initialStatus}
                existingRecord={observance || undefined}
            />
        </div>
    );
};

export default ObservanceActionCard;
