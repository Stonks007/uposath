package com.buddhist.uposatha.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.buddhist.uposatha.db.dao.*
import com.buddhist.uposatha.db.entities.*

@Database(
    entities = [
        Video::class,
        PlaybackHistory::class,
        Channel::class,
        Playlist::class,
        PlaylistVideo::class
    ],
    version = 1,
    exportSchema = false
)
abstract class UposathaAudioDatabase : RoomDatabase() {
    abstract fun videoDao(): VideoDao
    abstract fun playbackHistoryDao(): PlaybackHistoryDao
    abstract fun channelDao(): ChannelDao
    abstract fun playlistDao(): PlaylistDao

    companion object {
        @Volatile
        private var INSTANCE: UposathaAudioDatabase? = null

        fun getDatabase(context: Context): UposathaAudioDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    UposathaAudioDatabase::class.java,
                    "uposath_audio_db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
