package com.buddhist.uposatha.innertube.pages

import com.buddhist.uposatha.innertube.models.SongItem

data class PlaylistContinuationPage(
    val songs: List<SongItem>,
    val continuation: String?,
)

