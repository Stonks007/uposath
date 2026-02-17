package com.buddhist.uposatha.innertube.models.body

import com.buddhist.uposatha.innertube.models.Context
import kotlinx.serialization.Serializable

@Serializable
data class PlaylistDeleteBody(
    val context: Context,
    val playlistId: String
)

