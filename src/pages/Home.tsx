import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonButton,
  IonIcon,
  IonLabel,
  useIonViewWillEnter
} from '@ionic/react';
import { settingsOutline, statsChartOutline, leafOutline, calendarOutline, musicalNotesOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import NextUposathaWidget from '../components/uposatha/NextUposathaWidget';
import DhammaAudioWidget from '../components/audio/DhammaAudioWidget';
import { SatiStatsService } from '../services/SatiStatsService';
import { getSavedLocation, getObserver } from '../services/locationManager';
import { getDefaultChannel } from '../services/channelManager';
import { warmUpFestivalCache } from '../services/festivalCacheService';
import { UposathaObservanceService } from '../services/UposathaObservanceService';
import { UposathaStats } from '../types/ObservanceTypes';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const [stats, setStats] = useState({
    meditationMinutes: 0,
    totalBeads: 0,
    currentStreak: 0
  });
  const [observanceStats, setObservanceStats] = useState<UposathaStats | null>(null);
  const [channelName, setChannelName] = useState('Dhamma Inspiration');

  useIonViewWillEnter(() => {
    // Small delay to ensure smooth page transition
    setTimeout(() => {
      loadStats();
      loadChannel();
    }, 500);
  });

  useEffect(() => {
    // Warm up festival cache in background after app settles
    setTimeout(() => {
      getSavedLocation().then(loc => {
        warmUpFestivalCache(getObserver(loc));
      });
    }, 3000);
  }, []);

  const loadChannel = async () => {
    try {
      const def = await getDefaultChannel();
      if (def) {
        setChannelName(def.name);
      }
    } catch (err) {
      console.error('Failed to load default channel:', err);
    }
  };

  const loadStats = async () => {
    try {
      const globalStats = await SatiStatsService.getGlobalStats();
      const obsStats = await UposathaObservanceService.getStats();

      setStats({
        meditationMinutes: 0,
        totalBeads: globalStats.totalBeads,
        currentStreak: globalStats.currentStreak
      });
      setObservanceStats(obsStats);
    } catch (err) {
      console.error('Failed to load practice stats:', err);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border header-transparent">
        <IonToolbar>
          <IonTitle className="app-brand">Sammāsati</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="ion-padding home-container">

          {/* Hero Section */}
          <div className="home-hero">
            <h1 className="home-hero__title">Namo Buddhaya</h1>
            <p className="home-hero__subtitle">Your daily path to mindfulness.</p>
            <div className="home-hero__accent"></div>
          </div>

          {/* Primary Feature: Upcoming Uposatha */}
          <section>
            <div className="home-section-header">
              <div className="icon-wrapper icon-wrapper--small icon-wrapper--primary">
                <IonIcon icon={leafOutline} color="primary" />
              </div>
              <h3 className="home-section-title">Current Observance</h3>
            </div>
            <NextUposathaWidget />
          </section>

          {/* New Audio Section */}
          <section>
            <div className="home-section-header">
              <div className="icon-wrapper icon-wrapper--small icon-wrapper--primary">
                <IonIcon icon={musicalNotesOutline} color="primary" />
              </div>
              <h3 className="home-section-title">Latest from {channelName}</h3>
            </div>
            <DhammaAudioWidget />
          </section>

          {/* Stats Section */}
          <section>
            <div className="home-section-header">
              <div className="icon-wrapper icon-wrapper--small icon-wrapper--primary">
                <IonIcon icon={statsChartOutline} color="primary" />
              </div>
              <h3 className="home-section-title">Practice Summary</h3>
            </div>

            <div className="stats-grid">
              <div className="glass-card stat-card" onClick={() => history.push('/sati/stats')}>
                <div className="stat-value">{stats.totalBeads}</div>
                <div className="stat-label">Total Beads</div>
              </div>

              <div className="glass-card stat-card" onClick={() => history.push('/sati/stats')}>
                <div className="stat-value">{stats.currentStreak}</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>

            {observanceStats && (
              <div className="stats-grid" style={{ marginTop: '12px' }}>
                <div className="glass-card stat-card" onClick={() => history.push('/sati/stats')} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="stat-value" style={{ color: 'var(--color-mahayana-accent)' }}>{observanceStats.rate.toFixed(0)}%</div>
                    <div className="stat-label">Observance Rate</div>
                  </div>
                  <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="stat-value">{observanceStats.currentStreak}</div>
                    <div className="stat-label">Uposatha Streak</div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section>
            <div className="home-section-header">
              <h3 className="home-section-title">Quick Actions</h3>
            </div>
            <div className="action-grid">
              <div className="glass-card action-card-button" onClick={() => history.push('/sati')}>
                <div className="icon-wrapper icon-wrapper--large icon-wrapper--primary">
                  <IonIcon icon={leafOutline} color="primary" />
                </div>
                <div className="action-label">Practice</div>
                <div className="action-sublabel">Start Session</div>
              </div>

              <div className="glass-card action-card-button" onClick={() => history.push('/calendar')}>
                <div className="icon-wrapper icon-wrapper--large icon-wrapper--primary">
                  <IonIcon icon={calendarOutline} color="primary" />
                </div>
                <div className="action-label">Calendar</div>
                <div className="action-sublabel">View Dates</div>
              </div>
            </div>
          </section>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
