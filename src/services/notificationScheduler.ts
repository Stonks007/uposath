/**
 * Notification Scheduler Service
 *
 * Schedules local notifications for Uposatha days and Buddhist festivals.
 * Uses @capacitor/local-notifications.
 *
 * Uposatha Reminders:
 *   - Previous day at 18:00
 *   - Morning of at 05:00
 *
 * Festival Reminders:
 *   - 3 days before at 09:00
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { type Observer } from '@ishubhamx/panchangam-js';
import { getUpcomingFestivals } from './buddhistFestivalService';
import { getMonthUposathaDays } from './uposathaCalculator';
import { Preferences } from '@capacitor/preferences';
import { getSavedLocation, getObserver } from './locationManager';
import { cancelDailyVerseNotifications, scheduleDailyVerseNotifications } from './dailyVerseNotificationService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNotificationId(date: Date, typePrefix: number): number {
    // Generate a unique ID based on date and type
    // Type prefix: 1=Uposatha Eve, 2=Uposatha Morning, 3=Festival
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return parseInt(`${typePrefix}${dateStr.substring(2)}`);
}

/**
 * Schedule a notification at a specific time.
 */
async function scheduleNotification(
    id: number,
    title: string,
    body: string,
    scheduleAt: Date
) {
    // Only schedule if in future
    if (scheduleAt.getTime() <= Date.now()) return;

    await LocalNotifications.schedule({
        notifications: [
            {
                id,
                title,
                body,
                schedule: { at: scheduleAt },
                sound: undefined, // default
                iconColor: '#ffc670',
                attachments: [],
                actionTypeId: '',
                extra: null,
            },
        ],
    });
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Schedule notifications for the next 6 months.
 */
export async function scheduleAllNotifications(observer: Observer) {
    await cancelAllNotifications();
    await scheduleUposathaNotifications(observer);
    await scheduleFestivalNotifications(observer);
}

export async function scheduleUposathaNotifications(observer: Observer) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const notifications: any[] = [];

    // Iterate next 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date(currentYear, currentMonth + i, 1);
        const uposathaDays = getMonthUposathaDays(d.getFullYear(), d.getMonth(), observer);

        for (const { date: uDate, status } of uposathaDays) {
            if (status.isUposatha) {
                // Previous Day 18:00
                const prevDay = new Date(uDate);
                prevDay.setDate(prevDay.getDate() - 1);
                prevDay.setHours(18, 0, 0, 0);

                if (prevDay.getTime() > Date.now()) {
                    notifications.push({
                        id: getNotificationId(uDate, 1),
                        title: 'Uposatha Tomorrow',
                        body: `Prepare for ${status.label}.`,
                        schedule: { at: prevDay },
                        iconColor: '#ffc670',
                    });
                }

                // Morning Of 05:00
                const morningOf = new Date(uDate);
                morningOf.setHours(5, 0, 0, 0);

                if (morningOf.getTime() > Date.now()) {
                    notifications.push({
                        id: getNotificationId(uDate, 2),
                        title: 'Uposatha Today',
                        body: `Today is ${status.label}.`,
                        schedule: { at: morningOf },
                        iconColor: '#ffc670',
                    });
                }
            }
        }
    }

    if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
    }
}

export async function scheduleFestivalNotifications(observer: Observer) {
    const now = new Date();
    const upcomingFestivals = await getUpcomingFestivals(now, observer, 365);
    const notifications: any[] = [];

    for (const { date: fDate, festival } of upcomingFestivals) {
        // 3 days before
        const reminderDate = new Date(fDate);
        reminderDate.setDate(reminderDate.getDate() - 3);
        reminderDate.setHours(9, 0, 0, 0);

        if (reminderDate.getTime() > Date.now()) {
            notifications.push({
                id: getNotificationId(fDate, 3),
                title: `Upcoming Festival: ${festival.name}`,
                body: `${festival.name} is in 3 days.`,
                schedule: { at: reminderDate },
                iconColor: '#ffc670',
            });
        }
    }

    if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
    }
}

/**
 * Cancel all scheduled notifications and the pending ones.
 */
export async function cancelAllNotifications() {
    try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
        }
    } catch (e) {
        console.error('Error canceling notifications', e);
    }
}

/**
 * Bootstrap all notifications. Called on app startup.
 * Refactored to be extremely defensive, incremental and non-blocking.
 * Yields to the event loop between every few iterations to prevent ANR.
 */
