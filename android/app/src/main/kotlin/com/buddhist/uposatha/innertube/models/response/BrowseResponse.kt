package com.buddhist.uposatha.innertube.models.response

import com.buddhist.uposatha.innertube.models.Button
import com.buddhist.uposatha.innertube.models.Continuation
import com.buddhist.uposatha.innertube.models.GridRenderer
import com.buddhist.uposatha.innertube.models.Menu
import com.buddhist.uposatha.innertube.models.MusicDetailHeaderRenderer
import com.buddhist.uposatha.innertube.models.MusicEditablePlaylistDetailHeaderRenderer
import com.buddhist.uposatha.innertube.models.MusicShelfRenderer
import com.buddhist.uposatha.innertube.models.MusicTwoRowItemRenderer
import com.buddhist.uposatha.innertube.models.ResponseContext
import com.buddhist.uposatha.innertube.models.Runs
import com.buddhist.uposatha.innertube.models.SectionListRenderer
import com.buddhist.uposatha.innertube.models.SubscriptionButton
import com.buddhist.uposatha.innertube.models.Tabs
import com.buddhist.uposatha.innertube.models.Thumbnails
import com.buddhist.uposatha.innertube.models.ThumbnailRenderer
import com.buddhist.uposatha.innertube.models.YTText
import kotlinx.serialization.Serializable

@Serializable
data class BrowseResponse(
    val contents: Contents?,
    val continuationContents: ContinuationContents?,
    val onResponseReceivedActions: List<ResponseAction>?,
    val header: Header?,
    val microformat: Microformat?,
    val responseContext: ResponseContext,
    val background: ThumbnailRenderer?
) {
    @Serializable
    data class Contents(
        val singleColumnBrowseResultsRenderer: Tabs?,
        val sectionListRenderer: SectionListRenderer?,
        val twoColumnBrowseResultsRenderer: TwoColumnBrowseResultsRenderer?,
    )

    @Serializable
    data class TwoColumnBrowseResultsRenderer(
        val tabs: List<Tabs.Tab?>?,
        val secondaryContents: SecondaryContents?,
    )
    @Serializable
    data class SecondaryContents(
        val sectionListRenderer: SectionListRenderer?,
    )

    @Serializable
    data class ContinuationContents(
        val sectionListContinuation: SectionListContinuation?,
        val itemSectionContinuation: SectionListContinuation?,
        val musicPlaylistShelfContinuation: MusicPlaylistShelfContinuation?,
        val gridContinuation: GridContinuation?,
        val musicShelfContinuation: MusicShelfRenderer?
    ) {
        @Serializable
        data class SectionListContinuation(
            val contents: List<SectionListRenderer.Content>,
            val continuations: List<Continuation>?,
        )

        @Serializable
        data class MusicPlaylistShelfContinuation(
            val contents: List<MusicShelfRenderer.Content>,
            val continuations: List<Continuation>?,
        )

        @Serializable
        data class GridContinuation(
            val items: List<Item>,
            val continuations: List<Continuation>?,
        ) {
            @Serializable
            data class Item(
                val musicTwoRowItemRenderer: MusicTwoRowItemRenderer? = null,
                val videoRenderer: VideoRenderer? = null,
            )
        }
    }

    @Serializable
    data class ResponseAction(
        val appendContinuationItemsAction: ContinuationItems?,
    ) {
        @Serializable
        data class ContinuationItems(
            val continuationItems: List<MusicShelfRenderer.Content>?,
        )
    }

    @Serializable
    data class Header(
        val musicImmersiveHeaderRenderer: MusicImmersiveHeaderRenderer?,
        val musicDetailHeaderRenderer: MusicDetailHeaderRenderer?,
        val musicEditablePlaylistDetailHeaderRenderer: MusicEditablePlaylistDetailHeaderRenderer?,
        val musicVisualHeaderRenderer: MusicVisualHeaderRenderer?,
        val musicHeaderRenderer: MusicHeaderRenderer?,
    ) {
        @Serializable
        data class MusicImmersiveHeaderRenderer(
            val title: Runs,
            val description: Runs?,
            val thumbnail: ThumbnailRenderer?,
            val playButton: Button?,
            val startRadioButton: Button?,
            val subscriptionButton: SubscriptionButton?,
            val menu: Menu,
        )

        @Serializable
        data class MusicVisualHeaderRenderer(
            val title: Runs,
            val foregroundThumbnail: ThumbnailRenderer,
            val thumbnail: ThumbnailRenderer?,
        )

        @Serializable
        data class Buttons(
            val menuRenderer: Menu.MenuRenderer?,
        )

        @Serializable
        data class MusicHeaderRenderer(
            val buttons: List<Buttons>?,
            val title: Runs?,
            val thumbnail: MusicThumbnailRenderer?,
            val subtitle: Runs?,
            val secondSubtitle: Runs?,
            val straplineTextOne: Runs?,
            val straplineThumbnail: MusicThumbnailRenderer?,
        )
        @Serializable
        data class MusicThumbnail(
            val url: String?,
        )
        @Serializable
        data class MusicThumbnailRenderer(
            val musicThumbnailRenderer: MusicThumbnailRenderer,
            val thumbnails: List<MusicThumbnail>?,
        )
    }

    @Serializable
    data class VideoRenderer(
        val videoId: String,
        val thumbnail: Thumbnails,
        val title: YTText,
        val longBylineText: YTText? = null,
        val shortBylineText: YTText? = null,
        val lengthText: YTText? = null,
        val viewCountText: YTText? = null,
        val publishedTimeText: YTText? = null,
    )

    @Serializable
    data class GridVideoRenderer(
        val videoId: String,
        val thumbnail: Thumbnails,
        val title: YTText,
        val shortBylineText: YTText? = null,
        val viewCountText: YTText? = null,
        val publishedTimeText: YTText? = null,
        val thumbnailOverlays: List<ThumbnailOverlay>? = null,
    ) {
        @Serializable
        data class ThumbnailOverlay(
            val thumbnailOverlayTimeStatusRenderer: ThumbnailOverlayTimeStatusRenderer?,
        ) {
            @Serializable
            data class ThumbnailOverlayTimeStatusRenderer(
                val text: YTText,
            )
        }
    }

    @Serializable
    data class ReelItemRenderer(
        val videoId: String,
        val thumbnail: Thumbnails,
        val headline: YTText,
        val viewCountText: YTText? = null,
    )

    @Serializable
    data class Microformat(
        val microformatDataRenderer: MicroformatDataRenderer?,
    ) {
        @Serializable
        data class MicroformatDataRenderer(
            val urlCanonical: String?,
        )
    }
}

