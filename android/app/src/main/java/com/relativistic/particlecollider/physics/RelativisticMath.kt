package com.relativistic.particlecollider.physics

import com.relativistic.particlecollider.model.FourVector
import com.relativistic.particlecollider.model.MandelstamInvariants
import kotlin.math.*

object RelativisticMath {

    fun calculateGamma(beta: Double): Double {
        val b = beta.coerceIn(-0.9999, 0.9999)
        return 1.0 / sqrt(max(1e-12, 1.0 - b * b))
    }

    fun computeFourVector(mass: Double, vx: Double, vy: Double, vz: Double = 0.0): FourVector {
        val vMag = sqrt(vx * vx + vy * vy + vz * vz).coerceIn(0.0, 0.9999)
        if (mass == 0.0) {
            val normX = if (vMag > 1e-9) vx / vMag else 1.0
            val normY = if (vMag > 1e-9) vy / vMag else 0.0
            val normZ = if (vMag > 1e-9) vz / vMag else 0.0
            val e = 100.0 // 100 MeV reference
            return FourVector(e, e * normX, e * normY, e * normZ, 0.0)
        }
        val gamma = calculateGamma(vMag)
        val px = gamma * mass * vx
        val py = gamma * mass * vy
        val pz = gamma * mass * vz
        val energy = gamma * mass
        return FourVector(energy, px, py, pz, mass)
    }

    fun lorentzBoost(p: FourVector, bx: Double, by: Double, bz: Double = 0.0): FourVector {
        val b2 = bx * bx + by * by + bz * bz
        if (b2 < 1e-12) return p

        val gamma = 1.0 / sqrt(max(1e-12, 1.0 - b2))
        val bDotP = bx * p.px + by * p.py + bz * p.pz
        val newE = gamma * (p.e - bDotP)
        val factor = (gamma - 1.0) * (bDotP / b2) - gamma * p.e

        val newPx = p.px + factor * bx
        val newPy = p.py + factor * by
        val newPz = p.pz + factor * bz

        return FourVector(max(p.mass, newE), newPx, newPy, newPz, p.mass)
    }

    fun computeMandelstam(p1: FourVector, p2: FourVector, p3: FourVector, p4: FourVector): MandelstamInvariants {
        val sE = p1.e + p2.e
        val sPx = p1.px + p2.px
        val sPy = p1.py + p2.py
        val sPz = p1.pz + p2.pz
        val s = sE * sE - (sPx * sPx + sPy * sPy + sPz * sPz)

        val tE = p1.e - p3.e
        val tPx = p1.px - p3.px
        val tPy = p1.py - p3.py
        val tPz = p1.pz - p3.pz
        val t = tE * tE - (tPx * tPx + tPy * tPy + tPz * tPz)

        val uE = p1.e - p4.e
        val uPx = p1.px - p4.px
        val uPy = p1.py - p4.py
        val uPz = p1.pz - p4.pz
        val u = uE * uE - (uPx * uPx + uPy * uPy + uPz * uPz)

        return MandelstamInvariants(s, t, u, sqrt(max(0.0, s)))
    }

    fun closestApproachFm(bFm: Double, q1: Double, q2: Double, kineticEnergyCmMeV: Double): Double {
        if (abs(q1 * q2) < 1e-4) return abs(bFm)
        val kCoupling = 1.44 // MeV * fm
        val alpha = (kCoupling * q1 * q2) / max(1e-4, 2.0 * kineticEnergyCmMeV)
        val term = (2.0 * bFm * kineticEnergyCmMeV) / (kCoupling * q1 * q2)
        return max(0.1, abs(alpha * (1.0 + sqrt(1.0 + term * term))))
    }
}
