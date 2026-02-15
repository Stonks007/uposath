import { registerPlugin } from '@capacitor/core';
import type { DhammaAudioPlugin } from './definitions';

const DhammaAudio = registerPlugin<DhammaAudioPlugin>('DhammaAudio', {
    web: () => import('./web').then(m => new m.DhammaAudioWeb()),
});

export * from './definitions';
export { DhammaAudio };
