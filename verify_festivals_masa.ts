
import { Observer } from 'astronomy-engine';
import { getPanchangam } from '@ishubhamx/panchangam-js';
import { checkFestival, getUpcomingFestivals } from './src/services/buddhistFestivalService';

const nagpur = new Observer(21.1458, 79.0882, 310);

console.log('--- Buddhist Festival Verification (Indian Masa) ---');

// Test Case 1: Vesak 2026
// Expected: Vaishakha Purnima. In 2026, it should be around May 1.
const testDateVesak = new Date('2026-05-01T12:00:00Z');
const pVesak = getPanchangam(testDateVesak, nagpur);
console.log(`\nTesting Vesak 2026 approx date: ${testDateVesak.toDateString()}`);
console.log(`Masa: ${pVesak.masa.name} (Index: ${pVesak.masa.index}), Tithi: ${pVesak.tithi}`);
const fVesak = checkFestival(testDateVesak, nagpur, pVesak);
console.log(`Festival detected: ${fVesak?.name || 'None'}`);

// Test Case 2: Losar 2026
// Expected: Phalguna Amavasya. In 2026, it should be around Feb 17.
const testDateLosar = new Date('2026-02-17T12:00:00Z');
const pLosar = getPanchangam(testDateLosar, nagpur);
console.log(`\nTesting Losar 2026 approx date: ${testDateLosar.toDateString()}`);
console.log(`Masa: ${pLosar.masa.name} (Index: ${pLosar.masa.index}), Tithi: ${pLosar.tithi}`);
const fLosar = checkFestival(testDateLosar, nagpur, pLosar);
console.log(`Festival detected: ${fLosar?.name || 'None'}`);

// Test Case 3: Bodhi Day
// Expected: Pausa 8. 
const testDateBodhi = new Date('2026-01-26T12:00:00Z');
const pBodhi = getPanchangam(testDateBodhi, nagpur);
console.log(`\nTesting Bodhi Day 2026: ${testDateBodhi.toDateString()}`);
console.log(`Masa: ${pBodhi.masa.name} (Index: ${pBodhi.masa.index}), Tithi: ${pBodhi.tithi}`);
const fBodhi = checkFestival(testDateBodhi, nagpur, pBodhi);
console.log(`Festival detected: ${fBodhi?.name || 'None'}`);

// Test Case 4: Monlam (A range)
// Expected: Magha 4-25. 
const testDateMonlam = new Date('2026-01-22T12:00:00Z');
const pMonlam = getPanchangam(testDateMonlam, nagpur);
console.log(`\nTesting Monlam 2026: ${testDateMonlam.toDateString()}`);
console.log(`Masa: ${pMonlam.masa.name} (Index: ${pMonlam.masa.index}), Tithi: ${pMonlam.tithi}`);
const fMonlam = checkFestival(testDateMonlam, nagpur, pMonlam);
console.log(`Festival detected: ${fMonlam?.name || 'None'}`);

console.log('\n--- Upcoming Festivals Scan ---');
const upcoming = getUpcomingFestivals(new Date('2026-02-12'), nagpur, 90);
upcoming.forEach(match => {
    console.log(`${match.date.toDateString()}: ${match.festival.name} (${match.daysRemaining} days)`);
});
