package com.buddhist.uposatha.innertube.pages

import com.buddhist.uposatha.innertube.models.AlbumItem

data class ExplorePage(
    val newReleaseAlbums: List<AlbumItem>,
    val moodAndGenres: List<MoodAndGenres.Item>,
)

