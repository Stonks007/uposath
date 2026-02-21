
import React, { useState } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonToggle,
    IonButton,
    useIonViewWillEnter,
    IonSelect,
    IonSelectOption,
    IonIcon,
    useIonAlert
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

import { MalaService } from '../services/MalaService';
import { UposathaObservanceService } from '../services/UposathaObservanceService';
import './SettingsPage.css';
import {
    locationOutline,
    timeOutline,
    globeOutline,
    caretUpCircleOutline,
    notificationsOutline,
    eyeOutline,
    languageOutline,
    statsChartOutline,
    informationCircleOutline,
    trashOutline,
    radioOutline,
    sparklesOutline,
    calendarOutline
} from 'ionicons/icons';

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
            <IonHeader className="ion-no-border">
                <IonToolbar style={{
                    '--background': 'rgba(2, 2, 4, 0.7)',
                    'backdropFilter': 'blur(20px)',
                    '--border-style': 'none'
                }}>
                    <IonTitle style={{ fontSize: '1.6rem', fontWeight: '800' }}>Settings</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="settings-container">
                {/* Location & Timezone */}
                <div className="settings-section">
                    <div className="settings-section-title">Location & Timezone</div>
                    <div className="glass-card settings-card">
                        <div className="settings-item">
                            <div className="icon-wrapper icon-wrapper--medium icon-wrapper--primary settings-item-icon">
                                <IonIcon icon={locationOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2>Current Location</h2>
                                <p>{location ? location.name : 'Not set'}</p>
                            </div>
                        </div>

                        <div className="settings-input-container">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <IonIcon icon={globeOutline} color="secondary" style={{ fontSize: '1rem' }} />
                                <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search City</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="city-search-input"
                                    autoComplete="off"
                                    value={citySearch}
                                    onChange={e => handleCitySearch(e.target.value)}
                                    onFocus={() => { if (citySearch.length > 0) setShowCityDropdown(true); }}
                                    placeholder="Type city name (e.g. Colombo, Bangkok)..."
                                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                                />
                                {showCityDropdown && (
                                    <div className="city-dropdown-glass">
                                        {filteredCities.length > 0 ? (
                                            filteredCities.map((city, idx) => (
                                                <div
                                                    key={`${city.name}-${idx}`}
                                                    className="city-dropdown-item"
                                                    onMouseDown={() => selectCity(city)}
                                                >
                                                    <div style={{ fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span>{city.name}</span>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--color-accent-primary)', opacity: 0.9, background: 'rgba(255, 198, 112, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                            {city.timezone?.split('/').pop()?.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                                                        {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                No matches found for "{citySearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="settings-item">
                            <div className="icon-wrapper icon-wrapper--medium icon-wrapper--tertiary settings-item-icon">
                                <IonIcon icon={timeOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2>Timezone</h2>
                                <p style={{ color: 'var(--color-accent-primary)', fontWeight: '700' }}>
                                    {location?.timezone || 'Select a city mapping above'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="settings-section">
                    <div className="settings-section-title">Notifications</div>
                    <div className="glass-card settings-card">
                        <div className="settings-item">
                            <div className="icon-wrapper icon-wrapper--medium settings-item-icon" style={{ color: '#FCD34D' }}>
                                <IonIcon icon={notificationsOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2>Uposatha Days</h2>
                                <p>Alerts for full moon, new moon, and quarter days.</p>
                            </div>
                            <IonToggle
                                className="settings-toggle"
                                checked={notificationsEnabled}
                                onIonChange={e => toggleUposatha(e.detail.checked)}
                            />
                        </div>

                        <div className="settings-item">
                            <div className="icon-wrapper icon-wrapper--medium settings-item-icon" style={{ color: '#F472B6' }}>
                                <IonIcon icon={sparklesOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2>Buddhist Festivals</h2>
                                <p>Reminders for annual major celebrations.</p>
                            </div>
                            <IonToggle
                                className="settings-toggle"
                                checked={festivalsEnabled}
                                onIonChange={e => toggleFestivals(e.detail.checked)}
                            />
                        </div>

                        <div className="settings-item">
                            <div className="icon-wrapper icon-wrapper--medium settings-item-icon" style={{ color: '#6EE7B7' }}>
                                <IonIcon icon={radioOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2>Daily Dhammapada Verse</h2>
                                <p>Persistent sunrise notification for daily reflection.</p>
                            </div>
                            <IonToggle
                                className="settings-toggle"
                                checked={dailyVerseEnabled}
                                onIonChange={e => toggleDailyVerse(e.detail.checked)}
                            />
                        </div>
                    </div>
                </div>

                {/* Interface Settings */}
                <div className="settings-section">
                    <div className="settings-section-title">Interface & Text</div>
                    <div className="glass-card settings-card">
                        <div className="settings-item">
                            <div className="icon-wrapper icon-wrapper--medium settings-item-icon" style={{ color: '#818CF8' }}>
                                <IonIcon icon={eyeOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2>Calendar: Show Daily Verse</h2>
                                <p>Toggle the verse card on the main calendar view.</p>
                            </div>
                            <IonToggle
                                className="settings-toggle"
                                checked={showDailyVerseCard}
                                onIonChange={e => toggleShowDailyVerseCard(e.detail.checked)}
                            />
                        </div>

                        <div className="settings-item">
                            <div className="icon-wrapper icon-wrapper--medium settings-item-icon" style={{ color: '#FBBF24' }}>
                                <IonIcon icon={languageOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2>Pali Script</h2>
                                <p>Script used for all Pali texts and chants.</p>
                            </div>
                            <IonSelect
                                className="settings-select"
                                interface="action-sheet"
                                value={paliScript}
                                onIonChange={e => handlePaliScriptChange(e.detail.value)}
                            >
                                <IonSelectOption value="roman">Roman (Default)</IonSelectOption>
                                <IonSelectOption value="devanagari">Devanagari (देवनागरी)</IonSelectOption>
                                <IonSelectOption value="sinhala">Sinhala (සිංහල)</IonSelectOption>
                                <IonSelectOption value="thai">Thai (ไทย)</IonSelectOption>
                                <IonSelectOption value="burmese">Burmese (မြန်မာ)</IonSelectOption>
                            </IonSelect>
                        </div>
                    </div>
                </div>

                {/* Uposatha Tracking */}
                <div className="settings-section">
                    <div className="settings-section-title">Uposatha Logs</div>
                    <div className="glass-card settings-card">
                        <div className="settings-item">
                            <div className="icon-wrapper icon-wrapper--medium settings-item-icon" style={{ color: '#fbbf24' }}>
                                <IonIcon icon={calendarOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2>Enable Tracking</h2>
                                <p>Record and visualize your observance history.</p>
                            </div>
                            <IonToggle
                                className="settings-toggle"
                                checked={trackingEnabled}
                                onIonChange={e => toggleTracking(e.detail.checked)}
                            />
                        </div>
                        <div className="settings-item clickable" onClick={handleClearObservanceHistory}>
                            <div className="icon-wrapper icon-wrapper--medium settings-item-icon" style={{ color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                <IonIcon icon={trashOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2 style={{ color: '#EF4444' }}>Clear Data</h2>
                                <p>Permanently delete all observance records.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Practice Shortcuts */}
                <div className="settings-section">
                    <div className="settings-section-title">Practice Access</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="glass-card settings-card" onClick={() => (window as any).location = '/sati'} style={{ cursor: 'pointer', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div className="icon-wrapper icon-wrapper--large icon-wrapper--primary" style={{ marginBottom: '12px' }}>
                                <IonIcon icon={sparklesOutline} />
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Sati Practice</div>
                        </div>
                        <div className="glass-card settings-card" onClick={() => (window as any).location = '/sati/stats'} style={{ cursor: 'pointer', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div className="icon-wrapper icon-wrapper--large" style={{ marginBottom: '12px', color: '#6EE7B7', borderColor: 'rgba(110, 231, 183, 0.3)', background: 'rgba(110, 231, 183, 0.1)' }}>
                                <IonIcon icon={statsChartOutline} />
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Practice Stats</div>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="settings-section">
                    <div className="settings-section-title">About</div>
                    <div className="glass-card settings-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div className="icon-wrapper icon-wrapper--medium icon-wrapper--secondary">
                                <IonIcon icon={informationCircleOutline} />
                            </div>
                            <div className="settings-item-label">
                                <h2 style={{ fontSize: '1rem', marginBottom: '8px' }}>Uposatha App</h2>
                                <p style={{ fontSize: '0.85rem' }}>
                                    A spiritual companion for the traditional Buddhist calendar, featuring astronomical Uposatha calculations and Sati meditation tracking.
                                </p>
                                <p style={{ fontSize: '0.75rem', marginTop: '12px', fontStyle: 'italic' }}>
                                    Dhammapada texts sourced from public domain project Gutenberg.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="about-footer">
                    <p style={{ fontWeight: '700', color: 'var(--color-text-secondary)' }}>Uposatha v0.1.0-alpha</p>
                    <p>Designed for reflection and awareness.</p>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default SettingsPage;

