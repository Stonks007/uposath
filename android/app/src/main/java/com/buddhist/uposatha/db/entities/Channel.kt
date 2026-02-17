package com.buddhist.uposatha.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "channels")
data class Channel(
    @PrimaryKey val channelId: String,
    val name: String,
    val avatarUrl: String,
    val subscriberCount: Long,
    val description: String,
    val lastFetched: Long
)
