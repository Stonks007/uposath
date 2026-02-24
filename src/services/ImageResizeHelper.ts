export const ImageResizeHelper = {
    /**
     * Resizes a base64 image string to fit within maxWidth and maxHeight
     * using pure HTML Canvas API. Returns a base64 JPEG string.
     */
    resizeImage: (base64Str: string, maxWidth: number = 256, maxHeight: number = 256): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate scaling maintaining aspect ratio for center crop
                const scale = Math.max(maxWidth / width, maxHeight / height);
                width = width * scale;
                height = height * scale;

                canvas.width = maxWidth;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // Set fixed size
                canvas.width = maxWidth;
                canvas.height = maxHeight;

                // Center crop
                const offsetX = (width - maxWidth) / 2;
                const offsetY = (height - maxHeight) / 2;

                // Draw solid background to avoid transparent-to-black convert issues
                ctx.fillStyle = '#1a1a1a'; // matches app dark mode
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, -offsetX, -offsetY, width, height);

                // Export to high-quality low-filesize webp
                const resizedBase64 = canvas.toDataURL('image/webp', 0.85);
                resolve(resizedBase64);
            };
            img.onerror = () => reject(new Error('Failed to load image for resizing'));

            // Check if string contains data: prefix
            if (!base64Str.startsWith('data:')) {
                // Determine mime type roughly
                const isPng = base64Str.startsWith('iVBORw0KGgo');
                const isJpg = base64Str.startsWith('/9j/');
                const mime = isPng ? 'image/png' : (isJpg ? 'image/jpeg' : 'image/jpeg');
                img.src = `data:${mime};base64,${base64Str}`;
            } else {
                img.src = base64Str;
            }
        });
    }
};
