import React, { useState, useEffect, useRef } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonSpinner,
    IonButton,
    IonModal,
    IonInput,
    IonLabel,
    IonActionSheet,
    useIonViewWillEnter,
} from '@ionic/react';
import { addCircleOutline, musicalNotes, close, checkmarkCircle, trashOutline, starOutline } from 'ionicons/icons';
import { DhammaAudio, VideoInfo, ChannelSectionResult } from '../plugins/dhamma-audio';
import { useHistory } from 'react-router-dom';
import {
    SavedChannel,
    ensureSeeded,
    getChannels,
    addChannel,
    removeChannel,
    setDefault,
    getDefaultChannel,
} from '../services/channelManager';
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
    const [channels, setChannels] = useState<SavedChannel[]>([]);
    const [activeChannel, setActiveChannel] = useState<SavedChannel | null>(null);
    const [sections, setSections] = useState<ChannelSectionResult[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addUrl, setAddUrl] = useState('');
    const [resolving, setResolving] = useState(false);
    const [actionChannel, setActionChannel] = useState<SavedChannel | null>(null);
    const longPressTimer = useRef<any>(null);

    useIonViewWillEnter(() => {
        loadChannels();
    });

    useEffect(() => {
        const listener = DhammaAudio.addListener('playbackStateChanged', (state) => {
            setCurrentVideoId(state.currentVideo?.id || null);
        });
        DhammaAudio.getPlaybackState().then(state => {
            setCurrentVideoId(state.currentVideo?.id || null);
        }).catch(() => { });
        return () => { listener.then(l => l.remove()); };
    }, []);

    const loadChannels = async () => {
        setLoading(true);
        const ch = await ensureSeeded();
        setChannels(ch);
        const def = ch.find(c => c.isDefault) || ch[0] || null;
        if (def) {
            await loadChannelContent(def);
        } else {
            setLoading(false);
        }
    };

    const loadChannelContent = async (channel: SavedChannel) => {
        setActiveChannel(channel);
        setActiveTab(0);
        setLoading(true);
        try {
            const result = await DhammaAudio.getChannelPage({ channelId: channel.id });
            setSections(result.sections || []);
            // Update channel name/avatar if we got fresh data
            if (result.channelName && result.channelName !== channel.name) {
                channel.name = result.channelName;
                channel.avatarUrl = result.channelAvatar || '';
            }
        } catch (err) {
            console.error('Failed to load channel:', err);
            setSections([]);
        }
        setLoading(false);
    };

    const handleAddChannel = async () => {
        if (!addUrl.trim()) return;
        setResolving(true);
        try {
            const info = await DhammaAudio.resolveChannelUrl({ url: addUrl.trim() });
            const ch: SavedChannel = {
                id: info.id,
                name: info.name,
                avatarUrl: info.avatarUrl || '',
                isDefault: false,
            };
            const updated = await addChannel(ch);
            setChannels(updated);
            setShowAddModal(false);
            setAddUrl('');
            await loadChannelContent(ch);
        } catch (err) {
            console.error('Failed to resolve channel:', err);
            alert('Could not resolve channel URL. Please try a different format.');
        }
        setResolving(false);
    };

    const handleRemoveChannel = async (id: string) => {
        const updated = await removeChannel(id);
        setChannels(updated);
        if (activeChannel?.id === id) {
            if (updated.length > 0) {
                await loadChannelContent(updated[0]);
            } else {
                setActiveChannel(null);
                setSections([]);
            }
        }
    };

    const handleSetDefault = async (id: string) => {
        const updated = await setDefault(id);
        setChannels(updated);
    };

    const playVideo = (video: VideoInfo) => {
        DhammaAudio.playVideo({ video });
        history.push('/player');
    };

    const handleLongPressStart = (channel: SavedChannel) => {
        longPressTimer.current = setTimeout(() => {
            setActionChannel(channel);
        }, 500);
    };

    const handleLongPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const currentSection = sections[activeTab];

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle>Dhamma Library</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {channels.length === 0 && !loading ? (
                    /* Empty State */
                    <div className="library-empty-state">
                        <IonIcon icon={musicalNotes} className="library-empty-icon" />
                        <h2>Add a Dhamma talk channel to begin</h2>
                        <p>Paste a YouTube channel URL to start listening</p>
                        <IonButton
                            fill="clear"
                            className="library-add-btn-large"
                            onClick={() => setShowAddModal(true)}
                        >
                            <IonIcon icon={addCircleOutline} slot="start" />
                            Add Channel
                        </IonButton>
                    </div>
                ) : (
                    <>
                        {/* Channel Strip */}
                        <div className="channel-strip">
                            <div className="channel-strip-scroll">
                                {channels.map(ch => (
                                    <div
                                        key={ch.id}
                                        className={`channel-avatar-item ${activeChannel?.id === ch.id ? 'active' : ''}`}
                                        onClick={() => loadChannelContent(ch)}
                                        onMouseDown={() => handleLongPressStart(ch)}
                                        onMouseUp={handleLongPressEnd}
                                        onMouseLeave={handleLongPressEnd}
                                        onTouchStart={() => handleLongPressStart(ch)}
                                        onTouchEnd={handleLongPressEnd}
                                    >
                                        <div className="channel-avatar">
                                            {ch.avatarUrl ? (
                                                <img src={ch.avatarUrl} alt={ch.name} />
                                            ) : (
                                                <div className="channel-avatar-placeholder">
                                                    {ch.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {ch.isDefault && <div className="channel-default-dot" />}
                                        </div>
                                        <span className="channel-name">{ch.name}</span>
                                    </div>
                                ))}
                                <div
                                    className="channel-avatar-item channel-add-item"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <div className="channel-avatar channel-add-avatar">
                                        <IonIcon icon={addCircleOutline} />
                                    </div>
                                    <span className="channel-name">Add</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {!loading && sections.length > 0 && (
                            <div className="content-tabs">
                                {sections.map((section, idx) => (
                                    <button
                                        key={idx}
                                        className={`content-tab ${activeTab === idx ? 'active' : ''}`}
                                        onClick={() => setActiveTab(idx)}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Video List */}
                        {loading ? (
                            <SkeletonLoader />
                        ) : currentSection && currentSection.videos.length > 0 ? (
                            <div className="library-list">
                                {currentSection.videos.map(video => {
                                    const isPlaying = currentVideoId === video.id;
                                    return (
                                        <div
                                            key={video.id}
                                            className={`library-card ${isPlaying ? 'library-card--playing' : ''}`}
                                            onClick={() => playVideo(video)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0' }}>
                                                {isPlaying && <div className="library-now-playing-dot" />}
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
                        ) : (
                            <div className="library-empty">
                                <IonIcon icon={musicalNotes} className="library-empty-icon" />
                                <span className="library-empty-text">No content found</span>
                            </div>
                        )}
                    </>
                )}

                {/* Add Channel Modal */}
                <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)} className="add-channel-modal">
                    <div className="add-channel-content">
                        <div className="add-channel-header">
                            <h2>Add Channel</h2>
                            <IonButton fill="clear" onClick={() => setShowAddModal(false)}>
                                <IonIcon icon={close} />
                            </IonButton>
                        </div>
                        <p className="add-channel-hint">
                            Paste any YouTube channel URL
                        </p>
                        <IonInput
                            value={addUrl}
                            onIonInput={(e: any) => setAddUrl(e.target.value)}
                            placeholder="https://youtube.com/@ChannelName"
                            className="add-channel-input"
                            clearInput
                        />
                        <IonButton
                            expand="block"
                            className="add-channel-submit"
                            disabled={!addUrl.trim() || resolving}
                            onClick={handleAddChannel}
                        >
                            {resolving ? <IonSpinner name="crescent" /> : (
                                <>
                                    <IonIcon icon={checkmarkCircle} slot="start" />
                                    Add Channel
                                </>
                            )}
                        </IonButton>
                    </div>
                </IonModal>

                {/* Long-press action sheet */}
                <IonActionSheet
                    isOpen={!!actionChannel}
                    onDidDismiss={() => setActionChannel(null)}
                    header={actionChannel?.name || ''}
                    buttons={[
                        {
                            text: 'Set as Default',
                            icon: starOutline,
                            handler: () => { if (actionChannel) handleSetDefault(actionChannel.id); },
                        },
                        {
                            text: 'Remove Channel',
                            icon: trashOutline,
                            role: 'destructive',
                            handler: () => { if (actionChannel) handleRemoveChannel(actionChannel.id); },
                        },
                        { text: 'Cancel', role: 'cancel' },
                    ]}
                />
            </IonContent>
        </IonPage>
    );
};

export default AudioLibraryPage;
