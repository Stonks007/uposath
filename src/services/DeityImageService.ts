import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Mantra } from '../types/SatiTypes';
import { DEITY_IMAGE_MAP } from '../constants/DEITY_IMAGE_MAP';

// Static string reference to fallback image located in public/assets (or src depending on Vite alias)
// In Vite, src/assets imported directly gives a URL string. However we can use the relative path for simple resolving:
import fallbackImgUrl from '../assets/deities/generic-fallback.webp';

class DeityImageService {

    /**
     * Resolves the correct image source for a Mantra card or edit page view.
     */
    async getDeityImageSrc(mantra: Mantra): Promise<string> {
        const info = mantra.basic;

        if (info.deityImageType === 'user' && info.deityImagePath) {
            try {
                if (Capacitor.getPlatform() === 'web') {
                    // In browser, Filesystem uses IndexedDB. convertFileSrc won't work.
                    const file = await Filesystem.readFile({
                        directory: Directory.Data,
                        path: info.deityImagePath
                    });
                    return `data:image/webp;base64,${file.data}`;
                } else {
                    // If it's a user image we must serve it via capacitor local web server
                    const stat = await Filesystem.getUri({
                        directory: Directory.Data,
                        path: info.deityImagePath
                    });
                    return Capacitor.convertFileSrc(stat.uri);
                }
            } catch (error) {
                console.error(`Failed to resolve user image for mantra ${mantra.id}:`, error);
                // Fallthrough to fallback
            }
        }

        if (info.deityImageType === 'bundled') {
            const mappedPath = info.deityKey ? DEITY_IMAGE_MAP[info.deityKey] : DEITY_IMAGE_MAP['placeholder'];
            if (mappedPath) {
                return mappedPath;
            }
        }

        return fallbackImgUrl;
    }

    /**
     * Resets a mantra's image back to the bundled default and deletes the user image from storage.
     */
    async resetToDefaultImage(mantraId: string): Promise<void> {
        // We must import MantraService inside to avoid circular dependency
        const { MantraService } = await import('./MantraService');
        const mantras = await MantraService.getMantras();
        const mantra = mantras.find(m => m.id === mantraId);

        if (!mantra) throw new Error('Mantra not found');

        // Delete user file if it exists
        if (mantra.basic.deityImageType === 'user' && mantra.basic.deityImagePath) {
            try {
                await Filesystem.deleteFile({
                    directory: Directory.Data,
                    path: mantra.basic.deityImagePath
                });
            } catch (error) {
                console.warn('Could not delete old user image during reset:', error);
            }
        }

        mantra.basic.deityImageType = 'bundled';
        mantra.basic.deityImagePath = undefined;

        // Restore default key if it's a built-in mantra
        if (mantra.id === 'default_avalokitesvara') mantra.basic.deityKey = 'avalokitesvara';
        else if (mantra.id === 'default_tara') mantra.basic.deityKey = 'green-tara';
        else if (mantra.id === 'default_medicine_buddha') mantra.basic.deityKey = 'medicine-buddha';
        else mantra.basic.deityKey = undefined;

        await MantraService.updateMantra(mantra);
    }

    /**
     * Storage hygiene: Deletes any .jpg files in mantra-images that don't belong to any active mantra.
     */
    async cleanupOrphanedImages(): Promise<void> {
        try {
            const { MantraService } = await import('./MantraService');
            const mantras = await MantraService.getMantras();
            const activeImagePaths = new Set(
                mantras
                    .filter(m => m.basic.deityImageType === 'user' && m.basic.deityImagePath)
                    .map(m => m.basic.deityImagePath)
            );

            let hasDir = false;
            try {
                await Filesystem.readdir({ directory: Directory.Data, path: 'mantra-images' });
                hasDir = true;
            } catch (e) {
                return; // Directory doesn't exist yet
            }

            if (hasDir) {
                const result = await Filesystem.readdir({ directory: Directory.Data, path: 'mantra-images' });
                const files = result.files;

                for (const file of files) {
                    const fileName = typeof file === 'string' ? file : (file as any).name;
                    if (!fileName.endsWith('.webp') && !fileName.endsWith('.jpg')) continue;

                    const filePath = `mantra-images/${fileName}`;
                    if (!activeImagePaths.has(filePath)) {
                        console.log(`🧹 Deleting orphaned image: ${filePath}`);
                        try {
                            await Filesystem.deleteFile({
                                directory: Directory.Data,
                                path: filePath
                            });
                        } catch (delErr) {
                            console.warn(`Could not delete orphaned image ${filePath}:`, delErr);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to cleanup orphaned images:', error);
        }
    }
}

export const deityImageService = new DeityImageService();
