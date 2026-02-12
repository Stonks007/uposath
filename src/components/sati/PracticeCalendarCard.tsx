
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { flame, chevronForward } from 'ionicons/icons';
import { MalaService } from '../../services/MalaService';
import { getUposathaStatus } from '../../services/uposathaCalculator';
import { Observer } from '@ishubhamx/panchangam-js';
import { getSavedLocation } from '../../services/locationManager';

const PracticeCalendarCard: React.FC = () => {
    const history = useHistory();
    const [totals, setTotals] = useState({ buddha: 0, dhamma: 0, sangha: 0, overall: 0 });
    const [streak, setStreak] = useState<number>(0);
    const [isUposatha, setIsUposatha] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Load stats
        const buddha = await MalaService.getTodayTotal('buddha');
        const dhamma = await MalaService.getTodayTotal('dhamma');
        const sangha = await MalaService.getTodayTotal('sangha');
        const overall = await MalaService.getTodayTotal();
        const stats = await MalaService.getStats();

        // Load Uposatha status
        const loc = await getSavedLocation();
        const observer = loc ? new Observer(loc.latitude, loc.longitude, loc.altitude) : new Observer(24.7914, 85.0002, 111);
        const status = getUposathaStatus(new Date(), observer);

        setTotals({ buddha, dhamma, sangha, overall });
        setStreak(stats.overall.currentStreak);
        setIsUposatha(status.isUposatha);

        setIsVisible(true);
    };

    if (!isVisible) return null;

    return (
        <div
            className={`practice-card ${isUposatha ? 'uposatha-glow' : ''}`}
            onClick={() => history.push('/sati')}
        >
            <div style={{ padding: 'var(--space-lg)' }}>
                <div className="practice-header">
                    <div className="practice-title">
                        <span>🙏</span> Sati Practice
                    </div>
                    {streak > 0 && (
                        <div className="practice-streak">
                            {streak} <IonIcon icon={flame} />
                        </div>
                    )}
                </div>

                {totals.overall > 0 ? (
                    <>
                        <div className="practice-stats-grid">
                            <div className="practice-stat-item">
                                <span className="practice-stat-value" style={{ color: '#F59E0B' }}>{totals.buddha}</span>
                                <span className="practice-stat-label">Buddha</span>
                            </div>
                            <div className="practice-stat-item">
                                <span className="practice-stat-value" style={{ color: '#2563EB' }}>{totals.dhamma}</span>
                                <span className="practice-stat-label">Dhamma</span>
                            </div>
                            <div className="practice-stat-item">
                                <span className="practice-stat-value" style={{ color: '#DC2626' }}>{totals.sangha}</span>
                                <span className="practice-stat-label">Sangha</span>
                            </div>
                            <div className="practice-stat-item" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                <span className="practice-stat-value">{totals.overall}</span>
                                <span className="practice-stat-label">Total</span>
                            </div>
                        </div>

                        <div className="practice-footer">
                            <div className="practice-total">
                                Today's Progress
                            </div>
                            <div className="practice-action">
                                Continue <IonIcon icon={chevronForward} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                        {isUposatha ? 'Uposatha Day — A perfect time to practice.' : 'No practice logged yet today.'}
                        <div className="practice-action" style={{ justifyContent: 'center', marginTop: '12px' }}>
                            Start Practice <IonIcon icon={chevronForward} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeCalendarCard;
