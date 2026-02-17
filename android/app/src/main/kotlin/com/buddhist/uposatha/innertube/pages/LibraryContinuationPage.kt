package com.buddhist.uposatha.innertube.pages

import com.buddhist.uposatha.innertube.models.YTItem

data class LibraryContinuationPage(
    val items: List<YTItem>,
    val continuation: String?,
)
