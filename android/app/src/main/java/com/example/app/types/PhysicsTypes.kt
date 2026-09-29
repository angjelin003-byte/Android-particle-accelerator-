package com.example.app.types

import androidx.compose.ui.graphics.Color

enum class ParticleCategory {
    QUARK, LEPTON, GAUGE_BOSON, SCALAR_BOSON, BARYON, MESON, NUCLEUS
}

data class ParticleDefinition(
    val id: String,
    val name: String,
    val symbol: String,
    val category: ParticleCategory,
    val massMeV: Double,
    val charge: Double,
    val spin: String,
    val color: String,
    val radius: Double // Visual radius, scaled logically
)

data class ParticleState(
    val id: String,
    val definition: ParticleDefinition,
    val x: Double,
    val y: Double,
    val z: Double,
    val vx: Double,
    val vy: Double,
    val vz: Double,
    val beta: Double,
    val gamma: Double,
    val energy: Double,
    val trail: List<TrailPoint>,
    val isPrimaryBeam: String? = null,
    val annihilated: Boolean = false
)

data class TrailPoint(val x: Double, val y: Double, val z: Double)

enum class BombardmentType(val label: String) {
    PROTON_PROTON("p+ p+"),
    ELECTRON_POSITRON("e- e+"),
    PROTON_ANTIPROTON("p+ p-"),
    HEAVY_ION("Pb Pb"),
    CUSTOM("Custom")
}

data class SimulationState(
    val particles: List<ParticleState> = emptyList(),
    val isRunning: Boolean = false,
    val isPanelExpanded: Boolean = true,
    val theme: String = "dark",
    val forceLandscape: Boolean = false, // Orientation override
    val bombardmentType: BombardmentType = BombardmentType.PROTON_PROTON,
    val beamEnergyGeV: Double = 7.0,
    val trailLength: Int = 100,
    val speedMultiplier: Double = 1.0,
    val cameraRotationY: Float = -30f,
    val cameraRotationX: Float = 20f,
    val cameraDistance: Float = 1200f
)

object ElementaryParticles {
    // Quarks
    val UP = ParticleDefinition("u", "Up Quark", "u", ParticleCategory.QUARK, 2.2, 0.66, "1/2", "#FF5555", 5.0)
    val DOWN = ParticleDefinition("d", "Down Quark", "d", ParticleCategory.QUARK, 4.7, -0.33, "1/2", "#55FF55", 5.0)
    val CHARM = ParticleDefinition("c", "Charm Quark", "c", ParticleCategory.QUARK, 1280.0, 0.66, "1/2", "#5555FF", 7.0)
    val STRANGE = ParticleDefinition("s", "Strange Quark", "s", ParticleCategory.QUARK, 96.0, -0.33, "1/2", "#FFFF55", 6.0)
    val TOP = ParticleDefinition("t", "Top Quark", "t", ParticleCategory.QUARK, 173100.0, 0.66, "1/2", "#FF55FF", 10.0)
    val BOTTOM = ParticleDefinition("b", "Bottom Quark", "b", ParticleCategory.QUARK, 4180.0, -0.33, "1/2", "#55FFFF", 8.0)

    // Leptons
    val ELECTRON = ParticleDefinition("e", "Electron", "e-", ParticleCategory.LEPTON, 0.511, -1.0, "1/2", "#00AAFF", 4.0)
    val POSITRON = ParticleDefinition("pos", "Positron", "e+", ParticleCategory.LEPTON, 0.511, 1.0, "1/2", "#FF00AA", 4.0)
    val MUON = ParticleDefinition("mu", "Muon", "μ-", ParticleCategory.LEPTON, 105.66, -1.0, "1/2", "#00FFCC", 6.0)
    val TAU = ParticleDefinition("tau", "Tau", "τ-", ParticleCategory.LEPTON, 1776.8, -1.0, "1/2", "#00CCFF", 8.0)

    // Bosons
    val PHOTON = ParticleDefinition("y", "Photon", "γ", ParticleCategory.GAUGE_BOSON, 0.0, 0.0, "1", "#FFFFFF", 3.0)
    val GLUON = ParticleDefinition("g", "Gluon", "g", ParticleCategory.GAUGE_BOSON, 0.0, 0.0, "1", "#FFD700", 3.0)
    val W_PLUS = ParticleDefinition("wp", "W+ Boson", "W+", ParticleCategory.GAUGE_BOSON, 80385.0, 1.0, "1", "#FFA500", 9.0)
    val W_MINUS = ParticleDefinition("wm", "W- Boson", "W-", ParticleCategory.GAUGE_BOSON, 80385.0, -1.0, "1", "#FF8C00", 9.0)
    val Z_BOSON = ParticleDefinition("z", "Z Boson", "Z", ParticleCategory.GAUGE_BOSON, 91187.0, 0.0, "1", "#C0C0C0", 9.0)
    val HIGGS = ParticleDefinition("h", "Higgs Boson", "H", ParticleCategory.SCALAR_BOSON, 125100.0, 0.0, "0", "#FFD700", 11.0)

    // Hadrons
    val PROTON = ParticleDefinition("p", "Proton", "p+", ParticleCategory.BARYON, 938.27, 1.0, "1/2", "#6366F1", 12.0)
    val ANTIPROTON = ParticleDefinition("ap", "Antiproton", "p-", ParticleCategory.BARYON, 938.27, -1.0, "1/2", "#EC4899", 12.0)
    val PION = ParticleDefinition("pi", "Pion", "π", ParticleCategory.MESON, 139.57, 0.0, "0", "#10B981", 8.0)
    val LEAD = ParticleDefinition("pb", "Lead Nucleus", "Pb", ParticleCategory.NUCLEUS, 193700.0, 82.0, "0", "#4B5563", 25.0)
}

object AppTheme {
    val DarkBg = Color(0xFF07090E)
    val DarkSurface = Color(0xFF111827)
    val DarkPrimary = Color(0xFF818CF8)
    val DarkAccent = Color(0xFF22D3EE)
    val DarkText = Color(0xFFF1F5F9)
    val DarkTextSecondary = Color(0xFF94A3B8)
    
    val LightBg = Color(0xFFF8FAFC)
    val LightSurface = Color(0xFFFFFFFF)
    val LightPrimary = Color(0xFF6366F1)
    val LightAccent = Color(0xFF0891B2)
    val LightText = Color(0xFF0F172A)
    val LightTextSecondary = Color(0xFF64748B)
}
