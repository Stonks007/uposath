package com.buddhist.uposatha.audio

import android.content.ComponentName
import android.content.Context
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.getcapacitor.Plugin
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
class AudioPlayerManager(private val context: Context) {
    private var mediaController: MediaController? = null
    private val scope = CoroutineScope(Dispatchers.Main + Job())
    private val controllerDeferred = CompletableDeferred<MediaController>()
    
    private val _playbackState = MutableStateFlow(PlaybackState(PlayerState.IDLE))
    val playbackState = _playbackState.asStateFlow()

    private var positionUpdateJob: Job? = null

    init {
        initializeMediaController()
    }

    private fun initializeMediaController() {
        scope.launch {
            withContext(Dispatchers.Main) {
                Log.d("AudioPlayerManager", "Initializing MediaController on main thread")
                val sessionToken = SessionToken(context, ComponentName(context, AudioPlayerService::class.java))
                val controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
                controllerFuture.addListener({
                    try {
                        val controller = controllerFuture.get()
                        Log.d("AudioPlayerManager", "MediaController initialized successfully")
                        mediaController = controller
                        controllerDeferred.complete(controller)
                        setupListeners()
                    } catch (e: Exception) {
                        Log.e("AudioPlayerManager", "Failed to get MediaController", e)
                        controllerDeferred.completeExceptionally(e)
                    }
                }, ContextCompat.getMainExecutor(context))
            }
        }
    }

    private fun setupListeners() {
        mediaController?.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                Log.d("AudioPlayerManager", "onPlaybackStateChanged: $state")
                updateState()
            }

            override fun onIsPlayingChanged(isPlaying: Boolean) {
                Log.d("AudioPlayerManager", "onIsPlayingChanged: $isPlaying")
                updateState()
                if (isPlaying) startPositionUpdates() else stopPositionUpdates()
            }

            override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                Log.e("AudioPlayerManager", "onPlayerError: ${error.message}", error)
                updateState()
            }
        })
    }

    private fun updateState() {
        if (System.currentTimeMillis() - lastSeekTime < 2000) return // Skip updates shortly after seek

        val controller = mediaController ?: return
        val playbackState = controller.playbackState
        val playWhenReady = controller.playWhenReady
        
        val state = if (controller.playerError != null) {
            PlayerState.ERROR
        } else when (playbackState) {
            Player.STATE_IDLE -> PlayerState.IDLE
            Player.STATE_BUFFERING -> PlayerState.LOADING
            Player.STATE_READY -> if (playWhenReady) PlayerState.PLAYING else PlayerState.PAUSED
            Player.STATE_ENDED -> PlayerState.ENDED
            else -> PlayerState.IDLE
        }
        
        // Sanitize duration: if unknown (C.TIME_UNSET), report as 0
        val duration = if (controller.duration == C.TIME_UNSET) 0L else controller.duration
        
        _playbackState.value = _playbackState.value.copy(
            state = state,
            position = controller.currentPosition,
            duration = duration,
            speed = controller.playbackParameters.speed
        )
        
        // Reduced frequency logging
        if (state != PlayerState.IDLE) {
            Log.d("AudioPlayerManager", "State update: state=$state, duration=$duration, pos=${controller.currentPosition}")
        }
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
    
    fun prepare(video: VideoInfo) {
        _playbackState.value = _playbackState.value.copy(
            state = PlayerState.LOADING,
            currentVideo = video,
            position = 0,
            duration = 0
        )
    }

    fun play(video: VideoInfo, startPosition: Long = 0, url: String) {
        Log.d("AudioPlayerManager", "play() called for videoId=${video.videoId}, url=$url")
        scope.launch {
            _playbackState.value = _playbackState.value.copy(
                state = PlayerState.LOADING,
                currentVideo = video
            )
            try {
                val controller = mediaController ?: controllerDeferred.await()
                withContext(Dispatchers.Main) {
                    Log.d("AudioPlayerManager", "Setting media items and starting playback")
                    val mediaItem = MediaItem.Builder()
                        .setUri(url)
                        .setMediaId(video.videoId)
                        .build()
                    controller.setMediaItem(mediaItem)
                    if (startPosition > 0) {
                        lastSeekTime = System.currentTimeMillis()
                        controller.seekTo(startPosition)
                    }
                    controller.prepare()
                    controller.play()
                }
            } catch (e: Exception) {
                Log.e("AudioPlayerManager", "Error during play", e)
                _playbackState.value = _playbackState.value.copy(state = PlayerState.ERROR)
            }
        }
    }

    fun pause() {
        scope.launch {
            withContext(Dispatchers.Main) {
                mediaController?.pause()
            }
        }
    }

    fun resume() {
        scope.launch {
            withContext(Dispatchers.Main) {
                val controller = mediaController ?: return@withContext
                if (controller.playbackState == Player.STATE_ENDED) {
                    controller.seekTo(0)
                }
                controller.play()
            }
        }
    }

    private var lastSeekTime = 0L

    fun seekTo(positionMs: Long) {
        lastSeekTime = System.currentTimeMillis()
        // Optimistically update the state to prevent snapping back
        _playbackState.value = _playbackState.value.copy(position = positionMs)
        
        scope.launch {
            withContext(Dispatchers.Main) {
                mediaController?.seekTo(positionMs)
            }
        }
    }

    fun setSpeed(speed: Float) {
        scope.launch {
            withContext(Dispatchers.Main) {
                mediaController?.setPlaybackSpeed(speed)
            }
        }
    }
    
    fun getPlayerState(): PlaybackState = _playbackState.value
}
