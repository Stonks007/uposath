import React, { useEffect } from 'react';
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
import { calendar, rose, settings, today, leaf, home } from 'ionicons/icons';
import { LocalNotifications } from '@capacitor/local-notifications';

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
import TodayPage from './pages/TodayPage';
import FestivalsPage from './pages/FestivalsPage';
import SettingsPage from './pages/SettingsPage';
import DayDetailPage from './pages/DayDetailPage';
import SatiPage from './pages/SatiPage';
import SatiStatsPage from './pages/SatiStatsPage';
import TripleGemPage from './pages/TripleGemPage';
import AnapanasatiPage from './pages/AnapanasatiPage';
import AnapanasatiSessionPage from './pages/AnapanasatiSessionPage';
import AnapanasatiStatsPage from './pages/AnapanasatiStatsPage';
import EmptinessPage from './pages/EmptinessPage';
import MantraListPage from './pages/MantraListPage';
import MantraEditPage from './pages/MantraEditPage';
import MantraPracticePage from './pages/MantraPracticePage';

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

import { AudioProvider } from './context/AudioContext';
import MiniPlayer from './components/audio/MiniPlayer';
import AudioLibraryPage from './pages/AudioLibraryPage';
import AudioPlayerPage from './pages/AudioPlayerPage';

setupIonicReact();

const App: React.FC = () => (
  <AudioProvider>
    <IonApp>
      <IonReactRouter>
        <NotificationRouterBridge />
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/calendar">
              <CalendarPage />
            </Route>
            <Route exact path="/home">
              <Home />
            </Route>
            <Route exact path="/sati">
              <SatiPage />
            </Route>
            <Route exact path="/sati/triple-gem">
              <TripleGemPage />
            </Route>
            <Route exact path="/sati/anapanasati">
              <AnapanasatiPage />
            </Route>
            <Route exact path="/sati/anapanasati/session">
              <AnapanasatiSessionPage />
            </Route>
            <Route exact path="/sati/anapanasati/stats" component={AnapanasatiStatsPage} />
            <Route exact path="/sati/emptiness" component={EmptinessPage} />
            <Route exact path="/sati/mantras" component={MantraListPage} />
            <Route exact path="/sati/mantras/edit/:id" component={MantraEditPage} />
            <Route exact path="/sati/mantras/practice/:id" component={MantraPracticePage} />
            <Route exact path="/sati/stats">
              <SatiStatsPage />
            </Route>
            <Route exact path="/library">
              <AudioLibraryPage />
            </Route>
            <Route exact path="/player">
              <AudioPlayerPage />
            </Route>
            <Route exact path="/festivals">
              <FestivalsPage />
            </Route>
            <Route path="/day/:dateStr">
              <DayDetailPage />
            </Route>
            <Route exact path="/settings" component={SettingsPage} />
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>
          </IonRouterOutlet>

          <MiniPlayer />
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
    </IonApp >
  </AudioProvider>
);

export default App;
