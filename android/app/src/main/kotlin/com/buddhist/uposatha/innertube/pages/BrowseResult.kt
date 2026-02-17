package com.buddhist.uposatha.innertube.pages

import com.buddhist.uposatha.innertube.models.YTItem

data class BrowseResult(
    val title: String?,
    val items: List<Item>,
) {
    data class Item(
        val title: String?,
        val items: List<YTItem>,
    )
}

