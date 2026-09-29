# Relativistic 3D Particle Collider Lab

An interactive 3D elementary particle collision simulation modeling relativistic kinematics ($v \to c$), Mandelstam invariant variables, Coulomb scattering, quantum reaction channels, and Lorentz length contraction.

---

## 📱 Building the Android `debug.apk` with GitHub Actions (`build.yml`)

The repository includes a ready-to-run GitHub Actions workflow in [`.github/workflows/build.yml`](.github/workflows/build.yml).

### Step-by-Step Instructions:

1. **Push this repository to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of 3D Relativistic Particle Collider"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

2. **Trigger the Build**:
   - The build automatically runs on every `push` to `main`.
   - You can also manually trigger it anytime:
     1. Go to your repository on GitHub.
     2. Click the **Actions** tab.
     3. In the left sidebar, select **Build and Package Android APK**.
     4. Click **Run workflow** -> **Run workflow**.

3. **Download the `debug.apk`**:
   - Once the workflow completes (~2 minutes):
     1. Click on the completed workflow run.
     2. Scroll down to the **Artifacts** section at the bottom.
     3. Click **`debug-apk`** to download the zip file containing `app-debug.apk`.

4. **Install on Android**:
   - Transfer `app-debug.apk` to your phone (or download directly on mobile).
   - Tap the APK file and select **Install** (enable "Install unknown apps" for your browser/files app if prompted).
   - Launch **Particle Collider 3D** — it runs with full hardware acceleration, identical to the AI Studio preview.

---

## 🛠️ Local Development & Manual Android Build

### Run Web Preview:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Build Android APK Locally:
Requires Node.js 20+ and JDK 17:
```bash
# 1. Build web bundle & copy into Android assets:
npm run android:sync

# 2. Assemble Debug APK with Gradle:
cd android
./gradlew assembleDebug

# Output APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ⚛️ Features & Scientific Accuracy

- **Standard Model Elementary Particles**:
  - **Quarks**: Up ($u$), Down ($d$), Charm ($c$), Strange ($s$), Top ($t$ — 172.8 GeV), Bottom ($b$).
  - **Leptons**: Electron ($e^-$), Positron ($e^+$), Muon ($\mu^\mp$), Tau ($\tau^\mp$), Neutrinos ($\nu_e, \nu_\mu, \nu_\tau$).
  - **Gauge Bosons**: Photon ($\gamma$), Gluon ($g$), $W^\pm$ (80.4 GeV), $Z^0$ (91.2 GeV).
  - **Scalar Boson**: Higgs Boson ($H^0$ — 125.25 GeV).
  - **Composites & Nuclear**: Proton, Antiproton, Neutron, Pions ($\pi^0, \pi^+$), Alpha ($^4\text{He}^{2+}$), Gold Nucleus ($^{197}\text{Au}^{79+}$), and Custom particles.
- **Relativistic 3D Dynamics**:
  - Exact Lorentz gamma $\gamma = 1/\sqrt{1 - \beta^2}$ and 4-momentum boosts.
  - 3D Lorentz length contraction: particles dynamically deform into oblate ellipsoids along their velocity vector by $1/\gamma$.
  - 4th-order Runge-Kutta (RK4) Coulomb force integration.
- **Center of Collision Mathematical Analytics**:
  - Distance of closest approach ($r_{\text{min}}$) in femtometers ($\text{fm}$).
  - Invariant mass $\sqrt{s} = \sqrt{E_{\text{tot}}^2 - |\mathbf{p}_{\text{tot}}|^2 c^2}$.
  - Mandelstam invariant variables $s, t, u$ with momentum transfer.
  - Relativistic Center-of-Momentum scattering angles $\theta_1, \theta_2$.
- **Mobile Touch Controls**:
  - 1-finger orbit rotation, 2-finger pinch-to-zoom, touch-draggable impact parameter.
  - High-density compact theme optimized for mobile and desktop screens.
