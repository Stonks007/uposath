package com.buddhist.uposatha.audio

import android.content.Context
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.common.util.UnstableApi
import java.io.File

@UnstableApi
object AudioPlayerCache {
    private var cache: SimpleCache? = null
    private const val CACHE_SIZE = 100 * 1024 * 1024L // 100MB

    @Synchronized
    fun get(context: Context): SimpleCache {
        if (cache == null) {
            val cacheDir = File(context.cacheDir, "media")
            val evictor = LeastRecentlyUsedCacheEvictor(CACHE_SIZE)
            val databaseProvider = StandaloneDatabaseProvider(context)
            cache = SimpleCache(cacheDir, evictor, databaseProvider)
        }
        return cache!!
    }
}
