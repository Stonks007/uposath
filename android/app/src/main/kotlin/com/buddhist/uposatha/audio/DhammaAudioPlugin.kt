
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
        Log.d("DhammaAudio", "Plugin Search called for query: $query")
        scope.launch {
            youtube.search(query).onSuccess { items: List<VideoInfo> ->
                val ret = JSArray()
                items.forEach { video: VideoInfo ->
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
                            put("channelName", video.channelName)
                            put("channelId", video.channelId)
                            put("thumbnailUrl", video.thumbnailUrl)
                        })
                    }
                }
                notifyListeners("playbackStateChanged", ret)
                notifyListeners("progressUpdate", JSObject().apply {
                    put("position", state.position)
                    put("duration", state.duration)
                })
            }
            .launchIn(scope)
    }

    @PluginMethod
    fun getChannelVideos(call: PluginCall) {
        val channelId = call.getString("channelId") ?: return call.reject("Missing channelId")
        val continuation = call.getString("continuation")
        Log.d("DhammaAudio", "Plugin getChannelVideos called for channelId: $channelId, continuation: $continuation")
        scope.launch {
            youtube.getChannelVideos(channelId, continuation).onSuccess { result: ChannelVideosResult ->
                val videos = JSArray()
                result.videos.forEach { video: VideoInfo ->
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
        val videoObj = call.getObject("video") ?: return call.reject("Missing video object")
        Log.d("DhammaAudio", "Plugin playVideo called: $videoObj")
        val videoId = videoObj.getString("id") ?: return call.reject("Missing video id")
        val title = videoObj.getString("title") ?: ""
        val channelName = videoObj.getString("channelName") ?: ""
        val channelId = videoObj.getString("channelId") ?: ""
        val duration = videoObj.getString("duration") ?: "0"
        val thumbnailUrl = videoObj.getString("thumbnailUrl") ?: ""
        
        val videoIn = VideoInfo(
            videoId = videoId,
            title = title,
            channelName = channelName,
            channelId = channelId,
            duration = duration,
            thumbnailUrl = thumbnailUrl
        )

        val startPosition = call.getLong("startPosition") ?: 0L
        
        playerManager.prepare(videoIn)
        playerManager.play(videoIn, startPosition, "urn:youtube:$videoId")
        call.resolve()
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
        playerManager.seekTo(position)
        call.resolve()
    }

    @PluginMethod
    fun setPlaybackSpeed(call: PluginCall) {
        val speed = call.getFloat("speed") ?: return call.reject("Missing speed")
        playerManager.setSpeed(speed)
        call.resolve()
    }

    @PluginMethod
    fun getPlaybackState(call: PluginCall) {
        val state = playerManager.getPlayerState()
        call.resolve(JSObject().apply {
            put("isPlaying", state.state == PlayerState.PLAYING)
            put("isPaused", state.state == PlayerState.PAUSED)
            put("position", state.position)
            put("duration", state.duration)
            state.currentVideo?.let { video ->
                put("currentVideo", JSObject().apply {
                    put("id", video.videoId)
                    put("title", video.title)
                    put("channelName", video.channelName)
                    put("channelId", video.channelId)
                    put("thumbnailUrl", video.thumbnailUrl)
                })
            }
            put("queue", JSArray()) // Simplified for now
            put("currentIndex", 0)
        })
    }

    @PluginMethod
    fun resolveChannelUrl(call: PluginCall) {
        val url = call.getString("url") ?: return call.reject("Missing url")
        Log.d("DhammaAudio", "resolveChannelUrl called for: $url")
        scope.launch {
            youtube.resolveChannel(url).onSuccess { channel ->
                call.resolve(JSObject().apply {
                    put("id", channel.channelId)
                    put("name", channel.name)
                    put("avatarUrl", channel.avatarUrl)
                })
            }.onFailure { call.reject(it.message) }
        }
    }

    @PluginMethod
    fun getChannelPage(call: PluginCall) {
        val channelId = call.getString("channelId") ?: return call.reject("Missing channelId")
        Log.d("DhammaAudio", "getChannelPage called for: $channelId")
        scope.launch {
            youtube.getChannelPage(channelId).onSuccess { result ->
                val sectionsArr = JSArray()
                result.sections.forEach { section ->
                    val videosArr = JSArray()
                    section.items.forEach { video ->
                        videosArr.put(JSObject().apply {
                            put("id", video.videoId)
                            put("title", video.title)
                            put("channelName", video.channelName)
                            put("channelId", video.channelId)
                            put("duration", video.duration)
                            put("thumbnailUrl", video.thumbnailUrl)
                        })
                    }
                    sectionsArr.put(JSObject().apply {
                        put("title", section.title)
                        put("videos", videosArr)
                        put("continuation", section.continuation)
                        put("browseId", section.browseId)
                        put("params", section.params)
                    })
                }
                call.resolve(JSObject().apply {
                    put("channelName", result.channelName)
                    put("channelAvatar", result.channelAvatar)
                    put("sections", sectionsArr)
                })
            }.onFailure { call.reject(it.message) }
        }
    }

    @PluginMethod
    fun getPlaylistVideos(call: PluginCall) {
        val playlistId = call.getString("playlistId") ?: return call.reject("Missing playlistId")
        Log.d("DhammaAudio", "getPlaylistVideos called for: $playlistId")
        scope.launch {
            youtube.getPlaylistVideos(playlistId).onSuccess { videos ->
                val arr = JSArray()
                videos.forEach { video ->
                    arr.put(JSObject().apply {
                        put("id", video.videoId)
                        put("title", video.title)
                        put("channelName", video.channelName)
                        put("channelId", video.channelId)
                        put("duration", video.duration)
                        put("thumbnailUrl", video.thumbnailUrl)
                    })
                }
                call.resolve(JSObject().apply {
                    put("videos", arr)
                })
            }.onFailure { call.reject(it.message) }
        }
    }
}
