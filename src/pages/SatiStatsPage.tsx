
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
    IonDatetime,
    IonSegment,
    IonSegmentButton
} from '@ionic/react';
import { trashOutline, createOutline } from 'ionicons/icons';
import { MalaService } from '../services/MalaService';
import { AnapanasatiService, AnapanasatiStats } from '../services/AnapanasatiService';
import { MantraService } from '../services/MantraService';
import { EmptinessService } from '../services/EmptinessService';
import { SatiStatsService } from '../services/SatiStatsService';
import { MalaEntry, MalaStats, GlobalStats, UnifiedSession, PracticeCategory, EmptinessStats, Mantra, MantraSession } from '../types/SatiTypes';
import UposathaStatsView from '../components/uposatha/UposathaStatsView';
import './SatiStatsPage.css';


const SatiStatsPage: React.FC = () => {
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [history, setHistory] = useState<UnifiedSession[]>([]);

    // Detailed Stats for Category Cards
    const [malaStats, setMalaStats] = useState<MalaStats | null>(null);
    const [anapanasatiStats, setAnapanasatiStats] = useState<AnapanasatiStats | null>(null);
    const [mantraStats, setMantraStats] = useState<any>(null); // Aggregated
    const [emptinessStats, setEmptinessStats] = useState<EmptinessStats | null>(null);

    // Mantra Specifics
    const [mantras, setMantras] = useState<any[]>([]);
    const [mantraSessions, setMantraSessions] = useState<any[]>([]);

    const [entryToDelete, setEntryToDelete] = useState<{ id: string, category: PracticeCategory } | null>(null);
    const [showTriratnaDetails, setShowTriratnaDetails] = useState(false);
    const [showMantraDetails, setShowMantraDetails] = useState(false);
    const [showAnapanasatiDetails, setShowAnapanasatiDetails] = useState(false);
    const [showEmptinessDetails, setShowEmptinessDetails] = useState(false);


    // ... (inside component)
    const [statsView, setStatsView] = useState<'practice' | 'observance'>('practice');
    const [editingSession, setEditingSession] = useState<{ id: string, category: PracticeCategory, count: number, timestamp: string } | null>(null);

    const loadData = async () => {
        try {
            // Use settled promises so one failing service doesn't break the whole page
            const results = await Promise.allSettled([
                SatiStatsService.getGlobalStats(),
                SatiStatsService.getUnifiedHistory(),
                MalaService.getStats(),
                AnapanasatiService.getStats(),
                EmptinessService.getStats(),
                MantraService.getMantras(),
                MantraService.getSessions()
            ]);

            if (results[0].status === 'fulfilled') setGlobalStats(results[0].value);
            if (results[1].status === 'fulfilled') setHistory(results[1].value);
            if (results[2].status === 'fulfilled') setMalaStats(results[2].value);
            if (results[3].status === 'fulfilled') setAnapanasatiStats(results[3].value);
            if (results[4].status === 'fulfilled') setEmptinessStats(results[4].value);

            let mList: Mantra[] = [];
            let mSessions: MantraSession[] = [];
            if (results[5].status === 'fulfilled') {
                mList = results[5].value as Mantra[];
                setMantras(mList);
            }
            if (results[6].status === 'fulfilled') {
                mSessions = results[6].value as MantraSession[];
                setMantraSessions(mSessions);
            }

            const mBeads = mSessions.reduce((acc, s) => acc + (Number(s.reps) || 0), 0);
            setMantraStats({
                totalSessions: mSessions.length,
                totalBeads: mBeads,
                totalMalas: (mBeads / 108).toFixed(1)
            });

            // Log status for debugging on device
            const failedCount = results.filter(r => r.status === 'rejected').length;
            if (failedCount > 0) {
                console.warn(`${failedCount} sati services failed to load on device`);
            }
        } catch (err) {
            console.error('Critical failure in sati loadData:', err);
        }
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
                <IonToolbar style={{ '--background': 'transparent' }}>
                    <IonSegment value={statsView} onIonChange={e => setStatsView(e.detail.value as any)}>
                        <IonSegmentButton value="practice">
                            <IonLabel>Practice</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="observance">
                            <IonLabel>Observance</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="ion-padding">
                {statsView === 'practice' && (
                    <>
                        {/* Global Summary */}
                        {globalStats && (
                            <div className="glass-card journey-overview-card">
                                <h3>Journey Overview</h3>
                                <div className="stats-grid-3">
                                    <div>
                                        <div className="stat-value-large">{globalStats.totalSessions}</div>
                                        <div className="stat-label-small">Sessions</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="stat-value-large stat-value-accent">
                                            {globalStats.totalBeads.toLocaleString()}
                                        </div>
                                        <div className="stat-label-small">Total Beads</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="stat-value-large" style={{ color: 'var(--color-mahayana-secondary)' }}>
                                            {globalStats.currentStreak} <span style={{ fontSize: '1rem', fontWeight: '500' }}>d</span>
                                        </div>
                                        <div className="stat-label-small">Streak 🔥</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Category Cards Grid */}
                        <h3 className="practice-breakdown-title">Practice Breakdown</h3>

                        <div className="category-cards-grid">

                            {/* Mala Card */}
                            {malaStats && (
                                <div className="glass-card category-stat-card" onClick={() => setShowTriratnaDetails(true)}>
                                    <div className="cat-header">
                                        <span className="cat-icon">📿</span>
                                        <span className="cat-name" style={{ color: '#FCD34D' }}>Tiratana</span>
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <div className="main-value">{(malaStats.overall.totalBeads / 108).toFixed(1)}</div>
                                        <div className="sub-value">Malas Finished</div>
                                    </div>
                                </div>
                            )}

                            {/* Mantra Card */}
                            {mantraStats && (
                                <div className="glass-card category-stat-card" onClick={() => setShowMantraDetails(true)}>
                                    <div className="cat-header">
                                        <span className="cat-icon">🕉️</span>
                                        <span className="cat-name" style={{ color: '#C4B5FD' }}>Mantra</span>
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <div className="main-value">{mantraStats.totalMalas}</div>
                                        <div className="sub-value">Total Malas</div>
                                    </div>
                                </div>
                            )}

                            {/* Anapanasati Card */}
                            {anapanasatiStats && (
                                <div className="glass-card category-stat-card" onClick={() => setShowAnapanasatiDetails(true)}>
                                    <div className="cat-header">
                                        <span className="cat-icon">🌬️</span>
                                        <span className="cat-name" style={{ color: '#6EE7B7' }}>Anapanasati</span>
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <div className="main-value">{anapanasatiStats.totalMinutes}</div>
                                        <div className="sub-value">Total Minutes</div>
                                    </div>
                                </div>
                            )}

                            {/* Emptiness Card */}
                            {emptinessStats && (
                                <div className="glass-card category-stat-card" onClick={() => setShowEmptinessDetails(true)}>
                                    <div className="cat-header">
                                        <span className="cat-icon">🧘</span>
                                        <span className="cat-name" style={{ color: '#93C5FD' }}>Emptiness</span>
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <div className="main-value">{emptinessStats.totalMinutes}</div>
                                        <div className="sub-value">Total Minutes</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Unified History List */}
                        <h3 className="practice-breakdown-title">History Log</h3>
                        <IonList inset={true} style={{ margin: '0', background: 'transparent' }}>
                            {history.slice(0, 50).map(item => (
                                <IonItem key={item.id} className="glass-card history-item" lines="none" detail={false}>
                                    <div slot="start" className="icon-wrapper icon-wrapper--medium history-item-icon" style={{
                                        borderColor: `${getCategoryColor(item.category)}40`,
                                        background: `${getCategoryColor(item.category)}15`
                                    }}>
                                        {getCategoryIcon(item.category)}
                                    </div>
                                    <IonLabel className="ion-text-wrap">
                                        <h2 style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                                            {item.title}
                                        </h2>
                                        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
                                            <span style={{
                                                color: getCategoryColor(item.category),
                                                fontWeight: '600',
                                                marginRight: '6px'
                                            }}>
                                                {item.category.toUpperCase()}
                                            </span>
                                            • {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </IonLabel>
                                    <div slot="end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--color-text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-family-display)' }}>{item.detail}</span>
                                        <div style={{ display: 'flex' }}>
                                            <IonButton fill="clear" size="small" color="primary" onClick={() => handleEditClick(item)}>
                                                <IonIcon icon={createOutline} />
                                            </IonButton>
                                            <IonButton fill="clear" size="small" color="danger" onClick={() => setEntryToDelete({ id: item.id, category: item.category })}>
                                                <IonIcon icon={trashOutline} />
                                            </IonButton>
                                        </div>
                                    </div>
                                </IonItem>
                            ))}
                            {history.length === 0 && (
                                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
                                    No records found.
                                </div>
                            )}
                        </IonList>
                    </>
                )}
                {statsView === 'observance' && <UposathaStatsView />}
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
                    <IonToolbar style={{ '--background': 'transparent' }}>
                        <IonTitle>Tiratana Breakdown</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowTriratnaDetails(false)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding" fullscreen={true} style={{ '--background': 'var(--color-bg-primary)' }}>
                    {malaStats && (
                        <div style={{ display: 'grid', gap: '16px', paddingTop: '16px' }}>
                            {(['buddha', 'dhamma', 'sangha'] as const).map(type => {
                                // Source of truth: filter from history
                                const titlePart = type.toLowerCase().includes('budd') ? 'buddha' : (type.toLowerCase().includes('dham') ? 'dhamma' : 'sangha');
                                const typeSessions = history.filter(h =>
                                    h.category === 'mala' &&
                                    h.title.toLowerCase().includes(titlePart)
                                ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                                const totalBeads = typeSessions.reduce((acc, s) => {
                                    const match = s.detail.match(/(\d+)/);
                                    return acc + (match ? parseInt(match[0]) : 0);
                                }, 0);

                                const typeStats = malaStats.byType[type];
                                const color = type === 'buddha' ? 'var(--color-accent-primary)' : (type === 'dhamma' ? '#3B82F6' : '#F59E0B');
                                const displayTitle = type === 'buddha' ? 'Buddhanusati' : (type === 'dhamma' ? 'Dhammanusati' : 'Sanghanusati');
                                const icon = type === 'buddha' ? '☸️' : (type === 'dhamma' ? '📜' : '👥');

                                return (
                                    <div key={type} className="glass-card type-breakdown-card">
                                        <div className="type-breakdown-header">
                                            <div className="icon-wrapper icon-wrapper--medium" style={{ borderColor: `${color}40`, background: `${color}10` }}>{icon}</div>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: color, fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>
                                                {displayTitle}
                                            </h3>
                                        </div>

                                        <div className="type-breakdown-content">
                                            <div>
                                                <div className="stat-label-small">Total Beads</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{totalBeads.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="stat-label-small">Malas</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{(totalBeads / 108).toFixed(1)}</div>
                                            </div>
                                            <div>
                                                <div className="stat-label-small">Streak</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-accent-primary)' }}>
                                                    {typeStats.currentStreak} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>days</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="stat-label-small">Sessions</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{typeSessions.length}</div>
                                            </div>
                                        </div>

                                        {/* Mini Log List for this Type */}
                                        {typeSessions.length > 0 && (
                                            <div className="mini-log-container">
                                                <div className="mini-log-title">Recent Logs</div>
                                                {typeSessions.slice(0, 5).map(log => (
                                                    <div key={log.id} className="mini-log-item">
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{log.detail}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                                {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <IonButton fill="clear" size="small" color="primary" onClick={() => handleEditClick(log)}>
                                                                <IonIcon icon={createOutline} />
                                                            </IonButton>
                                                            <IonButton
                                                                fill="clear"
                                                                size="small"
                                                                color="danger"
                                                                onClick={() => setEntryToDelete({ id: log.id, category: 'mala' })}
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

                            {/* Legacy/Misc Mala Section */}
                            {(() => {
                                const legacySessions = history.filter(h =>
                                    h.category === 'mala' &&
                                    !['budd', 'dham', 'sang'].some(key => h.title.toLowerCase().includes(key))
                                );

                                if (legacySessions.length === 0) return null;

                                const totalBeads = legacySessions.reduce((acc, s) => {
                                    const match = s.detail.match(/(\d+)/);
                                    return acc + (match ? parseInt(match[0]) : 0);
                                }, 0);

                                return (
                                    <div style={{
                                        backgroundColor: '#F3F4F6',
                                        border: '1px solid #D1D5DB',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        opacity: 0.8
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '1.5rem' }}>📿</div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#4B5563', fontWeight: 'bold' }}>
                                                Other Recollection
                                            </h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Total Beads</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1F2937' }}>{totalBeads.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>Sessions</div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1F2937' }}>{legacySessions.length}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
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
                    <IonToolbar style={{ '--background': 'transparent' }}>
                        <IonTitle>Mantra Breakdown</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowMantraDetails(false)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding" fullscreen={true} style={{ '--background': 'var(--color-bg-primary)' }}>
                    <div style={{ display: 'grid', gap: '16px', paddingTop: '16px' }}>
                        {mantras.map(mantra => {
                            const mantraSessionsList = mantraSessions.filter(s => s.mantraId === mantra.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                            const totalReps = mantraSessionsList.reduce((acc, s) => acc + (Number(s.reps) || 0), 0);
                            const totalSessionsCount = mantraSessionsList.length;
                            const currentStreak = mantra.stats?.currentStreak || 0;

                            return (
                                <div key={mantra.id} className="glass-card type-breakdown-card">
                                    <div className="type-breakdown-header">
                                        <div className="icon-wrapper icon-wrapper--medium" style={{ borderColor: 'var(--color-mahayana-primary)40', background: 'var(--color-mahayana-primary)10' }}>
                                            {mantra.basic.icon || '🕉️'}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-mahayana-secondary)', fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>
                                                {mantra.basic.name}
                                            </h3>
                                            {mantra.basic.deity && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>{mantra.basic.deity}</div>}
                                        </div>
                                    </div>

                                    <div className="type-breakdown-content">
                                        <div>
                                            <div className="stat-label-small">Total Beads</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{totalReps.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="stat-label-small">Malas</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{(totalReps / 108).toFixed(1)}</div>
                                        </div>
                                        <div>
                                            <div className="stat-label-small">Streak</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-accent-primary)' }}>
                                                {currentStreak} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>days</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="stat-label-small">Sessions</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{totalSessionsCount}</div>
                                        </div>
                                    </div>

                                    {mantraSessionsList.length > 0 && (
                                        <div className="mini-log-container">
                                            <div className="mini-log-title">Recent Logs</div>
                                            {mantraSessionsList.slice(0, 5).map((log: any) => (
                                                <div key={log.id} className="mini-log-item">
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{log.reps} beads</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                            {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <IonButton fill="clear" size="small" color="primary" onClick={() => handleEditClick({ id: log.id, category: 'mantra', title: mantra.basic.name, detail: `${log.reps} beads`, timestamp: log.timestamp })}>
                                                            <IonIcon icon={createOutline} />
                                                        </IonButton>
                                                        <IonButton fill="clear" size="small" color="danger" onClick={() => setEntryToDelete({ id: log.id, category: 'mantra' })}>
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
                        {/* Legacy/Orphaned Mantra Sessions Section */}
                        {(() => {
                            const mantraIds = new Set(mantras.map(m => m.id));
                            const orphanedSessions = mantraSessions.filter(s => !mantraIds.has(s.mantraId)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                            if (orphanedSessions.length === 0) return null;

                            const orphanBeads = orphanedSessions.reduce((acc, s) => acc + (Number(s.reps) || 0), 0);

                            return (
                                <div className="glass-card" style={{
                                    border: '1px solid var(--glass-border)',
                                    padding: '20px',
                                    opacity: 0.9,
                                    marginTop: '16px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '1.5rem' }}>🪦</div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                                                Legacy Practice
                                            </h3>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>Sessions from deleted mantras</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div>
                                            <div className="stat-label-small" style={{ marginBottom: '4px' }}>Total Beads</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{orphanBeads.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="stat-label-small" style={{ marginBottom: '4px' }}>Sessions</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{orphanedSessions.length}</div>
                                        </div>
                                    </div>

                                    <div className="mini-log-container">
                                        <div className="mini-log-title" style={{ paddingLeft: '8px' }}>ORPHANED LOGS</div>
                                        {orphanedSessions.slice(0, 5).map((log: any) => (
                                            <div key={log.id} className="mini-log-item">
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>{log.reps} beads</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                        {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex' }}>
                                                    <IonButton
                                                        fill="clear"
                                                        size="small"
                                                        color="danger"
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
                                </div>
                            );
                        })()}
                    </div>
                </IonContent>
            </IonModal>

            {/* Anapanasati Detail Modal */}
            <IonModal
                isOpen={showAnapanasatiDetails}
                onDidDismiss={() => setShowAnapanasatiDetails(false)}
                initialBreakpoint={0.8}
                breakpoints={[0, 0.8, 1]}
                handle={true}
                backdropBreakpoint={0.5}
            >
                <IonHeader>
                    <IonToolbar style={{ '--background': 'transparent' }}>
                        <IonTitle>Anapanasati Breakdown</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowAnapanasatiDetails(false)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding" fullscreen={true} style={{ '--background': 'var(--color-bg-primary)' }}>
                    {anapanasatiStats && (
                        <div style={{ display: 'grid', gap: '16px', paddingTop: '16px' }}>
                            <div className="glass-card type-breakdown-card">
                                <div className="type-breakdown-header">
                                    <div className="icon-wrapper icon-wrapper--medium" style={{ borderColor: 'var(--color-mahayana-accent)40', background: 'var(--color-mahayana-accent)10' }}>🌬️</div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-mahayana-accent)', fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>
                                        Breath Awareness
                                    </h3>
                                </div>

                                <div className="type-breakdown-content">
                                    <div>
                                        <div className="stat-label-small">Total Time</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{anapanasatiStats.totalMinutes} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>mins</span></div>
                                    </div>
                                    <div>
                                        <div className="stat-label-small">Streak</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-accent-primary)' }}>
                                            {anapanasatiStats.currentStreak} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>days</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="stat-label-small">Sessions</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{anapanasatiStats.totalSessions}</div>
                                    </div>
                                </div>

                                <div className="mini-log-title" style={{ paddingLeft: '4px', marginBottom: '12px' }}>Focus Areas</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                    {[
                                        { id: 'all_16', name: 'Full 16 Steps', icon: '🌬️', color: '#10B981' },
                                        { id: 'body', name: 'Body', icon: '💪', color: '#F97316' },
                                        { id: 'feelings', name: 'Feelings', icon: '❤️', color: '#EF4444' },
                                        { id: 'mind', name: 'Mind', icon: '🧠', color: '#3B82F6' },
                                        { id: 'dhammas', name: 'Dhammas', icon: '☸️', color: '#8B5CF6' }
                                    ].map(focus => (
                                        <div key={focus.id} className="glass-card" style={{
                                            padding: '12px',
                                            borderColor: `${focus.color}30`,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div style={{ fontSize: '1.2rem' }}>{focus.icon}</div>
                                                <div style={{ fontSize: '0.6rem', fontWeight: '800', color: focus.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {focus.name}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                                {anapanasatiStats.byFocus?.[focus.id]?.totalMinutes || 0} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--color-text-tertiary)' }}>m</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {(() => {
                                    const anaHistory = history.filter(h => h.category === 'anapanasati');
                                    if (anaHistory.length === 0) return null;

                                    return (
                                        <div className="mini-log-container">
                                            <div className="mini-log-title">Recent Logs</div>
                                            {anaHistory.slice(0, 5).map(log => (
                                                <div key={log.id} className="mini-log-item">
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{log.detail}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                            {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <IonButton fill="clear" size="small" color="primary" onClick={() => handleEditClick(log)}>
                                                            <IonIcon icon={createOutline} />
                                                        </IonButton>
                                                        <IonButton fill="clear" size="small" color="danger" onClick={() => setEntryToDelete({ id: log.id, category: 'anapanasati' })}>
                                                            <IonIcon icon={trashOutline} />
                                                        </IonButton>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </IonContent>
            </IonModal>

            {/* Emptiness Detail Modal */}
            <IonModal
                isOpen={showEmptinessDetails}
                onDidDismiss={() => setShowEmptinessDetails(false)}
                initialBreakpoint={0.8}
                breakpoints={[0, 0.8, 1]}
                handle={true}
                backdropBreakpoint={0.5}
            >
                <IonHeader>
                    <IonToolbar style={{ '--background': 'transparent' }}>
                        <IonTitle>Emptiness Breakdown</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setShowEmptinessDetails(false)}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding" fullscreen={true} style={{ '--background': 'var(--color-bg-primary)' }}>
                    {emptinessStats && (
                        <div style={{ display: 'grid', gap: '16px', paddingTop: '16px' }}>
                            <div className="glass-card type-breakdown-card">
                                <div className="type-breakdown-header">
                                    <div className="icon-wrapper icon-wrapper--medium" style={{ borderColor: 'var(--color-mahayana-primary)40', background: 'var(--color-mahayana-primary)10' }}>🧘</div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-mahayana-secondary)', fontWeight: '800', fontFamily: 'var(--font-family-display)' }}>
                                        Wisdom & Insight
                                    </h3>
                                </div>

                                <div className="type-breakdown-content">
                                    <div>
                                        <div className="stat-label-small">Total Time</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>{emptinessStats.totalMinutes} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>mins</span></div>
                                    </div>
                                    <div>
                                        <div className="stat-label-small">Streak</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-accent-primary)' }}>
                                            {emptinessStats.currentStreak} <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>days</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="stat-label-small">Sessions</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{emptinessStats.totalSessions}</div>
                                    </div>
                                </div>

                                <div className="mini-log-title" style={{ paddingLeft: '4px', marginBottom: '12px' }}>Techniques</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                    {[
                                        { id: 'anatta', name: 'Selflessness', icon: '∅', color: '#6B7280' },
                                        { id: 'progressive', name: 'Dwelling', icon: '🏔️', color: '#60A5FA' },
                                        { id: 'heart_sutra', name: 'Heart Sutra', icon: '❤️', color: '#EC4899' }
                                    ].map(tech => (
                                        <div key={tech.id} className="glass-card" style={{
                                            padding: '12px',
                                            borderColor: `${tech.color}30`,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <div style={{ fontSize: '1.2rem' }}>{tech.icon}</div>
                                                <div style={{ fontSize: '0.6rem', fontWeight: '800', color: tech.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {tech.name}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-primary)' }}>
                                                {emptinessStats.byTechnique?.[tech.id]?.totalMinutes || 0} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--color-text-tertiary)' }}>m</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {(() => {
                                    const empHistory = history.filter(h => h.category === 'emptiness');
                                    if (empHistory.length === 0) return null;

                                    return (
                                        <div className="mini-log-container">
                                            <div className="mini-log-title">Recent Logs</div>
                                            {empHistory.slice(0, 5).map(log => (
                                                <div key={log.id} className="mini-log-item">
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>{log.detail}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                                            {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <IonButton fill="clear" size="small" color="primary" onClick={() => handleEditClick(log)}>
                                                            <IonIcon icon={createOutline} />
                                                        </IonButton>
                                                        <IonButton fill="clear" size="small" color="danger" onClick={() => setEntryToDelete({ id: log.id, category: 'emptiness' })}>
                                                            <IonIcon icon={trashOutline} />
                                                        </IonButton>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
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
                    <IonToolbar style={{ '--background': 'transparent' }}>
                        <IonTitle>Edit Session</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={() => setEditingSession(null)}>Cancel</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding" fullscreen={true} style={{ '--background': 'var(--color-bg-primary)' }}>
                    {editingSession && (
                        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <div className="stat-label-small" style={{ marginBottom: '12px' }}>Date & Time</div>
                                <div className="glass-card" style={{ padding: '8px' }}>
                                    <IonDatetime
                                        presentation="date-time"
                                        value={editingSession.timestamp}
                                        onIonChange={e => setEditingSession({ ...editingSession, timestamp: e.detail.value as string })}
                                        style={{ '--background': 'transparent', borderRadius: '12px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="stat-label-small" style={{ marginBottom: '12px' }}>
                                    {editingSession.category === 'anapanasati' || editingSession.category === 'emptiness' ? 'Duration (Minutes)' : 'Count / Beads'}
                                </div>
                                <IonItem lines="none" className="glass-card" style={{ '--background': 'transparent', '--padding-start': '12px' }}>
                                    <IonInput
                                        type="number"
                                        value={editingSession.count}
                                        onIonChange={e => setEditingSession({ ...editingSession, count: parseFloat(e.detail.value!) })}
                                        style={{ fontSize: '1.2rem', fontWeight: '700' }}
                                    />
                                </IonItem>
                            </div>

                            <div style={{ paddingTop: '20px' }}>
                                <IonButton expand="block" shape="round" onClick={handleSaveEdit} className="premium-button premium-button--accent" style={{ height: '56px' }}>
                                    <IonLabel>Save Changes</IonLabel>
                                </IonButton>
                            </div>
                        </div>
                    )}
                </IonContent>
            </IonModal>
        </IonPage>
    );
};

export default SatiStatsPage;
