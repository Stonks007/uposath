package com.buddhist.uposatha.audio

import kotlinx.serialization.Serializable

@Serializable
data class VideoInfo(
    val videoId: String,
    val title: String,
    val channelName: String,
    val channelId: String,
    val duration: String,
    val thumbnailUrl: String,
    val uploadDate: String? = null,
    val viewCount: Long? = null
)

@Serializable
data class ChannelVideosResult(
    val videos: List<VideoInfo>,
    val continuation: String?
)

@Serializable
data class AudioStream(
    val url: String,
    val mimeType: String,
    val bitrate: Int,
    val expiresAt: Long? = null
)

@Serializable
data class PlaybackState(
    val state: PlayerState,
    val currentVideo: VideoInfo? = null,
    val position: Long = 0,
    val duration: Long = 0,
    val speed: Float = 1.0f
)

enum class PlayerState {
    IDLE, LOADING, PLAYING, PAUSED, ENDED, ERROR
}
