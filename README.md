<div align="center">
  <br>
  <img src="assets/icon.png" width="140" height="140" alt="Uposath Logo" style="border-radius: 28px;">
  <br><br>

  # 🪷 Uposath

  **A Modern Sanctuary for Buddhist Practice & Observance**

  *Bridging ancient Dhamma wisdom with state-of-the-art mobile technology*

  <br>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
  [![Framework: Ionic](https://img.shields.io/badge/Framework-Ionic-3880ff?style=for-the-badge&logo=ionic)](https://ionicframework.com/)
  [![UI: React](https://img.shields.io/badge/UI-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Language: TypeScript](https://img.shields.io/badge/Lang-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Platform: Android](https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
  [![Backend: Kotlin](https://img.shields.io/badge/Native-Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org/)

  <br>

  [![Download APK](https://img.shields.io/badge/Download-APK_v1.0.0-success?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Stonks007/uposath/releases/download/v1.0.0/Uposatha-v1.0.0.apk)

  <br>

  <sub>*"Appamādo amatapadaṃ" — Heedfulness is the path to the Deathless.*<br>— Dhammapada 21</sub>

</div>

<br>

---

<details>
<summary><b>📖 Table of Contents</b></summary>

- [Overview](#-overview)
- [App Preview](#-app-preview)
- [Feature Showcase](#-feature-showcase)
- [Tech Stack & Architecture](#%EF%B8%8F-tech-stack--architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Available Scripts](#-available-scripts)
- [Data & Backup](#-data--backup)
- [Contributing](#-contributing)
- [Acknowledgments](#-acknowledgments)
- [License](#-license)

</details>

---

## 🌟 Overview

**Uposath** is a premium, open-source mobile application crafted for Buddhist practitioners. It provides an integrated suite of tools for tracking **Uposatha observance days**, engaging with ancient meditation techniques, studying the **Dhammapada**, and listening to curated Dhamma audio — all wrapped in a serene **dark glassmorphism** interface designed to minimize distraction and maximize mindfulness.

> 🧘 *One app. All traditions. Daily practice, beautifully tracked.*

### Why Uposath?

| 💡 Problem | ✅ Uposath Solution |
|---|---|
| Multi-tradition Support | Unified engine for **Theravāda**, **Mahāyāna** (Chinese lunar), and **Vajrayāna** (Tibetan lunar) |
| No way to track observance consistency | Visual heatmaps, streaks, and moon-phase breakdown statistics |
| Generic meditation timers | Purpose-built **Ānāpānasati** and **Śūnyatā** timers with zen bell cues and step guidance |
| Mantra counters lack depth | Digital mālā with custom deity mantras, per-mantra stats, and tradition tagging |
| Dhamma audio needs multiple apps | Native background playback with **ExoPlayer**, intelligent caching, and YouTube integration |

---

## 📸 App Preview

<div align="center">
  <table style="border-collapse: collapse; border: none;">
    <tr>
      <td align="center"><b>Home</b></td>
      <td align="center"><b>Calendar</b></td>
      <td align="center"><b>Festivals</b></td>
      <td align="center"><b>Mindfulness (Sati)</b></td>
    </tr>
    <tr>
      <td><img src="src/screenshots/home.jpeg" width="200" style="border-radius: 12px;"></td>
      <td><img src="src/screenshots/calendar.jpeg" width="200" style="border-radius: 12px;"></td>
      <td><img src="src/screenshots/festivals.jpeg" width="200" style="border-radius: 12px;"></td>
      <td><img src="src/screenshots/sati.jpeg" width="200" style="border-radius: 12px;"></td>
    </tr>
    <tr>
      <td align="center"><b>Sati Stats</b></td>
      <td align="center"><b>Library</b></td>
      <td align="center"><b>Audio Player</b></td>
      <td align="center"><b>Settings</b></td>
    </tr>
    <tr>
      <td><img src="src/screenshots/sati%20stats.jpeg" width="200" style="border-radius: 12px;"></td>
      <td><img src="src/screenshots/library.jpeg" width="200" style="border-radius: 12px;"></td>
      <td><img src="src/screenshots/player.jpeg" width="200" style="border-radius: 12px;"></td>
      <td><img src="src/screenshots/settings.jpeg" width="200" style="border-radius: 12px;"></td>
    </tr>
  </table>
</div>


## ✨ Feature Showcase

### 🌕 Uposatha & Lunar Calendar

- **Astronomical Moon Phase Engine** — Highly accurate lunisolar calculations using the `astronomy-engine` library
- **Multi-Tradition Support** — Theravāda (Pāli), Mahāyāna (Chinese `chinese-lunar-calendar`), Vajrayāna (Tibetan lookup tables)
- **Vedic Pañcāṅga** — Deep astrology layer with *Horā*, *Graha* positions, and *Nakṣatra* data via `panchangam-js`
- **Observance Tracker** — Log every Uposatha as observed/skipped, record precepts kept, practice minutes, quality, and reflections
- **Festival Calendar** — Annual Buddhist festivals across all three traditions with live countdown timers

### 🧘 Sati (Mindfulness) Suite

A unified practice backend tracks your daily streaks across all disciplines:

| Practice | Description |
|---|---|
| **Ānāpānasati** | 16-step breath meditation timer with tetrad-based step progression, interval bells, and session reflection |
| **Tiratana Recollection** | Structured *Buddhānussati*, *Dhammānussati*, *Saṅghānussati* with Pāli & Devanāgarī script support |
| **Digital Mālā** | Versatile bead counter supporting Buddha, Dhamma, Sangha recollection with haptic feedback |
| **Śūnyatā Bhāvanā** | Emptiness contemplation with guided sections — Five Aggregates (Anattā), Heart Sūtra, and more |
| **Custom Mantras** | Create personalized mantra practices with deity association, tradition tagging, and per-mantra statistics |

### 📖 Dhammapada

- **Complete Dhammapada** — All 423 verses with Max Müller English translations + Pāli originals
- **Daily Verse Notifications** — Persistent sunrise notification delivering a verse for daily reflection
- **Transliteration Engine** — Seamlessly switch between Roman and Devanāgarī scripts

### 🎧 Dhamma Audio Library

- **Native Background Playback** — Gapless audio powered by a custom **Media3 (ExoPlayer)** Kotlin service
- **Intelligent Chunk Caching** — Automatically caches audio during streaming for offline replay
- **YouTube Integration** — Converts video Dhamma talks (via the *Pañcasikha* library) into background-playable audio
- **Playlist System** — Organize talks into playlists with chapter navigation

### 📊 Unified Statistics

- **Global Dashboard** — Total sessions, beads counted, and current streak across all practices
- **Per-Practice Analytics** — Detailed breakdowns per meditation type with focus area distribution
- **Session History** — Complete chronological log with edit/delete capability

### 💾 Backup & Restore

- **Full JSON Export** — One-tap backup of all observances, sessions, mantras, and preferences
- **Native Share Sheet** — Send backups to Google Drive, email, WhatsApp, or any app
- **Validated Restore** — Import with item-count confirmation dialog before overwriting

---

## 🛠️ Tech Stack & Architecture

### Core Technologies

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + Ionic 8 | UI components & routing |
| **Language** | TypeScript 5.9 | Type-safe application logic |
| **Build** | Vite 5 | Lightning-fast HMR & bundling |
| **Native Bridge** | Capacitor 8 | Web ↔ Android bridge |
| **Android** | Kotlin + Media3 | Background audio, native features |
| **Storage** | `@capacitor/preferences` | JSON-based persistent storage |
| **Styling** | Vanilla CSS | Glassmorphism + CSS custom properties |

### Capacitor Plugins

```
@capacitor/app            — App lifecycle
@capacitor/preferences    — Key-value storage
@capacitor/filesystem     — File I/O for backup export
@capacitor/share          — Native share sheet
@capacitor/local-notifications — Uposatha, festival & verse alerts
@capacitor/haptics        — Mālā bead feedback
@capacitor/keyboard       — Input management
@capacitor/status-bar     — Immersive dark UI
```

### Architecture Diagram

```mermaid
graph TD
    subgraph Frontend["🌐 React / Ionic App"]
        direction TB
        UI["UI Components<br/><sub>Pages · Glass Cards · Timers</sub>"]
        Services["Domain Services<br/><sub>Mala · Anapanasati · Mantra · Emptiness · Observance</sub>"]
        Stats["SatiStatsService<br/><sub>Unified streak & session tracking</sub>"]
        Backup["BackupRestoreService<br/><sub>Export · Import · Validate · Restore</sub>"]

        UI --> Services
        UI --> Stats
        Services --> Stats
        Services --> Backup
    end

    subgraph Bridge["⚡ Capacitor Bridge"]
        Prefs["Preferences API"]
        FS["Filesystem API"]
        Share["Share API"]
        Notif["Local Notifications"]
        Haptic["Haptics API"]

        Services --> Prefs
        Backup --> FS
        Backup --> Share
        Services --> Notif
        UI --> Haptic
    end

    subgraph Native["📱 Native Kotlin Layer"]
        Audio["Foreground AudioService<br/><sub>Persistent notification · Wake lock</sub>"]
        Exo["Media3 ExoPlayer<br/><sub>Gapless playback · Seeking</sub>"]
        Cache["SimpleCache + SQLite<br/><sub>Intelligent chunk caching</sub>"]
        YT["YouTubeService<br/><sub>Pañcasikha extraction</sub>"]

        Audio --> Exo
        Exo --> Cache
        Audio --> YT
    end

    Bridge -.->|"JS Plugin Interface"| Native

    style Frontend fill:#0d1117,stroke:#30363d,color:#c9d1d9
    style Bridge fill:#161b22,stroke:#30363d,color:#c9d1d9
    style Native fill:#1c2128,stroke:#30363d,color:#c9d1d9
```

---

## 📁 Project Structure

```
uposath/
├── android/                    # Native Android project (Kotlin)
│   └── app/src/main/kotlin/    # ExoPlayer AudioService, YouTubeService
├── public/
│   └── assets/audio/           # Zen bell sound cues
├── src/
│   ├── assets/data/            # Anapanasati, Emptiness, Triple Gem JSON content
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Route-level page components
│   │   ├── CalendarPage.tsx    # Lunar calendar + daily verse
│   │   ├── SatiPage.tsx        # Practice hub
│   │   ├── AnapanasatiSessionPage.tsx
│   │   ├── EmptinessSessionPage.tsx
│   │   ├── MantraPracticePage.tsx
│   │   ├── SatiStatsPage.tsx   # Unified statistics dashboard
│   │   ├── AudioLibraryPage.tsx
│   │   ├── FestivalsPage.tsx
│   │   └── SettingsPage.tsx    # Config, notifications, backup/restore
│   ├── services/               # Business logic layer
│   │   ├── UposathaObservanceService.ts
│   │   ├── MalaService.ts
│   │   ├── AnapanasatiService.ts
│   │   ├── MantraService.ts
│   │   ├── EmptinessService.ts
│   │   ├── SatiStatsService.ts
│   │   ├── BackupRestoreService.ts
│   │   ├── uposathaCalculator.ts
│   │   ├── buddhistFestivalService.ts
│   │   └── notificationScheduler.ts
│   ├── types/                  # TypeScript interfaces
│   │   ├── ObservanceTypes.ts
│   │   └── SatiTypes.ts
│   └── theme/                  # CSS variables & global styles
├── capacitor.config.ts
├── vite.config.ts
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18.0 | JavaScript runtime |
| [Android Studio](https://developer.android.com/studio) | SDK 34+ | Native build & emulator |
| Git | Latest | Version control |

### 📲 Quick Install

If you just want to use the app on your Android device:

**[Download Uposath v1.0.0 APK](https://github.com/Stonks007/uposath/releases/download/v1.0.0/Uposatha-v1.0.0.apk)**

### 🏗️ Build from Source

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Stonks007/uposath.git
cd uposath

# 2. Install dependencies
npm install

# 3. Start the dev server (browser preview)
npm run dev

# 4. Build & deploy to Android device/emulator
npm run build
npx cap sync android
npx cap run android
```

> **💡 Tip:** Open the native project directly in Android Studio for Kotlin debugging:
> ```bash
> npx cap open android
> ```

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **Dev** | `npm run dev` | Start Vite dev server + proxy server |
| **Frontend** | `npm run frontend` | Vite dev server only |
| **Build** | `npm run build` | TypeScript check + production Vite bundle |
| **Preview** | `npm run preview` | Preview the production build locally |
| **Unit Tests** | `npm run test.unit` | Run Vitest unit tests |
| **E2E Tests** | `npm run test.e2e` | Run Cypress end-to-end tests |
| **Lint** | `npm run lint` | ESLint check |

---

## 💾 Data & Backup

All user data is stored locally via `@capacitor/preferences`. Nothing leaves the device unless you explicitly export.

### Storage Keys

| Key | Data |
|---|---|
| `uposatha_observance_entries` | Uposatha observance logs |
| `sati_mala_entries` | Triple Gem mālā bead sessions |
| `sati_mala_preferences` | Quick-button config, language prefs |
| `anapanasati_sessions` | Ānāpānasati meditation sessions |
| `anapanasati_settings` | Timer & bell defaults |
| `user_mantras` | Custom mantras + stats |
| `mantra_sessions` | Mantra practice sessions |
| `emptiness_sessions` | Śūnyatā contemplation sessions |

### Backup Format

Exported as a versioned JSON file (`uposatha_backup_YYYY-MM-DD.json`):

```json
{
  "version": 1,
  "appVersion": "0.1.0-alpha",
  "createdAt": "2026-02-22T10:00:00.000Z",
  "data": {
    "uposathaObservances": [],
    "malaEntries": [],
    "malaPreferences": {},
    "anapanasatiSessions": [],
    "anapanasatiSettings": {},
    "mantras": [],
    "mantraSessions": [],
    "emptinessSessions": []
  }
}
```

---

## 🤝 Contributing

Contributions are warmly welcomed! Whether it's fixing a bug, adding a new meditation technique, or translating content into a new language — every effort helps the Dhamma reach further.

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/loving-kindness-timer`
3. **Commit** your changes: `git commit -m 'feat: add metta bhavana timer'`
4. **Push** to the branch: `git push origin feature/loving-kindness-timer`
5. **Open** a Pull Request

### Areas for Contribution

- 🌍 **Translations** — Add Hindi, Sinhala, Thai, Burmese, or Mandarin translations
- 🧘 **New Practices** — Mettā Bhāvanā, Walking Meditation, Body Scan
- 📖 **Sutta Content** — Additional canonical texts and commentaries
- 🎨 **Themes** — New color palettes and visual themes
- 🐛 **Bug Fixes** — See [Issues](https://github.com/Stonks007/uposath/issues)

---

## 🙏 Acknowledgments

- **Dhammapada** texts sourced from [Project Gutenberg](https://www.gutenberg.org/) (public domain, Max Müller translation)
- **Vedic Pañcāṅga calculations** via [`@ishubhamx/panchangam-js`](https://github.com/ishubhamx/panchangam-js) by Shubham
- **Mahāyāna lunar phase tracking** via [`chinese-lunar-calendar`](https://www.npmjs.com/package/chinese-lunar-calendar) by linlifengx
- **Offline global location lookups** via [`country-state-city`](https://www.npmjs.com/package/country-state-city) by Harpreet Singh
- **Offline geospatial timezone mapping** via [`tz-lookup`](https://www.npmjs.com/package/tz-lookup) by The Dark Sky Company
- **YouTube Music playback architecture** inspired by the open-source work on [InnerTune](https://github.com/z-huang/InnerTune) by [Zion Huang](https://github.com/z-huang) and [Malopieds](https://github.com/Malopieds)
- **Audio extraction and decoding** powered by [NewPipe Extractor](https://github.com/TeamNewPipe/NewPipeExtractor)

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.

This software is offered freely in the spirit of *Dāna* (generosity) — may it support your practice and benefit all beings.

---

<div align="center">
  <br>
  <sub>

  *Bhavatu Sabba Maṅgalaṃ*
  *May all beings be well, happy, and peaceful.* 🙏

  </sub>
  <br><br>

  **[⬆ Back to Top](#-uposath)**

</div>
