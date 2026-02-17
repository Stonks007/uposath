package com.buddhist.uposatha.db.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.PrimaryKey

@Entity(
    tableName = "playback_history",
    foreignKeys = [
        ForeignKey(
            entity = Video::class,
            parentColumns = ["videoId"],
            childColumns = ["videoId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class PlaybackHistory(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val videoId: String,
    val playedAt: Long,
    val position: Long, // in milliseconds
    val duration: Long, // in milliseconds
    val completed: Boolean
)
