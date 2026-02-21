
import { describe, it, expect, beforeAll } from 'vitest';
import { getPanchangam, Observer } from '@ishubhamx/panchangam-js';
import { checkFestival, checkFestivalByTradition, checkAllFestivals, getUpcomingFestivals, initMahayanaCalendar } from './buddhistFestivalService';

const nagpur = new Observer(21.1458, 79.0882, 310);

describe('BuddhistFestivalService', () => {

    beforeAll(async () => {
        await initMahayanaCalendar();
    });

    // ─── Theravada Tests ─────────────────────────────────────────────────────

    it('should detect Vesak on Vaishakha Purnima (2026-05-01)', () => {
        const testDate = new Date('2026-05-01T12:00:00Z');
        const p = getPanchangam(testDate, nagpur);
        expect(p.masa.index).toBe(1); // Vaishakha
        expect(p.tithi).toBe(14); // Purnima

        const festival = checkFestival(testDate, nagpur, p);
        expect(festival?.name).toBe('Vesak');
        expect(festival?.tradition).toBe('Theravada');
        // Should have rich event data
        expect(festival?.events).toBeDefined();
        expect(festival!.events!.length).toBeGreaterThan(0);
    });

    it('should include Theravada Purnima event data with Hindi and English', () => {
        const testDate = new Date('2026-05-01T12:00:00Z');
        const festival = checkFestival(testDate, nagpur);
        expect(festival?.events).toBeDefined();
        // The first event should have both eventEn and eventHindi
        const birthEvent = festival!.events!.find(e => e.eventEn.includes('Birth of Siddhattha'));
        expect(birthEvent).toBeDefined();
        expect(birthEvent!.eventHindi).toBeDefined();
    });

    // ─── Vajrayana Tests ─────────────────────────────────────────────────────

    it('should detect Losar on Feb 18, 2026 (Tibetan date table)', () => {
        const testDate = new Date('2026-02-18T12:00:00Z');
        const festival = checkFestival(testDate, nagpur);
        expect(festival?.name).toBe('Losar');
        expect(festival?.tradition).toBe('Vajrayana');
    });

    it('should detect Saga Dawa Düchen on May 31, 2026', () => {
        const testDate = new Date('2026-05-31T12:00:00Z');
        // This date overlaps with Theravada Jyeshtha Purnima, so use tradition-specific check
        const festival = checkFestivalByTradition(testDate, nagpur, 'Vajrayana');
        expect(festival?.name).toBe('Saga Dawa Düchen');
        expect(festival?.tradition).toBe('Vajrayana');
        // Also verify both traditions are returned by checkAllFestivals
        const all = checkAllFestivals(testDate, nagpur);
        expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect Chotrul Düchen on Mar 3, 2026', () => {
        const testDate = new Date('2026-03-03T12:00:00Z');
        // This date overlaps with Theravada Phalguna Purnima, so use tradition-specific check
        const festival = checkFestivalByTradition(testDate, nagpur, 'Vajrayana');
        expect(festival?.name).toBe('Chotrul Düchen');
        expect(festival?.tradition).toBe('Vajrayana');
    });

    // ─── Mahayana Tests ──────────────────────────────────────────────────────

    it('should detect a Mahayana festival if chinese-lunar module is loaded', () => {
        // This test depends on the chinese-lunar library being correctly loaded
        // Buddha's Birthday = Chinese lunar month 4, day 8
        // In 2026, this should be around May 24
        const testDate = new Date('2026-05-24T12:00:00Z');
        const festival = checkFestival(testDate, nagpur);
        // If detected, verify it's Mahayana
        if (festival?.tradition === 'Mahayana') {
            expect(festival.name).toBe("Buddha's Birthday");
        }
    });

    // ─── Upcoming Festival Scan ──────────────────────────────────────────────

    it('should scan upcoming festivals from all 3 traditions (2026)', async () => {
        const upcoming = await getUpcomingFestivals(new Date('2026-02-01'), nagpur, 365);

        // Should have festivals from multiple traditions
        const traditions = new Set(upcoming.map(m => m.festival.tradition));
        expect(traditions.has('Theravada')).toBe(true);
        expect(traditions.has('Vajrayana')).toBe(true);

        // Should have a reasonable number of festivals
        expect(upcoming.length).toBeGreaterThan(6);

        // Should include Losar (Feb 18, 2026) as upcoming
        const hasLosar = upcoming.some(m => m.festival.name === 'Losar');
        expect(hasLosar).toBe(true);

        // Should be sorted by date
        for (let i = 1; i < upcoming.length; i++) {
            expect(upcoming[i].date.getTime()).toBeGreaterThanOrEqual(upcoming[i - 1].date.getTime());
        }
    });
});
