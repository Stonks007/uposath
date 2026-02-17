package com.buddhist.uposatha.innertube.models.body

import com.buddhist.uposatha.innertube.models.Context
import kotlinx.serialization.Serializable

@Serializable
data class BrowseBody(
    val context: Context,
    val browseId: String?,
    val params: String?,
    val continuation: String?
)

