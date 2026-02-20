
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
import { IonSelect, IonSelectOption, IonIcon, useIonAlert } from '@ionic/react';
import { locationOutline, timeOutline, globeOutline, caretUpCircleOutline } from 'ionicons/icons';
import { MalaService } from '../services/MalaService';
import { UposathaObservanceService } from '../services/UposathaObservanceService';

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
    const [trackingEnabled, setTrackingEnabled] = useState(true);
    const [presentAlert] = useIonAlert();
    const [citySearch, setCitySearch] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [filteredCities, setFilteredCities] = useState<SavedLocation[]>([]);

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

        const { value: trackEnabled } = await Preferences.get({ key: 'uposatha_tracking_enabled' });
        setTrackingEnabled(trackEnabled === null || trackEnabled === '' || trackEnabled === 'true');

        const prefs = await MalaService.getPreferences();
        setPaliScript(prefs.paliScript);
    };

    const toggleTracking = async (enabled: boolean) => {
        setTrackingEnabled(enabled);
        await Preferences.set({ key: 'uposatha_tracking_enabled', value: String(enabled) });
    };

    const handleClearObservanceHistory = async () => {
        presentAlert({
            header: 'Clear All Data?',
            message: 'This will permanently delete all your Uposatha observance records. This cannot be undone.',
            buttons: [
                'Cancel',
                {
                    text: 'Clear All',
                    role: 'destructive',
                    handler: async () => {
                        await UposathaObservanceService.clearHistory();
                        alert('Observance history cleared.');
                    }
                }
            ]
        });
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

    const handleCitySearch = (query: string) => {
        setCitySearch(query);
        if (query.length > 0) {
            const q = query.toLowerCase();
            const matches = MAJOR_CITIES.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8);
            setFilteredCities(matches);
            setShowCityDropdown(matches.length > 0);
        } else {
            setFilteredCities([]);
            setShowCityDropdown(false);
        }
    };

    const selectCity = async (city: SavedLocation) => {
        setCitySearch('');
        setShowCityDropdown(false);
        setFilteredCities([]);
        await handlePresetCityChange(city);
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
        if (enabled) {
            const granted = await requestDailyVersePermissionIfNeeded();
            if (!granted) {
                setNotificationsEnabled(false);
                await Preferences.set({ key: 'notifications_uposatha', value: 'false' });
                alert('Notification permission is required. Please enable it in system settings.');
                return;
            }
        }
        setNotificationsEnabled(enabled);
        await Preferences.set({ key: 'notifications_uposatha', value: String(enabled) });
        updateSchedules(enabled, festivalsEnabled);
    };

    const toggleFestivals = async (enabled: boolean) => {
        if (enabled) {
            const granted = await requestDailyVersePermissionIfNeeded();
            if (!granted) {
                setFestivalsEnabled(false);
                await Preferences.set({ key: 'notifications_festivals', value: 'false' });
                alert('Notification permission is required. Please enable it in system settings.');
                return;
            }
        }
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

                    <div style={{ position: 'relative', padding: '0 16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <IonIcon icon={globeOutline} color="secondary" style={{ fontSize: '1.2rem' }} />
                            <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--color-text-primary, #f5f0e8)' }}>Search City</span>
                        </div>
                        <input
                            type="text"
                            value={citySearch}
                            onChange={e => handleCitySearch(e.target.value)}
                            onFocus={() => { if (citySearch.length > 0) setShowCityDropdown(filteredCities.length > 0); }}
                            placeholder="Type a city name..."
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(255, 255, 255, 0.04)',
                                color: 'var(--color-text-primary, #f5f0e8)',
                                fontSize: '0.95rem',
                                fontFamily: 'Inter, sans-serif',
                                outline: 'none',
                                boxSizing: 'border-box' as any,
                                transition: 'border-color 0.2s ease',
                            }}
                            onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                        />
                        {showCityDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '16px',
                                right: '16px',
                                zIndex: 999,
                                background: 'rgba(20, 18, 14, 0.97)',
                                border: '1px solid rgba(255, 198, 112, 0.15)',
                                borderRadius: '12px',
                                maxHeight: '240px',
                                overflowY: 'auto',
                                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
                                backdropFilter: 'blur(12px)',
                            }}>
                                {filteredCities.map(city => (
                                    <div
                                        key={city.name}
                                        onMouseDown={() => selectCity(city)}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                            transition: 'background 0.15s',
                                            fontSize: '0.9rem',
                                            color: 'var(--color-text-primary, #f5f0e8)',
                                        }}
                                    >
                                        <div style={{ fontWeight: '600' }}>{city.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'rgba(255, 198, 112, 0.5)', marginTop: '2px' }}>
                                            {city.timezone}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <IonItem>
                        <IonIcon icon={timeOutline} slot="start" color="tertiary" />
                        <IonLabel className="ion-text-wrap">
                            <h2>Timezone</h2>
                            <p style={{ color: 'var(--ion-color-tertiary)', fontWeight: 'bold' }}>
                                {location?.timezone || 'Select a city above'}
                            </p>
                        </IonLabel>
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
                        <IonLabel>Uposatha Tracking</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                        <IonLabel className="ion-text-wrap">
                            <h2>Enable Observance Tracking</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Log and track your Uposatha observances and precepts.</p>
                        </IonLabel>
                        <IonToggle
                            slot="end"
                            checked={trackingEnabled}
                            onIonChange={e => toggleTracking(e.detail.checked)}
                        />
                    </IonItem>
                    <IonItem button onClick={handleClearObservanceHistory} detail={false}>
                        <IonLabel color="danger">Clear Observance History</IonLabel>
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
