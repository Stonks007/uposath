import React, { useState, useEffect } from 'react';
import {
    IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
    useIonViewWillEnter, IonList, IonItem, IonLabel, IonNote, IonIcon
} from '@ionic/react';
import { AnapanasatiService, AnapanasatiStats, AnapanasatiSession } from '../services/AnapanasatiService';
import { flame, timeOutline, calendarOutline, ribbonOutline } from 'ionicons/icons';

const AnapanasatiStatsPage: React.FC = () => {
    const [stats, setStats] = useState<AnapanasatiStats | null>(null);
    const [sessions, setSessions] = useState<AnapanasatiSession[]>([]);

    useIonViewWillEnter(() => {
        loadData();
    });

    const loadData = async () => {
        const s = await AnapanasatiService.getStats();
        const sess = await AnapanasatiService.getSessions();
        setStats(s);
        setSessions(sess);
    };

    if (!stats) return null;

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/sati/anapanasati" />
                    </IonButtons>
                    <IonTitle>Practice Statistics</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding">
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        background: 'var(--color-bg-card, #fff)',
                        padding: '16px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#F59E0B' }}>
                            {stats.currentStreak} <IonIcon icon={flame} style={{ fontSize: '1.2rem' }} />
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)' }}>Current Streak</div>
                    </div>

                    <div style={{
                        background: 'var(--color-bg-card, #fff)',
                        padding: '16px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10B981' }}>
                            {stats.totalSessions}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)' }}>Total Sessions</div>
                    </div>

                    <div style={{
                        background: 'var(--color-bg-card, #fff)',
                        padding: '16px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>
                            {Math.round(stats.totalMinutes / 60)}h
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)' }}>Total Time</div>
                    </div>

                    <div style={{
                        background: 'var(--color-bg-card, #fff)',
                        padding: '16px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8B5CF6' }}>
                            {stats.longestStreak}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #6b7280)' }}>Best Streak</div>
                    </div>
                </div>

                <h3 style={{ marginLeft: '8px', marginBottom: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}>Recent Sessions</h3>

                <IonList style={{ background: 'transparent' }}>
                    {sessions.map(session => (
                        <IonItem key={session.id} lines="none" style={{
                            '--background': 'var(--color-bg-card, #fff)',
                            marginBottom: '12px',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}>
                            <div style={{ padding: '8px 0', width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                                        {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #6b7280)' }}>
                                        {new Date(session.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{
                                            background: session.focus === 'all_16' ? '#E0F2FE' : '#F3F4F6',
                                            color: session.focus === 'all_16' ? '#0284C7' : '#4B5563',
                                            padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600'
                                        }}>
                                            {session.focus === 'all_16' ? 'All Steps' : session.focus}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                            {session.durationMinutes} min
                                        </span>
                                    </div>
                                    <div style={{ color: '#F59E0B', fontSize: '0.9rem' }}>
                                        {'★'.repeat(session.quality || 0)}
                                    </div>
                                </div>
                            </div>
                        </IonItem>
                    ))}
                    {sessions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontStyle: 'italic' }}>
                            No sessions yet. Start your journey!
                        </div>
                    )}
                </IonList>

            </IonContent>
        </IonPage>
    );
};

export default AnapanasatiStatsPage;
