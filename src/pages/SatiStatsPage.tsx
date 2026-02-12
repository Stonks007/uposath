
import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonIcon,
    IonButton,
    IonAlert
} from '@ionic/react';
import { trashOutline, createOutline } from 'ionicons/icons';
import { MalaService } from '../services/MalaService';
import { MalaEntry, MalaStats } from '../types/SatiTypes';

const SatiStatsPage: React.FC = () => {
    const [stats, setStats] = useState<MalaStats | null>(null);
    const [entries, setEntries] = useState<MalaEntry[]>([]);
    const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

    const loadData = async () => {
        const s = await MalaService.getStats();
        const e = await MalaService.getEntries();
        setStats(s);
        setEntries(e);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async () => {
        if (entryToDelete) {
            await MalaService.deleteEntry(entryToDelete);
            setEntryToDelete(null);
            loadData();
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/sati" />
                    </IonButtons>
                    <IonTitle>Practice Statistics</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding">


                {/* Stats Grid */}
                {stats && (
                    <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>

                        {/* Overall Summary */}
                        <div style={{
                            backgroundColor: '#7C3AED',
                            color: 'white',
                            borderRadius: '16px',
                            padding: '20px',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', fontWeight: 'bold' }}>Combined Total</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Total Beads</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.overall.totalBeads.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Malas</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{(stats.overall.totalBeads / 108).toFixed(1)}</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Practice Days: <strong>{stats.practiceDays}</strong></span>
                                <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
                                <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Streak: <strong>{stats.overall.currentStreak}</strong> 🔥</span>
                            </div>
                        </div>

                        {/* Breakdown Cards */}
                        {(['buddha', 'dhamma', 'sangha'] as const).map(type => {
                            const typeStats = stats.byType[type];
                            const color = type === 'buddha' ? '#D4AF37' : (type === 'dhamma' ? '#0056b3' : '#b45309');
                            const bg = type === 'buddha' ? '#fffbf0' : (type === 'dhamma' ? '#f0f7ff' : '#fff7ed');

                            return (
                                <div key={type} style={{
                                    backgroundColor: bg,
                                    border: `1px solid ${color}30`,
                                    borderRadius: '12px',
                                    padding: '16px'
                                }}>
                                    <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: color, textTransform: 'capitalize', fontWeight: 'bold' }}>
                                        {type} Recollection
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Beads</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>{typeStats.totalBeads.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Malas</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>{(typeStats.totalBeads / 108).toFixed(1)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Streak</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                                                {typeStats.currentStreak} <span style={{ fontSize: '0.8rem' }}>days</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Sessions</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>{typeStats.totalSessions}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Recent Sessions List */}
                <h3 style={{ paddingLeft: '8px', fontSize: '1.1rem', color: '#333' }}>Recent Sessions</h3>
                <IonList inset={true} style={{ margin: '0', borderRadius: '12px' }}>
                    {entries.slice(0, 50).map(entry => (
                        <IonItem key={entry.id}>
                            <IonLabel>
                                <h2 style={{ textTransform: 'capitalize', fontWeight: 'bold', color: '#333' }}>
                                    {entry.practiceType || 'Buddha'}
                                </h2>
                                <p style={{ color: '#666' }}>
                                    {entry.beads} beads • {new Date(entry.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                            </IonLabel>
                            <IonButtons slot="end">
                                <IonButton color="danger" onClick={() => setEntryToDelete(entry.id)}>
                                    <IonIcon icon={trashOutline} />
                                </IonButton>
                            </IonButtons>
                        </IonItem>
                    ))}
                    {entries.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            No sessions logged yet.
                        </div>
                    )}
                </IonList>

                <IonAlert
                    isOpen={!!entryToDelete}
                    onDidDismiss={() => setEntryToDelete(null)}
                    header="Delete Entry?"
                    message="Are you sure you want to delete this practice session? This cannot be undone."
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            handler: () => setEntryToDelete(null)
                        },
                        {
                            text: 'Delete',
                            role: 'confirm',
                            handler: handleDelete
                        }
                    ]}
                />

            </IonContent>
        </IonPage>
    );
};

export default SatiStatsPage;
