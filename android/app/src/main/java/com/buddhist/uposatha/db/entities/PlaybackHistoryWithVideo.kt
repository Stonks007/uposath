package com.buddhist.uposatha.db.entities

import androidx.room.Embedded
import androidx.room.Relation

data class PlaybackHistoryWithVideo(
    @Embedded val history: PlaybackHistory,
    @Relation(
        parentColumn = "videoId",
        entityColumn = "videoId"
    )
    val video: Video
)
