package com.relativistic.particlecollider.model

enum class ParticleCategory {
    QUARK,
    LEPTON,
    GAUGE_BOSON,
    SCALAR_BOSON,
    BARYON,
    MESON,
    NUCLEUS,
    CUSTOM
}

data class ParticleDefinition(
    val id: String,
    val name: String,
    val symbol: String,
    val category: ParticleCategory,
    val restMassMeV: Double,
    val charge: Double,
    val spin: String,
    val colorHex: String,
    val description: String,
    val isAntiparticle: Boolean = false
)

data class FourVector(
    val e: Double,   // Total energy in MeV
    val px: Double,  // Momentum x in MeV/c
    val py: Double,  // Momentum y in MeV/c
    val pz: Double,  // Momentum z in MeV/c
    val mass: Double // Invariant rest mass in MeV/c^2
) {
    val pTotal: Double get() = Math.sqrt(px * px + py * py + pz * pz)
    val beta: Double get() = if (e > 1e-9) pTotal / e else 0.0
    val gamma: Double get() = if (mass > 0) e / mass else Double.POSITIVE_INFINITY
}

data class MandelstamInvariants(
    val s: Double, // Center-of-mass energy squared (MeV^2)
    val t: Double, // Momentum transfer squared (MeV^2)
    val u: Double, // Cross-channel invariant (MeV^2)
    val sqrtS: Double
)
