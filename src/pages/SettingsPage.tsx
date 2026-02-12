
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
import { getSavedLocation, saveLocation, getCurrentGPS, type SavedLocation } from '../services/locationManager';
import { scheduleUposathaNotifications, scheduleFestivalNotifications, cancelAllNotifications } from '../services/notificationScheduler';
import {
    cancelDailyVerseNotifications,
    requestDailyVersePermissionIfNeeded,
    scheduleDailyVerseNotifications,
    type DailyVerseTime
} from '../services/dailyVerseNotificationService';
import { Observer } from '@ishubhamx/panchangam-js';
import { getTimezones } from '../services/timeUtils';
import { MAJOR_CITIES } from '../services/locationData';
import { IonSelect, IonSelectOption, IonIcon } from '@ionic/react';
import { locationOutline, timeOutline, globeOutline, caretUpCircleOutline } from 'ionicons/icons';
import { MalaService } from '../services/MalaService';

const SettingsPage: React.FC = () => {
    const [location, setLocation] = useState<SavedLocation | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [festivalsEnabled, setFestivalsEnabled] = useState(false);
    const [dailyVerseEnabled, setDailyVerseEnabled] = useState(true);
    const [dailyVerseTime, setDailyVerseTime] = useState<DailyVerseTime>({ hour: 6, minute: 0 });
    const [dailyVerseTimeLabel, setDailyVerseTimeLabel] = useState('06:00');
    const [showDailyVerseCard, setShowDailyVerseCard] = useState(true);
    const [timezones] = useState(getTimezones());
    const [paliScript, setPaliScript] = useState('roman');

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

        const { value: dailyVerseEnabledRaw } = await Preferences.get({ key: 'notifications_daily_verse_enabled' });
        setDailyVerseEnabled(dailyVerseEnabledRaw === null || dailyVerseEnabledRaw === '' || dailyVerseEnabledRaw === 'true');

        const { value: dailyVerseTimeRaw } = await Preferences.get({ key: 'notifications_daily_verse_time' });
        if (dailyVerseTimeRaw) {
            try {
                const parsed = JSON.parse(dailyVerseTimeRaw) as DailyVerseTime;
                if (typeof parsed.hour === 'number' && typeof parsed.minute === 'number') {
                    setDailyVerseTime(parsed);
                    const hh = String(parsed.hour).padStart(2, '0');
                    const mm = String(parsed.minute).padStart(2, '0');
                    setDailyVerseTimeLabel(`${hh}:${mm}`);
                }
            } catch {
                // ignore and keep default
            }
        }

        const { value: showVerse } = await Preferences.get({ key: 'settings_show_daily_verse' });
        setShowDailyVerseCard(showVerse === null || showVerse === '' || showVerse === 'true');

        const prefs = await MalaService.getPreferences();
        setPaliScript(prefs.paliScript);
    };

    const handleTimezoneChange = async (tz: string) => {
        if (!location) return;
        const updated = { ...location, timezone: tz };
        setLocation(updated);
        await saveLocation(updated);
        // Reschedule if notifications are on
        if (notificationsEnabled || festivalsEnabled) {
            await reschedule(updated);
        }
    };

    const handlePresetCityChange = async (city: SavedLocation) => {
        setLocation(city);
        await saveLocation(city);
        // Reschedule if notifications are on
        if (notificationsEnabled || festivalsEnabled) {
            await reschedule(city);
        }
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

    const toggleDailyVerse = async (enabled: boolean) => {
        setDailyVerseEnabled(enabled);
        await Preferences.set({ key: 'notifications_daily_verse_enabled', value: String(enabled) });

        if (enabled) {
            const granted = await requestDailyVersePermissionIfNeeded();
            if (!granted) {
                setDailyVerseEnabled(false);
                await Preferences.set({ key: 'notifications_daily_verse_enabled', value: 'false' });
                alert('Daily verse notifications are disabled because notification permission was not granted. You can enable notifications in system settings.');
                return;
            }
            await cancelDailyVerseNotifications();
            await scheduleDailyVerseNotifications(dailyVerseTime);
        } else {
            await cancelDailyVerseNotifications();
        }
    };

    const handleDailyVerseTimeChange = async (timeString: string) => {
        setDailyVerseTimeLabel(timeString);
        const [hh, mm] = timeString.split(':').map(part => parseInt(part, 10));
        if (Number.isNaN(hh) || Number.isNaN(mm)) return;

        const time: DailyVerseTime = { hour: hh, minute: mm };
        setDailyVerseTime(time);
        await Preferences.set({ key: 'notifications_daily_verse_time', value: JSON.stringify(time) });

        if (dailyVerseEnabled) {
            await cancelDailyVerseNotifications();
            await scheduleDailyVerseNotifications(time);
        }
    };

    const toggleShowDailyVerseCard = async (enabled: boolean) => {
        setShowDailyVerseCard(enabled);
        await Preferences.set({ key: 'settings_show_daily_verse', value: String(enabled) });
    };

    const handlePaliScriptChange = async (script: string) => {
        setPaliScript(script);
        const prefs = await MalaService.getPreferences();
        await MalaService.savePreferences({ ...prefs, paliScript: script });
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
                        <IonLabel>Location & Timezone</IonLabel>
                    </IonItemDivider>

                    <IonItem>
                        <IonIcon icon={locationOutline} slot="start" color="primary" />
                        <IonLabel className="ion-text-wrap">
                            <h2>Current Location</h2>
                            <p>{location ? location.name : 'Not set'}</p>
                            {location && <p className="text-xs">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>}
                        </IonLabel>
                        <IonButton slot="end" size="small" fill="outline" onClick={handleGPS}>
                            Detect GPS
                        </IonButton>
                    </IonItem>

                    <IonItem>
                        <IonIcon icon={globeOutline} slot="start" color="secondary" />
                        <IonLabel className="ion-text-wrap" style={{ flex: '1 1 auto' }}>
                            <h2>Preset City</h2>
                            <p style={{ color: 'var(--ion-color-secondary)', fontWeight: 'bold' }}>
                                {MAJOR_CITIES.find(c => c.name === location?.name)?.name || 'Custom/GPS'}
                            </p>
                        </IonLabel>
                        <IonSelect
                            slot="end"
                            interface="action-sheet"
                            placeholder="Select"
                            style={{ maxWidth: '40%' }}
                            value={location?.name}
                            onIonChange={e => {
                                const city = MAJOR_CITIES.find(c => c.name === e.detail.value);
                                if (city) handlePresetCityChange(city);
                            }}
                        >
                            {MAJOR_CITIES.map(city => (
                                <IonSelectOption key={city.name} value={city.name}>
                                    {city.name}
                                </IonSelectOption>
                            ))}
                        </IonSelect>
                    </IonItem>

                    <IonItem>
                        <IonIcon icon={timeOutline} slot="start" color="tertiary" />
                        <IonLabel className="ion-text-wrap" style={{ flex: '1 1 auto' }}>
                            <h2>Timezone</h2>
                            <p style={{ color: 'var(--ion-color-tertiary)', fontWeight: 'bold' }}>
                                {location?.timezone || 'Detecting...'}
                            </p>
                        </IonLabel>
                        <IonSelect
                            slot="end"
                            interface="action-sheet"
                            placeholder="Change"
                            style={{ maxWidth: '40%' }}
                            value={location?.timezone}
                            onIonChange={e => handleTimezoneChange(e.detail.value)}
                        >
                            {timezones.map(tz => (
                                <IonSelectOption key={tz} value={tz}>{tz}</IonSelectOption>
                            ))}
                        </IonSelect>
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
                    <IonItem>
                        <IonLabel>Daily Dhammapada Verse</IonLabel>
                        <IonToggle
                            slot="end"
                            checked={dailyVerseEnabled}
                            onIonChange={e => toggleDailyVerse(e.detail.checked)}
                        />
                    </IonItem>
                    <IonItem>
                        <IonLabel className="ion-text-wrap">
                            <h2>Daily Verse Time</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Local time for the daily verse notification.</p>
                        </IonLabel>
                        <IonSelect
                            slot="end"
                            interface="action-sheet"
                            placeholder="Select time"
                            style={{ maxWidth: '40%' }}
                            value={dailyVerseTimeLabel}
                            onIonChange={e => handleDailyVerseTimeChange(e.detail.value)}
                        >
                            {['04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30', '08:00'].map(t => (
                                <IonSelectOption key={t} value={t}>
                                    {t}
                                </IonSelectOption>
                            ))}
                        </IonSelect>
                    </IonItem>
                    <IonItem lines="none">
                        <IonNote className="ion-text-wrap" style={{ fontSize: '0.8rem' }}>
                            Notifications are scheduled locally on your device based on your location's astronomical data.
                        </IonNote>
                    </IonItem>
                </IonList>

                <IonList inset>
                    <IonItemDivider>
                        <IonLabel>Daily Verse Display</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                        <IonLabel>Show verse card on Calendar screen</IonLabel>
                        <IonToggle
                            slot="end"
                            checked={showDailyVerseCard}
                            onIonChange={e => toggleShowDailyVerseCard(e.detail.checked)}
                        />
                    </IonItem>
                </IonList>

                <IonList inset>
                    <IonItemDivider>
                        <IonLabel>Pali Text Settings</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                        <IonIcon icon={caretUpCircleOutline} slot="start" color="warning" />
                        <IonLabel className="ion-text-wrap">
                            <h2>Pali Script</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Script used for all Pali texts (Triple Gem, Anapanasati, etc.)</p>
                        </IonLabel>
                        <IonSelect
                            slot="end"
                            interface="action-sheet"
                            placeholder="Select"
                            value={paliScript}
                            onIonChange={e => handlePaliScriptChange(e.detail.value)}
                        >
                            <IonSelectOption value="roman">Roman (Default)</IonSelectOption>
                            <IonSelectOption value="devanagari">Devanagari (देवनागरी)</IonSelectOption>
                            <IonSelectOption value="sinhala">Sinhala (සිංහල)</IonSelectOption>
                            <IonSelectOption value="thai">Thai (ไทย)</IonSelectOption>
                            <IonSelectOption value="burmese">Burmese (မြန်မာ)</IonSelectOption>
                        </IonSelect>
                    </IonItem>
                </IonList>

                <IonList inset>
                    <IonItemDivider>
                        <IonLabel>Sati Practice</IonLabel>
                    </IonItemDivider>
                    <IonItem button routerLink="/sati" detail>
                        <IonLabel>Go to Sati Practice</IonLabel>
                    </IonItem>
                    <IonItem button routerLink="/sati/stats" detail>
                        <IonLabel>View Practice Statistics</IonLabel>
                    </IonItem>
                </IonList>

                <IonList inset>
                    <IonItemDivider>
                        <IonLabel>About & Credits</IonLabel>
                    </IonItemDivider>
                    <IonItem lines="none">
                        <IonLabel className="ion-text-wrap">
                            <h2>Texts & Sources</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                Dhammapada verses translated by F. Max Müller (public domain). Text source: Project Gutenberg eBook #2017.
                            </p>
                        </IonLabel>
                    </IonItem>
                </IonList>

                <div className="ion-padding text-center text-sm text-gray-500">
                    <p>Uposatha App v0.1.0</p>
                    <p>Calculations by @ishubhamx/panchangam-js</p>
                </div>
            </IonContent>
        </IonPage >
    );
};

export default SettingsPage;
