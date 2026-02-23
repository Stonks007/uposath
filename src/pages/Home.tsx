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
import { settingsOutline, statsChartOutline, leafOutline, calendarOutline, musicalNotesOutline, chevronForwardOutline, locationOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
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
  const [locationName, setLocationName] = useState('Set your location');
  const [isLocationSet, setIsLocationSet] = useState(false);

  useIonViewWillEnter(() => {
    // Small delay to ensure smooth page transition
    loadLocation();
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

  const loadLocation = async () => {
    try {
      const { value } = await Preferences.get({ key: 'uposatha_location' });
      const loc = await getSavedLocation();
      setLocationName(loc.name);
      setIsLocationSet(!!value);
    } catch (err) {
      console.error('Failed to load location info:', err);
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px' }}>
            <IonTitle className="app-brand" style={{ flex: 'none' }}>Sammāsati</IonTitle>
            <div
              onClick={() => history.push('/settings')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6, fontSize: '0.7rem', fontWeight: '700' }}
            >
              <IonIcon icon={locationOutline} style={{ color: isLocationSet ? 'var(--color-text-secondary)' : 'var(--color-accent-primary)' }} />
              <span style={{ color: isLocationSet ? 'var(--color-text-secondary)' : 'var(--color-accent-primary)' }}>
                {locationName.split(',')[0]}
              </span>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="ion-padding home-container">

          {/* Hero Section */}
          <div className="home-hero">
            <h1 className="home-hero__title">Namo Buddhaya</h1>
            <p className="home-hero__subtitle">Your daily path to mindfulness.</p>

            <div className="home-hero__accent"></div>

            <div className="home-location-container" onClick={() => history.push('/settings')}>
              <div className={`home-location-row ${!isLocationSet ? 'is-unset' : ''}`}>
                <IonIcon icon={locationOutline} className="location-pin-icon" />
                <span className="location-text">{isLocationSet ? locationName : 'Set your location'}</span>
                <IonIcon icon={chevronForwardOutline} className="location-chevron" />
              </div>
              <p className="location-note">
                {isLocationSet
                  ? "Observance dates are calculated for your selected region. Tap to update your location."
                  : "Set your country to receive accurate Uposatha and festival dates for your region."}
              </p>
            </div>
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

          <section>
            <div
              className="home-section-header"
              onClick={() => history.push('/sati/stats')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div className="icon-wrapper icon-wrapper--small icon-wrapper--primary">
                  <IonIcon icon={statsChartOutline} color="primary" />
                </div>
                <h3 className="home-section-title">Practice Summary</h3>
              </div>
              <IonIcon icon={chevronForwardOutline} style={{ fontSize: '1.2rem', color: 'var(--color-text-tertiary)' }} />
            </div>

            <div className="glass-card unified-stats-container">
              {/* Daily Mindfulness Row */}
              <div
                className="stats-header-label"
                onClick={() => history.push('/sati/stats?tab=practice')}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                DAILY MINDFULNESS <IonIcon icon={chevronForwardOutline} style={{ fontSize: '0.8rem', opacity: 0.6 }} />
              </div>
              <div className="stats-section-row">
                <div className="stats-column" onClick={() => history.push('/sati/stats?tab=practice')}>
                  <div className="stat-value">{stats.totalBeads}</div>
                  <div className="stat-label">Total Beads</div>
                </div>
                <div className="stats-divider-vertical"></div>
                <div className="stats-column" onClick={() => history.push('/sati/stats?tab=practice')}>
                  <div className="stat-value">{stats.currentStreak}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              </div>

              {/* Uposatha Journey Row (Only if tracking) */}
              {observanceStats && observanceStats.totalTracked > 0 && (
                <>
                  <div className="stats-divider-horizontal"></div>
                  <div
                    className="stats-header-label"
                    onClick={() => history.push('/sati/stats?tab=history')}
                    style={{ color: 'var(--color-mahayana-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    UPOSATHA JOURNEY <IonIcon icon={chevronForwardOutline} style={{ fontSize: '0.8rem', opacity: 0.6 }} />
                  </div>
                  <div className="stats-section-row">
                    <div className="stats-column" onClick={() => history.push('/sati/stats?tab=history')}>
                      <div className="stat-value" style={{ color: 'var(--color-mahayana-accent)' }}>{observanceStats.rate.toFixed(0)}%</div>
                      <div className="stat-label">Observance Rate</div>
                    </div>
                    <div className="stats-divider-vertical"></div>
                    <div className="stats-column" onClick={() => history.push('/sati/stats?tab=history')}>
                      <div className="stat-value">{observanceStats.currentStreak}</div>
                      <div className="stat-label">Uposatha Streak</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Dhamma Inspiration (Audio) - Moved to Bottom */}
          <section>
            <div className="home-section-header">
              <div className="icon-wrapper icon-wrapper--small icon-wrapper--primary">
                <IonIcon icon={musicalNotesOutline} color="primary" />
              </div>
              <h3 className="home-section-title">Latest from {channelName}</h3>
            </div>
            <DhammaAudioWidget />
          </section>

        </div>
      </IonContent>
    </IonPage >
  );
};

export default Home;
