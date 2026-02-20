
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
import kotlinx.coroutines.async

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
            var avatar = extractFromHtml(body, """"avatar"\s*:\s*\{\s*"thumbnails"\s*:\s*\[\s*\{\s*"url"\s*:\s*"([^"]+)"""")
                ?: ""
                
            if (avatar.startsWith("//")) {
                avatar = "https:$avatar"
            }

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
            // PRIMARY: scrape the regular YouTube channel page and process valid tabs
            try {
                Log.d("YouTubeService", "Trying regular YouTube scrape for $channelId")
                val baseUrl = if (channelId.startsWith("UC")) "https://www.youtube.com/channel/$channelId" else "https://www.youtube.com/$channelId"
                val client = okhttp3.OkHttpClient.Builder().followRedirects(true).build()

                suspend fun fetchTab(tab: String): Pair<String, String>? = withContext(Dispatchers.IO) {
                    try {
                        val url = "$baseUrl/$tab"
                        val request = okhttp3.Request.Builder().url(url)
                            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                            .header("Accept-Language", "en-US,en;q=0.9").build()
                        val response = client.newCall(request).execute()
                        val body = response.body?.string() ?: return@withContext null
                        
                        // Ensure we are actually on the requested tab and not soft-redirected to 'Videos'
                        if (tab == "streams" || tab == "playlists" || tab == "videos") {
                            val expectedTitle = when (tab) {
                                "streams" -> "Live"
                                "playlists" -> "Playlists"
                                else -> "Videos"
                            }
                            
                            val selectedTitleMatch = Regex(""""title"\s*:\s*"([^"]+)"[^}]*"selected"\s*:\s*true""").find(body)
                                ?: Regex(""""tabRenderer"\s*:\s*\{[^}]*"title"\s*:\s*"([^"]+)"[^}]*"selected"\s*:\s*true""").find(body)
                                ?: Regex(""""selected"\s*:\s*true[^}]*"title"\s*:\s*"([^"]+)"""").find(body)
                                
                            val selectedTitle = selectedTitleMatch?.groupValues?.get(1)
                            
                            // If YouTube redirected us to a different tab because the requested one doesn't exist, skip it
                            if (selectedTitle != null && !selectedTitle.equals(expectedTitle, ignoreCase = true)) {
                                Log.d("YouTubeService", "Tab $tab soft-redirected to $selectedTitle, returning empty list.")
                                return@withContext Pair(tab, "") // Return empty string so the regex finds 0 items later
                            }
                        }
                        
                        // YouTube's canonical URLs no longer reliably append /streams or /playlists,
                        // so we simply parse whatever DOM we get. If it's empty, the regex will safely return 0 items.
                        Pair(tab, body)
                    } catch (e: Exception) { 
                        Log.e("YouTubeService", "Failed to fetch tab $tab", e)
                        null 
                    }
                }

                // Fire async requests
                val results = kotlinx.coroutines.coroutineScope {
                    val videosDef = async<Pair<String, String>?> { fetchTab("videos") }
                    val streamsDef = async<Pair<String, String>?> { fetchTab("streams") }
                    val playlistsDef = async<Pair<String, String>?> { fetchTab("playlists") }
                    
                    listOfNotNull(videosDef.await(), streamsDef.await(), playlistsDef.await())
                }
                
                if (results.isEmpty()) {
                    Log.w("YouTubeService", "No tabs found for $channelId")
                    throw Exception("Empty response for all tabs")
                }

                fun extractJson(html: String): String? {
                    val pattern = "ytInitialData ="
                    val startIdx = html.indexOf(pattern)
                    if (startIdx == -1) return null
                    
                    val objStart = html.indexOf("{", startIdx)
                    if (objStart == -1) return null
                    
                    var braceCount = 0
                    var i = objStart
                    while (i < html.length) {
                        when (html[i]) {
                            '{' -> braceCount++
                            '}' -> {
                                braceCount--
                                if (braceCount == 0) return html.substring(objStart, i + 1)
                            }
                        }
                        i++
                    }
                    return null
                }

                val firstBody = results.first().second
                val ytDataRaw = extractJson(firstBody)
                
                var channelName = channelId
                var avatarUrl = ""
                
                if (ytDataRaw != null) {
                    try {
                        val json = org.json.JSONObject(ytDataRaw)
                        val microformat = json.optJSONObject("microformat")?.optJSONObject("microformatDataRenderer")
                        if (microformat != null) {
                            channelName = microformat.optString("title", channelId)
                            val thumbnails = microformat.optJSONObject("thumbnail")?.optJSONArray("thumbnails")
                            if (thumbnails != null && thumbnails.length() > 0) {
                                avatarUrl = thumbnails.optJSONObject(thumbnails.length() - 1)?.optString("url") ?: ""
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("YouTubeService", "JSON parse error for channel metadata", e)
                    }
                }

                // Basic fallbacks for name/avatar if JSON parsing failed or was incomplete
                if (channelName == channelId) {
                    channelName = Regex(""""title"\s*:\s*"([^"]+)"""").find(firstBody)?.groupValues?.get(1) ?: channelId
                }
                if (avatarUrl.isEmpty()) {
                    avatarUrl = Regex(""""avatar"\s*:\s*\{\s*"thumbnails"\s*:\s*\[\s*\{\s*"url"\s*:\s*"([^"]+)"""").find(firstBody)?.groupValues?.get(1) ?: ""
                }
                if (avatarUrl.startsWith("//")) {
                    avatarUrl = "https:$avatarUrl"
                }

                val sections = mutableListOf<ChannelSection>()
                val seenTitles = mutableSetOf<String>()
                
                for ((tab, body) in results) {
                    val tabJsonRaw = extractJson(body)
                    val contentString = tabJsonRaw ?: body
                    
                    val videos = mutableListOf<VideoInfo>()
                    val rendererRegex = Regex(""""videoRenderer"\s*:\s*\{|"(gridVideo|reelItem|gridPlaylist|playlist)Renderer"\s*:\s*\{|"(shortsLockupViewModel|lockupViewModel)"\s*:\s*\{""")
                    val rendererStarts = rendererRegex.findAll(contentString).map { it.range.first }.toList()
                    
                    for (start in rendererStarts.take(30)) {
                        try {
                            val subBody = contentString.substring(start, minOf(start + 10000, contentString.length))
                            
                            val isPlaylistTab = tab == "playlists"
                            val regexPlaylistId = Regex(""""playlistId"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)
                                ?: Regex(""""contentId"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)
                                
                            val regexVideoId = Regex(""""videoId"\s*:\s*"([a-zA-Z0-9_-]{11,12})"""").find(subBody)?.groupValues?.get(1)
                                ?: Regex(""""url"\s*:\s*"/shorts/([a-zA-Z0-9_-]{11,12})"""").find(subBody)?.groupValues?.get(1)

                            val vid = if (isPlaylistTab) {
                                regexPlaylistId ?: regexVideoId // Fallback to videoId just in case
                            } else {
                                regexVideoId ?: regexPlaylistId // Fallback to playlistId if it's a playlist returned in a mixed tab
                            } ?: continue
                                
                            val title = Regex(""""headline"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)
                                ?: Regex(""""title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)
                                ?: Regex(""""title"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)
                                ?: Regex(""""lockupMetadataViewModel"\s*:\s*\{[^}]*"title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)
                                ?: Regex(""""title"\s*:\s*\{\s*"content"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)
                                ?: Regex(""""accessibilityText"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)?.substringBefore(", ")
                                ?: continue
                                
                            val thumbnail = if (vid.startsWith("PL")) 
                                Regex(""""url"\s*:\s*"([^"]+)"""").find(subBody)?.groupValues?.get(1)?.replace("\\u0026", "&") ?: ""
                            else "https://i.ytimg.com/vi/$vid/hqdefault.jpg"
                            
                            val lengthIdx = subBody.indexOf("\"lengthText\"")
                            val lengthText = if (lengthIdx != -1) Regex(""""(?:simpleText|text)"\s*:\s*"([0-9:]+)"""").find(subBody, lengthIdx)?.groupValues?.get(1) ?: "0" else "0"
                            val durationSec = parseDuration(lengthText)
                            
                            val viewIdx = subBody.indexOf("\"viewCountText\"")
                            val viewCountText = if (viewIdx != -1) Regex(""""simpleText"\s*:\s*"([^"]+)"""").find(subBody, viewIdx)?.groupValues?.get(1) else null
                            
                            val pubIdx = subBody.indexOf("\"publishedTimeText\"")
                            val publishedTimeText = if (pubIdx != -1) Regex(""""simpleText"\s*:\s*"([^"]+)"""").find(subBody, pubIdx)?.groupValues?.get(1) else null

                            // Special extraction for playlists to get the videoCount format
                            val videoCountIdx = subBody.indexOf("\"videoCountText\"")
                            val playlistVideoCountText = if (videoCountIdx != -1) Regex(""""(?:simpleText|text)"\s*:\s*"?([\d,]+\s*(?:videos|video))"?""").find(subBody, videoCountIdx)?.groupValues?.get(1) 
                                ?: Regex(""""accessibilityText"\s*:\s*"([\d,]+\s*(?:videos|video))"?""").find(subBody, videoCountIdx)?.groupValues?.get(1) else null
                            
                            val displayViewCount = if (vid.startsWith("PL") && playlistVideoCountText != null) playlistVideoCountText else viewCountText

                            videos.add(VideoInfo(
                                videoId = vid,
                                title = title,
                                channelName = channelName,
                                channelId = channelId,
                                duration = durationSec.toString(),
                                thumbnailUrl = thumbnail,
                                uploadDate = publishedTimeText,
                                viewCountText = displayViewCount
                            ))
                        } catch (e: Exception) {}
                    }

                    val sectionTitle = when(tab) {
                        "videos" -> "Videos"
                        "streams" -> "Live"
                        "playlists" -> "Playlists"
                        else -> tab.replaceFirstChar { it.uppercase() }
                    }
                    
                    if (!seenTitles.contains(sectionTitle)) {
                        sections.add(ChannelSection(sectionTitle, videos, null))
                        seenTitles.add(sectionTitle)
                    }
                }
                
                // Ensure the 3 required tabs are *always* present, even if empty (so UI shows "No content available")
                val requiredTabs = listOf("Videos", "Live", "Playlists")
                requiredTabs.forEach { reqTab ->
                    if (!seenTitles.contains(reqTab)) {
                         sections.add(ChannelSection(reqTab, emptyList(), null))
                         seenTitles.add(reqTab)
                    }
                }
                
                // Final sort to put Videos first, Live second, Playlists third
                sections.sortBy { 
                    when(it.title) {
                        "Videos" -> 0
                        "Live" -> 1
                        "Playlists" -> 2
                        else -> 3
                    }
                }

                Log.d("YouTubeService", "Processed ${sections.size} core tabs")
                
                if (sections.isNotEmpty()) {
                    return@runCatching ChannelPageResult(
                        channelName = channelName,
                        channelAvatar = avatarUrl,
                        sections = sections
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
