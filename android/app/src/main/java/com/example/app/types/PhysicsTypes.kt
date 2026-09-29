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
    val radius: Double, // Base rest radius
    val lifetimeNs: Double = -1.0,
    val isStable: Boolean = true,
    val hasColorCharge: Boolean = false 
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
    val annihilated: Boolean = false,
    val birthTimeMs: Long = System.currentTimeMillis(),
    val colorCharge: Int = 0 
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
    val cameraTranslationX: Float = 0f,
    val cameraTranslationY: Float = 0f,
    val activeSection: String = "BEAM",
    val maxParticles: Int = 150, 
    val magneticFieldTesla: Double = 2.0,
    val selectedParticleA: ParticleDefinition = ElementaryParticles.PROTON,
    val selectedParticleB: ParticleDefinition = ElementaryParticles.PROTON,
    val selectedParticleId: String? = null 
)

object ElementaryParticles {
    // Realistic sizing: Nuclei are huge, Baryons large, Leptons/Quarks tiny points
    val PROTON = ParticleDefinition("p", "Proton", "p+", ParticleCategory.BARYON, 938.27, 1.0, "1/2", "#6366F1", 14.0, isStable = true)
    val ANTIPROTON = ParticleDefinition("ap", "Antiproton", "p-", ParticleCategory.BARYON, 938.27, -1.0, "1/2", "#EC4899", 14.0, isStable = true)
    val LEAD = ParticleDefinition("pb", "Lead Nucleus", "Pb", ParticleCategory.NUCLEUS, 193700.0, 82.0, "0", "#4B5563", 40.0, isStable = true)
    val PION = ParticleDefinition("pi", "Pion", "π", ParticleCategory.MESON, 139.57, 0.0, "0", "#10B981", 10.0, lifetimeNs = 26.0, isStable = false)

    val PHOTON = ParticleDefinition("y", "Photon", "γ", ParticleCategory.GAUGE_BOSON, 0.0, 0.0, "1", "#FFFFFF", 6.0, isStable = true)
    val GLUON = ParticleDefinition("g", "Gluon", "g", ParticleCategory.GAUGE_BOSON, 0.0, 0.0, "1", "#FFD700", 6.0, isStable = true, hasColorCharge = true)
    val Z_BOSON = ParticleDefinition("z", "Z Boson", "Z", ParticleCategory.GAUGE_BOSON, 91187.0, 0.0, "1", "#C0C0C0", 18.0, lifetimeNs = 0.00000001, isStable = false)
    val W_PLUS = ParticleDefinition("wp", "W+ Boson", "W+", ParticleCategory.GAUGE_BOSON, 80385.0, 1.0, "1", "#FFA500", 18.0, lifetimeNs = 0.00000001, isStable = false)
    val HIGGS = ParticleDefinition("h", "Higgs Boson", "H", ParticleCategory.SCALAR_BOSON, 125100.0, 0.0, "0", "#F59E0B", 22.0, lifetimeNs = 0.0000001, isStable = false)

    val ELECTRON = ParticleDefinition("e", "Electron", "e-", ParticleCategory.LEPTON, 0.511, -1.0, "1/2", "#00AAFF", 4.0, isStable = true)
    val POSITRON = ParticleDefinition("pos", "Positron", "e+", ParticleCategory.LEPTON, 0.511, 1.0, "1/2", "#FF00AA", 4.0, isStable = true)
    val MUON = ParticleDefinition("mu", "Muon", "μ-", ParticleCategory.LEPTON, 105.66, -1.0, "1/2", "#00FFCC", 5.0, lifetimeNs = 2200.0, isStable = false)
    val TAU = ParticleDefinition("tau", "Tau", "τ-", ParticleCategory.LEPTON, 1776.8, -1.0, "1/2", "#00CCFF", 6.0, lifetimeNs = 0.00029, isStable = false)

    val TOP = ParticleDefinition("t", "Top Quark", "t", ParticleCategory.QUARK, 173100.0, 0.66, "1/2", "#FF55FF", 8.0, lifetimeNs = 0.0000000000001, isStable = false, hasColorCharge = true)
    val BOTTOM = ParticleDefinition("b", "Bottom Quark", "b", ParticleCategory.QUARK, 4180.0, -0.33, "1/2", "#55FFFF", 6.0, isStable = true, hasColorCharge = true)
    val CHARM = ParticleDefinition("c", "Charm Quark", "c", ParticleCategory.QUARK, 1280.0, 0.66, "1/2", "#5555FF", 5.0, isStable = true, hasColorCharge = true)
    val STRANGE = ParticleDefinition("s", "Strange Quark", "s", ParticleCategory.QUARK, 96.0, -0.33, "1/2", "#FFFF55", 4.0, isStable = true, hasColorCharge = true)
    val UP = ParticleDefinition("u", "Up Quark", "u", ParticleCategory.QUARK, 2.2, 0.66, "1/2", "#FF5555", 3.0, isStable = true, hasColorCharge = true)
    val DOWN = ParticleDefinition("d", "Down Quark", "d", ParticleCategory.QUARK, 4.7, -0.33, "1/2", "#55FF55", 3.0, isStable = true, hasColorCharge = true)

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
        Color(0xFF020617),
        Color(0xFFFFFFFF)
    )
}
