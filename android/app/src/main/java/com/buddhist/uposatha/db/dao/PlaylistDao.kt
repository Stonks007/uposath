package com.buddhist.uposatha.db.dao

import androidx.room.*
import com.buddhist.uposatha.db.entities.Playlist
import com.buddhist.uposatha.db.entities.PlaylistVideo
import com.buddhist.uposatha.db.entities.Video

@Dao
interface PlaylistDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlaylist(playlist: Playlist)

    @Query("SELECT * FROM playlists")
    suspend fun getAllPlaylists(): List<Playlist>

    @Query("SELECT * FROM playlists WHERE playlistId = :playlistId")
    suspend fun getPlaylistById(playlistId: String): Playlist?

    @Query("DELETE FROM playlists WHERE playlistId = :playlistId")
    suspend fun deletePlaylist(playlistId: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addVideoToPlaylist(playlistVideo: PlaylistVideo)

    @Query("DELETE FROM playlist_videos WHERE playlistId = :playlistId AND videoId = :videoId")
    suspend fun removeVideoFromPlaylist(playlistId: String, videoId: String)

    @Query("""
        SELECT v.* FROM videos v
        INNER JOIN playlist_videos pv ON v.videoId = pv.videoId
        WHERE pv.playlistId = :playlistId
        ORDER BY pv.position ASC
    """)
    suspend fun getPlaylistVideos(playlistId: String): List<Video>
}
