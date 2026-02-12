
import { describe, it } from 'vitest';
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

        debug(new Date('2026-02-17T12:00:00Z'), 'Losar check Feb 17');
        debug(new Date('2026-02-16T12:00:00Z'), 'Losar check Feb 16');
        debug(new Date('2026-01-26T12:00:00Z'), 'Bodhi Day check Jan 26');
        debug(new Date('2026-01-25T12:00:00Z'), 'Bodhi Day check Jan 25');

        fs.writeFileSync('debug_output.txt', output);
    });
});
