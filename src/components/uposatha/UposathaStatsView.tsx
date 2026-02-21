
import React, { useState, useEffect } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonGrid, IonRow, IonCol, IonProgressBar, IonList, IonItem, IonLabel, IonNote, IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle, moon, ellipseOutline } from 'ionicons/icons';
import { UposathaStats, UposathaObservance } from '../../types/ObservanceTypes';
import { UposathaObservanceService } from '../../services/UposathaObservanceService';
import '../../pages/SatiStatsPage.css';

const UposathaStatsView: React.FC = () => {
    const [stats, setStats] = useState<UposathaStats | null>(null);
    const [history, setHistory] = useState<UposathaObservance[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const s = await UposathaObservanceService.getStats();
        const h = await UposathaObservanceService.getHistory();
        setStats(s);
        setHistory(h);
    };

    if (!stats) return <div className="ion-padding text-center">Loading stats...</div>;

    const getPhaseIcon = (phase: string) => {
        switch (phase) {
            case 'full': return '🌕';
            case 'new': return '🌑';
            default: return '🌗';
        }
    };

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

            <div className="glass-card moon-breakdown-card">
                <h3>Moon Phase Breakdown</h3>
                <div className="moon-phase-row">
                    <div className="moon-phase-info">
                        <span>Full Moon 🌕</span>
                        <span>{stats.byMoonPhase.full.observed} / {stats.byMoonPhase.full.total}</span>
                    </div>
                    <IonProgressBar value={stats.byMoonPhase.full.total > 0 ? stats.byMoonPhase.full.observed / stats.byMoonPhase.full.total : 0} color="primary" />
                </div>
                <div className="moon-phase-row">
                    <div className="moon-phase-info">
                        <span>New Moon 🌑</span>
                        <span>{stats.byMoonPhase.new.observed} / {stats.byMoonPhase.new.total}</span>
                    </div>
                    <IonProgressBar value={stats.byMoonPhase.new.total > 0 ? stats.byMoonPhase.new.observed / stats.byMoonPhase.new.total : 0} color="medium" />
                </div>
                <div className="moon-phase-row">
                    <div className="moon-phase-info">
                        <span>Quarters 🌗</span>
                        <span>{stats.byMoonPhase.quarter.observed} / {stats.byMoonPhase.quarter.total}</span>
                    </div>
                    <IonProgressBar value={stats.byMoonPhase.quarter.total > 0 ? stats.byMoonPhase.quarter.observed / stats.byMoonPhase.quarter.total : 0} color="secondary" />
                </div>
            </div>

            <h3 className="practice-breakdown-title">Recent History</h3>
            <IonList inset={true} style={{ margin: '0', background: 'transparent' }}>
                {history.slice(0, 10).map(obs => (
                    <IonItem key={obs.id} className="glass-card history-item" lines="none" detail={false}>
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
                                • {obs.status === 'observed' ? (obs.level || 'Full Practice') : (obs.skipReason || 'Not Recorded')}
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
        </div>
    );
};

export default UposathaStatsView;
