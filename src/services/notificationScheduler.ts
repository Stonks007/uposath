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
import { type Observer } from 'astronomy-engine';
import { getUpcomingFestivals } from './buddhistFestivalService';
import { getMonthUposathaDays } from './uposathaCalculator';

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

    // Iterate next 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date(currentYear, currentMonth + i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();

        const uposathaDays = getMonthUposathaDays(year, month, observer);

        for (const { date: uDate, status } of uposathaDays) {
            if (status.isUposatha) {
                // Previous Day 18:00
                const prevDay = new Date(uDate);
                prevDay.setDate(prevDay.getDate() - 1);
                prevDay.setHours(18, 0, 0, 0);

                await scheduleNotification(
                    getNotificationId(uDate, 1),
                    'Uposatha Tomorrow',
                    `Prepare for ${status.label}.`,
                    prevDay
                );

                // Morning Of 05:00
                const morningOf = new Date(uDate);
                morningOf.setHours(5, 0, 0, 0);

                await scheduleNotification(
                    getNotificationId(uDate, 2),
                    'Uposatha Today',
                    `Today is ${status.label}.`,
                    morningOf
                );
            }
        }
    }
}

export async function scheduleFestivalNotifications(observer: Observer) {
    const now = new Date();
    // 3. Schedule Festival reminders
    // Scan next 365 days
    const upcomingFestivals = getUpcomingFestivals(now, observer, 365);

    for (const { date: fDate, festival } of upcomingFestivals) {
        // 3 days before
        const reminderDate = new Date(fDate);
        reminderDate.setDate(reminderDate.getDate() - 3);
        reminderDate.setHours(9, 0, 0, 0);

        await scheduleNotification(
            getNotificationId(fDate, 3),
            `Upcoming Festival: ${festival.name}`,
            `${festival.name} is in 3 days.`,
            reminderDate
        );
    }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications() {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
    }
}
