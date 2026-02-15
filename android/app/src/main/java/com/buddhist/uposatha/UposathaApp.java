package com.buddhist.uposatha;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import com.buddhist.uposatha.audio.NewPipeExtractorService;
import org.schabi.newpipe.extractor.NewPipe;
import org.schabi.newpipe.extractor.downloader.Downloader;
// import org.schabi.newpipe.extractor.downloader.RequieredDownloader; // Typo in NewPipe?

public class UposathaApp extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        // Initialize NewPipeExtractor
        NewPipeExtractorService.getInstance().initialize(this);

        // Create Notification Channel for Audio
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "uposatha_audio",
                "Dhamma Audio Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background audio playback foreground service");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
