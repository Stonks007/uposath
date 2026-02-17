package com.buddhist.uposatha.db.entities

import androidx.room.Embedded

data class VideoWithPosition(
    @Embedded val video: Video,
    val position: Int
)
