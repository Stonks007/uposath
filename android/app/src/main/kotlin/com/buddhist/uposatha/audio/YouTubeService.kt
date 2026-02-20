
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
     * Uses direct HTTP to www.youtube.com to scrape channel info,
     * because the YouTube Music (WEB_REMIX) API doesn't support regular channels.
     */
    suspend fun resolveChannel(url: String): Result<ResolvedChannel> = withContext(Dispatchers.IO) {
        Log.d("YouTubeService", "resolveChannel() called with url: $url")
        runCatching {
            val channelUrl = normalizeChannelUrl(url)
            Log.d("YouTubeService", "Normalized URL: $channelUrl")

            val client = okhttp3.OkHttpClient.Builder()
                .followRedirects(true)
                .build()
            val request = okhttp3.Request.Builder()
                .url(channelUrl)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .header("Accept-Language", "en-US,en;q=0.9")
                .build()
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: throw Exception("Empty response from YouTube")
            
            // Extract channel ID from page
            val channelId = extractFromHtml(body, """"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]+)"""")
                ?: extractFromHtml(body, """"externalId"\s*:\s*"(UC[a-zA-Z0-9_-]+)"""")
                ?: throw Exception("Could not find channel ID in page")
            
            // Extract channel name
            val name = extractFromHtml(body, """"title"\s*:\s*"([^"]+)"""")
                ?: extractFromHtml(body, """<title>([^<]+)</title>""")?.replace(" - YouTube", "")
                ?: "Unknown"
            
            // Extract avatar
            val avatar = extractFromHtml(body, """"avatar"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"""")
                ?: ""

            Log.d("YouTubeService", "Resolved: id=$channelId, name=$name")
            ResolvedChannel(
                channelId = channelId,
                name = name,
                avatarUrl = avatar
            )
        }.onFailure {
            Log.e("YouTubeService", "resolveChannel() failed", it)
        }
    }

    /**
     * Get channel page content.
     * Regular YouTube scrape is primary (highest priority).
     * YouTube Music artist API is secondary fallback.
     */
    suspend fun getChannelPage(channelId: String): Result<ChannelPageResult> = withContext(Dispatchers.IO) {
        Log.d("YouTubeService", "getChannelPage() called for channelId: $channelId")
        runCatching {
            // PRIMARY: scrape the regular YouTube channel page
            try {
                Log.d("YouTubeService", "Trying regular YouTube scrape for $channelId")
                val channelUrl = if (channelId.startsWith("UC")) {
                    "https://www.youtube.com/channel/$channelId/videos"
                } else {
                    "https://www.youtube.com/$channelId/videos"
                }
                
                val client = okhttp3.OkHttpClient.Builder()
                    .followRedirects(true)
                    .build()
                val request = okhttp3.Request.Builder()
                    .url(channelUrl)
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .build()
                val response = client.newCall(request).execute()
                val body = response.body?.string() ?: throw Exception("Empty response")
                
                // Extract channel name
                val channelName = extractFromHtml(body, """"title"\s*:\s*"([^"]+)"""")
                    ?: extractFromHtml(body, """<title>([^<]+)</title>""")?.replace(" - YouTube", "")
                    ?: channelId
                
                // Extract avatar URL
                val avatarUrl = extractFromHtml(body, """"avatar"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"""")
                
                // Extract video renderers with titles
                val videos = mutableListOf<VideoInfo>()
                val rendererRegex = Regex(""""videoRenderer"\s*:\s*\{""")
                val rendererStarts = rendererRegex.findAll(body).map { it.range.first }.toList()
                
                for (start in rendererStarts.take(30)) {
                    try {
                        val subBody = body.substring(start, minOf(start + 3000, body.length))
                        val vid = Regex(""""videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"""").find(subBody)?.groupValues?.get(1) ?: continue
                        val title = Regex(""""title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1) ?: continue
                        val thumbnail = "https://i.ytimg.com/vi/$vid/hqdefault.jpg"
                        val lengthText = Regex(""""lengthText"\s*:\s*\{\s*"[^"]*"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1) ?: "0"
                        val durationSec = parseDuration(lengthText)

                        videos.add(VideoInfo(
                            videoId = vid,
                            title = title,
                            channelName = channelName,
                            channelId = channelId,
                            duration = durationSec.toString(),
                            thumbnailUrl = thumbnail
                        ))
                    } catch (e: Exception) {
                        // Skip malformed renderers
                    }
                }

                Log.d("YouTubeService", "Scraped ${videos.size} videos from regular YouTube")
                
                if (videos.isNotEmpty()) {
                    return@runCatching ChannelPageResult(
                        channelName = channelName,
                        channelAvatar = avatarUrl,
                        sections = listOf(
                            ChannelSection(
                                title = "Videos",
                                items = videos,
                                continuation = null
                            )
                        )
                    )
                }
            } catch (e: Exception) {
                Log.w("YouTubeService", "Regular YouTube scrape failed for $channelId", e)
            }

            // SECONDARY: try YouTube Music artist API (works for music/chanting channels)
            try {
                val artistPage = YouTube.artist(channelId).getOrThrow()
                if (artistPage.sections.isNotEmpty()) {
                    Log.d("YouTubeService", "YT Music artist page loaded: ${artistPage.artist.title}, sections: ${artistPage.sections.size}")
                    val sections = artistPage.sections.map { section ->
                        ChannelSection(
                            title = section.title,
                            items = section.items.map { toVideoInfo(it) },
                            continuation = section.continuation,
                            browseId = section.moreEndpoint?.browseId,
                            params = section.moreEndpoint?.params
                        )
                    }
                    return@runCatching ChannelPageResult(
                        channelName = artistPage.artist.title,
                        channelAvatar = artistPage.artist.thumbnail,
                        sections = sections
                    )
                }
            } catch (e: Exception) {
                Log.w("YouTubeService", "YouTube Music artist API also failed for $channelId", e)
            }

            throw Exception("Could not load channel content for $channelId from any source")
        }.onFailure {
            Log.e("YouTubeService", "getChannelPage() failed completely", it)
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
     * Normalize various YouTube URL formats to a full channel URL.
     */
    private fun normalizeChannelUrl(input: String): String {
        val trimmed = input.trim()
        
        // Already a full URL
        if (trimmed.startsWith("http")) return trimmed
        
        // @handle
        if (trimmed.startsWith("@")) return "https://www.youtube.com/$trimmed"
        
        // UC channel ID
        if (trimmed.startsWith("UC")) return "https://www.youtube.com/channel/$trimmed"
        
        // Must be a custom URL slug
        return "https://www.youtube.com/$trimmed"
    }

    /**
     * Extract channel ID or path from various URL formats for browsing.
     */
    private fun extractChannelId(input: String): String {
        val trimmed = input.trim()

        // Already a channel ID
        if (trimmed.startsWith("UC") && !trimmed.contains("/")) return trimmed

        // /channel/UCxxx
        val channelRegex = Regex("""youtube\.com/channel/(UC[a-zA-Z0-9_-]+)""")
        channelRegex.find(trimmed)?.let { return it.groupValues[1] }

        // @handle
        val handleRegex = Regex("""youtube\.com/@([a-zA-Z0-9_.-]+)""")
        handleRegex.find(trimmed)?.let { return "@${it.groupValues[1]}" }

        // /c/name or /user/name
        val customRegex = Regex("""youtube\.com/(?:c|user)/([a-zA-Z0-9_.-]+)""")
        customRegex.find(trimmed)?.let { return it.groupValues[1] }

        // If just a handle without URL
        if (trimmed.startsWith("@")) return trimmed

        return trimmed
    }

    /**
     * Extract a regex match from HTML content.
     */
    private fun extractFromHtml(html: String, pattern: String): String? {
        return try {
            Regex(pattern).find(html)?.groupValues?.get(1)
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Parse duration string like "12:34" or "1:02:03" to seconds.
     */
    private fun parseDuration(text: String): Int {
        val parts = text.split(":").mapNotNull { it.trim().toIntOrNull() }
        return when (parts.size) {
            3 -> parts[0] * 3600 + parts[1] * 60 + parts[2]
            2 -> parts[0] * 60 + parts[1]
            1 -> parts[0]
            else -> 0
        }
    }
}
