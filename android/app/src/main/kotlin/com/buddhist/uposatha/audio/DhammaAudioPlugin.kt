
package com.buddhist.uposatha.audio

import android.util.Log
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

@CapacitorPlugin(name = "DhammaAudio")
class DhammaAudioPlugin : Plugin() {
    private lateinit var playerManager: AudioPlayerManager
    private val youtube = YouTubeService()
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    @PluginMethod
    fun search(call: PluginCall) {
        val query = call.getString("query") ?: return call.reject("Missing query")
        scope.launch {
            youtube.search(query).onSuccess { items ->
                val ret = JSArray()
                items.forEach { video ->
                    ret.put(JSObject().apply {
                        put("id", video.videoId)
                        put("title", video.title)
                        put("channelName", video.channelName)
                        put("channelId", video.channelId)
                        put("duration", video.duration)
                        put("thumbnailUrl", video.thumbnailUrl)
                    })
                }
                call.resolve(JSObject().apply {
                    put("videos", ret)
                    put("hasMore", false) // Simplified for now
                })
            }.onFailure { call.reject(it.message) }
        }
    }

    override fun load() {
        super.load()
        Log.d("DhammaAudio", "DhammaAudio plugin loaded")
        playerManager = AudioPlayerManager(context)
        observePlaybackState()
    }

    private fun observePlaybackState() {
        playerManager.playbackState
            .onEach { state ->
                val ret = JSObject().apply {
                    put("state", state.state.name)
                    put("position", state.position / 1000)
                    put("duration", state.duration / 1000)
                    state.currentVideo?.let { video ->
                        put("currentVideo", JSObject().apply {
                            put("id", video.videoId)
                            put("title", video.title)
                        })
                    }
                }
                notifyListeners("playbackStateChanged", ret)
                notifyListeners("positionChanged", JSObject().apply {
                    put("position", state.position / 1000)
                    put("duration", state.duration / 1000)
                })
            }
            .launchIn(scope)
    }

    @PluginMethod
    fun getChannelVideos(call: PluginCall) {
        val channelId = call.getString("channelId") ?: return call.reject("Missing channelId")
        val continuation = call.getString("continuation")
        scope.launch {
            youtube.getChannelVideos(channelId, continuation).onSuccess { result ->
                val videos = JSArray()
                result.videos.forEach { video ->
                    videos.put(JSObject().apply {
                        put("id", video.videoId)
                        put("title", video.title)
                        put("channelName", video.channelName)
                        put("channelId", video.channelId)
                        put("duration", video.duration)
                        put("thumbnailUrl", video.thumbnailUrl)
                        put("uploadDate", video.uploadDate)
                        put("viewCount", video.viewCount)
                    })
                }
                call.resolve(JSObject().apply {
                    put("videos", videos)
                    put("hasMore", result.continuation != null)
                    put("continuation", result.continuation)
                })
            }.onFailure { call.reject(it.message) }
        }
    }

    @PluginMethod
    fun playVideo(call: PluginCall) {
        val videoId = call.getString("videoId") ?: return call.reject("Missing videoId")
        val startPosition = call.getLong("startPosition") ?: 0L
        
        scope.launch {
            youtube.getAudioStream(videoId).onSuccess { url ->
                playerManager.play(videoId, startPosition * 1000, url) // Assuming play takes url now?
                call.resolve()
            }.onFailure { call.reject(it.message) }
        }
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        playerManager.pause()
        call.resolve()
    }

    @PluginMethod
    fun resume(call: PluginCall) {
        playerManager.resume()
        call.resolve()
    }

    @PluginMethod
    fun seekTo(call: PluginCall) {
        val position = call.getLong("position") ?: return call.reject("Missing position")
        playerManager.seekTo(position * 1000)
        call.resolve()
    }

    @PluginMethod
    fun setPlaybackSpeed(call: PluginCall) {
        val speed = call.getFloat("speed") ?: return call.reject("Missing speed")
        playerManager.setSpeed(speed)
        call.resolve()
    }

    @PluginMethod
    fun getPlayerState(call: PluginCall) {
        val state = playerManager.getPlayerState()
        call.resolve(JSObject().apply {
            put("state", state.state.name)
            put("position", state.position / 1000)
            put("duration", state.duration / 1000)
            put("speed", state.speed)
        })
    }
}
