package com.buddhist.uposatha.db.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "playlists")
data class Playlist(
    @PrimaryKey val playlistId: String,
    val name: String,
    val createdAt: Long,
    val updatedAt: Long
)
