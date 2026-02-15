package com.buddhist.uposatha.plugins.dhammaaudio;

import android.content.ComponentName;
import android.content.Context;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;
import com.buddhist.uposatha.audio.AudioPlayerService;
import com.buddhist.uposatha.audio.NewPipeExtractorService;
import com.buddhist.uposatha.db.UposathaAudioDatabase;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.MoreExecutors;

import org.schabi.newpipe.extractor.channel.ChannelInfo;
import org.schabi.newpipe.extractor.stream.StreamInfoItem;

import java.util.List;
import java.util.concurrent.ExecutionException;

@CapacitorPlugin(name = "DhammaAudio")
public class DhammaAudioPlugin extends Plugin {

    private MediaController mediaController;
    private ListenableFuture<MediaController> controllerFuture;

    @Override
    public void load() {
        super.load();
        initializeMediaController();
    }

    private void initializeMediaController() {
        Context context = getContext();
        SessionToken sessionToken = new SessionToken(context, new ComponentName(context, AudioPlayerService.class));
        controllerFuture = new MediaController.Builder(context, sessionToken).buildAsync();
        controllerFuture.addListener(() -> {
            try {
                mediaController = controllerFuture.get();
                // Setup listeners for playback state changes to notify Ionic
            } catch (ExecutionException | InterruptedException e) {
                e.printStackTrace();
            }
        }, MoreExecutors.directExecutor());
    }

    @PluginMethod
    public void getChannelVideos(PluginCall call) {
        String channelUrl = call.getString("channelId"); // In this impl, we use URL or ID
        if (channelUrl == null) {
            call.reject("channelId is required");
            return;
        }

        NewPipeExtractorService.getInstance().getChannelVideos(channelUrl, new NewPipeExtractorService.Callback<List<StreamInfoItem>>() {
            @Override
            public void onSuccess(List<StreamInfoItem> result) {
                JSObject ret = new JSObject();
                // Map result to JSObject array
                call.resolve(ret);
            }

            @Override
            public void onError(Exception e) {
                call.reject(e.getMessage());
            }
        });
    }

    @PluginMethod
    public void playVideo(PluginCall call) {
        String videoId = call.getString("videoId");
        if (videoId == null) {
            call.reject("videoId is required");
            return;
        }

        if (mediaController != null) {
            // In a real impl, we'd get the stream URL first using NewPipe
            // Then create a MediaItem and play
            // mediaController.setMediaItem(MediaItem.fromUri(streamUrl));
            // mediaController.prepare();
            // mediaController.play();
            call.resolve();
        } else {
            call.reject("MediaController not initialized");
        }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (mediaController != null) {
            mediaController.pause();
            call.resolve();
        } else {
            call.reject("MediaController not initialized");
        }
    }

    @PluginMethod
    public void resume(PluginCall call) {
        if (mediaController != null) {
            mediaController.play();
            call.resolve();
        } else {
            call.reject("MediaController not initialized");
        }
    }
}