export async function bootstrapNotifications() {
    // Wait longer (5s) for the app to settle and animations to finish
    setTimeout(async () => {
        try {
            const { display } = await LocalNotifications.checkPermissions();
            if (display !== 'granted') return;

            const location = await getSavedLocation();
            const observer = getObserver(location);

            const uposathaRes = await Preferences.get({ key: 'notifications_uposatha' });
            const festivalsRes = await Preferences.get({ key: 'notifications_festivals' });
            const dailyVerseRes = await Preferences.get({ key: 'notifications_daily_verse_enabled' });

            const uposatha = uposathaRes.value === 'true';
            const festivals = festivalsRes.value === 'true';
            const dailyVerse = dailyVerseRes.value === null || dailyVerseRes.value === '' || dailyVerseRes.value === 'true';

            // 1. Clear everything first
            await cancelAllNotifications();

            const allNotifications: any[] = [];
            const now = new Date();

            // 2. Gather Uposatha notifications (Incremental)
            if (uposatha) {
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth();
                // Reduced to next 2 months for faster startup; settings page can reschedule for 6 months
                for (let i = 0; i < 2; i++) {
                    const d = new Date(currentYear, currentMonth + i, 1);
                    const uposathaDays = getMonthUposathaDays(d.getFullYear(), d.getMonth(), observer);
                    for (const { date: uDate, status } of uposathaDays) {
                        if (status.isUposatha) {
                            const prevDay = new Date(uDate);
                            prevDay.setDate(prevDay.getDate() - 1);
                            prevDay.setHours(18, 0, 0, 0);
                            if (prevDay.getTime() > Date.now()) {
                                allNotifications.push({
                                    id: getNotificationId(uDate, 1),
                                    title: 'Uposatha Tomorrow',
                                    body: `Prepare for ${status.label}.`,
                                    schedule: { at: prevDay },
                                    iconColor: '#ffc670',
                                });
                            }
                            const morningOf = new Date(uDate);
                            morningOf.setHours(5, 0, 0, 0);
                            if (morningOf.getTime() > Date.now()) {
                                allNotifications.push({
                                    id: getNotificationId(uDate, 2),
                                    title: 'Uposatha Today',
                                    body: `Today is ${status.label}.`,
                                    schedule: { at: morningOf },
                                    iconColor: '#ffc670',
                                });
                            }
                        }
                    }
                    // Yield after each month
                    await new Promise(r => setTimeout(r, 10));
                }
            }

            // 3. Gather Festival notifications (Reduced window for boot)
            if (festivals) {
                // Only scan next 30 days during boot to keep it fast
                const upcomingFestivals = await getUpcomingFestivals(now, observer, 30);
                for (const { date: fDate, festival } of upcomingFestivals) {
                    const reminderDate = new Date(fDate);
                    reminderDate.setDate(reminderDate.getDate() - 3);
                    reminderDate.setHours(9, 0, 0, 0);
                    if (reminderDate.getTime() > Date.now()) {
                        allNotifications.push({
                            id: getNotificationId(fDate, 3),
                            title: `Upcoming Festival: ${festival.name}`,
                            body: `${festival.name} is in 3 days.`,
                            schedule: { at: reminderDate },
                            iconColor: '#ffc670',
                        });
                    }
                }
                await new Promise(r => setTimeout(r, 10));
            }

            // 4. Gather Daily Verse notifications
            if (dailyVerse) {
                const { getSunrise } = await import('@ishubhamx/panchangam-js');
                const { getVerseForDate, getCleanVerseText, getVerseDisplayReference } = await import('./dhammapadaService');

                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                for (let offset = 0; offset < 7; offset += 1) { // Reduced to 7 days for boot
                    const targetDate = new Date(start);
                    targetDate.setDate(start.getDate() + offset);

                    const sunriseDate = getSunrise(targetDate, observer);
                    if (sunriseDate && sunriseDate.getTime() > now.getTime()) {
                        const verse = getVerseForDate(sunriseDate);
                        const id = parseInt(`4${sunriseDate.toISOString().split('T')[0].replace(/-/g, '').substring(2)}`, 10);
                        allNotifications.push({
                            id,
                            title: `Verse of the Day • ${verse.chapterTitle}`,
                            body: getCleanVerseText(verse),
                            largeBody: getCleanVerseText(verse),
                            summaryText: getVerseDisplayReference(verse),
                            ongoing: true,
                            autoCancel: false,
                            schedule: { at: sunriseDate },
                            iconColor: '#ffc670',
                            extra: { route: '/calendar', payloadType: 'daily-dhammapada-verse', globalVerseNumber: verse.globalVerseNumber },
                        });
                    }
                }
            }

            // 5. Submit all at once
            if (allNotifications.length > 0) {
                // Batch submission in chunks if very large (though here it's likely small now)
                await LocalNotifications.schedule({ notifications: allNotifications.slice(0, 40) });
            }
        } catch (e) {
            console.error('Error bootstrapping notifications', e);
        }
    }, 5000);
}
