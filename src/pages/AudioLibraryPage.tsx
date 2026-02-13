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
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonIcon,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonSkeletonText,
    IonText,
    IonCard,
    IonCardContent
} from '@ionic/react';
import { searchOutline, optionsOutline, play, musicalNote } from 'ionicons/icons';
import { AudioService } from '../services/audio/AudioService';
import { LocalAudioDataService } from '../services/audio/LocalAudioDataService';
import { AudioTrack, AudioChannel } from '../types/audio/AudioTypes';
import { useAudio } from '../context/AudioContext';

const AudioLibraryPage: React.FC = () => {
    const { playTrack } = useAudio();
    const [searchQuery, setSearchQuery] = useState('');
    const [channels, setChannels] = useState<AudioChannel[]>([]);
    const [featuredTracks, setFeaturedTracks] = useState<AudioTrack[]>([]);
    const [recentTracks, setRecentTracks] = useState<AudioTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchResults, setSearchResults] = useState<AudioTrack[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const PRIMARY_CHANNEL_ID = '@Pancasikha-358'; // Pañcasikha

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load subscribed channels
            const subIds = await LocalAudioDataService.getSubscribedChannels();
            const channelInfos = await Promise.all(
                subIds.map(id => AudioService.getChannelInfo(id))
            );
            setChannels(channelInfos.filter(c => c !== null) as AudioChannel[]);

            // Load primary channel videos
            const pVideos = await AudioService.getChannelVideos(PRIMARY_CHANNEL_ID, 15);
            setFeaturedTracks(pVideos.slice(0, 5));
            setRecentTracks(pVideos.slice(5));
        } catch (error) {
            console.error('Error loading library data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBrowseChannel = async (channelId: string) => {
        setLoading(true);
        try {
            const videos = await AudioService.getChannelVideos(channelId, 20);
            setRecentTracks(videos);
        } catch (error) {
            console.error('Error browsing channel:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (!val.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const results = await AudioService.search(val);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>Dhamma Audio</IonTitle>
                    <IonButtons slot="end">
                        <IonButton size="small">
                            <IonIcon icon={optionsOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar
                        value={searchQuery}
                        onIonInput={e => handleSearch(e.detail.value!)}
                        placeholder="Search suttas, topics, channels..."
                        style={{ '--border-radius': '12px', padding: '0 16px 8px 16px' }}
                    />
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                {isSearching ? (
                    <div className="search-results">
                        <h3 style={{ margin: '16px 0 16px 0', fontSize: '1.2rem', fontWeight: '700' }}>Search Results</h3>
                        <IonList lines="none">
                            {searchResults.map(track => (
                                <IonItem
                                    key={track.id}
                                    button
                                    onClick={() => playTrack(track, searchResults)}
                                    style={{ '--padding-start': '0', marginBottom: '8px' }}
                                >
                                    <IonThumbnail slot="start" style={{ width: '80px', height: '45px', borderRadius: '8px', overflow: 'hidden' }}>
                                        <img src={track.thumbnail} alt={track.title} style={{ objectFit: 'cover' }} />
                                    </IonThumbnail>
                                    <IonLabel className="ion-text-wrap">
                                        <h2 style={{ fontSize: '0.9rem', fontWeight: '500' }}>{track.title}</h2>
                                        <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{track.channelTitle}</p>
                                    </IonLabel>
                                </IonItem>
                            ))}
                        </IonList>
                    </div>
                ) : (
                    <>
                        <div className="featured-section">
                            <h3 style={{ margin: '16px 0 12px 0', fontSize: '1.2rem', fontWeight: '700' }}>Featured Today</h3>
                            <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '16px', scrollSnapType: 'x mandatory' }}>
                                {loading ? [1, 2, 3].map(i => (
                                    <div key={i} style={{ minWidth: '280px', scrollSnapAlign: 'start' }}>
                                        <IonSkeletonText animated style={{ width: '100%', height: '160px', borderRadius: '16px' }} />
                                    </div>
                                )) : featuredTracks.map(track => (
                                    <IonCard
                                        key={track.id}
                                        style={{
                                            minWidth: '280px',
                                            margin: '0',
                                            borderRadius: '16px',
                                            scrollSnapAlign: 'start',
                                            boxShadow: 'none',
                                            border: '1px solid rgba(var(--ion-color-step-200-rgb), 0.5)'
                                        }}
                                        onClick={() => playTrack(track, featuredTracks)}
                                    >
                                        <img src={track.thumbnail} alt={track.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                                        <IonCardContent style={{ padding: '12px' }}>
                                            <h2 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--ion-color-dark)', marginBottom: '4px' }}>{track.title}</h2>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{track.channelTitle}</p>
                                        </IonCardContent>
                                    </IonCard>
                                ))}
                            </div>
                        </div>

                        <div className="channels-section" style={{ marginTop: '24px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700' }}>Channels</h3>
                            <IonList lines="none">
                                {loading ? [1].map(i => (
                                    <IonItem key={i}><IonSkeletonText animated style={{ width: '100%', height: '60px' }} /></IonItem>
                                )) : channels.map(channel => (
                                    <IonItem
                                        key={channel.id}
                                        button
                                        onClick={() => handleBrowseChannel(channel.id)}
                                        style={{ '--padding-start': '0' }}
                                    >
                                        <IonThumbnail slot="start" style={{ width: '48px', height: '48px', margin: '4px' }}>
                                            <img src={channel.logo} alt={channel.name} style={{ borderRadius: '50%' }} />
                                        </IonThumbnail>
                                        <IonLabel>
                                            <h2 style={{ fontWeight: '600' }}>{channel.name}</h2>
                                            <p>Dhamma Recordings</p>
                                        </IonLabel>
                                        <IonButton fill="clear" slot="end" size="small">Browse</IonButton>
                                    </IonItem>
                                ))}
                                <IonButton fill="outline" expand="block" style={{ marginTop: '12px', '--border-radius': '12px' }}>
                                    Add More Channels
                                </IonButton>
                            </IonList>
                        </div>

                        <div className="recent-section" style={{ marginTop: '32px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700' }}>Recently Added</h3>
                            <IonList lines="none">
                                {loading ? [1, 2, 3].map(i => (
                                    <IonItem key={i}><IonSkeletonText animated style={{ width: '100%', height: '50px' }} /></IonItem>
                                )) : recentTracks.map(track => (
                                    <IonItem
                                        key={track.id}
                                        button
                                        onClick={() => playTrack(track, recentTracks)}
                                        style={{ '--padding-start': '0', marginBottom: '8px' }}
                                    >
                                        <IonThumbnail slot="start" style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden' }}>
                                            <img src={track.thumbnail} alt={track.title} style={{ objectFit: 'cover' }} />
                                        </IonThumbnail>
                                        <IonLabel className="ion-text-wrap">
                                            <h2 style={{ fontSize: '0.9rem', fontWeight: '500' }}>{track.title}</h2>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{track.channelTitle}</p>
                                        </IonLabel>
                                        <IonIcon icon={play} slot="end" color="medium" style={{ fontSize: '1.2rem' }} />
                                    </IonItem>
                                ))}
                            </IonList>
                        </div>
                    </>
                )}
            </IonContent>
        </IonPage>
    );
};

export default AudioLibraryPage;
