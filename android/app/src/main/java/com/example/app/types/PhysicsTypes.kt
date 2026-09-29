package com.example.app.types

import androidx.compose.ui.graphics.Color

enum class ParticleCategory {
    QUARK, LEPTON, GAUGE_BOSON, SCALAR_BOSON, BARYON, MESON, NUCLEUS, CUSTOM
}

data class ParticleState(
    val id: String,
    val definitionId: String,
    val name: String,
    val symbol: String,
    val color: String,
    val category: ParticleCategory,
    val x: Double,
    val y: Double,
    val z: Double,
    val vx: Double,
    val vy: Double,
    val vz: Double,
    val mass: Double,
    val charge: Double,
    val beta: Double,
    val gamma: Double,
    val px: Double,
    val py: Double,
    val pz: Double,
    val pTotal: Double,
    val energy: Double,
    val kineticEnergy: Double,
    val radius: Double,
    val trail: List<TrailPoint>,
    val isPrimaryBeam: String? = null, // 'A', 'B', or null
    val isReactionProduct: Boolean,
    val annihilated: Boolean = false,
    val scatteringAngleDeg: Double? = null
)

data class TrailPoint(val x: Double, val y: Double, val z: Double, val time: Double)

data class SimulationState(
    val particles: List<ParticleState> = emptyList(),
    val isRunning: Boolean = false,
    val isPanelExpanded: Boolean = true,
    val theme: String = "dark",
    val beamEnergyMeV: Double = 7000.0,
    val collisionAngleDeg: Double = 180.0,
    val trailLength: Int = 150,
    val speedMultiplier: Double = 1.0,
    val cameraRotationY: Float = 0f,
    val cameraRotationX: Float = 0f,
    val cameraDistance: Float = 1000f
)

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
