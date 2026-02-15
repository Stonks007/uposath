package com.buddhist.uposatha.db.dao

import androidx.room.*
import com.buddhist.uposatha.db.entities.Video
import kotlinx.coroutines.flow.Flow

@Dao
interface VideoDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVideo(video: Video)

    @Query("SELECT * FROM videos WHERE videoId = :videoId")
    suspend fun getVideoById(videoId: String): Video?

    @Query("SELECT * FROM videos")
    fun getAllVideos(): Flow<List<Video>>

    @Query("SELECT * FROM videos WHERE title LIKE '%' || :query || '%'")
    suspend fun searchVideos(query: String): List<Video>

    @Query("SELECT * FROM videos WHERE channelId = :channelId")
    suspend fun getVideosByChannel(channelId: String): List<Video>

    @Query("DELETE FROM videos WHERE videoId = :videoId")
    suspend fun deleteVideo(videoId: String)
}
