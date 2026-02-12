
import React, { useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonListHeader,
    IonNote,
    IonButton,
    useIonViewWillEnter,
    IonItemDivider
} from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { getSavedLocation, saveLocation, getCurrentGPS } from '../services/locationManager';
import { scheduleUposathaNotifications, scheduleFestivalNotifications, cancelAllNotifications } from '../services/notificationScheduler';
import { Observer } from '@ishubhamx/panchangam-js';

const SettingsPage: React.FC = () => {
    const [location, setLocation] = useState<any>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [festivalsEnabled, setFestivalsEnabled] = useState(false);

    useIonViewWillEnter(() => {
        loadSettings();
    });

    const loadSettings = async () => {
        const loc = await getSavedLocation();
        setLocation(loc);

        const { value: notif } = await Preferences.get({ key: 'notifications_uposatha' });
        setNotificationsEnabled(notif === 'true');

        const { value: fest } = await Preferences.get({ key: 'notifications_festivals' });
        setFestivalsEnabled(fest === 'true');
    };

    const handleGPS = async () => {
        try {
            const gps = await getCurrentGPS();
            if (gps) {
                await saveLocation(gps);
                setLocation(gps);
                // Reschedule if notifications are on
                if (notificationsEnabled || festivalsEnabled) {
                    await reschedule(gps);
                }
            } else {
                alert('Could not get GPS location.');
            }
        } catch (e) {
            alert('Could not get GPS location. Ensure permissions are granted.');
        }
    };

    const toggleUposatha = async (enabled: boolean) => {
        setNotificationsEnabled(enabled);
        await Preferences.set({ key: 'notifications_uposatha', value: String(enabled) });
        updateSchedules(enabled, festivalsEnabled);
    };

    const toggleFestivals = async (enabled: boolean) => {
        setFestivalsEnabled(enabled);
        await Preferences.set({ key: 'notifications_festivals', value: String(enabled) });
        updateSchedules(notificationsEnabled, enabled);
    };

    const updateSchedules = async (uposatha: boolean, festivals: boolean) => {
        if (!location) return;
        const observer = new Observer(location.latitude, location.longitude, location.altitude);

        // Simplistic approach: cancel all and re-add enabled ones
        await cancelAllNotifications();

        if (uposatha) {
            await scheduleUposathaNotifications(observer);
        }
        if (festivals) {
            await scheduleFestivalNotifications(observer);
        }
    };

    const reschedule = async (loc: any) => {
        const observer = new Observer(loc.latitude, loc.longitude, loc.altitude);
        await cancelAllNotifications();
        if (notificationsEnabled) await scheduleUposathaNotifications(observer);
        if (festivalsEnabled) await scheduleFestivalNotifications(observer);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Settings</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonList inset>
                    <IonItemDivider>
                        <IonLabel>Location</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                        <IonLabel>
                            <h2>Current Location</h2>
                            <p>{location ? location.name : 'Not set'}</p>
                            {location && <p className="text-xs">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>}
                        </IonLabel>
                        <IonButton slot="end" size="small" onClick={handleGPS}>Use GPS</IonButton>
                    </IonItem>
                </IonList>

                <IonList inset>
                    <IonItemDivider>
                        <IonLabel>Notifications</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                        <IonLabel>Uposatha Days</IonLabel>
                        <IonToggle
                            slot="end"
                            checked={notificationsEnabled}
                            onIonChange={e => toggleUposatha(e.detail.checked)}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel>Buddhist Festivals</IonLabel>
                        <IonToggle
                            slot="end"
                            checked={festivalsEnabled}
                            onIonChange={e => toggleFestivals(e.detail.checked)}
                        />
                    </IonItem>
                    <IonItem lines="none">
                        <IonNote className="ion-text-wrap" style={{ fontSize: '0.8rem' }}>
                            Notifications are scheduled locally on your device based on your location's astronomical data.
                        </IonNote>
                    </IonItem>
                </IonList>

                <div className="ion-padding text-center text-sm text-gray-500">
                    <p>Uposatha App v0.1.0</p>
                    <p>Calculations by @ishubhamx/panchangam-js</p>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SettingsPage;
