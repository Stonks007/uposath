package com.buddhist.uposatha.audio

import android.content.ComponentName
import android.content.Context
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.getcapacitor.Plugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AudioPlayerManager(private val context: Context) {
    private var mediaController: MediaController? = null
    private val scope = CoroutineScope(Dispatchers.Main + Job())
    
    private val _playbackState = MutableStateFlow(PlaybackState(PlayerState.IDLE))
    val playbackState = _playbackState.asStateFlow()

    private var positionUpdateJob: Job? = null

    init {
        initializeMediaController()
    }

    private fun initializeMediaController() {
        val sessionToken = SessionToken(context, ComponentName(context, AudioPlayerService::class.java))
        val controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
        controllerFuture.addListener({
            mediaController = controllerFuture.get()
            setupListeners()
        }, ContextCompat.getMainExecutor(context))
    }

    private fun setupListeners() {
        mediaController?.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                updateState()
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                updateState()
                if (isPlaying) startPositionUpdates() else stopPositionUpdates()
            }
        })
    }

    private fun updateState() {
        val controller = mediaController ?: return
        val state = when (controller.playbackState) {
            Player.STATE_IDLE -> PlayerState.IDLE
            Player.STATE_BUFFERING -> PlayerState.LOADING
            Player.STATE_READY -> if (controller.isPlaying) PlayerState.PLAYING else PlayerState.PAUSED
            Player.STATE_ENDED -> PlayerState.ENDED
            else -> PlayerState.IDLE
        }
        
        _playbackState.value = _playbackState.value.copy(
            state = state,
            position = controller.currentPosition,
            duration = controller.duration,
            speed = controller.playbackParameters.speed
        )
    }

    private fun startPositionUpdates() {
        positionUpdateJob?.cancel()
        positionUpdateJob = scope.launch {
            while (true) {
                updateState()
                delay(1000)
            }
        }
    }

    private fun stopPositionUpdates() {
        positionUpdateJob?.cancel()
    }

    fun play(videoId: String, startPosition: Long = 0, url: String) {
        scope.launch {
            _playbackState.value = _playbackState.value.copy(state = PlayerState.LOADING)
            withContext(Dispatchers.Main) {
                val controller = mediaController ?: return@withContext
                val mediaItem = MediaItem.Builder()
                    .setUri(url)
                    .setMediaId(videoId)
                    .build()
                controller.setMediaItem(mediaItem)
                if (startPosition > 0) controller.seekTo(startPosition)
                controller.prepare()
                controller.play()
            }
        }
    }

    fun pause() {
        mediaController?.pause()
    }

    fun resume() {
        mediaController?.play()
    }

    fun seekTo(positionMs: Long) {
        mediaController?.seekTo(positionMs)
    }

    fun setSpeed(speed: Float) {
        mediaController?.setPlaybackSpeed(speed)
    }
    
    fun getPlayerState(): PlaybackState = _playbackState.value
}
