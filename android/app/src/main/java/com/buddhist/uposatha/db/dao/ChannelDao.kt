package com.buddhist.uposatha.db.dao

import androidx.room.*
import com.buddhist.uposatha.db.entities.Channel

@Dao
interface ChannelDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChannel(channel: Channel)

    @Query("SELECT * FROM channels WHERE channelId = :channelId")
    suspend fun getChannelById(channelId: String): Channel?

    @Query("SELECT * FROM channels ORDER BY lastFetched DESC")
    suspend fun getAllChannels(): List<Channel>

    @Delete
    suspend fun deleteChannel(channel: Channel)
}
