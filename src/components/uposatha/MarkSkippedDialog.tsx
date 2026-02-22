
import React, { useState } from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea
} from '@ionic/react';
import { UposathaObservance } from '../../types/ObservanceTypes';

interface MarkSkippedDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<UposathaObservance>) => void;
    date: Date;
}

const MarkSkippedDialog: React.FC<MarkSkippedDialogProps> = ({ isOpen, onClose, onSave, date }) => {
    const [reason, setReason] = useState<string>('work');
    const [note, setNote] = useState<string>('');

    const handleSave = () => {
        onSave({
            status: 'skipped',
            skipReason: reason as any,
            skipNote: note,
            date: date.toISOString().split('T')[0]
        });
        onClose();
    };

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.5} breakpoints={[0, 0.5, 0.75]} style={{ '--background': 'transparent', '--border-radius': '16px' }} className="glass-modal">
            <IonHeader className="ion-no-border">
                <IonToolbar style={{ '--background': 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Skip Uposatha</h3>
                        <IonButtons>
                            <IonButton onClick={onClose} color="medium">Cancel</IonButton>
                            <IonButton strong color="warning" onClick={handleSave}>Confirm</IonButton>
                        </IonButtons>
                    </div>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{ '--background': 'transparent' }}>
                <div className="text-center mb-4 mt-2">
                    <h2 className="text-lg font-bold">
                        {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h2>
                    <p className="text-sm text-gray-400">Life happens. What prevented observance today?</p>
                </div>

                <IonList inset className="glass-list">
                    <IonItem className="glass-item">
                        <IonSelect
                            label="Reason"
                            labelPlacement="floating"
                            value={reason}
                            onIonChange={e => setReason(e.detail.value)}
                        >
                            <IonSelectOption value="work">Work / Busy</IonSelectOption>
                            <IonSelectOption value="travel">Traveling</IonSelectOption>
                            <IonSelectOption value="health">Health / Illness</IonSelectOption>
                            <IonSelectOption value="forgot">Forgot</IonSelectOption>
                            <IonSelectOption value="other">Other</IonSelectOption>
                        </IonSelect>
                    </IonItem>

                    <IonItem className="glass-item">
                        <IonTextarea
                            label="Note (Optional)"
                            labelPlacement="floating"
                            rows={3}
                            value={note}
                            onIonChange={e => setNote(e.detail.value || '')}
                        />
                    </IonItem>
                </IonList>
            </IonContent>
        </IonModal>
    );
};

export default MarkSkippedDialog;
