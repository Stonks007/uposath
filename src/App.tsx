import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Redirect, Route, useHistory } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { calendar, rose, settings, leaf, home, library, musicalNotes } from 'ionicons/icons';
import { LocalNotifications } from '@capacitor/local-notifications';
import { bootstrapNotifications } from './services/notificationScheduler';
import { getSavedLocation } from './services/locationManager';
import { Observer } from '@ishubhamx/panchangam-js';
import { UposathaObservanceService } from './services/UposathaObservanceService';
import { App as CapApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import UpdateService, { ReleaseInfo } from './services/UpdateService';
import UpdateDialog from './components/UpdateDialog';
import { useState } from 'react';

/* Core CSS */
import '@ionic/react/css/core.css';

/* Basic CSS */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark Mode */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import './theme/global.css';

/* Pages */
import Home from './pages/Home';
import CalendarPage from './pages/CalendarPage';
import FestivalsPage from './pages/FestivalsPage';
import SettingsPage from './pages/SettingsPage';
import DayDetailPage from './pages/DayDetailPage';
import SatiPage from './pages/SatiPage';
import TripleGemPage from './pages/TripleGemPage';
import AnapanasatiPage from './pages/AnapanasatiPage';
import AnapanasatiSessionPage from './pages/AnapanasatiSessionPage';
import EmptinessPage from './pages/EmptinessPage';
import EmptinessSessionPage from './pages/EmptinessSessionPage';
import MantraListPage from './pages/MantraListPage';
import MantraEditPage from './pages/MantraEditPage';
import MantraPracticePage from './pages/MantraPracticePage';
import AudioLibraryPage from './pages/AudioLibraryPage';
import AudioPlayerPage from './pages/AudioPlayerPage';
import SatiStatsPage from './pages/SatiStatsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';

const FocusManager: React.FC = () => {
  const history = useHistory();
  useEffect(() => {
    return history.listen(() => {
      if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    });
  }, [history]);
  return null;
};

const NotificationRouterBridge: React.FC = () => {
  const history = useHistory();
  useEffect(() => {
    const listenerPromise = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event) => {
        const extra = event.notification.extra as { route?: string } | null | undefined;
        const route = extra?.route;
        if (route) {
          history.push(route);
        }
      },
    );
    return () => {
      listenerPromise.then((listener) => {
        listener.remove();
      });
    };
  }, [history]);
  return null;
};

const SyncManager: React.FC = () => {
  useEffect(() => {
    const syncMissed = async () => {
      const loc = await getSavedLocation();
      const observer = loc ? new Observer(loc.latitude, loc.longitude, loc.altitude) : new Observer(24.7914, 85.0002, 111);
      await UposathaObservanceService.syncMissedObservances(observer);
    };
    syncMissed();
  }, []);
  return null;
};

const StorageHygieneManager: React.FC = () => {
  useEffect(() => {
    import('./services/DeityImageService').then(({ deityImageService }) => {
      deityImageService.cleanupOrphanedImages();
    });
  }, []);
  return null;
};

const UpdateManager: React.FC = () => {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);

  useEffect(() => {
    const checkUpdate = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        const { value } = await Preferences.get({ key: 'lastUpdateCheck' });
        const now = Date.now();

        if (value) {
          const lastCheck = parseInt(value, 10);
          if (now - lastCheck < 24 * 60 * 60 * 1000) {
            return;
          }
        }

        const update = await UpdateService.checkForUpdate();
        await Preferences.set({ key: 'lastUpdateCheck', value: now.toString() });

        if (update) {
          setRelease(update);
        }
      } catch (e) {
        console.error('Update check failed', e);
      }
    };

    // Run immediately on cold launch
    checkUpdate();

    const handleAppStateChange = CapApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        checkUpdate();
      }
    });

    return () => {
      handleAppStateChange.then(listener => listener.remove());
    };
  }, []);

  if (!release) return null;

  return (
    <UpdateDialog
      version={release.version}
      changelog={release.changelog}
      onUpdate={async () => {
        if (release.apkUrl) {
          await UpdateService.openDownload(release.apkUrl, release.version);
        }
      }}
      onDismiss={() => setRelease(null)}
    />
  );
};

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    // Request notification permissions on first launch, then bootstrap
    LocalNotifications.requestPermissions().then(() => {
      bootstrapNotifications();
    }).catch(() => { });
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <NotificationRouterBridge />
        <FocusManager />
        <SyncManager />
        <StorageHygieneManager />
        <UpdateManager />
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/calendar" component={CalendarPage} />
            <Route exact path="/home" component={Home} />
            <Route exact path="/sati" component={SatiPage} />
            <Route exact path="/sati/triple-gem" component={TripleGemPage} />
            <Route exact path="/sati/anapanasati" component={AnapanasatiPage} />
            <Route exact path="/sati/anapanasati/session" component={AnapanasatiSessionPage} />
            <Route exact path="/sati/emptiness" component={EmptinessPage} />
            <Route exact path="/sati/emptiness/session" component={EmptinessSessionPage} />
            <Route exact path="/sati/mantras" component={MantraListPage} />
            <Route exact path="/sati/mantras/edit/:id" component={MantraEditPage} />
            <Route exact path="/sati/mantras/practice/:id" component={MantraPracticePage} />
            <Route exact path="/sati/stats" component={SatiStatsPage} />
            <Route exact path="/library/:channelId?" component={AudioLibraryPage} />
            <Route exact path="/playlist/:id" component={PlaylistDetailPage} />
            <Route exact path="/player" component={AudioPlayerPage} />
            <Route exact path="/festivals" component={FestivalsPage} />
            <Route path="/day/:dateStr" component={DayDetailPage} />
            <Route exact path="/settings" component={SettingsPage} />
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/home">
              <IonIcon aria-hidden="true" icon={home} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
            <IonTabButton tab="calendar" href="/calendar">
              <IonIcon aria-hidden="true" icon={calendar} />
              <IonLabel>Calendar</IonLabel>
            </IonTabButton>
            <IonTabButton tab="sati" href="/sati">
              <IonIcon aria-hidden="true" icon={leaf} />
              <IonLabel>Sati</IonLabel>
            </IonTabButton>
            <IonTabButton tab="player" href="/player">
              <IonIcon aria-hidden="true" icon={musicalNotes} />
              <IonLabel>Player</IonLabel>
            </IonTabButton>
            <IonTabButton tab="library" href="/library">
              <IonIcon aria-hidden="true" icon={library} />
              <IonLabel>Library</IonLabel>
            </IonTabButton>
            <IonTabButton tab="festivals" href="/festivals">
              <IonIcon aria-hidden="true" icon={rose} />
              <IonLabel>Festivals</IonLabel>
            </IonTabButton>
            <IonTabButton tab="settings" href="/settings">
              <IonIcon aria-hidden="true" icon={settings} />
              <IonLabel>Settings</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
