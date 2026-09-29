package com.example.app.types

enum class ParticleCategory {
    QUARK, LEPTON, GAUGE_BOSON, SCALAR_BOSON, BARYON, MESON, NUCLEUS, CUSTOM
}

data class ParticleDefinition(
    val id: String,
    val name: String,
    val symbol: String,
    val category: ParticleCategory,
    val generation: Int? = null,
    val restMassMeV: Double,
    val charge: Double,
    val spin: String,
    val radius: Double,
    val color: String,
    val secondaryColor: String? = null,
    val description: String,
    val isAntiparticle: Boolean = false
)

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
