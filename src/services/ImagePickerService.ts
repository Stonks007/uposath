import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ImageResizeHelper } from './ImageResizeHelper';

class ImagePickerService {

    async pickAndSaveDeityImage(mantraId: string, oldPath?: string): Promise<string | null> {
        try {
            // Pick image from gallery
            const image = await Camera.pickImages({
                limit: 1
            });

            if (!image.photos || image.photos.length === 0) {
                return null; // User cancelled
            }

            const nativeUrl = image.photos[0].path || image.photos[0].webPath;
            if (!nativeUrl) return null;

            // Optional: for web environment we might just get a blob URL from webPath
            // If it's capacitor, path gets populated. Let's handle both.
            let base64Data: string;

            if (Capacitor.getPlatform() === 'web') {
                // In Web mode, Capacitor returns a blob URL in webPath. Read it using fetch.
                const response = await fetch(nativeUrl);
                const blob = await response.blob();
                base64Data = await this.blobToBase64(blob);
                base64Data = base64Data.split(',')[1] || base64Data;
            } else {
                try {
                    // Try reading real native path via Filesystem (Android/iOS)
                    const file = await Filesystem.readFile({
                        path: nativeUrl
                    });
                    base64Data = typeof file.data === 'string' ? file.data : await this.blobToBase64(file.data);
                } catch (e) {
                    // Fallback just in case
                    const response = await fetch(nativeUrl);
                    const blob = await response.blob();
                    base64Data = await this.blobToBase64(blob);
                    base64Data = base64Data.split(',')[1] || base64Data;
                }
            }

            // Resize image to 256x256 webp
            const resizedBase64Url = await ImageResizeHelper.resizeImage(base64Data, 256, 256);
            // Extract pure base64 without mime prefix for Capacitor writing
            const pureBase64 = resizedBase64Url.split(',')[1];

            const newFilename = `mantra-images/${mantraId}.webp`;

            // Delete old user image if exists
            if (oldPath) {
                try {
                    await Filesystem.deleteFile({
                        directory: Directory.Data,
                        path: oldPath
                    });
                } catch (err) {
                    console.warn('Failed old image deletion, might not exist:', err);
                }
            }

            // Ensure directory exists
            try {
                await Filesystem.mkdir({
                    directory: Directory.Data,
                    path: 'mantra-images',
                    recursive: true
                });
            } catch (e) {
                // Ignore if it already exists
            }

            // Save new image
            await Filesystem.writeFile({
                directory: Directory.Data,
                path: newFilename,
                data: pureBase64
            });

            return newFilename;

        } catch (error) {
            console.error('Error picking/saving deity image:', error);
            throw error;
        }
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

export const imagePickerService = new ImagePickerService();
