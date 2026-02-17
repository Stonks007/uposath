package com.buddhist.uposatha.innertube.models.body

import com.buddhist.uposatha.innertube.models.Context
import kotlinx.serialization.Serializable

@Serializable
data class SearchBody(
    val context: Context,
    val query: String?,
    val params: String?,
)

