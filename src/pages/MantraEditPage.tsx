import React, { useState, useRef } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonContent, IonButton, IonItem, IonLabel, IonInput,
    IonSelect, IonSelectOption, IonTextarea, IonList, IonListHeader,
    IonIcon, useIonToast, useIonViewWillEnter, IonProgressBar
} from '@ionic/react';
import { settingsOutline, createOutline, leafOutline, statsChartOutline, trashOutline, imageOutline, closeCircleOutline } from 'ionicons/icons';
import imageCompression from 'browser-image-compression';
import { useHistory, useParams } from 'react-router-dom';
import { MantraService } from '../services/MantraService';
import { deityImageService } from '../services/DeityImageService';
import { imagePickerService } from '../services/ImagePickerService';
import { Mantra, MantraTradition } from '../types/SatiTypes';
import './MantraEditPage.css';

const MantraEditPage: React.FC = () => {
    const history = useHistory();
    const { id } = useParams<{ id: string }>();
    const [mantra, setMantra] = useState<Mantra | null>(null);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [present] = useIonToast();

    useIonViewWillEnter(() => {
        loadData();
    });

    React.useEffect(() => {
        if (mantra) {
            deityImageService.getDeityImageSrc(mantra).then(setImageSrc);
        }
    }, [mantra]);

    const loadData = async () => {
        if (id === 'new') {
            setMantra(MantraService.createNewMantra());
        } else {
            const mantras = await MantraService.getMantras();
            const found = mantras.find(m => m.id === id);
            if (found) {
                setMantra(found);
            } else {
                present('Mantra not found', 2000);
                history.goBack();
            }
        }
    };

    const handleSave = async () => {
        if (!mantra) return;
        if (!mantra.basic.name) {
            present('Please enter a name', 2000);
            return;
        }

        await MantraService.addOrUpdateMantra({
            ...mantra,
            updated: new Date().toISOString()
        });

        history.goBack();
    };

    const handleDelete = async () => {
        if (id !== 'new') {
            await MantraService.deleteMantra(id);
            history.goBack();
        }
    };

    const handleChangeImage = async () => {
        if (!mantra) return;
        try {
            const oldPath = mantra.basic.deityImageType === 'user' ? mantra.basic.deityImagePath : undefined;
            const newPath = await imagePickerService.pickAndSaveDeityImage(mantra.id, oldPath);

            if (newPath) {
                setMantra({
                    ...mantra,
                    basic: {
                        ...mantra.basic,
                        deityImageType: 'user',
                        deityImagePath: newPath,
                        deityKey: undefined
                    }
                });
            }
        } catch (e) {
            console.error('Image change failed', e);
        }
    };

    const handleResetImage = async () => {
        if (!mantra) return;
        try {
            // Delete user file if it exists
            if (mantra.basic.deityImageType === 'user' && mantra.basic.deityImagePath) {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                await Filesystem.deleteFile({
                    directory: Directory.Data,
                    path: mantra.basic.deityImagePath
                });
            }

            const updatedMantra: Mantra = {
                ...mantra,
                basic: {
                    ...mantra.basic,
                    deityImageType: 'bundled',
                    deityImagePath: undefined
                }
            };

            // Restore default key if it's a built-in mantra
            if (updatedMantra.id === 'default_avalokitesvara') updatedMantra.basic.deityKey = 'avalokitesvara';
            else if (updatedMantra.id === 'default_tara') updatedMantra.basic.deityKey = 'green-tara';
            else if (updatedMantra.id === 'default_medicine_buddha') updatedMantra.basic.deityKey = 'medicine-buddha';
            else updatedMantra.basic.deityKey = undefined;

            setMantra(updatedMantra);
        } catch (e) {
            console.error('Image reset failed', e);
        }
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/sati/mantras" />
                    </IonButtons>
                    <IonTitle style={{ fontWeight: 800, fontFamily: 'var(--font-family-display)', letterSpacing: '0.02em' }}>
                        {id === 'new' ? 'ADD MANTRA' : 'EDIT MANTRA'}
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave} className="save-button-header" disabled={!mantra}>
                            SAVE
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                {!mantra ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <IonProgressBar type="indeterminate" color="primary" />
                        <p style={{ marginTop: '20px', color: 'var(--color-text-tertiary)' }}>Gathering mantra details...</p>
                    </div>
                ) : (
                    <div className="ion-padding mantra-edit-container">

                        {/* Basic Info Section */}
                        <div className="edit-section">
                            <div className="edit-section-header">
                                <h3 className="edit-section-title">Core Identity</h3>
                            </div>
                            <div className="edit-glass-card">
                                <div className="input-group">
                                    <label className="input-label">Mantra Name *</label>
                                    <IonInput
                                        className="custom-input"
                                        value={mantra.basic.name}
                                        placeholder="e.g. Great Compassion Mantra"
                                        onIonInput={e => setMantra(prev => prev ? { ...prev, basic: { ...prev.basic, name: e.detail.value! } } : null)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Deity / Figure</label>
                                    <IonInput
                                        className="custom-input"
                                        value={mantra.basic.deity}
                                        placeholder="e.g. Avalokiteśvara"
                                        onIonInput={e => setMantra(prev => prev ? { ...prev, basic: { ...prev.basic, deity: e.detail.value! } } : null)}
                                    />
                                </div>

                                <div className="input-group" style={{ marginTop: '24px' }}>
                                    <label className="input-label">Iconography</label>
                                    <div className="image-upload-row">
                                        <div className="image-preview-wrapper" onClick={handleChangeImage}>
                                            <img src={imageSrc} alt="Deity Preview" className="deity-preview-image" />
                                        </div>
                                        <div className="image-info">
                                            <div className="image-info-title">Sacred Imagery</div>
                                            <div className="image-actions">
                                                <IonButton fill="clear" color="primary" onClick={handleChangeImage} className="mini-action-button">
                                                    UPDATE
                                                </IonButton>
                                                {mantra.basic.deityImageType === 'user' && (
                                                    <IonButton fill="clear" color="danger" onClick={handleResetImage} className="mini-action-button">
                                                        RESET
                                                    </IonButton>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mantra Text Section */}
                        <div className="edit-section">
                            <div className="edit-section-header">
                                <h3 className="edit-section-title">Sacred Text</h3>
                            </div>
                            <div className="edit-glass-card">
                                <div className="input-group">
                                    <label className="input-label">Primary Script</label>
                                    <IonSelect
                                        className="custom-select"
                                        interface="popover"
                                        value={mantra.text.primaryScript}
                                        onIonChange={e => setMantra(prev => prev ? { ...prev, text: { ...prev.text, primaryScript: e.detail.value! } } : null)}
                                    >
                                        <IonSelectOption value="devanagari">Devanagari</IonSelectOption>
                                        <IonSelectOption value="roman">Roman (IAST)</IonSelectOption>
                                        <IonSelectOption value="tibetan">Tibetan</IonSelectOption>
                                        <IonSelectOption value="chinese">Chinese</IonSelectOption>
                                        <IonSelectOption value="thai">Thai</IonSelectOption>
                                    </IonSelect>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Mantra Text *</label>
                                    <IonTextarea
                                        className="custom-textarea"
                                        rows={4}
                                        value={mantra.text.primaryText}
                                        placeholder="Enter the sacred syllables..."
                                        onIonInput={e => setMantra(prev => prev ? { ...prev, text: { ...prev.text, primaryText: e.detail.value! } } : null)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Transliteration</label>
                                    <IonTextarea
                                        className="custom-textarea"
                                        rows={2}
                                        value={mantra.text.transliteration}
                                        placeholder="Phonetic reading..."
                                        onIonInput={e => setMantra(prev => prev ? { ...prev, text: { ...prev.text, transliteration: e.detail.value! } } : null)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Context & Practice Sections Combined for flow */}
                        <div className="edit-section">
                            <div className="edit-section-header">
                                <h3 className="edit-section-title">Tradition & Goals</h3>
                            </div>
                            <div className="edit-glass-card">
                                <div className="input-group">
                                    <label className="input-label">Lineage / Tradition</label>
                                    <IonSelect
                                        className="custom-select"
                                        interface="popover"
                                        value={mantra.tradition}
                                        onIonChange={e => setMantra(prev => prev ? { ...prev, tradition: e.detail.value as MantraTradition } : null)}
                                    >
                                        <IonSelectOption value="mahayana">Mahayana</IonSelectOption>
                                        <IonSelectOption value="theravada">Theravada</IonSelectOption>
                                        <IonSelectOption value="tibetan">Tibetan</IonSelectOption>
                                        <IonSelectOption value="zen">Zen</IonSelectOption>
                                        <IonSelectOption value="pureland">Pure Land</IonSelectOption>
                                        <IonSelectOption value="hindu">Hindu</IonSelectOption>
                                        <IonSelectOption value="custom">Custom / Other</IonSelectOption>
                                    </IonSelect>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Spiritual Purpose</label>
                                    <IonInput
                                        className="custom-input"
                                        value={mantra.purpose}
                                        placeholder="e.g. Compassion, Protection"
                                        onIonInput={e => setMantra(prev => prev ? { ...prev, purpose: e.detail.value! } : null)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="edit-section">
                            <div className="edit-section-header">
                                <h3 className="edit-section-title">Practice Targets</h3>
                            </div>
                            <div className="edit-glass-card">
                                <div className="practice-grid">
                                    <div className="input-group">
                                        <label className="input-label">Daily Reps</label>
                                        <IonInput
                                            className="custom-input"
                                            type="number"
                                            value={mantra.practice.defaultReps}
                                            onIonInput={e => setMantra(prev => prev ? { ...prev, practice: { ...prev.practice, defaultReps: parseInt(e.detail.value!, 10) || 0 } } : null)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Duration (Min)</label>
                                        <IonInput
                                            className="custom-input"
                                            type="number"
                                            value={mantra.practice.defaultDurationMinutes}
                                            onIonInput={e => setMantra(prev => prev ? { ...prev, practice: { ...prev.practice, defaultDurationMinutes: parseInt(e.detail.value!, 10) || 0 } } : null)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {id !== 'new' && (
                            <div className="delete-container">
                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    className="delete-button-brutal"
                                    onClick={handleDelete}
                                >
                                    <IonIcon slot="start" icon={trashOutline} />
                                    Delete Mantra
                                </IonButton>
                            </div>
                        )}
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default MantraEditPage;
