package com.buddhist.uposatha.db.dao

import androidx.room.*
import com.buddhist.uposatha.db.entities.Video
import kotlinx.coroutines.flow.Flow

@Dao
interface VideoDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVideo(video: Video)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVideos(videos: List<Video>)

    @Query("SELECT * FROM videos WHERE videoId = :videoId")
    suspend fun getVideoById(videoId: String): Video?

    @Query("SELECT * FROM videos ORDER BY uploadDate DESC")
    suspend fun getAllVideos(): List<Video>

    @Query("SELECT * FROM videos WHERE channelId = :channelId ORDER BY uploadDate DESC")
    suspend fun getVideosByChannel(channelId: String): List<Video>

    @Query("SELECT * FROM videos WHERE title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%'")
    suspend fun searchVideos(query: String): List<Video>

    @Query("DELETE FROM videos WHERE videoId = :videoId")
    suspend fun deleteVideo(videoId: String)

    @Query("DELETE FROM videos WHERE lastUpdated < :timestamp")
    suspend fun deleteOldVideos(timestamp: Long)

    @Query("UPDATE videos SET audioStreamUrl = :url, audioStreamQuality = :quality, lastUpdated = :timestamp WHERE videoId = :videoId")
    suspend fun updateStreamUrl(videoId: String, url: String, quality: String, timestamp: Long)
}
