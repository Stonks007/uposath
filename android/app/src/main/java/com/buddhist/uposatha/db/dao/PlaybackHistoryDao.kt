package com.buddhist.uposatha.db.dao

import androidx.room.*
import com.buddhist.uposatha.db.entities.PlaybackHistoryWithVideo
import com.buddhist.uposatha.db.entities.PlaybackHistory

@Dao
interface PlaybackHistoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertHistory(history: PlaybackHistory)

    @Transaction
    @Query("SELECT h.*, v.* FROM playback_history h INNER JOIN videos v ON h.videoId = v.videoId ORDER BY h.playedAt DESC LIMIT :limit")
    fun getRecentHistory(limit: Int): List<PlaybackHistoryWithVideo>

    @Query("SELECT * FROM playback_history WHERE videoId = :videoId ORDER BY playedAt DESC LIMIT 1")
    fun getLastPlaybackPosition(videoId: String): PlaybackHistory?

    @Query("UPDATE playback_history SET position = :position, completed = :completed WHERE id = :id")
    fun updatePosition(id: Int, position: Long, completed: Boolean)

    @Query("DELETE FROM playback_history")
    fun clearHistory()

    @Query("DELETE FROM playback_history WHERE playedAt < :timestamp")
    fun deleteOldHistory(timestamp: Long)
}
