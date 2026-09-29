# Relativistic 3D Particle Collider - Android (Kotlin & Gradle)

Interactive 3D simulation of elementary particle collisions modeling near-light-speed relativistic kinematics, Lorentz contraction ellipsoids, Coulomb deflection, Mandelstam invariants, and quantum reaction channels across all Standard Model particles.

---

## Android Build with Gradle & Kotlin

This project is configured with a pure **Kotlin & Gradle** build system (`.kts` Kotlin DSL scripts) and automated GitHub Actions workflow.

### Automated GitHub Actions Build (`.github/workflows/build.yml`)

The GitHub Actions workflow requires **no Node or npm dependencies**. It runs natively using JDK 17 and Gradle:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Build Android APK with Kotlin and Gradle"
   git push
   ```
2. **View Build**:
   - Go to your repository on GitHub.
   - Click the **Actions** tab -> **Build Android APK with Gradle & Kotlin**.
3. **Download `debug.apk`**:
   - Once completed, click the run summary.
   - Under **Artifacts**, click **`debug-apk`** to download `app-debug.apk`.
   - Install on any Android device (Android 7.0+ / API 24+).

---

## Local Gradle Build

You can build the APK directly using the Gradle wrapper:

```bash
# On Linux / macOS:
./gradlew assembleDebug

# On Windows:
gradlew.bat assembleDebug
```

The output APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Architecture & Kotlin Components

- **Kotlin DSL Build Scripts**:
  - `build.gradle.kts` & `settings.gradle.kts`: Configured with Android Gradle Plugin 8.2.2 and Kotlin 1.9.22.
  - `android/app/build.gradle.kts`: Android 14 (API 34) target, minSdk 24, JVM 17.
- **Native Kotlin Models**:
  - `com.relativistic.particlecollider.model.Particle.kt`: Particle definitions, FourVector data structures, and Mandelstam invariants.
  - `com.relativistic.particlecollider.physics.RelativisticMath.kt`: 3D Lorentz boosts, closest approach $r_{\text{min}}$, and Mandelstam $s, t, u$ calculations.
  - `com.relativistic.particlecollider.physics.StandardModelRegistry.kt`: All Quarks, Leptons, Gauge Bosons, and Higgs Boson.
  - `com.relativistic.particlecollider.MainActivity.kt`: Hardware-accelerated WebView activity with full WebGL 3D rendering and sensor orientation support.
- **Pre-packaged WebGL Assets**:
  - Embedded inside `android/app/src/main/assets/` to run completely offline on device.
