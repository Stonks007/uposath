package com.buddhist.uposatha.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "videos")
data class Video(
    @PrimaryKey val videoId: String,
    val title: String,
    val channelId: String,
    val channelName: String,
    val duration: Long, // in seconds
    val thumbnailUrl: String,
    val uploadDate: Long, // timestamp
    val viewCount: Long,
    val description: String?,
    val audioStreamUrl: String?,
    val audioStreamQuality: String?,
    val lastUpdated: Long
)
