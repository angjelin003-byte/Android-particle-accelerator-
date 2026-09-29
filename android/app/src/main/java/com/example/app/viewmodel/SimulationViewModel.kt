package com.example.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.app.types.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlin.math.*
import androidx.compose.ui.graphics.Color
import kotlin.random.Random

class SimulationViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(SimulationState())
    val uiState: StateFlow<SimulationState> = _uiState
    private var simulationJob: Job? = null

    init {
        resetSimulation()
    }

    fun togglePlay() {
        val running = !_uiState.value.isRunning
        _uiState.value = _uiState.value.copy(isRunning = running)
        if (running) startSimulation() else stopSimulation()
    }

    private fun stopSimulation() {
        simulationJob?.cancel()
        simulationJob = null
    }

    fun togglePanel() {
        _uiState.value = _uiState.value.copy(isPanelExpanded = !_uiState.value.isPanelExpanded)
    }

    fun toggleOrientation() {
        _uiState.value = _uiState.value.copy(forceLandscape = !_uiState.value.forceLandscape)
    }

    fun toggleTheme() {
        val current = _uiState.value.theme
        _uiState.value = _uiState.value.copy(theme = if (current == "dark") "light" else "dark")
    }

    fun setBgColor(color: Color?) {
        _uiState.value = _uiState.value.copy(customBgColor = color)
    }

    fun setActiveSection(section: String) {
        _uiState.value = _uiState.value.copy(activeSection = section)
    }

    fun selectParticleA(def: ParticleDefinition) {
        _uiState.value = _uiState.value.copy(selectedParticleA = def)
        resetSimulation()
    }

    fun selectParticleB(def: ParticleDefinition) {
        _uiState.value = _uiState.value.copy(selectedParticleB = def)
        resetSimulation()
    }

    fun setBeamEnergy(energyGeV: Double) {
        _uiState.value = _uiState.value.copy(beamEnergyGeV = energyGeV)
        resetSimulation()
    }

    fun setTrailLength(length: Int) {
        _uiState.value = _uiState.value.copy(trailLength = length)
    }

    fun setSpeed(speed: Double) {
        _uiState.value = _uiState.value.copy(speedMultiplier = speed)
    }

    fun setMagneticField(tesla: Double) {
        _uiState.value = _uiState.value.copy(magneticFieldTesla = tesla)
    }

    fun setForceScale(force: String, scale: Double) {
        _uiState.value = when(force) {
            "STRONG" -> _uiState.value.copy(strongForceScale = scale)
            "WEAK" -> _uiState.value.copy(weakForceScale = scale)
            "EM" -> _uiState.value.copy(emForceScale = scale)
            "GRAVITY" -> _uiState.value.copy(gravityScale = scale)
            else -> _uiState.value
        }
    }

    fun selectParticle(id: String?) {
        _uiState.value = _uiState.value.copy(selectedParticleId = id)
    }

    fun updateCamera(rotateX: Float, rotateY: Float) {
        _uiState.value = _uiState.value.copy(
            cameraRotationX = (_uiState.value.cameraRotationX + rotateX).coerceIn(-60f, 60f),
            cameraRotationY = _uiState.value.cameraRotationY + rotateY
        )
    }

    fun resetSimulation() {
        stopSimulation()
        
        val energyMeV = _uiState.value.beamEnergyGeV * 1000.0
        val p1Def = _uiState.value.selectedParticleA
        val p2Def = _uiState.value.selectedParticleB

        fun createBeamParticle(def: ParticleDefinition, x: Double, side: String): ParticleState {
            val totalE = energyMeV + def.massMeV
            val gamma = totalE / max(0.001, def.massMeV)
            val beta = if (def.massMeV == 0.0) 1.0 else sqrt(max(0.0, 1.0 - 1.0 / (gamma * gamma)))
            
            return ParticleState(
                id = "beam_$side",
                definition = def,
                x = x,
                y = 0.0,
                z = 0.0,
                vx = if (side == "A") beta * 8.0 else -beta * 8.0,
                vy = 0.0,
                vz = 0.0,
                beta = beta,
                gamma = gamma,
                energy = totalE,
                trail = emptyList(),
                isPrimaryBeam = side,
                colorCharge = if (def.hasColorCharge) (1..3).random() else 0
            )
        }

        _uiState.value = _uiState.value.copy(
            particles = listOf(
                createBeamParticle(p1Def, -500.0, "A"),
                createBeamParticle(p2Def, 500.0, "B")
            ),
            isRunning = false,
            selectedParticleId = null
        )
    }

    private fun startSimulation() {
        simulationJob?.cancel()
        simulationJob = viewModelScope.launch(Dispatchers.Default) {
            val dt = 0.016
            
            while (isActive) {
                val state = _uiState.value
                if (!state.isRunning) break
                
                var collided = false
                val updated = mutableListOf<ParticleState>()
                val newParticles = mutableListOf<ParticleState>()

                // Calculate all forces O(N^2) for EM and Gravity (limited N)
                val currentParticles = state.particles
                val accelerations = Array(currentParticles.size) { doubleArrayOf(0.0, 0.0, 0.0) }

                for (i in currentParticles.indices) {
                    val pi = currentParticles[i]
                    if (pi.annihilated) continue

                    // 1. External B-Field (EM - Lorentz)
                    val q = pi.definition.charge
                    val forceConstant = if (pi.definition.massMeV > 0) (q / pi.definition.massMeV) * state.magneticFieldTesla * 1000.0 else 0.0
                    accelerations[i][0] += pi.vy * forceConstant
                    accelerations[i][1] -= pi.vx * forceConstant

                    // 2. Pairwise forces (EM, Gravity, Strong)
                    for (j in i + 1 until currentParticles.size) {
                        val pj = currentParticles[j]
                        if (pj.annihilated) continue

                        val dx = pj.x - pi.x
                        val dy = pj.y - pi.y
                        val dz = pj.z - pi.z
                        val distSq = dx*dx + dy*dy + dz*dz + 100.0 // Softening factor
                        val dist = sqrt(distSq)

                        // 2a. Electromagnetism (Coulomb: q1*q2 / r^2)
                        if (state.emForceScale > 0) {
                            val emMag = (pi.definition.charge * pj.definition.charge * 5000.0 * state.emForceScale) / distSq
                            val ax = (dx / dist) * emMag
                            val ay = (dy / dist) * emMag
                            val az = (dz / dist) * emMag
                            
                            accelerations[i][0] -= ax / max(1.0, pi.definition.massMeV)
                            accelerations[i][1] -= ay / max(1.0, pi.definition.massMeV)
                            accelerations[i][2] -= az / max(1.0, pi.definition.massMeV)
                            accelerations[j][0] += ax / max(1.0, pj.definition.massMeV)
                            accelerations[j][1] += ay / max(1.0, pj.definition.massMeV)
                            accelerations[j][2] += az / max(1.0, pj.definition.massMeV)
                        }

                        // 2b. Gravity (m1*m2 / r^2) - Scale heavily for visibility
                        if (state.gravityScale > 0) {
                            val gMag = (pi.definition.massMeV * pj.definition.massMeV * 0.00001 * state.gravityScale) / distSq
                            val ax = (dx / dist) * gMag
                            val ay = (dy / dist) * gMag
                            val az = (dz / dist) * gMag
                            
                            accelerations[i][0] += ax / max(1.0, pi.definition.massMeV)
                            accelerations[i][1] += ay / max(1.0, pi.definition.massMeV)
                            accelerations[i][2] += az / max(1.0, pi.definition.massMeV)
                            accelerations[j][0] -= ax / max(1.0, pj.definition.massMeV)
                            accelerations[j][1] -= ay / max(1.0, pj.definition.massMeV)
                            accelerations[j][2] -= az / max(1.0, pj.definition.massMeV)
                        }

                        // 2c. Strong Force (Spring-like confinement for color-charged)
                        if (state.strongForceScale > 0 && pi.definition.hasColorCharge && pj.definition.hasColorCharge) {
                            // Confinement: Force increases or stays constant with distance
                            // Simplified: Spring force if dist > 50
                            if (dist > 50.0) {
                                val strongMag = (dist - 50.0) * 0.05 * state.strongForceScale
                                val ax = (dx / dist) * strongMag
                                val ay = (dy / dist) * strongMag
                                val az = (dz / dist) * strongMag
                                
                                accelerations[i][0] += ax / max(1.0, pi.definition.massMeV)
                                accelerations[i][1] += ay / max(1.0, pi.definition.massMeV)
                                accelerations[i][2] += az / max(1.0, pi.definition.massMeV)
                                accelerations[j][0] -= ax / max(1.0, pj.definition.massMeV)
                                accelerations[j][1] -= ay / max(1.0, pj.definition.massMeV)
                                accelerations[j][2] -= az / max(1.0, pj.definition.massMeV)
                                
                                // String snap (hadronization)
                                if (dist > 250.0 && Random.nextDouble() < 0.05 * state.strongForceScale) {
                                    // Produce new quark pair at the center
                                    val midX = (pi.x + pj.x) / 2.0
                                    val midY = (pi.y + pj.y) / 2.0
                                    val midZ = (pi.z + pj.z) / 2.0
                                    newParticles.addAll(produceQuarkPair(midX, midY, midZ))
                                }
                            }
                        }
                    }
                }

                // Update velocities and positions
                for (i in currentParticles.indices) {
                    val p = currentParticles[i]
                    if (p.annihilated) continue

                    val nvx = p.vx + accelerations[i][0] * dt * state.speedMultiplier
                    val nvy = p.vy + accelerations[i][1] * dt * state.speedMultiplier
                    val nvz = p.vz + accelerations[i][2] * dt * state.speedMultiplier
                    
                    val nx = p.x + nvx * state.speedMultiplier
                    val ny = p.y + nvy * state.speedMultiplier
                    val nz = p.z + nvz * state.speedMultiplier
                    
                    // Weak Force (Decay)
                    var isDecaying = false
                    if (!p.definition.isStable && p.isPrimaryBeam == null) {
                        val tau = p.definition.lifetimeNs
                        val decayProb = 1.0 - exp(-dt * state.speedMultiplier * 0.1 * state.weakForceScale / (max(1.0, p.gamma) * max(0.0001, tau)))
                        if (Random.nextDouble() < decayProb) isDecaying = true
                    }

                    if (isDecaying) {
                        newParticles.addAll(decayParticle(p))
                    } else {
                        val newTrail = (p.trail + TrailPoint(p.x, p.y, p.z)).takeLast(state.trailLength)
                        updated.add(p.copy(x = nx, y = ny, z = nz, vx = nvx, vy = nvy, vz = nvz, trail = newTrail))
                    }
                }

                // Collision Logic
                val a = updated.find { it.isPrimaryBeam == "A" }
                val b = updated.find { it.isPrimaryBeam == "B" }
                if (a != null && b != null && !collided) {
                    val dist = sqrt((a.x - b.x).pow(2) + (a.y - b.y).pow(2) + (a.z - b.z).pow(2))
                    if (dist < 20.0) {
                        collided = true
                        newParticles.addAll(generateProducts(a, b))
                        updated.forEachIndexed { i, p -> if (p.isPrimaryBeam != null) updated[i] = p.copy(annihilated = true) }
                    }
                }

                _uiState.value = _uiState.value.copy(
                    particles = (updated.filter { !it.annihilated } + newParticles)
                )
                
                delay(16)
            }
        }
    }

    private fun produceQuarkPair(x: Double, y: Double, z: Double): List<ParticleState> {
        val q1 = ElementaryParticles.UP
        val q2 = ElementaryParticles.DOWN
        return listOf(
            ParticleState("snap_${Random.nextLong()}", q1, x, y, z, (Random.nextDouble()-0.5)*5, (Random.nextDouble()-0.5)*5, (Random.nextDouble()-0.5)*5, 0.0, 1.0, q1.massMeV, emptyList(), colorCharge = 1),
            ParticleState("snap_${Random.nextLong()}", q2, x, y, z, (Random.nextDouble()-0.5)*5, (Random.nextDouble()-0.5)*5, (Random.nextDouble()-0.5)*5, 0.0, 1.0, q2.massMeV, emptyList(), colorCharge = 2)
        )
    }

    private fun decayParticle(p: ParticleState): List<ParticleState> {
        val products = mutableListOf<ParticleState>()
        val rnd = Random
        val def = p.definition
        val targets = when (def.id) {
            "h" -> listOf(ElementaryParticles.PHOTON, ElementaryParticles.PHOTON)
            "z" -> listOf(ElementaryParticles.MUON, ElementaryParticles.POSITRON)
            "mu" -> listOf(ElementaryParticles.ELECTRON)
            "tau" -> listOf(ElementaryParticles.MUON)
            "pi" -> listOf(ElementaryParticles.PHOTON, ElementaryParticles.PHOTON)
            "t" -> listOf(ElementaryParticles.W_PLUS, ElementaryParticles.BOTTOM)
            else -> listOf(ElementaryParticles.PHOTON)
        }
        for ((i, tDef) in targets.withIndex()) {
            val angle = rnd.nextDouble(0.0, 2 * PI)
            val vSpread = 1.0 + rnd.nextDouble(0.0, 2.0)
            products.add(p.copy(id = "decay_${p.id}_$i", definition = tDef, vx = p.vx * 0.5 + cos(angle) * vSpread, vy = p.vy * 0.5 + sin(angle) * vSpread, vz = p.vz * 0.5 + (rnd.nextDouble() - 0.5) * vSpread, trail = emptyList(), isPrimaryBeam = null, birthTimeMs = System.currentTimeMillis()))
        }
        return products
    }

    private fun generateProducts(a: ParticleState, b: ParticleState): List<ParticleState> {
        val list = mutableListOf<ParticleState>()
        val rnd = Random
        val energyGeV = _uiState.value.beamEnergyGeV
        val count = (12 + rnd.nextInt(10) * (energyGeV / 2).toInt()).coerceAtMost(60) // Reduced N for N^2 perf
        val particlePool = ElementaryParticles.ALL_PARTICLES
        for (i in 0 until count) {
            val def = particlePool[rnd.nextInt(particlePool.size)]
            val theta = rnd.nextDouble(0.0, PI)
            val phi = rnd.nextDouble(0.0, 2 * PI)
            val speed = 2.0 + rnd.nextDouble(1.0, 8.0)
            list.add(ParticleState(id = "prod_${System.currentTimeMillis()}_$i", definition = def, x = (a.x + b.x) / 2.0, y = (a.y + b.y) / 2.0, z = (a.z + b.z) / 2.0, vx = speed * sin(theta) * cos(phi), vy = speed * sin(theta) * sin(phi), vz = speed * cos(theta), beta = 0.0, gamma = 1.0, energy = def.massMeV, trail = emptyList(), isPrimaryBeam = null, colorCharge = if (def.hasColorCharge) (1..3).random() else 0))
        }
        return list
    }
}
