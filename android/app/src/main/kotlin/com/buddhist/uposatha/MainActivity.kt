package com.buddhist.uposatha

import android.os.Bundle
import com.buddhist.uposatha.audio.DhammaAudioPlugin
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(DhammaAudioPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
