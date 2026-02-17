package com.buddhist.uposatha.innertube.models.body

import com.buddhist.uposatha.innertube.models.Context
import kotlinx.serialization.Serializable

@Serializable
data class GetSearchSuggestionsBody(
    val context: Context,
    val input: String,
)

