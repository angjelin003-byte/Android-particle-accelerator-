package com.example.app.physics

import com.example.app.types.ParticleCategory
import com.example.app.types.ParticleDefinition

object ParticleConstants {
    val C_SPEED_PIXELS_PER_NS = 240.0
    val COULOMB_K_SCALE = 3200.0

    val PARTICLE_REGISTRY: Map<String, ParticleDefinition> = mapOf(
        "up_quark" to ParticleDefinition(
            id = "up_quark",
            name = "Up Quark",
            symbol = "u",
            category = ParticleCategory.QUARK,
            generation = 1,
            restMassMeV = 2.16,
            charge = 2.0 / 3.0,
            spin = "1/2",
            radius = 5.0,
            color = "#38bdf8",
            description = "First-generation quark with +2/3e charge. Main constituent of protons and neutrons."
        ),
        "down_quark" to ParticleDefinition(
            id = "down_quark",
            name = "Down Quark",
            symbol = "d",
            category = ParticleCategory.QUARK,
            generation = 1,
            restMassMeV = 4.67,
            charge = -1.0 / 3.0,
            spin = "1/2",
            radius = 5.5,
            color = "#0284c7",
            description = "First-generation quark with -1/3e charge. Present in nucleons."
        ),
        "electron" to ParticleDefinition(
            id = "electron",
            name = "Electron",
            symbol = "e⁻",
            category = ParticleCategory.LEPTON,
            generation = 1,
            restMassMeV = 0.51099895,
            charge = -1.0,
            spin = "1/2",
            radius = 6.0,
            color = "#06b6d4",
            description = "Stable first-generation lepton. Fundamental building block of atomic shells."
        ),
        "positron" to ParticleDefinition(
            id = "positron",
            name = "Positron",
            symbol = "e⁺",
            category = ParticleCategory.LEPTON,
            generation = 1,
            restMassMeV = 0.51099895,
            charge = 1.0,
            spin = "1/2",
            radius = 6.0,
            color = "#f59e0b",
            description = "Antiparticle of the electron. Annihilates with electron into 2 or 3 gamma rays.",
            isAntiparticle = true
        )
        // ... (Other particles would be added similarly)
    )
}
