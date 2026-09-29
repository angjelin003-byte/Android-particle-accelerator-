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
    val radius: Double // Scaled relative radius for visualization
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

data class SimulationState(
    val particles: List<ParticleState> = emptyList(),
    val isRunning: Boolean = false,
    val isPanelExpanded: Boolean = true,
    val theme: String = "dark",
    val customBgColor: Color? = null,
    val forceLandscape: Boolean = false,
    val beamEnergyGeV: Double = 7.0,
    val trailLength: Int = 100,
    val speedMultiplier: Double = 1.0,
    val cameraRotationY: Float = -30f,
    val cameraRotationX: Float = 20f,
    val cameraDistance: Float = 1200f,
    val activeSection: String = "BEAM",
    
    // Custom beam configuration
    val selectedParticleA: ParticleDefinition = ElementaryParticles.PROTON,
    val selectedParticleB: ParticleDefinition = ElementaryParticles.PROTON
)

object ElementaryParticles {
    // Realistic sizing: Nuclei are massive, Bosons are large/energetic, Quarks/Leptons are small
    
    // Hadrons & Nuclei (Largest)
    val PROTON = ParticleDefinition("p", "Proton", "p+", ParticleCategory.BARYON, 938.27, 1.0, "1/2", "#6366F1", 12.0)
    val ANTIPROTON = ParticleDefinition("ap", "Antiproton", "p-", ParticleCategory.BARYON, 938.27, -1.0, "1/2", "#EC4899", 12.0)
    val LEAD = ParticleDefinition("pb", "Lead Nucleus", "Pb", ParticleCategory.NUCLEUS, 193700.0, 82.0, "0", "#4B5563", 28.0)
    val PION = ParticleDefinition("pi", "Pion", "π", ParticleCategory.MESON, 139.57, 0.0, "0", "#10B981", 8.0)

    // Gauge Bosons (Medium)
    val PHOTON = ParticleDefinition("y", "Photon", "γ", ParticleCategory.GAUGE_BOSON, 0.0, 0.0, "1", "#FFFFFF", 6.0)
    val GLUON = ParticleDefinition("g", "Gluon", "g", ParticleCategory.GAUGE_BOSON, 0.0, 0.0, "1", "#FFD700", 6.0)
    val Z_BOSON = ParticleDefinition("z", "Z Boson", "Z", ParticleCategory.GAUGE_BOSON, 91187.0, 0.0, "1", "#C0C0C0", 10.0)
    val W_PLUS = ParticleDefinition("wp", "W+ Boson", "W+", ParticleCategory.GAUGE_BOSON, 80385.0, 1.0, "1", "#FFA500", 10.0)
    val HIGGS = ParticleDefinition("h", "Higgs Boson", "H", ParticleCategory.SCALAR_BOSON, 125100.0, 0.0, "0", "#F59E0B", 14.0)

    // Leptons (Small)
    val ELECTRON = ParticleDefinition("e", "Electron", "e-", ParticleCategory.LEPTON, 0.511, -1.0, "1/2", "#00AAFF", 4.0)
    val POSITRON = ParticleDefinition("pos", "Positron", "e+", ParticleCategory.LEPTON, 0.511, 1.0, "1/2", "#FF00AA", 4.0)
    val MUON = ParticleDefinition("mu", "Muon", "μ-", ParticleCategory.LEPTON, 105.66, -1.0, "1/2", "#00FFCC", 5.0)
    val TAU = ParticleDefinition("tau", "Tau", "τ-", ParticleCategory.LEPTON, 1776.8, -1.0, "1/2", "#00CCFF", 6.0)

    // Quarks (Smallest visual points)
    val TOP = ParticleDefinition("t", "Top Quark", "t", ParticleCategory.QUARK, 173100.0, 0.66, "1/2", "#FF55FF", 5.0)
    val BOTTOM = ParticleDefinition("b", "Bottom Quark", "b", ParticleCategory.QUARK, 4180.0, -0.33, "1/2", "#55FFFF", 4.0)
    val CHARM = ParticleDefinition("c", "Charm Quark", "c", ParticleCategory.QUARK, 1280.0, 0.66, "1/2", "#5555FF", 4.0)
    val STRANGE = ParticleDefinition("s", "Strange Quark", "s", ParticleCategory.QUARK, 96.0, -0.33, "1/2", "#FFFF55", 3.0)
    val UP = ParticleDefinition("u", "Up Quark", "u", ParticleCategory.QUARK, 2.2, 0.66, "1/2", "#FF5555", 3.0)
    val DOWN = ParticleDefinition("d", "Down Quark", "d", ParticleCategory.QUARK, 4.7, -0.33, "1/2", "#55FF55", 3.0)

    val ALL_PARTICLES = listOf(
        PROTON, ANTIPROTON, LEAD, PION, 
        PHOTON, GLUON, Z_BOSON, W_PLUS, HIGGS,
        ELECTRON, POSITRON, MUON, TAU,
        TOP, BOTTOM, CHARM, STRANGE, UP, DOWN
    )
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

    val BgPalette = listOf(
        Color(0xFF07090E), 
        Color(0xFF1E293B), 
        Color(0xFF1E1B4B), 
        Color(0xFF0F172A),
        Color(0xFF020617)
    )
}
