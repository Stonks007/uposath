
import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonButton, IonIcon, IonChip, useIonAlert } from '@ionic/react';
import { checkmarkCircle, closeCircle, timeOutline, ribbonOutline } from 'ionicons/icons';
import { UposathaObservance } from '../../types/ObservanceTypes';
import { UposathaObservanceService } from '../../services/UposathaObservanceService';
import MarkObservedDialog from './MarkObservedDialog';
import MarkSkippedDialog from './MarkSkippedDialog';

interface ObservanceActionCardProps {
    date: Date;
    moonPhase?: 'full' | 'new' | 'quarter' | 'chaturdashi';
    paksha?: 'Shukla' | 'Krishna';
    onUpdate?: () => void;
}

const ObservanceActionCard: React.FC<ObservanceActionCardProps> = ({ date, moonPhase = 'full', paksha, onUpdate }) => {
    const [observance, setObservance] = useState<UposathaObservance | null>(null);
    const [showObservedDialog, setShowObservedDialog] = useState(false);
    const [showSkippedDialog, setShowSkippedDialog] = useState(false);
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
        return (
            <IonCard style={{ background: observance.status === 'observed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: observance.status === 'observed' ? '1px solid #10B981' : '1px solid #EF4444' }}>
                <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <IonIcon
                                    icon={observance.status === 'observed' ? checkmarkCircle : closeCircle}
                                    style={{ color: observance.status === 'observed' ? '#10B981' : '#EF4444', fontSize: '1.5rem' }}
                                />
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {observance.status === 'observed' ? 'Observed' : 'Skipped'}
                                </span>
                            </div>

                            {observance.status === 'observed' && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <IonChip color="success" outline>
                                        <IonIcon icon={ribbonOutline} />&nbsp;
                                        {observance.level?.toUpperCase()}
                                    </IonChip>
                                    {observance.practiceMinutes && ((observance.practiceMinutes.meditation || 0) + (observance.practiceMinutes.chanting || 0) + (observance.practiceMinutes.study || 0)) > 0 && (
                                        <IonChip color="secondary" outline>
                                            <IonIcon icon={timeOutline} />&nbsp;
                                            {(observance.practiceMinutes.meditation || 0) + (observance.practiceMinutes.chanting || 0) + (observance.practiceMinutes.study || 0)}m
                                        </IonChip>
                                    )}
                                </div>
                            )}

                            {observance.status === 'skipped' && observance.skipReason && (
                                <div style={{ marginTop: '4px', color: '#666' }}>
                                    Reason: {observance.skipReason.charAt(0).toUpperCase() + observance.skipReason.slice(1)}
                                </div>
                            )}

                        </div>
                        <IonButton fill="clear" size="small" color="medium" onClick={handleDelete}>
                            Edit
                        </IonButton>
                    </div>
                </IonCardContent>
            </IonCard>
        );
    }

    return (
        <IonCard className="ion-margin-bottom">
            <IonCardContent>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: "bold", margin: '0 0 4px 0' }}>Uposatha Observance</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Have you observed the precepts today?</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <IonButton
                        expand="block"
                        color="success"
                        fill="solid"
                        onClick={() => setShowObservedDialog(true)}
                    >
                        <IonIcon slot="start" icon={checkmarkCircle} />
                        Observed
                    </IonButton>

                    <IonButton
                        expand="block"
                        color="danger"
                        fill="outline"
                        onClick={() => setShowSkippedDialog(true)}
                    >
                        <IonIcon slot="start" icon={closeCircle} />
                        Skipped
                    </IonButton>
                </div>

                <MarkObservedDialog
                    isOpen={showObservedDialog}
                    onClose={() => setShowObservedDialog(false)}
                    onSave={handleSave}
                    date={date}
                />

                <MarkSkippedDialog
                    isOpen={showSkippedDialog}
                    onClose={() => setShowSkippedDialog(false)}
                    onSave={handleSave}
                    date={date}
                />
            </IonCardContent>
        </IonCard>
    );
};

export default ObservanceActionCard;
