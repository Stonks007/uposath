
package com.buddhist.uposatha.audio

import android.util.Log
import com.buddhist.uposatha.innertube.NewPipeUtils
import com.buddhist.uposatha.innertube.YouTube
import com.buddhist.uposatha.innertube.models.ArtistItem
import com.buddhist.uposatha.innertube.models.SongItem
import com.buddhist.uposatha.innertube.models.YTItem
import com.buddhist.uposatha.innertube.models.YouTubeClient
import com.buddhist.uposatha.innertube.pages.SearchResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class YouTubeService {

    suspend fun search(query: String): Result<List<VideoInfo>> = withContext(Dispatchers.IO) {
        Log.d("YouTubeService", "search() called with query: $query")
        runCatching {
            val result = YouTube.search(query, YouTube.SearchFilter.FILTER_VIDEO).getOrThrow()
            Log.d("YouTubeService", "search() found ${result.items.size} items")
            
            result.items.map { item ->
                Log.d("YouTubeService", "Mapping item: ${item.title} (type: ${item.javaClass.simpleName})")
                toVideoInfo(item)
            }
        }.onFailure {
            Log.e("YouTubeService", "search() failed", it)
        }
    }

    suspend fun getAudioStream(videoId: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val client = YouTubeClient.ANDROID_VR_NO_AUTH
            val signatureTimestamp = if (client.useSignatureTimestamp) {
                NewPipeUtils.getSignatureTimestamp(videoId).getOrNull()
            } else null
            
            val response = YouTube.player(videoId, client = client, signatureTimestamp = signatureTimestamp).getOrThrow()
            
            val formats = response.streamingData?.adaptiveFormats
            val audioFormat = formats?.filter { it.mimeType.startsWith("audio/") }
                ?.maxByOrNull { it.bitrate ?: 0 }
                ?: throw Exception("No audio stream found")
                
            NewPipeUtils.getStreamUrl(audioFormat, videoId).getOrThrow()
        }.onFailure {
            Log.e("YouTubeService", "getAudioStream() failed for videoId: $videoId", it)
        }
    }

    suspend fun getChannelVideos(channelId: String, continuation: String? = null): Result<ChannelVideosResult> = withContext(Dispatchers.IO) {
        Log.d("YouTubeService", "getChannelVideos() called for channelId: $channelId, continuation: $continuation")
        runCatching {
            if (continuation != null) {
                val result = YouTube.artistItemsContinuation(continuation).getOrThrow()
                Log.d("YouTubeService", "Continuation for $channelId found ${result.items.size} items")
                ChannelVideosResult(
                    videos = result.items.map { 
                        Log.d("YouTubeService", "Mapping continuation item: ${it.title} (type: ${it.javaClass.simpleName})")
                        toVideoInfo(it) 
                    },
                    continuation = result.continuation
                )
            } else {
                val artistPage = YouTube.artist(channelId).getOrThrow()
                Log.d("YouTubeService", "Artist page loaded for $channelId: ${artistPage.artist.title}, sections: ${artistPage.sections.size}")
                artistPage.sections.forEach { Log.d("YouTubeService", "Section: ${it.title} (items: ${it.items.size})") }

                // Find section that looks like videos/songs
                val videoSection = artistPage.sections.find { 
                    it.title.contains("Videos", ignoreCase = true) || 
                    it.title.contains("Songs", ignoreCase = true) ||
                    it.title.contains("Uploads", ignoreCase = true) ||
                    it.title.contains("Releases", ignoreCase = true)
                } ?: artistPage.sections.firstOrNull()

                Log.d("YouTubeService", "Chosen section: ${videoSection?.title}")

                ChannelVideosResult(
                    videos = videoSection?.items?.map { toVideoInfo(it) } ?: emptyList(),
                    continuation = videoSection?.continuation
                )
            }
        }.onFailure {
            Log.e("YouTubeService", "getChannelVideos() failed", it)
        }
    }

    private fun toVideoInfo(item: YTItem): VideoInfo {
        return VideoInfo(
            videoId = item.id,
            title = item.title,
            channelName = when (item) {
                is SongItem -> item.artists.firstOrNull()?.name ?: ""
                is ArtistItem -> item.title
                else -> ""
            },
            channelId = when (item) {
                is SongItem -> item.artists.firstOrNull()?.id ?: ""
                is ArtistItem -> item.id
                else -> ""
            },
            duration = when (item) {
                is SongItem -> item.duration?.toString() ?: "0"
                else -> "0"
            },
            thumbnailUrl = item.thumbnail ?: "",
            uploadDate = null,
            viewCount = null
        )
    }
}
