
import React, { useState, useEffect } from 'react';
import { IonProgressBar, IonList, IonItem, IonLabel, IonNote, IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle, removeCircleOutline } from 'ionicons/icons';
import { UposathaStats, UposathaObservance } from '../../types/ObservanceTypes';
import { UposathaObservanceService } from '../../services/UposathaObservanceService';
import LogObservanceDialog from './LogObservanceDialog';
import '../../pages/SatiStatsPage.css';

const UposathaStatsView: React.FC = () => {
    const [stats, setStats] = useState<UposathaStats | null>(null);
    const [history, setHistory] = useState<UposathaObservance[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingRecord, setEditingRecord] = useState<UposathaObservance | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const s = await UposathaObservanceService.getStats();
        const h = await UposathaObservanceService.getHistory();
        setStats(s);
        setHistory(h);
    };

    const handleEdit = (obs: UposathaObservance) => {
        setEditingRecord(obs);
        setShowDialog(true);
    };

    const handleSave = async (data: Partial<UposathaObservance>) => {
        if (editingRecord) {
            // Merge with existing data
            const updated = { ...editingRecord, ...data };
            await UposathaObservanceService.saveObservance(updated as UposathaObservance);
            await loadData();
            setEditingRecord(null);
            setShowDialog(false);
        }
    };

    const handleDelete = async (id: string) => {
        await UposathaObservanceService.deleteObservance(id);
        await loadData();
        setEditingRecord(null);
        setShowDialog(false);
    };

    if (!stats) return <div className="ion-padding text-center">Loading stats...</div>;

    const getPhaseIcon = (phase: string) => {
        switch (phase) {
            case 'full': return '🌕';
            case 'new': return '🌑';
            case 'chaturdashi': return '🌖';
            default: return '🌗';
        }
    };

    const getPhaseLabel = (phase: string) => {
        switch (phase) {
            case 'full': return 'Pūrṇimā';
            case 'new': return 'Amāvasyā';
            case 'chaturdashi': return 'Catuddasī';
            default: return 'Aṭṭhamī';
        }
    };

    // --- PAKSHA HEATMAP ---
    // Group history by paksha, sorted chronologically (oldest first for left-to-right reading)
    const shuklaEntries = history
        .filter(o => o.paksha === 'Shukla')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const krishnaEntries = history
        .filter(o => o.paksha === 'Krishna')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Entries without paksha (legacy) — show in a combined row
    const legacyEntries = history
        .filter(o => !o.paksha)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const renderHeatmapRow = (entries: UposathaObservance[], label: string) => (
        <div style={{ marginBottom: '16px' }}>
            <div style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '8px'
            }}>
                {label}
            </div>
            <div style={{
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                {entries.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No entries yet
                    </div>
                ) : entries.map(obs => {
                    const isObserved = obs.status === 'observed';
                    return (
                        <div
                            key={obs.id}
                            title={`${new Date(obs.date).toLocaleDateString()} — ${obs.status.toUpperCase()} (${getPhaseLabel(obs.moonPhase)})`}
                            onClick={() => handleEdit(obs)}
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                background: isObserved
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${isObserved ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                position: 'relative'
                            }}
                            className="heatmap-cell"
                        >
                            {getPhaseIcon(obs.moonPhase)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const phaseRows: { key: keyof UposathaStats['byMoonPhase']; icon: string; label: string; color: string }[] = [
        { key: 'full', icon: '🌕', label: 'Pūrṇimā', color: 'var(--color-mahayana-accent)' },
        { key: 'new', icon: '🌑', label: 'Amāvasyā', color: 'var(--color-text-secondary)' },
        { key: 'chaturdashi', icon: '🌖', label: 'Catuddasī', color: '#A78BFA' },
        { key: 'quarter', icon: '🌗', label: 'Aṭṭhamī', color: '#60A5FA' },
    ];

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Summary Cards */}
            <div className="observance-summary-grid">
                <div className="glass-card observance-summary-card text-center">
                    <div className="observance-rate-value">{stats.rate.toFixed(0)}%</div>
                    <div className="stat-label-small">Observance Rate</div>
                </div>
                <div className="glass-card observance-summary-card text-center">
                    <div className="streak-value">{stats.currentStreak}</div>
                    <div className="stat-label-small">Current Streak</div>
                </div>
            </div>

            {/* Additional Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-display)' }}>
                        {stats.observed}
                    </div>
                    <div className="stat-label-small">Observed</div>
                </div>
                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--ion-color-danger)', fontFamily: 'var(--font-family-display)' }}>
                        {stats.skipped}
                    </div>
                    <div className="stat-label-small">Skipped</div>
                </div>
                <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-mahayana-accent)', fontFamily: 'var(--font-family-display)' }}>
                        {stats.longestStreak}
                    </div>
                    <div className="stat-label-small">Best Streak</div>
                </div>
            </div>

            {/* Paksha Heatmap */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
                <h3 style={{
                    margin: '0 0 16px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    color: 'var(--color-accent-primary)',
                    fontFamily: 'var(--font-family-display)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                }}>
                    Paksha Observance Map
                </h3>

                {renderHeatmapRow(shuklaEntries, 'Śukla Pakṣa (Waxing)')}
                {renderHeatmapRow(krishnaEntries, 'Kṛṣṇa Pakṣa (Waning)')}
                {legacyEntries.length > 0 && renderHeatmapRow(legacyEntries, 'Earlier Records')}

                {/* Legend */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--glass-border)',
                    fontSize: '0.7rem',
                    color: 'var(--color-text-tertiary)',
                    flexWrap: 'wrap'
                }}>
                    <span>🌕 Pūrṇimā</span>
                    <span>🌑 Amāvasyā</span>
                    <span>🌖 Catuddasī</span>
                    <span>🌗 Aṭṭhamī</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.5)', display: 'inline-block' }} /> Observed
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-block' }} /> Skipped
                    </span>
                </div>
            </div>

            {/* Moon Phase Breakdown — 4 categories */}
            <div className="glass-card moon-breakdown-card">
                <h3>Moon Phase Breakdown</h3>
                {phaseRows.map(({ key, icon, label, color }) => {
                    const phase = stats.byMoonPhase[key];
                    return (
                        <div className="moon-phase-row" key={key}>
                            <div className="moon-phase-info">
                                <span>{label} {icon}</span>
                                <span>{phase.observed} / {phase.total}</span>
                            </div>
                            <IonProgressBar
                                value={phase.total > 0 ? phase.observed / phase.total : 0}
                                style={{ '--progress-background': color }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Recent History */}
            <h3 className="practice-breakdown-title">Recent History</h3>
            <IonList inset={true} style={{ margin: '0', background: 'transparent' }}>
                {history.slice(0, 15).map(obs => (
                    <IonItem
                        key={obs.id}
                        className="glass-card history-item"
                        lines="none"
                        detail={false}
                        button
                        onClick={() => handleEdit(obs)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div slot="start" className="icon-wrapper icon-wrapper--medium history-item-icon" style={{
                            borderColor: obs.status === 'observed' ? 'var(--color-mahayana-accent)40' : 'var(--ion-color-danger)40',
                            background: obs.status === 'observed' ? 'var(--color-mahayana-accent)15' : 'var(--ion-color-danger)15',
                            fontSize: '1.4rem'
                        }}>
                            {getPhaseIcon(obs.moonPhase)}
                        </div>
                        <IonLabel>
                            <h2 style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                                {new Date(obs.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </h2>
                            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem' }}>
                                <span style={{
                                    color: obs.status === 'observed' ? 'var(--color-mahayana-accent)' : 'var(--ion-color-danger)',
                                    fontWeight: '700',
                                    marginRight: '6px'
                                }}>
                                    {obs.status.toUpperCase()}
                                </span>
                                • {getPhaseLabel(obs.moonPhase)}
                                {obs.paksha && <span> • {obs.paksha} Pakṣa</span>}
                                {obs.status === 'observed' && obs.level && <span> • {obs.level}</span>}
                                {obs.status === 'skipped' && obs.skipReason && <span> • {obs.skipReason}</span>}
                            </p>
                        </IonLabel>
                        <IonNote slot="end">
                            {obs.status === 'observed' ? (
                                <IonIcon icon={checkmarkCircle} color="success" style={{ fontSize: '1.5rem' }} />
                            ) : (
                                <IonIcon icon={closeCircle} color="danger" style={{ fontSize: '1.5rem' }} />
                            )}
                        </IonNote>
                    </IonItem>
                ))}
                {history.length === 0 && (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
                        No history recorded.
                    </div>
                )}
            </IonList>

            <LogObservanceDialog
                isOpen={showDialog}
                onClose={() => {
                    setShowDialog(false);
                    setEditingRecord(null);
                }}
                onSave={handleSave}
                onDelete={handleDelete}
                date={editingRecord ? new Date(editingRecord.date) : new Date()}
                tithi={editingRecord?.tithi}
                existingRecord={editingRecord || undefined}
            />
        </div>
    );
};

export default UposathaStatsView;
