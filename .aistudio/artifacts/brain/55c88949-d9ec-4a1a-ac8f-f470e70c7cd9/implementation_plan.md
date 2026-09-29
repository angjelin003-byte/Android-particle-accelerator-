# Relativistic Elementary Particle Collision Laboratory

An interactive 2D physics simulation environment modeling elementary particle collisions at near-light speeds ($v \to c$). The system combines relativistic kinematics (Lorentz $\gamma$ dilation, 4-momentum conservation, length contraction) with Coulomb scattering and quantum reaction/annihilation channels, housed in a precision scientific laboratory interface with a foldable real-time control panel, polar protractor overlays, and live energy-level spectra.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your Phase 1 preferences, the simulation is configured with:
> - **Collision Physics**: Dual-engine supporting both **relativistic kinematics with particle reactions/decays** ($e^-e^+ \to 2\gamma$, $\mu^\pm$ pair production, Compton scattering) AND **pure relativistic elastic and Coulomb scattering** with RK4 trajectory integration.
> - **Aesthetic & Style**: **Clean laboratory physics sandbox** featuring subtle coordinate grids, vector arrows, interactive polar protractor guides, and high-legibility tabular metrics without distracting sci-fi glow.
> - **Experience Structure**: **Both guided experiment presets** (Rutherford scattering, Compton effect, $e^+e^-$ annihilation, relativistic angle contraction) and a **free-form collision sandbox**.

---

### 1. Overview & Core Concept

- **What It Does**: Simulates 2D collisions between subatomic particles (electrons, positrons, protons, antiprotons, alphas, muons, photons) from non-relativistic speeds up to ultra-relativistic speeds ($0.999c$). Features an extreme slow-motion engine (down to femtosecond / picosecond step intervals), Lorentz contraction visualization, relativistic center-of-momentum (CoM) frame transformations, polar scattering angle protractors, and dynamic energy-momentum conservation meters.
- **Target Audience**: Physics students, educators, researchers, and curious learners exploring special relativity, scattering cross-sections, and particle reaction phenomenology.
- **Key Value**: Provides tangible visual intuition for non-intuitive relativistic effects—such as the Lorentz angle squeezing (where equal-mass scattering angles collapse below $90^\circ$), velocity addition, invariant mass generation, and energy-to-mass transformation.

---

### 2. User Experience & Visual Design

#### Visual Identity & Theme
- **Color Palette (60-30-10 Rule)**:
  - *60% Neutral Canvas*: Slate obsidian darkroom canvas (`#0b0f17`) with subtle coordinate grid lines (`rgba(148, 163, 184, 0.08)`).
  - *30% Structural Panels*: Monochromatic flat laboratory consoles (`#111827`, border `#1e293b`), matte black floating widgets, and hairline dividers.
  - *10% Telemetry Accents*: Phosphor cyan (`#06b6d4`) for Beam A / electron tracks, laser amber (`#f59e0b`) for Beam B / positron tracks, emerald (`#10b981`) for reaction products / photons, and cobalt (`#3b82f6`) for vectors.
- **Typography & Precision Notation**:
  - Technical UI headings and labels: Clean geometric sans (`Plus Jakarta Sans` / system clean neo-grotesque).
  - Telemetry readouts, angles, coordinates, and Lorentz factors: Tabular monospace (`font-mono tabular-nums`) with clear unit separations ($c$, $\text{MeV}$, $\text{GeV/c}$, $\text{deg}$, $\text{fm}$).
- **Spatial Composition**:
  - **Top Laboratory Telemetry Ribbon**: Simulation time $t$, time-dilation ratio, simulation rate (FPS), invariant mass $M_{\text{inv}}$, and rapid preset selector.
  - **Foldable Left Control Panel (340px width)**: Toggleable between expanded and folded docked state with smooth CSS transforms; houses particle selector, relativistic sliders ($\beta = v/c$, mass $m$, impact parameter $b$, launch angle $\theta$), physics engine mode, and slow-mo stepper.
  - **Main Laboratory Canvas Stage**: High-DPI 2D HTML5 canvas with zoom/pan, trajectory phosphor trails, Lorentz-contracted particle ellipsoids, velocity/momentum vectors, and draggable target placement.
  - **Overlaid Precision HUD & Protractors**:
    - Center-of-collision polar protractor arc displaying precise laboratory scattering angles $\theta_1, \theta_2$.
    - Energy Level Spectrum Bar: Visual breakdown of Rest Mass Energy ($m c^2$), Kinetic Energy ($K = (\gamma - 1)mc^2$), and Total Energy ($E$).
    - Center-of-Momentum (CoM) vs Lab Frame toggle.

---

