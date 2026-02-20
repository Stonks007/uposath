
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

    /**
     * Resolve a YouTube URL to channel metadata.
     * Supports @handle, /c/name, /channel/UCxxx, or just a channel ID.
     */
    suspend fun resolveChannel(url: String): Result<ResolvedChannel> = withContext(Dispatchers.IO) {
        Log.d("YouTubeService", "resolveChannel() called with url: $url")
        runCatching {
            // Extract channel ID or browse ID from URL
            val channelId = extractChannelId(url)
            Log.d("YouTubeService", "Resolved URL to channelId/browseId: $channelId")

            // Fetch the artist/channel page to get metadata
            val artistPage = YouTube.artist(channelId).getOrThrow()
            ResolvedChannel(
                channelId = artistPage.artist.channelId ?: channelId,
                name = artistPage.artist.title,
                avatarUrl = artistPage.artist.thumbnail ?: ""
            )
        }.onFailure {
            Log.e("YouTubeService", "resolveChannel() failed", it)
        }
    }

    /**
     * Get all sections/tabs from a channel page for dynamic tab rendering.
     */
    suspend fun getChannelPage(channelId: String): Result<ChannelPageResult> = withContext(Dispatchers.IO) {
        Log.d("YouTubeService", "getChannelPage() called for channelId: $channelId")
        runCatching {
            val artistPage = YouTube.artist(channelId).getOrThrow()
            Log.d("YouTubeService", "Artist page: ${artistPage.artist.title}, sections: ${artistPage.sections.size}")

            val sections = artistPage.sections.map { section ->
                Log.d("YouTubeService", "Section: '${section.title}' items=${section.items.size} cont=${section.continuation != null}")
                ChannelSection(
                    title = section.title,
                    items = section.items.map { toVideoInfo(it) },
                    continuation = section.continuation,
                    browseId = section.moreEndpoint?.browseId,
                    params = section.moreEndpoint?.params
                )
            }

            ChannelPageResult(
                channelName = artistPage.artist.title,
                channelAvatar = artistPage.artist.thumbnail,
                sections = sections
            )
        }.onFailure {
            Log.e("YouTubeService", "getChannelPage() failed", it)
        }
    }

    /**
     * Get videos from a playlist.
     */
    suspend fun getPlaylistVideos(playlistId: String): Result<List<VideoInfo>> = withContext(Dispatchers.IO) {
        Log.d("YouTubeService", "getPlaylistVideos() called for playlistId: $playlistId")
        runCatching {
            val playlistPage = YouTube.playlist(playlistId).getOrThrow()
            Log.d("YouTubeService", "Playlist: ${playlistPage.playlist.title}, items: ${playlistPage.songs.size}")
            playlistPage.songs.map { song ->
                VideoInfo(
                    videoId = song.id,
                    title = song.title,
                    channelName = song.artists.firstOrNull()?.name ?: "",
                    channelId = song.artists.firstOrNull()?.id ?: "",
                    duration = song.duration?.toString() ?: "0",
                    thumbnailUrl = song.thumbnail ?: ""
                )
            }
        }.onFailure {
            Log.e("YouTubeService", "getPlaylistVideos() failed", it)
        }
    }

    /**
     * Extract a channel ID or browse ID from various YouTube URL formats.
     */
    private fun extractChannelId(input: String): String {
        val trimmed = input.trim()

        // Already a channel/browse ID
        if (trimmed.startsWith("UC") && !trimmed.contains("/")) return trimmed

        // /channel/UCxxx
        val channelRegex = Regex("""youtube\.com/channel/(UC[a-zA-Z0-9_-]+)""")
        channelRegex.find(trimmed)?.let { return it.groupValues[1] }

        // @handle
        val handleRegex = Regex("""youtube\.com/@([a-zA-Z0-9_.-]+)""")
        handleRegex.find(trimmed)?.let {
            val handle = it.groupValues[1]
            // For handles, we use the browse endpoint with the handle
            return "@$handle"
        }

        // /c/name or /user/name
        val customRegex = Regex("""youtube\.com/(?:c|user)/([a-zA-Z0-9_.-]+)""")
        customRegex.find(trimmed)?.let {
            return it.groupValues[1]
        }

        // If just a handle without URL
        if (trimmed.startsWith("@")) return trimmed

        // Return as-is (might be a browse ID)
        return trimmed
    }
}
