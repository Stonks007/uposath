package com.buddhist.uposatha.audio

import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.common.util.UnstableApi
import android.media.audiofx.LoudnessEnhancer
import com.buddhist.uposatha.MainActivity

class AudioPlayerService : MediaSessionService() {
    private var player: ExoPlayer? = null
    private var mediaSession: MediaSession? = null
    private var loudnessEnhancer: LoudnessEnhancer? = null

    companion object {
        private const val TAG = "AudioPlayerService"
        private const val CHANNEL_ID = "uposatha_audio_channel"
        private const val NOTIFICATION_ID = 1001
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "onCreate: Initializing ExoPlayer and MediaSession")

        player = ExoPlayer.Builder(this)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
                    .setUsage(C.USAGE_MEDIA)
                    .build(),
                true
            )
            .setHandleAudioBecomingNoisy(true)
            .build()

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        mediaSession = MediaSession.Builder(this, player!!)
            .setSessionActivity(pendingIntent)
            .build()

        player?.addListener(object : Player.Listener {
            @androidx.annotation.OptIn(UnstableApi::class)
            override fun onPlaybackStateChanged(playbackState: Int) {
                Log.d(TAG, "onPlaybackStateChanged: $playbackState")
                if (playbackState == Player.STATE_READY && player?.playWhenReady == true) {
                    startForegroundWithNotification()
                    if (loudnessEnhancer == null) {
                        try {
                            val audioSessionId = player?.audioSessionId ?: C.AUDIO_SESSION_ID_UNSET
                            if (audioSessionId != C.AUDIO_SESSION_ID_UNSET) {
                                loudnessEnhancer = LoudnessEnhancer(audioSessionId).apply {
                                    setTargetGain(1000) // 10dB boost
                                    enabled = true
                                }
                                Log.d(TAG, "LoudnessEnhancer enabled for session: $audioSessionId")
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to initialize LoudnessEnhancer", e)
                        }
                    }
                } else if (playbackState == Player.STATE_IDLE || playbackState == Player.STATE_ENDED) {
                    stopForeground(STOP_FOREGROUND_DETACH)
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                Log.e(TAG, "onPlayerError: code=${PlaybackException.getErrorCodeName(error.errorCode)} (${error.errorCode})", error)
            }
        })
    }

    private fun startForegroundWithNotification() {
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Dhamma Talk")
            .setContentText("Playing audio...")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)

        startForeground(NOTIFICATION_ID, builder.build())
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = mediaSession

    override fun onDestroy() {
        Log.d(TAG, "onDestroy: Releasing resources")
        player?.release()
        player = null
        mediaSession?.release()
        mediaSession = null
        loudnessEnhancer?.release()
        loudnessEnhancer = null
        super.onDestroy()
    }
}
