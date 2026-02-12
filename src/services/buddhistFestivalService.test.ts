
import { describe, it, expect } from 'vitest';
import { getPanchangam, Observer } from '@ishubhamx/panchangam-js';
import { checkFestival, getUpcomingFestivals } from './buddhistFestivalService';

const nagpur = new Observer(21.1458, 79.0882, 310);

describe('BuddhistFestivalService', () => {
    it('should detect Vesak on Vaishakha Purnima (2026-05-01)', () => {
        const testDate = new Date('2026-05-01T12:00:00Z');
        const p = getPanchangam(testDate, nagpur);
        expect(p.masa.index).toBe(1); // Vaishakha
        expect(p.tithi).toBe(14); // Purnima

        const festival = checkFestival(testDate, nagpur, p);
        expect(festival?.name).toBe('Vesak');
        expect(festival?.tradition).toBe('Theravada');
    });

    it('should detect Losar on Phalguna Amavasya (2026-03-19 approx)', () => {
        // Based on debug, Feb 17 was Magha 29. Next Amavasya should be Phalguna.
        const testDate = new Date('2026-03-19T12:00:00Z');
        const p = getPanchangam(testDate, nagpur);
        expect(p.masa.index).toBe(11); // Phalguna
        expect(p.tithi).toBe(29); // Amavasya

        const festival = checkFestival(testDate, nagpur, p);
        expect(festival?.name).toBe('Losar');
        expect(festival?.tradition).toBe('Vajrayana');
    });

    it('should detect Bodhi Day on Pausa 8 (2025-12-28 approx)', () => {
        // Pausa is index 9. Tithi 8 is index 7.
        const testDate = new Date('2025-12-28T12:00:00Z');
        const p = getPanchangam(testDate, nagpur);
        expect(p.masa.index).toBe(9); // Pausa
        expect(p.tithi).toBe(7);

        const festival = checkFestival(testDate, nagpur, p);
        expect(festival?.name).toBe('Bodhi Day');
        expect(festival?.tradition).toBe('Mahayana');
    });

    it('should detect Monlam on Magha 4 (2026-01-22 approx)', () => {
        // Magha is index 10. Tithi 4 is index 3.
        const testDate = new Date('2026-01-22T12:00:00Z');
        const p = getPanchangam(testDate, nagpur);
        expect(p.masa.index).toBe(10); // Magha
        expect(p.tithi).toBe(3);

        const festival = checkFestival(testDate, nagpur, p);
        expect(festival?.name).toBe('Monlam Chenmo');
    });

    it('should scan upcoming festivals correctly', () => {
        const upcoming = getUpcomingFestivals(new Date('2026-02-12'), nagpur, 40);
        // Within 40 days of Feb 12:
        // Magha Purnima (Feb 1 approx) - passed
        // Chotrul Duchen (Magha Purnima) - 
        // Phalguna Amavasya (Losar) - March 18. This is ~34 days away.
        const hasLosar = upcoming.some(m => m.festival.name === 'Losar');
        expect(hasLosar).toBe(true);
    });
});
