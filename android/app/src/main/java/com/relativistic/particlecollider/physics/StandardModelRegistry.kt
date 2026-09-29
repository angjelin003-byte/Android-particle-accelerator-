package com.relativistic.particlecollider.physics

import com.relativistic.particlecollider.model.ParticleCategory
import com.relativistic.particlecollider.model.ParticleDefinition

object StandardModelRegistry {
    val particles: Map<String, ParticleDefinition> = listOf(
        // Quarks
        ParticleDefinition("up_quark", "Up Quark", "u", ParticleCategory.QUARK, 2.16, 2.0 / 3.0, "1/2", "#38bdf8", "First-gen quark"),
        ParticleDefinition("down_quark", "Down Quark", "d", ParticleCategory.QUARK, 4.67, -1.0 / 3.0, "1/2", "#0284c7", "First-gen quark"),
        ParticleDefinition("charm_quark", "Charm Quark", "c", ParticleCategory.QUARK, 1270.0, 2.0 / 3.0, "1/2", "#6366f1", "Second-gen quark"),
        ParticleDefinition("strange_quark", "Strange Quark", "s", ParticleCategory.QUARK, 93.4, -1.0 / 3.0, "1/2", "#8b5cf6", "Second-gen quark"),
        ParticleDefinition("top_quark", "Top Quark", "t", ParticleCategory.QUARK, 172760.0, 2.0 / 3.0, "1/2", "#d946ef", "Third-gen massive quark"),
        ParticleDefinition("bottom_quark", "Bottom Quark", "b", ParticleCategory.QUARK, 4180.0, -1.0 / 3.0, "1/2", "#ec4899", "Third-gen quark"),

        // Leptons
        ParticleDefinition("electron", "Electron", "e⁻", ParticleCategory.LEPTON, 0.51099895, -1.0, "1/2", "#06b6d4", "First-gen charged lepton"),
        ParticleDefinition("positron", "Positron", "e⁺", ParticleCategory.LEPTON, 0.51099895, 1.0, "1/2", "#f59e0b", "Antiparticle of electron", true),
        ParticleDefinition("muon_minus", "Muon", "μ⁻", ParticleCategory.LEPTON, 105.658, -1.0, "1/2", "#14b8a6", "Second-gen lepton"),
        ParticleDefinition("tau_minus", "Tau Lepton", "τ⁻", ParticleCategory.LEPTON, 1776.86, -1.0, "1/2", "#10b981", "Third-gen heavy lepton"),
        ParticleDefinition("electron_neutrino", "Electron Neutrino", "νₑ", ParticleCategory.LEPTON, 0.0000008, 0.0, "1/2", "#94a3b8", "Neutral lepton"),

        // Gauge & Scalar Bosons
        ParticleDefinition("photon", "Photon", "γ", ParticleCategory.GAUGE_BOSON, 0.0, 0.0, "1", "#eab308", "Electromagnetic carrier"),
        ParticleDefinition("gluon", "Gluon", "g", ParticleCategory.GAUGE_BOSON, 0.0, 0.0, "1", "#ef4444", "Strong force carrier"),
        ParticleDefinition("w_plus", "W⁺ Boson", "W⁺", ParticleCategory.GAUGE_BOSON, 80377.0, 1.0, "1", "#3b82f6", "Weak force carrier"),
        ParticleDefinition("w_minus", "W⁻ Boson", "W⁻", ParticleCategory.GAUGE_BOSON, 80377.0, -1.0, "1", "#0ea5e9", "Weak force carrier", true),
        ParticleDefinition("z_boson", "Z⁰ Boson", "Z⁰", ParticleCategory.GAUGE_BOSON, 91187.6, 0.0, "1", "#a855f7", "Neutral weak carrier"),
        ParticleDefinition("higgs_boson", "Higgs Boson", "H⁰", ParticleCategory.SCALAR_BOSON, 125250.0, 0.0, "0", "#fb7185", "Electroweak symmetry breaking scalar"),

        // Hadrons & Composites
        ParticleDefinition("proton", "Proton", "p⁺", ParticleCategory.BARYON, 938.272, 1.0, "1/2", "#2563eb", "uud baryon"),
        ParticleDefinition("antiproton", "Antiproton", "p̄⁻", ParticleCategory.BARYON, 938.272, -1.0, "1/2", "#e11d48", "ūūd̄ antibaryon", true),
        ParticleDefinition("neutron", "Neutron", "n⁰", ParticleCategory.BARYON, 939.565, 0.0, "1/2", "#64748b", "udd baryon"),
        ParticleDefinition("alpha", "Alpha Particle", "α²⁺", ParticleCategory.NUCLEUS, 3727.379, 2.0, "0", "#9333ea", "Helium-4 nucleus"),
        ParticleDefinition("pion_neutral", "Neutral Pion", "π⁰", ParticleCategory.MESON, 134.9768, 0.0, "0", "#e2e8f0", "Lightest meson"),
        ParticleDefinition("pion_plus", "Positive Pion", "π⁺", ParticleCategory.MESON, 139.5704, 1.0, "0", "#0284c7", "ud̄ meson"),
        ParticleDefinition("gold_nucleus", "Gold-197 Nucleus", "¹⁹⁷Au⁷⁹⁺", ParticleCategory.NUCLEUS, 183432.5, 79.0, "3/2", "#eab308", "Rutherford target")
    ).associateBy { it.id }
}
