package com.buddhist.uposatha.innertube.models

import kotlinx.serialization.Serializable

@Serializable
data class YTText(
    val simpleText: String? = null,
    val runs: List<Run>? = null,
) {
    val text: String?
        get() = simpleText ?: runs?.firstOrNull()?.text
}
