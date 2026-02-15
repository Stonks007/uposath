package com.buddhist.uposatha.db.entities

import androidx.room.Entity
import androidx.room.ForeignKey

@Entity(
    tableName = "playlist_videos",
    primaryKeys = ["playlistId", "videoId"],
    foreignKeys = [
        ForeignKey(
            entity = Playlist::class,
            parentColumns = ["playlistId"],
            childColumns = ["playlistId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Video::class,
            parentColumns = ["videoId"],
            childColumns = ["videoId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class PlaylistVideo(
    val playlistId: String,
    val videoId: String,
    val position: Int
)
