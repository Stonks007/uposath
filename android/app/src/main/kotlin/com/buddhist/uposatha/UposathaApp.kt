package com.buddhist.uposatha

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class UposathaApp : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
    }

    companion object {
        lateinit var instance: UposathaApp
            private set
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            "uposatha_audio_channel",
            "Dhamma Audio Playback",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Background audio playback foreground service"
        }

        val manager = getSystemService(NotificationManager::class.java)
        manager?.createNotificationChannel(channel)
    }
}
