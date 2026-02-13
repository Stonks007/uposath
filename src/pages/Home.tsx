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
  IonLabel
} from '@ionic/react';
import { settingsOutline, statsChartOutline, leafOutline, calendarOutline } from 'ionicons/icons';
import NextUposathaWidget from '../components/uposatha/NextUposathaWidget';
import DhammaAudioWidget from '../components/audio/DhammaAudioWidget';
import { MalaService } from '../services/MalaService';
import './Home.css';

const Home: React.FC = () => {
  const [globalStats, setGlobalStats] = useState<{ totalSessions: number; currentStreak: number } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const stats = await MalaService.getStats();
    setGlobalStats({
      totalSessions: stats.overall.totalSessions,
      currentStreak: stats.overall.currentStreak
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle style={{ fontWeight: '800', letterSpacing: '0.05em' }}>DHAMMA PATH</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/settings">
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--ion-color-dark)' }}>
            Namo Buddhaya
          </h1>
          <p style={{ margin: 0, opacity: 0.7, fontSize: '1rem' }}>
            Your daily path to mindfulness
          </p>
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IonIcon icon={statsChartOutline} color="primary" />
            Practice Summary
          </h3>

          <IonGrid className="ion-no-padding">
            <IonRow>
              <IonCol size="6">
                <div style={{
                  background: 'var(--ion-color-primary-light, #e0f2f1)',
                  padding: '20px',
                  borderRadius: '20px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ion-color-primary)' }}>
                    {globalStats?.totalSessions || 0}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase' }}>
                    Total Sessions
                  </div>
                </div>
              </IonCol>
              <IonCol size="6">
                <div style={{
                  background: 'var(--ion-color-secondary-light, #fff3e0)',
                  padding: '20px',
                  borderRadius: '20px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ion-color-secondary)' }}>
                    {globalStats?.currentStreak || 0}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase' }}>
                    Day Streak
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        <DhammaAudioWidget />

        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Upcoming Observance</h3>
          <NextUposathaWidget />
        </div>

        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <IonButton routerLink="/sati" mode="ios" style={{ height: '50px', flex: 1 }}>
              <IonIcon slot="start" icon={leafOutline} />
              Practice
            </IonButton>
            <IonButton routerLink="/calendar" color="secondary" mode="ios" style={{ height: '50px', flex: 1 }}>
              <IonIcon slot="start" icon={calendarOutline} />
              Calendar
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
