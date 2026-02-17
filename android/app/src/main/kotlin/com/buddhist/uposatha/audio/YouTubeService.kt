
package com.buddhist.uposatha.audio

import com.buddhist.uposatha.innertube.YouTube
import com.buddhist.uposatha.innertube.NewPipeUtils
import com.buddhist.uposatha.audio.potoken.PoTokenGenerator
import com.buddhist.uposatha.innertube.models.SongItem
import com.buddhist.uposatha.innertube.models.YouTubeClient
import com.buddhist.uposatha.innertube.models.YouTubeClient.Companion.WEB_REMIX
import com.buddhist.uposatha.innertube.models.YouTubeClient.Companion.ANDROID_VR_NO_AUTH
import com.buddhist.uposatha.innertube.models.YouTubeClient.Companion.IOS
import com.buddhist.uposatha.innertube.models.response.PlayerResponse
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class YouTubeService {
    private val TAG = "YouTubeService"
    private val poTokenGenerator = PoTokenGenerator()
    
    // Clients used for fallback streams
    private val STREAM_FALLBACK_CLIENTS = arrayOf(
        ANDROID_VR_NO_AUTH,
        IOS
    )
    
    suspend fun getChannelVideos(channelId: String, continuation: String? = null): Result<ChannelResult> = withContext(Dispatchers.IO) {
        runCatching {
            val (items, nextContinuation) = if (continuation == null) {
                val artistPage = YouTube.artist(channelId).getOrThrow()
                // Find "Videos" section first, otherwise take all SongItems
                val videoSection = artistPage.sections.find { it.title == "Videos" }
                    ?: artistPage.sections.find { it.title == "Songs" }
                
                if (videoSection?.moreEndpoint != null) {
                    val morePage = YouTube.artistItems(videoSection.moreEndpoint).getOrThrow()
                    morePage.items.filterIsInstance<SongItem>() to morePage.continuation
                } else {
                    val targetItems = videoSection?.items?.filterIsInstance<SongItem>() 
                        ?: artistPage.sections.flatMap { it.items }.filterIsInstance<SongItem>()
                    
                    targetItems to null
                }
            } else {
                val page = YouTube.artistItemsContinuation(continuation).getOrThrow()
                val targetItems = page.items.filterIsInstance<SongItem>()
                targetItems to page.continuation
            }
            
            val videoInfos = items.map { song ->
                VideoInfo(
                    videoId = song.id,
                    title = song.title,
                    channelName = song.artists.firstOrNull()?.name ?: "",
                    channelId = song.artists.firstOrNull()?.id ?: channelId,
                    duration = song.duration?.toString() ?: "0",
                    thumbnailUrl = song.thumbnail,
                    uploadDate = null,
                    viewCount = null
                )
            }
            
            ChannelResult(videoInfos, nextContinuation)
        }
    }

    suspend fun getAudioStream(videoId: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            Log.d(TAG, "Getting audio stream for: $videoId")
            
            val signatureTimestamp = NewPipeUtils.getSignatureTimestamp(videoId).getOrNull()
            
            val isLoggedIn = YouTube.cookie != null
            val sessionId = if (isLoggedIn) YouTube.dataSyncId else YouTube.visitorData
            
            val (webPlayerPot, webStreamingPot) = poTokenGenerator.getWebClientPoToken(videoId, sessionId ?: "")?.let {
                it.playerRequestPoToken to it.streamingDataPoToken
            } ?: (null to null)

            // Try WEB_REMIX as main client
            var playerResponse = YouTube.player(
                videoId = videoId, 
                client = WEB_REMIX, 
                signatureTimestamp = signatureTimestamp, 
                webPlayerPot = webPlayerPot
            ).getOrNull()

            var streamUrl: String? = null
            
            // If main client fails or has no streams, try fallback clients
            val clientsToTry = listOf(WEB_REMIX) + STREAM_FALLBACK_CLIENTS
            
            for (client in clientsToTry) {
                if (client.loginRequired && !isLoggedIn) continue
                
                val currentResponse = if (client == WEB_REMIX) {
                    playerResponse
                } else {
                    YouTube.player(
                        videoId = videoId, 
                        client = client, 
                        signatureTimestamp = signatureTimestamp, 
                        webPlayerPot = if (client == WEB_REMIX) webPlayerPot else null
                    ).getOrNull()
                }

                if (currentResponse?.playabilityStatus?.status == "OK") {
                    val formats = currentResponse.streamingData?.adaptiveFormats ?: continue
                    val audioFormat = formats.filter { it.mimeType.startsWith("audio/") && !it.url.isNullOrEmpty() }
                        .maxByOrNull { it.bitrate ?: 0 } ?: continue
                    
                    var url = NewPipeUtils.getStreamUrl(audioFormat, videoId).getOrNull() ?: continue
                    
                    if (client == WEB_REMIX && webStreamingPot != null) {
                        url += "&pot=$webStreamingPot"
                    }
                    
                    streamUrl = url
                    Log.d(TAG, "Found working stream with client: ${client.clientName}")
                    break
                }
            }
                
            streamUrl ?: throw Exception("No audio stream found")
        }
    }

    suspend fun search(query: String): Result<List<VideoInfo>> = withContext(Dispatchers.IO) {
        YouTube.searchSummary(query).map { page ->
            page.summaries.flatMap { it.items }.filterIsInstance<SongItem>().map { item ->
                VideoInfo(
                    videoId = item.id,
                    title = item.title,
                    channelName = item.artists.firstOrNull()?.name ?: "Unknown",
                    channelId = item.artists.firstOrNull()?.id ?: "",
                    duration = item.duration?.toString() ?: "",
                    thumbnailUrl = item.thumbnail ?: "",
                    uploadDate = null,
                    viewCount = null
                )
            }
        }
    }

    suspend fun getVideoInfo(videoId: String): Result<VideoInfo> = withContext(Dispatchers.IO) {
        runCatching {
            val response = YouTube.player(videoId, client = YouTubeClient.ANDROID).getOrThrow()
            val details = response.videoDetails ?: throw Exception("No video details found")
            
            VideoInfo(
                videoId = details.videoId,
                title = details.title,
                channelName = details.author,
                channelId = details.channelId,
                duration = details.lengthSeconds,
                thumbnailUrl = details.thumbnail.thumbnails.lastOrNull()?.url ?: "",
                uploadDate = null,
                viewCount = details.viewCount.toLongOrNull()
            )
        }
    }
}
