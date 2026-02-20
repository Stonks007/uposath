import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonSearchbar,
    IonIcon,
    IonSpinner
} from '@ionic/react';
import { musicalNotes, search as searchIcon } from 'ionicons/icons';
import { DhammaAudio, VideoInfo, PlaybackState } from '../plugins/dhamma-audio';
import { useHistory } from 'react-router-dom';
import './AudioLibraryPage.css';

const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const SkeletonLoader: React.FC = () => (
    <div className="library-skeleton">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="library-skeleton-card">
                <div className="library-skeleton-thumb" />
                <div className="library-skeleton-lines">
                    <div className="library-skeleton-line" />
                    <div className="library-skeleton-line library-skeleton-line--short" />
                    <div className="library-skeleton-line library-skeleton-line--shorter" />
                </div>
            </div>
        ))}
    </div>
);

const AudioLibraryPage: React.FC = () => {
    const history = useHistory();
    const [videos, setVideos] = useState<VideoInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

    const PANCASIKHA_CHANNEL_ID = 'UC0ypu1lL-Srd4O7XHjtIQrg';

    useEffect(() => {
        loadVideos();

        // Track currently playing video
        const listener = DhammaAudio.addListener('playbackStateChanged', (state: PlaybackState) => {
            setCurrentVideoId(state.currentVideo?.id || null);
        });

        // Load initial playing state
        DhammaAudio.getPlaybackState().then(state => {
            setCurrentVideoId(state.currentVideo?.id || null);
        }).catch(() => { });

        return () => {
            listener.then(l => l.remove());
        };
    }, []);

    const loadVideos = async () => {
        try {
            setLoading(true);
            const result = await DhammaAudio.getChannelVideos({
                channelId: PANCASIKHA_CHANNEL_ID,
                page: 1
            });
            setVideos(result.videos);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load videos:', err);
            setLoading(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchText(query);
        if (query.length > 2) {
            try {
                setLoading(true);
                const result = await DhammaAudio.search({ query });
                setVideos(result.videos);
                setLoading(false);
            } catch (err) {
                console.error('Search failed:', err);
                setLoading(false);
            }
        } else if (query.length === 0) {
            loadVideos();
        }
    };

    const playVideo = (video: VideoInfo) => {
        DhammaAudio.playVideo({ video });
        history.push('/player');
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>Dhamma Library</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonSearchbar
                    value={searchText}
                    onIonInput={(e: any) => handleSearch(e.target.value)}
                    placeholder="Search chants & talks..."
                    debounce={1000}
                    className="library-searchbar"
                />

                {loading ? (
                    <SkeletonLoader />
                ) : videos.length === 0 ? (
                    <div className="library-empty">
                        <IonIcon icon={musicalNotes} className="library-empty-icon" />
                        <span className="library-empty-text">No tracks found</span>
                    </div>
                ) : (
                    <div className="library-list">
                        {videos.map(video => {
                            const isPlaying = currentVideoId === video.id;
                            return (
                                <div
                                    key={video.id}
                                    className={`library-card ${isPlaying ? 'library-card--playing' : ''}`}
                                    onClick={() => playVideo(video)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0' }}>
                                        {/* Now playing dot */}
                                        {isPlaying && <div className="library-now-playing-dot" />}

                                        {/* Thumbnail */}
                                        <div className="library-thumb-wrapper">
                                            {video.thumbnailUrl ? (
                                                <img src={video.thumbnailUrl} alt="" className="library-thumb" />
                                            ) : (
                                                <div className="library-thumb-placeholder">
                                                    <IonIcon icon={musicalNotes} />
                                                </div>
                                            )}
                                            {video.duration > 0 && (
                                                <span className="library-duration-badge">
                                                    {formatDuration(video.duration)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Text */}
                                        <div className="library-card-content">
                                            <h3 className="library-card-title">{video.title}</h3>
                                            <p className="library-card-meta">
                                                {video.channelName}
                                                {video.duration > 0 && ` · ${Math.floor(video.duration / 60)} min`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default AudioLibraryPage;
