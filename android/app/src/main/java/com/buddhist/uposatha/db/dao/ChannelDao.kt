package com.buddhist.uposatha.db.dao

import androidx.room.*
import com.buddhist.uposatha.db.entities.Channel

@Dao
interface ChannelDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChannel(channel: Channel)

    @Query("SELECT * FROM channels WHERE channelId = :channelId")
    suspend fun getChannelById(channelId: String): Channel?

    @Update
    suspend fun updateChannel(channel: Channel)

    @Query("DELETE FROM channels WHERE channelId = :channelId")
    suspend fun deleteChannel(channelId: String)
}
