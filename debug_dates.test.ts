
import { describe, it, expect } from 'vitest';
import { Observer, getPanchangam } from '@ishubhamx/panchangam-js';
import * as fs from 'fs';

const nagpur = new Observer(21.1458, 79.0882, 310);

describe('Festival Dates Debug', () => {
    it('debug dates', () => {
        let output = '';
        function debug(date: Date, label: string) {
            const p = getPanchangam(date, nagpur);
            output += `\n[${label}] Date: ${date.toDateString()}\n`;
            output += `Masa: ${p.masa.name} (Index: ${p.masa.index})\n`;
            output += `Tithi: ${p.tithi} (Name: ${p.tithiName})\n`;
        }

        debug(new Date('2026-01-26T12:00:00Z'), 'Bodhi Day check Jan 26');
        debug(new Date('2026-01-25T12:00:00Z'), 'Bodhi Day check Jan 25');

        fs.writeFileSync('debug_output.txt', output);
    });

    it('should correctly handle Consecutive Ashtami (Vridhi) for Feb 9-10, 2026', () => {
        const observer = new Observer(24.7914, 85.0002, 111);
        const getUposathaStatus = require('./src/services/uposathaCalculator').getUposathaStatus;

        // Feb 9 Should be Standard Uposatha
        const feb9 = new Date(2026, 1, 9, 12, 0, 0);
        const s9 = getUposathaStatus(feb9, observer);
        expect(s9.isUposatha).toBe(true);
        expect(s9.isOptional).toBe(false);

        // Feb 10 Should be Optional (Vridhi/Extended)
        const feb10 = new Date(2026, 1, 10, 12, 0, 0);
        const s10 = getUposathaStatus(feb10, observer);
        expect(s10.isUposatha).toBe(false);
        expect(s10.isOptional).toBe(true);
        expect(s10.isVridhi).toBe(true);
    });
});
