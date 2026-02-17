package com.buddhist.uposatha.db.dao

import androidx.room.*
import com.buddhist.uposatha.db.entities.VideoWithPosition
import com.buddhist.uposatha.db.entities.Playlist
import com.buddhist.uposatha.db.entities.PlaylistVideo
import com.buddhist.uposatha.db.entities.Video

@Dao
interface PlaylistDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertPlaylist(playlist: Playlist)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertPlaylistVideo(playlistVideo: PlaylistVideo)

    @Query("SELECT * FROM playlists ORDER BY updatedAt DESC")
    fun getAllPlaylists(): List<Playlist>

    @Transaction
    @Query("SELECT v.*, pv.position FROM videos v INNER JOIN playlist_videos pv ON v.videoId = pv.videoId WHERE pv.playlistId = :playlistId ORDER BY pv.position ASC")
    fun getVideosInPlaylist(playlistId: String): List<VideoWithPosition>

    @Query("SELECT COUNT(*) FROM playlist_videos WHERE playlistId = :playlistId")
    fun getPlaylistCount(playlistId: String): Int

    @Query("DELETE FROM playlist_videos WHERE playlistId = :playlistId AND videoId = :videoId")
    fun removeVideoFromPlaylist(playlistId: String, videoId: String)

    @Delete
    fun deletePlaylist(playlist: Playlist)
}
