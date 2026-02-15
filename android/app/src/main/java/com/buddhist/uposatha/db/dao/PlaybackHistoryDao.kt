package com.buddhist.uposatha.db.dao

import androidx.room.*
import com.buddhist.uposatha.db.entities.PlaybackHistory

@Dao
interface PlaybackHistoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHistory(history: PlaybackHistory)

    @Query("SELECT * FROM playback_history ORDER BY playedAt DESC LIMIT :limit")
    suspend fun getRecentHistory(limit: Int): List<PlaybackHistory>

    @Query("SELECT * FROM playback_history WHERE videoId = :videoId")
    suspend fun getHistoryByVideo(videoId: String): PlaybackHistory?

    @Query("UPDATE playback_history SET position = :position, playedAt = :timestamp WHERE videoId = :videoId")
    suspend fun updatePosition(videoId: String, position: Long, timestamp: Long)

    @Query("DELETE FROM playback_history")
    suspend fun clearHistory()
}
