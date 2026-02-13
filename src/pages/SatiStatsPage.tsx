
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
    IonAlert,
    IonModal,
    IonInput,
    useIonViewWillEnter,
    IonDatetime
} from '@ionic/react';
import { trashOutline, createOutline } from 'ionicons/icons';
import { MalaService } from '../services/MalaService';
import { AnapanasatiService } from '../services/AnapanasatiService';
import { MantraService } from '../services/MantraService';
import { EmptinessService } from '../services/EmptinessService';
import { SatiStatsService } from '../services/SatiStatsService';
import { MalaEntry, MalaStats, GlobalStats, UnifiedSession, PracticeCategory } from '../types/SatiTypes';


const SatiStatsPage: React.FC = () => {
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [history, setHistory] = useState<UnifiedSession[]>([]);

    // Detailed Stats for Category Cards
    const [malaStats, setMalaStats] = useState<MalaStats | null>(null);
    const [anapanasatiStats, setAnapanasatiStats] = useState<any>(null);
    const [mantraStats, setMantraStats] = useState<any>(null); // Aggregated
    const [emptinessStats, setEmptinessStats] = useState<any>(null);

    // Mantra Specifics
    const [mantras, setMantras] = useState<any[]>([]);
    const [mantraSessions, setMantraSessions] = useState<any[]>([]);

    const [entryToDelete, setEntryToDelete] = useState<{ id: string, category: PracticeCategory } | null>(null);
    const [showTriratnaDetails, setShowTriratnaDetails] = useState(false);
    const [showMantraDetails, setShowMantraDetails] = useState(false);

    // Editing State
    const [editingSession, setEditingSession] = useState<{ id: string, category: PracticeCategory, count: number, timestamp: string } | null>(null);

    const loadData = async () => {
        const g = await SatiStatsService.getGlobalStats();
        const h = await SatiStatsService.getUnifiedHistory();
        setGlobalStats(g);
        setHistory(h);

        // Load specific stats for cards
        setMalaStats(await MalaService.getStats());
        setAnapanasatiStats(await AnapanasatiService.getStats());
        setEmptinessStats(await EmptinessService.getStats());

        // Mantra aggregation for card and details
        const mList = await MantraService.getMantras();
        const mSessions = await MantraService.getSessions();
        setMantras(mList);
        setMantraSessions(mSessions);

        const mBeads = mSessions.reduce((acc, s) => acc + s.reps, 0);
        setMantraStats({
            totalSessions: mSessions.length,
            totalBeads: mBeads,
            totalMalas: (mBeads / 108).toFixed(1)
        });
    };

    useIonViewWillEnter(() => {
        loadData();
    });

    const handleDelete = async () => {
        if (entryToDelete) {
            await SatiStatsService.deleteSession(entryToDelete.id, entryToDelete.category);
            setEntryToDelete(null);
            loadData();
        }
    };

    const handleEditClick = (session: UnifiedSession) => {
        // Extract count from detail string or fetch it? 
        // Detail string is like "108 beads" or "20 mins".
        // Let's parse it for now as a quick solution, or fetch full object if needed.
        // Parsing is risky if format changes.
        // Better: We can rely on the fact that we know the structure.
        let count = 0;
        const numMatch = session.detail.match(/(\d+(\.\d+)?)/);
        if (numMatch) {
            count = parseFloat(numMatch[0]);
        }

        setEditingSession({
            id: session.id,
            category: session.category,
            count: count,
            timestamp: session.timestamp
        });
    };

    const handleSaveEdit = async () => {
        if (editingSession) {
            // value construction depends on category
            // We need to fetch original to keep other fields?
            // Or just construct a partial update if our services support it.
            // Our services (updated in previous steps) assume full object replacement usually or we need to fetch -> update -> save.

            // Let's fetch the specific session first to ensure we don't lose data
            let original: any = null;
            if (editingSession.category === 'mala') {
                const entries = await MalaService.getEntries();
                original = entries.find(e => e.id === editingSession.id);
                if (original) {
                    original.beads = editingSession.count;
                    original.timestamp = editingSession.timestamp;
                }
            } else if (editingSession.category === 'anapanasati') {
                const sessions = await AnapanasatiService.getSessions();
                original = sessions.find(s => s.id === editingSession.id);
                if (original) {
                    original.durationMinutes = editingSession.count;
                    original.timestamp = editingSession.timestamp;
                }
            } else if (editingSession.category === 'emptiness') {
                const sessions = await EmptinessService.getSessions();
                original = sessions.find(s => s.id === editingSession.id);
                if (original) {
                    original.durationMinutes = editingSession.count;
                    original.timestamp = editingSession.timestamp;
                }
            } else if (editingSession.category === 'mantra') {
                const sessions = await MantraService.getSessions();
                original = sessions.find(s => s.id === editingSession.id);
                if (original) {
                    original.reps = editingSession.count;
                    original.durationMinutes = (editingSession.count / 108) * 15; // Approx or keep original? Let's just update reps.
                    original.timestamp = editingSession.timestamp;
                }
            }

            if (original) {
                await SatiStatsService.updateSession(original, editingSession.category);
                setEditingSession(null);
                loadData();
            }
        }
    };

    const getCategoryIcon = (cat: PracticeCategory) => {
        switch (cat) {
            case 'mala': return '📿';
            case 'anapanasati': return '🌬️';
            case 'mantra': return '🕉️';
            case 'emptiness': return '🧘';
            default: return '•';
        }
    };

    const getCategoryColor = (cat: PracticeCategory) => {
        switch (cat) {
            case 'mala': return '#D97706'; // Amber
            case 'anapanasati': return '#059669'; // Emerald
            case 'mantra': return '#7C3AED'; // Violet
            case 'emptiness': return '#2563EB'; // Blue
            default: return '#666';
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

                {/* Global Summary */}
                {globalStats && (
                    <div style={{
                        background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
                        color: 'white',
                        borderRadius: '24px',
                        padding: '24px',
                        marginBottom: '24px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', fontWeight: '600', opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Journey Overview
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1 }}>
                                    {globalStats.totalSessions}
                                </div>
                                <div style={{ fontSize: '0.95rem', opacity: 0.7, marginTop: '4px' }}>Total Sessions</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#FCD34D' }}>
                                    {globalStats.currentStreak} <span style={{ fontSize: '1rem' }}>days</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Current Streak 🔥</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Cards Grid */}
                <h3 style={{ paddingLeft: '8px', fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>Practice Breakdown</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>

                    {/* Mala Card */}
                    {malaStats && (
                        <div
                            className="stat-card"
                            style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '16px', padding: '16px', cursor: 'pointer' }}
                            onClick={() => setShowTriratnaDetails(true)}
                        >
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📿</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#92400E', textTransform: 'uppercase', marginBottom: '12px' }}>Tiratana Anussati</div>

                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1F2937' }}>{(malaStats.overall.totalBeads / 108).toFixed(1)}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Malas</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1F2937' }}>{malaStats.overall.totalBeads.toLocaleString()}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Beads</div>
                            </div>
                        </div>
                    )}

                    {/* Mantra Card */}
                    {mantraStats && (
                        <div
                            className="stat-card"
                            style={{ background: '#F5F3FF', border: '1px solid #C4B5FD', borderRadius: '16px', padding: '16px', cursor: 'pointer' }}
                            onClick={() => setShowMantraDetails(true)}
                        >
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🕉️</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#5B21B6', textTransform: 'uppercase', marginBottom: '12px' }}>Mantra</div>

                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1F2937' }}>{mantraStats.totalMalas}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Malas</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1F2937' }}>{mantraStats.totalBeads.toLocaleString()}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Beads</div>
                            </div>
                        </div>
                    )}

                    {/* Anapanasati Card */}
                    {anapanasatiStats && (
                        <div className="stat-card" style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '16px', padding: '16px' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🌬️</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#065F46', textTransform: 'uppercase', marginBottom: '12px' }}>Anapanasati</div>

                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1F2937' }}>{anapanasatiStats.totalMinutes}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Minutes</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1F2937' }}>{anapanasatiStats.totalSessions}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Sessions</div>
                            </div>
                        </div>
                    )}

                    {/* Emptiness Card */}
                    {emptinessStats && (
                        <div className="stat-card" style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: '16px', padding: '16px' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🧘</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1E40AF', textTransform: 'uppercase', marginBottom: '12px' }}>Emptiness</div>

                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1F2937' }}>{emptinessStats.totalMinutes}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Minutes</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1F2937' }}>{emptinessStats.totalSessions}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Sessions</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Unified History List */}
                <h3 style={{ paddingLeft: '8px', fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>History Log</h3>
                <IonList inset={true} style={{ margin: '0', borderRadius: '16px', background: 'var(--color-bg-card)' }}>
                    {history.slice(0, 50).map(item => (
                        <IonItem key={item.id} lines="full" detail={false}>
                            <div slot="start" style={{
                                fontSize: '1.5rem',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `${getCategoryColor(item.category)}20`,
                                borderRadius: '50%'
                            }}>
                                {getCategoryIcon(item.category)}
                            </div>
                            <IonLabel className="ion-text-wrap">
                                <h2 style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '1rem' }}>
                                    {item.title}
                                </h2>
                                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>
                                    <span style={{
                                        color: getCategoryColor(item.category),
                                        fontWeight: '600',
                                        marginRight: '6px',
                                        textTransform: 'capitalize'
                                    }}>
                                        {item.category}
                                    </span>
                                    • {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </IonLabel>
                            <div slot="end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <span style={{ fontWeight: '700', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{item.detail}</span>
                                <div style={{ display: 'flex' }}>
                                    <IonButton
                                        fill="clear"
                                        size="small"
                                        color="medium"
                                        style={{ margin: 0, height: '24px' }}
                                        onClick={() => handleEditClick(item)}
                                    >
                                        <IonIcon icon={createOutline} style={{ fontSize: '1rem' }} />
                                    </IonButton>
                                    <IonButton
                                        fill="clear"
                                        size="small"
                                        color="medium"
                                        style={{ margin: 0, height: '24px' }}
                                        onClick={() => setEntryToDelete({ id: item.id, category: item.category })}
                                    >
                                        <IonIcon icon={trashOutline} style={{ fontSize: '1rem' }} />
                                    </IonButton>
                                </div>
                            </div>
                        </IonItem>
                    ))}
                    {history.length === 0 && (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                            No practice sessions recorded yet.
                        </div>
                    )}
                </IonList>
            </IonContent>

            <IonAlert
                isOpen={!!entryToDelete}
                onDidDismiss={() => setEntryToDelete(null)}
                header="Delete Session?"
                message="Are you sure you want to delete this practice record? This cannot be undone."
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

            {/* Tiratana Detail Modal */}
            <IonModal
                isOpen={showTriratnaDetails}
                onDidDismiss={() => setShowTriratnaDetails(false)}
                initialBreakpoint={0.8}
                breakpoints={[0, 0.8, 1]}
                handle={true}
                backdropBreakpoint={0.5}
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Tiratana Breakdown</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowTriratnaDetails(false)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding" fullscreen={true}>
                    {malaStats && (
                        <div style={{ display: 'grid', gap: '16px', paddingTop: '16px' }}>
                            {(['buddha', 'dhamma', 'sangha'] as const).map(type => {
                                const typeStats = malaStats.byType[type];
                                const color = type === 'buddha' ? '#D4AF37' : (type === 'dhamma' ? '#0056b3' : '#b45309');
                                const bg = type === 'buddha' ? '#fffbf0' : (type === 'dhamma' ? '#f0f7ff' : '#fff7ed');
                                const title = type === 'buddha' ? 'Buddhanusati' : (type === 'dhamma' ? 'Dhammanusati' : 'Sanghanusati');
                                const icon = type === 'buddha' ? '☸️' : (type === 'dhamma' ? '📜' : '👥');

                                return (
                                    <div key={type} style={{
                                        backgroundColor: bg,
                                        border: `1px solid ${color}30`,
                                        borderRadius: '16px',
                                        padding: '20px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: color, fontWeight: 'bold' }}>
                                                {title}
                                            </h3>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Total Beads</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1F2937' }}>{typeStats.totalBeads.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Malas</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1F2937' }}>{(typeStats.totalBeads / 108).toFixed(1)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Current Streak</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1F2937' }}>
                                                    {typeStats.currentStreak} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>days</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Sessions</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1F2937' }}>{typeStats.totalSessions}</div>
                                            </div>
                                        </div>

                                        {/* Mini Log List for this Type */}
                                        {(() => {
                                            const typeHistory = history.filter(h =>
                                                h.category === 'mala' &&
                                                h.title.toLowerCase().includes(title.replace('nusati', '').toLowerCase())
                                            );

                                            if (typeHistory.length === 0) return null;

                                            return (
                                                <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '8px' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666', marginBottom: '8px', paddingLeft: '8px' }}>RECENT LOGS</div>
                                                    {typeHistory.slice(0, 5).map(log => (
                                                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                            <div>
                                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>{log.detail}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                                    {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex' }}>
                                                                <IonButton
                                                                    fill="clear"
                                                                    size="small"
                                                                    color="medium"
                                                                    onClick={() => handleEditClick(log)}
                                                                >
                                                                    <IonIcon icon={createOutline} />
                                                                </IonButton>
                                                                <IonButton
                                                                    fill="clear"
                                                                    size="small"
                                                                    color="medium"
                                                                    onClick={() => {
                                                                        setEntryToDelete({ id: log.id, category: 'mala' });
                                                                    }}
                                                                >
                                                                    <IonIcon icon={trashOutline} />
                                                                </IonButton>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </IonContent>
            </IonModal>

            {/* Mantra Detail Modal */}
            <IonModal
                isOpen={showMantraDetails}
                onDidDismiss={() => setShowMantraDetails(false)}
                initialBreakpoint={0.8}
                breakpoints={[0, 0.8, 1]}
                handle={true}
                backdropBreakpoint={0.5}
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Mantra Breakdown</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowMantraDetails(false)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding" fullscreen={true}>
                    <div style={{ display: 'grid', gap: '16px', paddingTop: '16px' }}>
                        {mantras.map(mantra => {
                            // Filter sessions for this mantra
                            const sessions = mantraSessions.filter(s => s.mantraId === mantra.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                            return (
                                <div key={mantra.id} style={{
                                    backgroundColor: '#F5F3FF',
                                    border: '1px solid #C4B5FD',
                                    borderRadius: '16px',
                                    padding: '20px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '1.5rem' }}>{mantra.basic.icon || '🕉️'}</div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#5B21B6', fontWeight: 'bold' }}>
                                                {mantra.basic.name}
                                            </h3>
                                            {mantra.basic.deity && <div style={{ fontSize: '0.8rem', color: '#666' }}>{mantra.basic.deity}</div>}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Total Beads</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1F2937' }}>{mantra.stats.totalReps.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Malas</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1F2937' }}>{(mantra.stats.totalReps / 108).toFixed(1)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Current Streak</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1F2937' }}>
                                                {mantra.stats.currentStreak} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>days</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Sessions</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1F2937' }}>{mantra.stats.totalSessions}</div>
                                        </div>
                                    </div>

                                    {/* Mini Log List for this Mantra */}
                                    {sessions.length > 0 && (
                                        <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '8px' }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666', marginBottom: '8px', paddingLeft: '8px' }}>RECENT LOGS</div>
                                            {sessions.slice(0, 5).map((log: any) => (
                                                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>{log.reps} beads</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                            {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex' }}>
                                                        <IonButton
                                                            fill="clear"
                                                            size="small"
                                                            color="medium"
                                                            onClick={() => {
                                                                handleEditClick({
                                                                    id: log.id,
                                                                    category: 'mantra',
                                                                    title: mantra.basic.name,
                                                                    detail: `${log.reps} beads`,
                                                                    timestamp: log.timestamp
                                                                });
                                                            }}
                                                        >
                                                            <IonIcon icon={createOutline} />
                                                        </IonButton>
                                                        <IonButton
                                                            fill="clear"
                                                            size="small"
                                                            color="medium"
                                                            onClick={() => {
                                                                setEntryToDelete({ id: log.id, category: 'mantra' });
                                                            }}
                                                        >
                                                            <IonIcon icon={trashOutline} />
                                                        </IonButton>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </IonContent>
            </IonModal>

            {/* Edit Session Modal */}
            <IonModal
                isOpen={!!editingSession}
                onDidDismiss={() => setEditingSession(null)}
                initialBreakpoint={0.8}
                breakpoints={[0, 0.8, 1]}
                handle={true}
                backdropBreakpoint={0.5}
            >
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Edit Session</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setEditingSession(null)}>Cancel</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding" fullscreen={true}>
                    {editingSession && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>Date & Time</div>
                                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px' }}>
                                    <IonDatetime
                                        presentation="date-time"
                                        value={editingSession.timestamp}
                                        onIonChange={e => setEditingSession({ ...editingSession, timestamp: e.detail.value as string })}
                                    />
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                                    {editingSession.category === 'anapanasati' || editingSession.category === 'emptiness' ? 'Duration (Minutes)' :
                                        'Beads'}
                                </div>
                                <IonItem lines="none" style={{ border: '1px solid #ddd', borderRadius: '8px', '--background': 'transparent' }}>
                                    <IonInput
                                        type="number"
                                        value={editingSession.count}
                                        onIonChange={e => setEditingSession({ ...editingSession, count: parseFloat(e.detail.value!) })}
                                    />
                                </IonItem>
                            </div>

                            <div style={{ paddingTop: '20px' }}>
                                <IonButton expand="block" onClick={handleSaveEdit}>Save Changes</IonButton>
                            </div>
                        </div>
                    )}
                </IonContent>
            </IonModal>
        </IonPage>
    );
};

export default SatiStatsPage;
