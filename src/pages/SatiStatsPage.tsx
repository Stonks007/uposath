
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
    IonDatetime,
    IonSegment,
    IonSegmentButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonFab,
    IonFabButton,
    useIonViewWillEnter
} from '@ionic/react';
import { trashOutline, createOutline, addOutline } from 'ionicons/icons';
import { MalaService } from '../services/MalaService';
import { AnapanasatiService, AnapanasatiStats, AnapanasatiSession } from '../services/AnapanasatiService';
import { MantraService } from '../services/MantraService';
import { EmptinessService } from '../services/EmptinessService';
import { SatiStatsService } from '../services/SatiStatsService';
import { MalaEntry, MalaStats, GlobalStats, UnifiedSession, PracticeCategory, EmptinessStats, Mantra, MantraSession, EmptinessSession } from '../types/SatiTypes';
import UposathaStatsView from '../components/uposatha/UposathaStatsView';
import './SatiStatsPage.css';


import { useLocation } from 'react-router-dom';

const SatiStatsPage: React.FC = () => {
    const location = useLocation();

    // ... all other states ...
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

    const [statsView, setStatsView] = useState<'practice' | 'observance'>('practice');
    const [editingSession, setEditingSession] = useState<{ id: string, category: PracticeCategory, count: number, seconds?: number, timestamp: string, notes?: string, focus?: string, technique?: string } | null>(null);

    // Filter & Pagination State
    const [logFilter, setLogFilter] = useState<PracticeCategory | 'all'>('all');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tab = queryParams.get('tab');
        if (tab === 'history' || tab === 'observance') {
            setStatsView('observance');
        } else if (tab === 'practice') {
            setStatsView('practice');
        }
    }, [location.search]);

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
            const failedCount = results.filter(r => (r as any).status === 'rejected').length;
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

    const handleEditClick = async (session: UnifiedSession) => {
        let count = 0;
        const numMatch = session.detail.match(/(\d+(\.\d+)?)/);
        if (numMatch) {
            count = parseFloat(numMatch[0]);
        }

        let focus = undefined;
        let technique = undefined;
        let notes = session.notes;
        let seconds = session.durationSeconds;

        if (session.category === 'anapanasati') {
            const anaSessions = await AnapanasatiService.getSessions();
            const orig = anaSessions.find(s => s.id === session.id);
            if (orig) {
                focus = orig.focus;
                seconds = orig.durationSeconds;
            }
        } else if (session.category === 'emptiness') {
            const empSessions = await EmptinessService.getSessions();
            const orig = empSessions.find(s => s.id === session.id);
            if (orig) {
                technique = orig.focus;
                seconds = orig.durationSeconds;
            }
        } else if (session.category === 'mantra') {
            const mSessions = await MantraService.getSessions();
            const orig = mSessions.find(s => s.id === session.id);
            if (orig) {
                count = orig.reps;
                seconds = (orig.durationMinutes || 0) * 60 + (orig.durationSeconds || 0);
            }
        }

        setEditingSession({
            id: session.id,
            category: session.category,
            count: count,
            seconds: seconds,
            timestamp: session.timestamp,
            notes: notes,
            focus: focus,
            technique: technique
        });
    };

    const handleManualLog = () => {
        setEditingSession({
            id: '', // Empty ID indicates new session
            category: logFilter === 'all' ? 'anapanasati' : logFilter,
            count: 0,
            seconds: 0,
            timestamp: new Date().toISOString(),
            notes: '',
            focus: 'all_16',
            technique: 'anatta'
        });
    };

    const handleSaveEdit = async () => {
        if (!editingSession) return;

        try {
            const isNew = editingSession.id === '';
            const id = isNew ? crypto.randomUUID() : editingSession.id;

            if (editingSession.category === 'mala') {
                const entry: MalaEntry = {
                    id,
                    timestamp: editingSession.timestamp,
                    beads: editingSession.count,
                    notes: editingSession.notes,
                    practiceType: 'buddha' // Defaulting for simple manual log
                };
                if (isNew) await SatiStatsService.saveSession(entry, 'mala');
                else await SatiStatsService.updateSession(entry, 'mala');
            } else if (editingSession.category === 'anapanasati') {
                const session: AnapanasatiSession = {
                    id,
                    timestamp: editingSession.timestamp,
                    durationMinutes: editingSession.count,
                    durationSeconds: editingSession.seconds || 0,
                    plannedDurationMinutes: editingSession.count,
                    focus: (editingSession.focus as any) || 'all_16',
                    completed: true,
                    endedEarly: false,
                    reflection: editingSession.notes
                };
                if (isNew) await SatiStatsService.saveSession(session, 'anapanasati');
                else await SatiStatsService.updateSession(session, 'anapanasati');
            } else if (editingSession.category === 'mantra') {
                // For mantra, manual log needs a mantraId. We'll pick the first available one or handle error.
                if (mantras.length === 0) {
                    alert('Please create a Mantra first in the Mantras overview.');
                    return;
                }
                const session: MantraSession = {
                    id,
                    mantraId: mantras[0].id, // Default to first for manual log
                    timestamp: editingSession.timestamp,
                    reps: editingSession.count,
                    durationMinutes: editingSession.seconds ? Math.floor(editingSession.seconds / 60) : 0,
                    durationSeconds: editingSession.seconds ? editingSession.seconds % 60 : 0,
                    completed: true,
                    notes: editingSession.notes
                };
                if (isNew) await SatiStatsService.saveSession(session, 'mantra');
                else await SatiStatsService.updateSession(session, 'mantra');
            } else if (editingSession.category === 'emptiness') {
                const session: EmptinessSession = {
                    id,
                    timestamp: editingSession.timestamp,
                    durationMinutes: editingSession.count,
                    durationSeconds: editingSession.seconds || 0,
                    tradition: 'theravada',
                    focus: (editingSession.technique as any) || 'anatta',
                    completed: true,
                    reflection: editingSession.notes
                };
                if (isNew) await SatiStatsService.saveSession(session, 'emptiness');
                else await SatiStatsService.updateSession(session, 'emptiness');
            }

            setEditingSession(null);
            loadData();
        } catch (err) {
            console.error('Failed to save session:', err);
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

    // Derived state for filtering and grouping
    const filteredHistory = history.filter(item => {
        const categoryMatch = logFilter === 'all' || item.category === logFilter;
        if (!categoryMatch) return false;

        if (timeFilter === 'all') return true;

        const date = new Date(item.timestamp);
        const now = new Date();
        now.setHours(23, 59, 59, 999); // End of today

        if (timeFilter === 'today') {
            return date.toDateString() === new Date().toDateString();
        } else if (timeFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            weekAgo.setHours(0, 0, 0, 0);
            return date >= weekAgo;
        } else if (timeFilter === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            monthAgo.setHours(0, 0, 0, 0);
            return date >= monthAgo;
        }
        return true;
    });
    const groupedHistory = filteredHistory.reduce((groups: { [key: string]: UnifiedSession[] }, item) => {
        const date = new Date(item.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateString = '';
        if (date.toDateString() === today.toDateString()) {
            dateString = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateString = 'Yesterday';
        } else {
            dateString = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        }

        if (!groups[dateString]) {
            groups[dateString] = [];
        }
        groups[dateString].push(item);
        return groups;
    }, {});

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/sati" />
                    </IonButtons>
                    <IonTitle>Sati Bhāvanā</IonTitle>
                </IonToolbar>
                <IonToolbar className="sati-toolbar">
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
                                        <span className="cat-name" style={{ color: '#6EE7B7' }}>Ānāpānasati</span>
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
                                        <span className="cat-name" style={{ color: '#93C5FD' }}>Suññatā</span>
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <div className="main-value">{emptinessStats.totalMinutes}</div>
                                        <div className="sub-value">Total Minutes</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Unified History List */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '16px', padding: '0 4px' }}>
                            <h3 className="practice-breakdown-title">History Log</h3>
                            <IonSegment
                                value={timeFilter}
                                onIonChange={e => setTimeFilter(e.detail.value as any)}
                                className="time-filter-mini"
                            >
                                <IonSegmentButton value="today"><IonLabel>Today</IonLabel></IonSegmentButton>
                                <IonSegmentButton value="week"><IonLabel>Week</IonLabel></IonSegmentButton>
                                <IonSegmentButton value="month"><IonLabel>Month</IonLabel></IonSegmentButton>
                                <IonSegmentButton value="all"><IonLabel>All</IonLabel></IonSegmentButton>
                            </IonSegment>
                        </div>

                        <IonSegment
                            scrollable
                            value={logFilter}
                            onIonChange={e => {
                                setLogFilter(e.detail.value as PracticeCategory | 'all');
                            }}
                            className="category-filter-main"
                        >
                            <IonSegmentButton value="all"><IonLabel>All</IonLabel></IonSegmentButton>
                            <IonSegmentButton value="mala"><IonLabel>Triple Gem</IonLabel></IonSegmentButton>
                            <IonSegmentButton value="anapanasati"><IonLabel>Breathing</IonLabel></IonSegmentButton>
                            <IonSegmentButton value="mantra"><IonLabel>Mantra</IonLabel></IonSegmentButton>
                            <IonSegmentButton value="emptiness"><IonLabel>Emptiness</IonLabel></IonSegmentButton>
                        </IonSegment>

                        {/* Manual Log FAB */}
                        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '16px', marginRight: '8px' }}>
                            <IonFabButton onClick={handleManualLog} className="premium-fab" style={{ '--background': 'var(--color-accent-primary)', '--color': 'var(--color-bg-primary)' }}>
                                <IonIcon icon={addOutline} />
                            </IonFabButton>
                        </IonFab>

                        <div style={{ margin: '0', background: 'transparent' }}>
                            {Object.entries(groupedHistory).map(([dateLabel, items]) => (
                                <div key={dateLabel} style={{ marginBottom: '24px' }}>
                                    <div style={{
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        background: 'var(--color-bg-primary)',
                                        padding: '8px 4px',
                                        fontSize: '0.9rem',
                                        fontWeight: '800',
                                        color: 'var(--color-text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                        borderBottom: '1px solid var(--glass-border)'
                                    }}>
                                        {dateLabel}
                                    </div>
                                    <IonList inset={true} style={{ margin: '8px 0 0 0', background: 'transparent' }}>
                                        {items.map(item => (
                                            <IonItem key={item.id} className="glass-card history-item" lines="none" detail={false} style={{ marginBottom: '8px' }}>
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
                                                        • {new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                        {item.tithi && ` • ${item.tithi}`}
                                                    </p>
                                                    {item.notes && (
                                                        <p style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', borderLeft: `2px solid ${getCategoryColor(item.category)}`, paddingLeft: '8px' }}>
                                                            "{item.notes}"
                                                        </p>
                                                    )}
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
                                    </IonList>
                                </div>
                            ))}

                            {filteredHistory.length === 0 && (
                                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
                                    No records found for this filter.
                                </div>
                            )}


                        </div>
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
                                                                {log.tithi && ` • ${log.tithi}`}
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
                                                            {log.tithi && ` • ${log.tithi}`}
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
                                                        {log.tithi && ` • ${log.tithi}`}
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
                        <IonTitle>Ānāpānasati</IonTitle>
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
                                        Ānāpānasati
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

                                <div className="mini-log-title" style={{ paddingLeft: '4px', marginBottom: '12px' }}>Kammaṭṭhāna</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                    {[
                                        { id: 'all_16', name: 'Sabbasati', icon: '🌬️', color: '#10B981' },
                                        { id: 'body', name: 'Kāya', icon: '💪', color: '#F97316' },
                                        { id: 'feelings', name: 'Vedanā', icon: '❤️', color: '#EF4444' },
                                        { id: 'mind', name: 'Citta', icon: '🧠', color: '#3B82F6' },
                                        { id: 'dhammas', name: 'Dhamma', icon: '☸️', color: '#8B5CF6' }
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
                                                            {log.tithi && ` • ${log.tithi}`}
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
                        <IonTitle>Suññatā</IonTitle>
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
                                        Paññā & Vipassanā
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

                                <div className="mini-log-title" style={{ paddingLeft: '4px', marginBottom: '12px' }}>Suññatā Bhāvanā</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                    {[
                                        { id: 'anatta', name: 'Anattā', icon: '∅', color: '#6B7280' },
                                        { id: 'progressive', name: 'Vihāra', icon: '🏔️', color: '#60A5FA' },
                                        { id: 'heart_sutra', name: 'Hṛdaya Sūtra', icon: '❤️', color: '#EC4899' }
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
                                                            {log.tithi && ` • ${log.tithi}`}
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
            </IonModal >

            {/* Edit Session Modal */}
            < IonModal
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
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="stat-label-small" style={{ marginBottom: '12px' }}>
                                            {editingSession.category === 'anapanasati' || editingSession.category === 'emptiness' ? 'Minutes' : 'Count / Beads'}
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
                                    {(editingSession.category === 'anapanasati' || editingSession.category === 'emptiness') && (
                                        <div style={{ flex: 1 }}>
                                            <div className="stat-label-small" style={{ marginBottom: '12px' }}>Seconds</div>
                                            <IonItem lines="none" className="glass-card" style={{ '--background': 'transparent', '--padding-start': '12px' }}>
                                                <IonInput
                                                    type="number"
                                                    value={editingSession.seconds || 0}
                                                    onIonChange={e => setEditingSession({ ...editingSession, seconds: parseInt(e.detail.value!) })}
                                                    style={{ fontSize: '1.2rem', fontWeight: '700' }}
                                                />
                                            </IonItem>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Duration field for mantra and mala */}
                            {(editingSession.category === 'mantra' || editingSession.category === 'mala') && (
                                <div>
                                    <div className="stat-label-small" style={{ marginBottom: '12px' }}>Duration</div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1 }}>
                                            <IonItem lines="none" className="glass-card" style={{ '--background': 'transparent', '--padding-start': '12px' }}>
                                                <IonInput
                                                    type="number"
                                                    label="Min"
                                                    labelPlacement="stacked"
                                                    value={editingSession.seconds !== undefined ? Math.floor(editingSession.seconds / 60) : 0}
                                                    onIonChange={e => {
                                                        const mins = parseInt(e.detail.value!) || 0;
                                                        const secs = (editingSession.seconds || 0) % 60;
                                                        setEditingSession({ ...editingSession, seconds: mins * 60 + secs });
                                                    }}
                                                    style={{ fontSize: '1.2rem', fontWeight: '700' }}
                                                />
                                            </IonItem>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <IonItem lines="none" className="glass-card" style={{ '--background': 'transparent', '--padding-start': '12px' }}>
                                                <IonInput
                                                    type="number"
                                                    label="Sec"
                                                    labelPlacement="stacked"
                                                    value={editingSession.seconds !== undefined ? editingSession.seconds % 60 : 0}
                                                    onIonChange={e => {
                                                        const secs = parseInt(e.detail.value!) || 0;
                                                        const mins = Math.floor((editingSession.seconds || 0) / 60);
                                                        setEditingSession({ ...editingSession, seconds: mins * 60 + secs });
                                                    }}
                                                    style={{ fontSize: '1.2rem', fontWeight: '700' }}
                                                />
                                            </IonItem>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Category Specific Fields */}
                            {editingSession.category === 'anapanasati' && (
                                <div>
                                    <div className="stat-label-small" style={{ marginBottom: '12px' }}>Focus Area</div>
                                    <IonItem lines="none" className="glass-card" style={{ '--background': 'transparent', '--padding-start': '12px' }}>
                                        <IonSelect
                                            value={editingSession.focus}
                                            onIonChange={e => setEditingSession({ ...editingSession, focus: e.detail.value })}
                                            interface="popover"
                                            style={{ width: '100%', fontSize: '1.1rem', fontWeight: '600' }}
                                        >
                                            <IonSelectOption value="all_16">Sabbasati</IonSelectOption>
                                            <IonSelectOption value="body">Kāya</IonSelectOption>
                                            <IonSelectOption value="feelings">Vedanā</IonSelectOption>
                                            <IonSelectOption value="mind">Citta</IonSelectOption>
                                            <IonSelectOption value="dhammas">Dhamma</IonSelectOption>
                                        </IonSelect>
                                    </IonItem>
                                </div>
                            )}

                            {editingSession.category === 'emptiness' && (
                                <div>
                                    <div className="stat-label-small" style={{ marginBottom: '12px' }}>Technique</div>
                                    <IonItem lines="none" className="glass-card" style={{ '--background': 'transparent', '--padding-start': '12px' }}>
                                        <IonSelect
                                            value={editingSession.technique}
                                            onIonChange={e => setEditingSession({ ...editingSession, technique: e.detail.value })}
                                            interface="popover"
                                            style={{ width: '100%', fontSize: '1.1rem', fontWeight: '600' }}
                                        >
                                            <IonSelectOption value="anatta">Anattā</IonSelectOption>
                                            <IonSelectOption value="progressive">Anupubba-suññatā-vihāra</IonSelectOption>
                                            <IonSelectOption value="heart_sutra">Hṛdaya Sūtra</IonSelectOption>
                                        </IonSelect>
                                    </IonItem>
                                </div>
                            )}

                            {/* Reflections / Notes Field */}
                            <div>
                                <div className="stat-label-small" style={{ marginBottom: '12px' }}>Reflections / Notes</div>
                                <IonItem lines="none" className="glass-card" style={{ '--background': 'transparent', '--padding-start': '12px', alignItems: 'flex-start' }}>
                                    <IonTextarea
                                        value={editingSession.notes}
                                        onIonChange={e => setEditingSession({ ...editingSession, notes: e.detail.value! })}
                                        placeholder="Add notes about your practice..."
                                        rows={3}
                                        style={{ marginTop: '8px', marginBottom: '8px' }}
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
            </IonModal >
        </IonPage >
    );
};

export default SatiStatsPage;
