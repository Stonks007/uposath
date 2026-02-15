import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonImg,
    IonButtons,
    IonBackButton,
    IonSearchbar,
    IonSpinner,
    IonText
} from '@ionic/react';
import { DhammaAudio, VideoInfo } from '../plugins/dhamma-audio';
import { useHistory } from 'react-router-dom';

const AudioLibraryPage: React.FC = () => {
    const history = useHistory();
    const [videos, setVideos] = useState<VideoInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // Pañcasikha Channel ID URL
    const PANCASIKHA_CHANNEL_URL = 'https://www.youtube.com/@Pañcasikha-358';

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {
            setLoading(true);
            const result = await DhammaAudio.getChannelVideos({
                channelId: PANCASIKHA_CHANNEL_URL,
                page: 1
            });
            setVideos(result.videos);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load videos:', err);
            setLoading(false);
        }
    };

    const playVideo = (video: VideoInfo) => {
        DhammaAudio.playVideo({ videoId: video.id });
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
                <IonToolbar>
                    <IonSearchbar
                        value={searchText}
                        onIonInput={(e: any) => setSearchText(e.target.value)}
                        placeholder="Search chants..."
                    />
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {loading ? (
                    <div className="ion-text-center ion-padding">
                        <IonSpinner name="crescent" />
                        <p>Gathering Dhamma...</p>
                    </div>
                ) : (
                    <IonList>
                        {videos.filter(v => v.title.toLowerCase().includes(searchText.toLowerCase())).map(video => (
                            <IonItem key={video.id} button onClick={() => playVideo(video)} detail={false}>
                                <IonThumbnail slot="start" style={{ '--border-radius': '8px' }}>
                                    <IonImg src={video.thumbnailUrl} />
                                </IonThumbnail>
                                <IonLabel>
                                    <IonText className="ion-text-wrap">
                                        <h2 style={{ fontWeight: 600 }}>{video.title}</h2>
                                    </IonText>
                                    <p>{video.channelName} • {Math.floor(video.duration / 60)}m</p>
                                </IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                )}
            </IonContent>
        </IonPage>
    );
};

export default AudioLibraryPage;
