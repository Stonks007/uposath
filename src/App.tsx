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
import { calendar, rose, settings, today, leaf } from 'ionicons/icons';
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

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <NotificationRouterBridge />
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/calendar">
            <CalendarPage />
          </Route>
          <Route exact path="/today">
            <TodayPage />
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
          <Route exact path="/sati/anapanasati/stats">
            <AnapanasatiStatsPage />
          </Route>
          <Route exact path="/sati/stats">
            <SatiStatsPage />
          </Route>
          <Route exact path="/festivals">
            <FestivalsPage />
          </Route>
          <Route exact path="/settings">
            <SettingsPage />
          </Route>
          <Route path="/day/:dateStr">
            <DayDetailPage />
          </Route>
          <Route exact path="/">
            <Redirect to="/calendar" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="calendar" href="/calendar">
            <IonIcon aria-hidden="true" icon={calendar} />
            <IonLabel>Calendar</IonLabel>
          </IonTabButton>
          <IonTabButton tab="today" href="/today">
            <IonIcon aria-hidden="true" icon={today} />
            <IonLabel>Today</IonLabel>
          </IonTabButton>
          <IonTabButton tab="sati" href="/sati">
            <IonIcon aria-hidden="true" icon={rose} /> {/* Using rose temporarily if 'flower' or 'leaf' is better? Blueprint says prayer hands 🙏 (txt) or similar ? Icon: 🙏 (prayer hands emoji) - Ionic doesn't have emoji icon, I should use a suitable icon. 'flower' or 'leaf' or 'heart'. The blueprint says "Icon: 🙏 (prayer hands emoji)". Ionicons has 'hand-left' or 'body', maybe 'flower-outline'. Let's use 'flower' (lotus-like) or 'leaf' for now, or text. Wait, I can use an SVG or just an icon that looks spiritual. 'happy' or 'heart'? 'flower-outline' is usually good for lotus. Let's stick to 'rose' as it was used for Festivals? wait, Festivals used 'rose'. I see Festivals uses 'rose' in existing code.
            Let's use 'leaf' for Sati (mindfulness) or maybe 'body' (mindfulness of body).
            Actually, the blueprint says: "Icon: 🙏 (prayer hands emoji)". If I can't find a perfect IonIcon, I will use 'flower-outline' (lotus). Let's use 'leaf' for now as it's distinct.
            Wait, I'll check imports. 'rose' is imported. I need to import another icon.
            I'll use 'leaf' for now and add it to imports.
            */}
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
  </IonApp>
);

export default App;
