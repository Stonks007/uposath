
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
import { getSavedLocation, saveLocation, type SavedLocation } from '../services/locationManager';
import { scheduleUposathaNotifications, scheduleFestivalNotifications, cancelAllNotifications } from '../services/notificationScheduler';
import {
    cancelDailyVerseNotifications,
    requestDailyVersePermissionIfNeeded,
    scheduleDailyVerseNotifications
} from '../services/dailyVerseNotificationService';
import { Observer } from '@ishubhamx/panchangam-js';
import { getTimezones } from '../services/timeUtils';
// City import removed from here and moved to lazy getter to speed up bundle parsing
// City and TzLookup imports removed from here and moved to lazy getters to speed up bundle parsing

// Lazy load city data to keep bundle small and startup fast
let memoizedCities: any[] | null = null;
const getCitiesLazy = async () => {
    if (!memoizedCities) {
        try {
            const { City } = await import('country-state-city');
            memoizedCities = City.getAllCities();
        } catch (e) {
            console.error('Failed to load cities', e);
            return [];
        }
    }
    return memoizedCities;
};

let memoizedTzLookup: any = null;
const getTzLookupLazy = async () => {
    if (!memoizedTzLookup) {
        try {
            const { default: tz } = await import('tz-lookup');
            memoizedTzLookup = tz;
        } catch (e) {
            console.error('Failed to load tz-lookup', e);
            return () => 'UTC';
        }
    }
    return memoizedTzLookup;
};

import { IonSelect, IonSelectOption, IonIcon, useIonAlert } from '@ionic/react';
import { locationOutline, timeOutline, globeOutline, caretUpCircleOutline } from 'ionicons/icons';
import { MalaService } from '../services/MalaService';
import { UposathaObservanceService } from '../services/UposathaObservanceService';

const SettingsPage: React.FC = () => {
    const [location, setLocation] = useState<SavedLocation | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [festivalsEnabled, setFestivalsEnabled] = useState(false);
    const [dailyVerseEnabled, setDailyVerseEnabled] = useState(true);
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
        // Warm up heavy libraries in the background while user is looking at settings
        setTimeout(() => {
            getCitiesLazy();
            getTzLookupLazy();
        }, 2000);
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
        if (notificationsEnabled || festivalsEnabled || dailyVerseEnabled) {
            await reschedule(updated);
        }
    };

    const searchIdRef = React.useRef(0);
    const searchTimeoutRef = React.useRef<any>(null);

    // Helper function to filter and map cities
    // Uses chunked processing to keep the UI thread alive during the scan of 200k+ cities
    // Abortable if a new search starts
    const getFilteredCities = async (query: string): Promise<SavedLocation[]> => {
        const currentId = ++searchIdRef.current;
        const q = query.toLowerCase();

        // Only load libraries when first needed and not already loaded
        const allCities = await getCitiesLazy();
        if (currentId !== searchIdRef.current) return [];

        const tzLookup = await getTzLookupLazy();
        if (currentId !== searchIdRef.current) return [];

        const matches: any[] = [];
        const CHUNK_SIZE = 1000;

        for (let i = 0; i < allCities.length; i++) {
            // Check for abort every chunk
            if (i % CHUNK_SIZE === 0) {
                if (currentId !== searchIdRef.current) return [];
                // Yield to event loop
                await new Promise(r => setTimeout(r, 0));
            }

            const c = allCities[i];
            if (c.name.toLowerCase().indexOf(q) !== -1) {
                matches.push(c);
                // Yield on every 5 matches to allow UI to breathe
                if (matches.length % 5 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            if (matches.length >= 15) break;
        }

        if (currentId !== searchIdRef.current) return [];

        return matches
            .sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const aStarts = aName.startsWith(q);
                const bStarts = bName.startsWith(q);
                return aStarts && !bStarts ? -1 :
                    !aStarts && bStarts ? 1 :
                        aName.length - bName.length;
            })
            .map((c) => {
                const lat = parseFloat(c.latitude);
                const lon = parseFloat(c.longitude);
                return {
                    name: `${c.name}, ${c.stateCode}, ${c.countryCode}`,
                    latitude: lat,
                    longitude: lon,
                    altitude: 0,
                    timezone: tzLookup(lat, lon)
                };
            });
    };

    const handleCitySearch = (query: string) => {
        setCitySearch(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (query.length > 2) {
            searchTimeoutRef.current = setTimeout(async () => {
                const matches = await getFilteredCities(query);
                setFilteredCities(matches);
                setShowCityDropdown(true);
            }, 300);
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
        if (notificationsEnabled || festivalsEnabled || dailyVerseEnabled) {
            await reschedule(city);
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
            if (location) {
                const observer = new Observer(location.latitude, location.longitude, location.altitude);
                await cancelDailyVerseNotifications();
                await scheduleDailyVerseNotifications(observer);
            }
        } else {
            await cancelDailyVerseNotifications();
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
        if (dailyVerseEnabled) {
            await cancelDailyVerseNotifications();
            await scheduleDailyVerseNotifications(observer);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Settings</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonList inset style={{ overflow: 'visible', contain: 'none', position: 'relative', zIndex: 20 }}>
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
                    </IonItem>

                    <div style={{ padding: '0 16px 12px', position: 'relative', zIndex: 100 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <IonIcon icon={globeOutline} color="secondary" style={{ fontSize: '1.2rem' }} />
                            <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--color-text-primary, #f5f0e8)' }}>Search City</span>
                        </div>
                        <div style={{ position: 'relative', zIndex: 101 }}>
                            <input
                                type="text"
                                autoComplete="off"
                                value={citySearch}
                                onChange={e => handleCitySearch(e.target.value)}
                                onFocus={() => { if (citySearch.length > 0) setShowCityDropdown(true); }}
                                placeholder="Type a city name..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: showCityDropdown ? '12px 12px 0 0' : '12px',
                                    border: showCityDropdown ? '1px solid rgba(255, 198, 112, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderBottom: showCityDropdown ? 'none' : undefined,
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
                                    left: '0',
                                    right: '0',
                                    zIndex: 9999,
                                    background: 'rgba(18, 18, 18, 0.98)',
                                    border: '1px solid rgba(255, 198, 112, 0.4)',
                                    borderTop: 'none',
                                    borderRadius: '0 0 12px 12px',
                                    maxHeight: '280px',
                                    overflowY: 'auto',
                                    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.9)',
                                    backdropFilter: 'blur(25px)',
                                }}>
                                    {filteredCities.length > 0 ? (
                                        filteredCities.map((city, idx) => (
                                            <div
                                                key={`${city.name}-${idx}`}
                                                onMouseDown={() => selectCity(city)}
                                                style={{
                                                    padding: '14px 18px',
                                                    cursor: 'pointer',
                                                    borderBottom: idx === filteredCities.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                                                    fontSize: '0.9rem',
                                                    color: '#f5f0e8',
                                                }}
                                            >
                                                <div style={{ fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{city.name}</span>
                                                    <span style={{ fontSize: '0.65rem', color: '#ffc670', opacity: 0.8 }}>
                                                        {city.timezone?.split('/').pop()?.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                                                    {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.85rem' }}>
                                            No matches found for "{citySearch}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
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
                        <IonLabel className="ion-text-wrap">
                            <h2>Daily Dhammapada Verse</h2>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>A persistent notification updated daily at sunrise.</p>
                        </IonLabel>
                        <IonToggle
                            slot="end"
                            checked={dailyVerseEnabled}
                            onIonChange={e => toggleDailyVerse(e.detail.checked)}
                        />
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