### 3. Key Product Decisions & Trade-Offs

1. **Relativistic Kinematics Engine (RK4 + 4-Vector Algebra)**:
   - *Chosen Approach*: Implement exact relativistic equations of motion $\frac{d\mathbf{p}}{dt} = \mathbf{F}$ where $\mathbf{p} = \gamma m \mathbf{v}$ and $\gamma = 1/\sqrt{1 - (v/c)^2}$. For Coulomb interactions, calculate relativistic Lorentz force and integrate trajectories using 4th-order Runge-Kutta (RK4) with adaptive sub-stepping to eliminate numerical energy drift.
   - *Reaction Channeling*: When particles approach within reaction interaction radius $r_{\text{crit}}$ and center-of-mass energy exceeds threshold $\sqrt{s} \ge \sum m_{\text{products}} c^2$, allow probabilistic or deterministic branching into annihilation photons ($2\gamma$), muon pairs ($\mu^+\mu^-$), or pion clusters.
   - *Why*: Provides genuine educational accuracy. Students can observe that at $v \to c$, momentum grows to infinity and particles cannot exceed $c$, while scattering angles visibly deviate from Newtonian billiards.
2. **Slow-Motion Engine with Variable Frame Intervals**:
   - *Chosen Approach*: Decouple physics integration step ($dt$) from display refresh rate. Provide real-time sliders for time dilation factor ($1\times$ to $0.0001\times$ real speed) and fine frame intervals ($0.1\text{ ps}$ to $10\text{ ps}$ step resolution), plus manual single-step frame advance (`Step >|`) and reverse trail review.
3. **Foldable Control Panel UX**:
   - *Chosen Approach*: An ergonomically collapsible sidebar dock with chevron toggle, keyboard shortcut (`[Tab]`), and floating miniature quick-action toolbar when collapsed so the canvas can occupy full viewport width.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Top Laboratory Telemetry Ribbon                      │
│ [Preset Experiments] [Frame Rate / dt] [M_inv Readout] [Play/Step/Reset]│
└────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────┬──────────────────────────────────────────────┐
│  Foldable Control Panel │         Laboratory Simulation Canvas         │
│  (Collapsible 340px)    │         (Interactive High-DPI Canvas)        │
│                         │                                              │
│ ├─ Beam A Parameters    │  • Relativistic trajectories with fading     │
│ │  (Type, m, v/c, θ)    │    phosphor trails                           │
│ ├─ Beam B / Target      │  • Lorentz-contracted particle bodies        │
│ │  (Type, m, v/c, b)    │  • Interactive polar protractor overlay      │
│ ├─ Kinematics & Slowmo  │  • Momentum / velocity vector arrows         │
│ │  (Time scale, dt)     │  • Collision impact vertex & flash bursts    │
│ ├─ Physics Toggles      │                                              │
│ │  (Coulomb, Reaction)  │                                              │
│ └─ View Options         │                                              │
│    (Angles, Vectors)    │                                              │
├─────────────────────────┴──────────────────────────────────────────────┤
│                Energy & Scattering Analytics Tray                      │
│ [Relativistic Energy Spectrum Bar] [Angular Distribution] [CoM / Lab]  │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Particle Data Model
```typescript
interface ParticleTypeDefinition {
  id: string;
  name: string;
  symbol: string;
  restMassMeV: number;     // e.g. 0.511 for electron
  charge: number;          // in elementary charges: -1, 0, +1, +2
  color: string;
  radius: number;          // visual rest radius
  category: 'lepton' | 'baryon' | 'gauge_boson' | 'meson' | 'nucleus';
}

interface ParticleState {
  id: string;
  typeId: string;
  x: number;
  y: number;
  vx: number;              // in units of c
  vy: number;              // in units of c
  mass: number;            // in MeV/c^2
  charge: number;
  trail: Array<{x: number; y: number; alpha: number}>;
  gamma: number;           // Lorentz factor
  energy: number;          // Total relativistic energy (MeV)
  momentum: { px: number; py: number; pTotal: number };
}
```

#### Verification & Quality Gates
- **Relativistic Accuracy**: Verify energy and 3-momentum conservation: $E_{\text{init}} = E_{\text{final}}$ and $\mathbf{p}_{\text{init}} = \mathbf{p}_{\text{final}}$ to within $< 0.1\%$ numerical precision.
- **Lorentz Contraction**: Particle visual bounding box contracts along $\mathbf{v}$ axis by $1/\gamma$.
- **Responsiveness**: Smooth 60 FPS animation with zero memory leaks via pre-allocated typed buffers for particle trails.
- **Responsive Layout**: Foldable control panel operates cleanly on both desktop (1440px) and compact screens.
