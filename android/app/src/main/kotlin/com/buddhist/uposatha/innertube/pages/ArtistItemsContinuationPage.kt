package com.buddhist.uposatha.innertube.pages

import com.buddhist.uposatha.innertube.models.YTItem

data class ArtistItemsContinuationPage(
    val items: List<YTItem>,
    val continuation: String?,
)

