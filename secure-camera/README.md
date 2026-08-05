# TrustChain Secure Evidence Camera — Mobile Application (iOS & Android)

The **TrustChain Secure Evidence Camera** is a native Flutter mobile application designed for authorized law enforcement officers to use a mobile phone as a controlled, untampered forensic evidence capture device.

---

## 📌 Architecture Overview

- **Mobile Client**: Flutter (Dart) — `secure-camera/`
- **Backend**: TrustChain Express REST API (`server/index.ts`)
- **Database**: PostgreSQL on Neon via Prisma ORM
- **Authentication**: JWT Bearer Tokens (RBAC secured for Officer roles only)
- **Integrity**: Dual SHA-256 Checksum Verification (Client seal + Server verification)
- **Storage & AI**: Pinata IPFS + Sightengine AI Forensic Analysis
- **Blockchain Ledger**: Polygon Amoy Testnet smart contract registration

---

## 📱 Features

1. **Officer Authentication**: Reuses existing TrustChain account credentials. Secured via `flutter_secure_storage`. Restricted to Officer roles.
2. **Case Selection**: Displays live assigned investigation cases from the TrustChain backend.
3. **Live Camera Capture**: Full-screen photo & video capture. **No gallery import or file picker allowed**.
4. **Geolocation Tracking**:
   - Single high-accuracy GPS fix for photo captures.
   - Periodic 5-second interval GPS location trail for video recordings.
5. **Client-Side SHA-256 Seal**: Calculates SHA-256 checksum from original raw capture bytes prior to upload.
6. **Server Hash Verification**: Server independently re-computes SHA-256 on received bytes. Registration halts if checksums mismatch (`INTEGRITY_MISMATCH`).
7. **Optional Evidence Note**: Allows up to 2000 characters of contextual notes.

---

## 🚀 Development & Build Instructions

### Prerequisites
- Flutter SDK (>= 3.0.0)
- Android Studio / Android SDK (for Android builds)
- macOS & Xcode 15+ (for iOS builds & signing)

### Running Locally (Android Emulator / Device)
1. Ensure the TrustChain Express backend is running (`npm run dev` or `node server/index.js` on port 3000).
2. Open terminal in `secure-camera/`:
   ```bash
   cd secure-camera
   flutter pub get
   flutter run
   ```

### Building Android APK
```bash
cd secure-camera
flutter build apk --release
```
The output APK will be located at `build/app/outputs/flutter-apk/app-release.apk`.

---

## 🍎 iOS Build & Signing Steps

> [!NOTE]
> Building and signing an iOS app requires a macOS environment with Xcode and an active Apple Developer Certificate.

### iOS Prerequisites & Setup:
1. Ensure Flutter is installed on your Mac.
2. Open terminal and navigate to `secure-camera/`:
   ```bash
   cd secure-camera
   flutter pub get
   cd ios
   pod install
   ```
3. Open `secure-camera/ios/Runner.xcworkspace` in Xcode:
   ```bash
   open ios/Runner.xcworkspace
   ```
4. In Xcode:
   - Select the **Runner** target.
   - Go to **Signing & Capabilities**.
   - Select your **Development Team**.
   - Ensure Bundle Identifier matches your Apple Provisioning Profile.
5. Connect your iPhone via USB, select your device in Xcode, and click **Build & Run** (`Cmd + R`) or run:
   ```bash
   flutter build ios
   ```
