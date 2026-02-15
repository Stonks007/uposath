package com.buddhist.uposatha.audio;

import android.content.Context;
import org.schabi.newpipe.extractor.NewPipe;
import org.schabi.newpipe.extractor.ServiceList;
import org.schabi.newpipe.extractor.StreamingService;
import org.schabi.newpipe.extractor.channel.ChannelExtractor;
import org.schabi.newpipe.extractor.channel.ChannelInfo;
import org.schabi.newpipe.extractor.channel.tabs.ITabInfo;
import org.schabi.newpipe.extractor.exceptions.ExtractionException;
import org.schabi.newpipe.extractor.services.youtube.YoutubeService;
import org.schabi.newpipe.extractor.stream.AudioStream;
import org.schabi.newpipe.extractor.stream.StreamExtractor;
import org.schabi.newpipe.extractor.stream.StreamInfo;
import org.schabi.newpipe.extractor.stream.StreamInfoItem;
import org.schabi.newpipe.extractor.search.SearchExtractor;
import org.schabi.newpipe.extractor.search.SearchInfo;
import org.schabi.newpipe.extractor.InfoItem;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NewPipeExtractorService {
    private static NewPipeExtractorService instance;
    private final StreamingService youtubeService;
    private final ExecutorService executor;
    private boolean initialized = false;

    private NewPipeExtractorService() {
        this.youtubeService = ServiceList.YouTube;
        this.executor = Executors.newFixedThreadPool(4);
    }

    public static synchronized NewPipeExtractorService getInstance() {
        if (instance == null) {
            instance = new NewPipeExtractorService();
        }
        return instance;
    }

    public void initialize(Context context) {
        if (!initialized) {
            // In a real implementation, you'd need a Downloader (e.g. OkHttpDownloader)
            // For now, we initialize NewPipe
            // NewPipe.init(new OkHttpDownloader());
            initialized = true;
        }
    }

    public interface Callback<T> {
        void onSuccess(T result);
        void onError(Exception e);
    }

    public void getChannelInfo(String channelUrl, Callback<ChannelInfo> callback) {
        executor.execute(() -> {
            try {
                ChannelInfo info = ChannelInfo.getInfo(youtubeService, channelUrl);
                callback.onSuccess(info);
            } catch (Exception e) {
                callback.onError(e);
            }
        });
    }

    public void getChannelVideos(String channelUrl, Callback<List<StreamInfoItem>> callback) {
        executor.execute(() -> {
            try {
                ChannelExtractor extractor = (ChannelExtractor) youtubeService.getChannelExtractor(channelUrl);
                extractor.fetchPage();
                List<InfoItem> items = extractor.getInitialPage().getItems();
                List<StreamInfoItem> videos = new ArrayList<>();
                for (InfoItem item : items) {
                    if (item instanceof StreamInfoItem) {
                        videos.add((StreamInfoItem) item);
                    }
                }
                callback.onSuccess(videos);
            } catch (Exception e) {
                callback.onError(e);
            }
        });
    }

    public void getVideoStreamInfo(String videoUrl, Callback<StreamInfo> callback) {
        executor.execute(() -> {
            try {
                StreamInfo info = StreamInfo.getInfo(youtubeService, videoUrl);
                callback.onSuccess(info);
            } catch (Exception e) {
                callback.onError(e);
            }
        });
    }

    public void searchInChannel(String channelUrl, String query, Callback<List<StreamInfoItem>> callback) {
        executor.execute(() -> {
            try {
                // Simplified search within channel logic
                SearchExtractor extractor = youtubeService.getSearchExtractor(query);
                extractor.fetchPage();
                List<InfoItem> items = extractor.getInitialPage().getItems();
                List<StreamInfoItem> videos = new ArrayList<>();
                for (InfoItem item : items) {
                    if (item instanceof StreamInfoItem) {
                        videos.add((StreamInfoItem) item);
                    }
                }
                callback.onSuccess(videos);
            } catch (Exception e) {
                callback.onError(e);
            }
        });
    }
}
