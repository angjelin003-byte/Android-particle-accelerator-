package com.example.app.physics

import kotlin.math.*

data class FourMomentum3D(
    val E: Double,
    val px: Double,
    val py: Double,
    val pz: Double,
    val mass: Double
)

data class MandelstamVariables(
    val s: Double,
    val t: Double,
    val u: Double,
    val sqrtS: Double,
    val sumInvariantCheck: Double
)

fun clampBeta(beta: Double): Double {
    return beta.coerceIn(-0.9999, 0.9999)
}

fun calculateGamma(beta: Double): Double {
    val b = clampBeta(abs(beta))
    return 1.0 / sqrt(max(1e-12, 1.0 - b * b))
}

fun computeRelativisticProperties3D(
    mass: Double,
    vx: Double,
    vy: Double,
    vz: Double = 0.0
): Map<String, Double> {
    val vMag = sqrt(vx * vx + vy * vy + vz * vz)
    val beta = clampBeta(vMag)

    if (mass == 0.0) {
        val normX = if (vMag > 1e-9) vx / vMag else 1.0
        val normY = if (vMag > 1e-9) vy / vMag else 0.0
        val normZ = if (vMag > 1e-9) vz / vMag else 0.0
        val defaultEnergy = 100.0
        return mapOf(
            "beta" to 1.0,
            "gamma" to Double.POSITIVE_INFINITY,
            "px" to defaultEnergy * normX,
            "py" to defaultEnergy * normY,
            "pz" to defaultEnergy * normZ,
            "pTotal" to defaultEnergy,
            "energy" to defaultEnergy,
            "kineticEnergy" to defaultEnergy
        )
    }

    val gamma = calculateGamma(beta)
    val px = gamma * mass * vx
    val py = gamma * mass * vy
    val pz = gamma * mass * vz
    val pTotal = sqrt(px * px + py * py + pz * pz)
    val energy = gamma * mass
    val kineticEnergy = (gamma - 1.0) * mass

    return mapOf(
        "beta" to beta,
        "gamma" to gamma,
        "px" to px,
        "py" to py,
        "pz" to pz,
        "pTotal" to pTotal,
        "energy" to energy,
        "kineticEnergy" to kineticEnergy
    )
}
