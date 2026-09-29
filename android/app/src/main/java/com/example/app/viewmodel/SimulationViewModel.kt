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

    private val SUB_STEPS = 8 

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

    fun setMaxParticles(count: Int) {
        _uiState.value = _uiState.value.copy(maxParticles = count)
    }

    fun setMagneticField(tesla: Double) {
        _uiState.value = _uiState.value.copy(magneticFieldTesla = tesla)
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

    fun updateCameraZoom(zoomFactor: Float) {
        _uiState.value = _uiState.value.copy(
            cameraDistance = (_uiState.value.cameraDistance / zoomFactor).coerceIn(200f, 5000f)
        )
    }

    fun updateCameraTranslation(dx: Float, dy: Float) {
        _uiState.value = _uiState.value.copy(
            cameraTranslationX = _uiState.value.cameraTranslationX + dx,
            cameraTranslationY = _uiState.value.cameraTranslationY + dy
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
                x = x, y = 0.0, z = 0.0,
                vx = if (side == "A") beta * 8.0 else -beta * 8.0,
                vy = 0.0, vz = 0.0,
                beta = beta, gamma = gamma, energy = totalE,
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
            val totalFrameDt = 0.016
            val dt = totalFrameDt / SUB_STEPS
            
            while (isActive) {
                val state = _uiState.value
                if (!state.isRunning) break
                
                var currentFrameParticles = state.particles.toMutableList()
                var collided = false
                val collisionNewParticles = mutableListOf<ParticleState>()

                repeat(SUB_STEPS) {
                    val stepNewParticles = mutableListOf<ParticleState>()
                    val stepUpdated = mutableListOf<ParticleState>()
                    val accelerations = Array(currentFrameParticles.size) { doubleArrayOf(0.0, 0.0, 0.0) }

                    for (i in currentFrameParticles.indices) {
                        val pi = currentFrameParticles[i]
                        if (pi.annihilated) continue

                        // Lorentz Force (External Detector Field)
                        val q = pi.definition.charge
                        val bForce = if (pi.definition.massMeV > 0) (q / pi.definition.massMeV) * state.magneticFieldTesla * 1000.0 else 0.0
                        accelerations[i][0] += pi.vy * bForce
                        accelerations[i][1] -= pi.vx * bForce

                        // Pairwise Fundamental Forces (Internal Particle Physics)
                        for (j in i + 1 until currentFrameParticles.size) {
                            val pj = currentFrameParticles[j]
                            if (pj.annihilated) continue

                            val dx = pj.x - pi.x
                            val dy = pj.y - pi.y
                            val dz = pj.z - pi.z
                            val distSq = dx*dx + dy*dy + dz*dz + 100.0
                            val dist = sqrt(distSq)

                            // 1. Electromagnetism (Coulomb) - Alpha ~ 1/137
                            val emMag = (pi.definition.charge * pj.definition.charge * 5000.0) / distSq
                            applyForce(accelerations, i, j, dx/dist, dy/dist, dz/dist, emMag, pi.definition.massMeV, pj.definition.massMeV, repulsive = true)

                            // 2. Strong Force (Color Confinement) - Alpha_s ~ 1.0
                            if (pi.definition.hasColorCharge && pj.definition.hasColorCharge) {
                                if (dist > 50.0) {
                                    val strongMag = (dist - 50.0) * 0.05
                                    applyForce(accelerations, i, j, dx/dist, dy/dist, dz/dist, strongMag, pi.definition.massMeV, pj.definition.massMeV, repulsive = false)
                                    
                                    if (dist > 250.0 && Random.nextDouble() < 0.005) {
                                        stepNewParticles.addAll(produceQuarkPair((pi.x + pj.x)/2.0, (pi.y + pj.y)/2.0, (pi.z + pj.z)/2.0))
                                    }
                                }
                            }
                            
                            // Note: Gravity and Weak force are either too weak (10^-39) to matter 
                            // at this scale or represented by decay lifetimes (Weak).
                        }
                    }

                    for (i in currentFrameParticles.indices) {
                        val p = currentFrameParticles[i]
                        if (p.annihilated) continue

                        val nvx = p.vx + accelerations[i][0] * dt * state.speedMultiplier * 60.0
                        val nvy = p.vy + accelerations[i][1] * dt * state.speedMultiplier * 60.0
                        val nvz = p.vz + accelerations[i][2] * dt * state.speedMultiplier * 60.0
                        
                        val nx = p.x + nvx * dt * 60.0 * state.speedMultiplier
                        val ny = p.y + nvy * dt * 60.0 * state.speedMultiplier
                        val nz = p.z + nvz * dt * 60.0 * state.speedMultiplier
                        
                        var isDecaying = false
                        if (!p.definition.isStable && p.isPrimaryBeam == null) {
                            // Weak Force interaction via stochastic decay
                            val decayProb = 1.0 - exp(-dt * state.speedMultiplier * 0.1 / (max(1.0, p.gamma) * max(0.0001, p.definition.lifetimeNs)))
                            if (Random.nextDouble() < decayProb) isDecaying = true
                        }

                        if (isDecaying) {
                            stepNewParticles.addAll(decayParticle(p))
                            currentFrameParticles[i] = p.copy(annihilated = true)
                        } else {
                            val newTrail = if (it == 0) (p.trail + TrailPoint(p.x, p.y, p.z)).takeLast(state.trailLength) else p.trail
                            stepUpdated.add(p.copy(x = nx, y = ny, z = nz, vx = nvx, vy = nvy, vz = nvz, trail = newTrail))
                        }
                    }

                    val a = stepUpdated.find { it.isPrimaryBeam == "A" }
                    val b = stepUpdated.find { it.isPrimaryBeam == "B" }
                    if (a != null && b != null && !collided) {
                        val dist = sqrt((a.x - b.x).pow(2) + (a.y - b.y).pow(2) + (a.z - b.z).pow(2))
                        if (dist < 20.0) {
                            collided = true
                            collisionNewParticles.addAll(generateProducts(a, b))
                            stepUpdated.forEachIndexed { idx, p -> if (p.isPrimaryBeam != null) stepUpdated[idx] = p.copy(annihilated = true) }
                        }
                    }

                    currentFrameParticles = (stepUpdated.filter { !it.annihilated } + stepNewParticles).toMutableList()
                    if (currentFrameParticles.size > state.maxParticles) {
                        currentFrameParticles = currentFrameParticles.take(state.maxParticles).toMutableList()
                    }
                }

                _uiState.value = _uiState.value.copy(
                    particles = currentFrameParticles + collisionNewParticles
                )
                
                delay(16)
            }
        }
    }

    private fun applyForce(acc: Array<DoubleArray>, i: Int, j: Int, dx: Double, dy: Double, dz: Double, mag: Double, mi: Double, mj: Double, repulsive: Boolean) {
        val sign = if (repulsive) -1.0 else 1.0
        val ax = dx * mag * sign
        val ay = dy * mag * sign
        val az = dz * mag * sign
        
        acc[i][0] += ax / max(1.0, mi)
        acc[i][1] += ay / max(1.0, mi)
        acc[i][2] += az / max(1.0, mi)
        acc[j][0] -= ax / max(1.0, mj)
        acc[j][1] -= ay / max(1.0, mj)
        acc[j][2] -= az / max(1.0, mj)
    }

    private fun produceQuarkPair(x: Double, y: Double, z: Double): List<ParticleState> {
        val q1 = ElementaryParticles.UP
        val q2 = ElementaryParticles.DOWN
        val speed = 2.0
        val phi = Random.nextDouble(0.0, 2 * PI)
        return listOf(
            ParticleState("snap_${Random.nextLong()}", q1, x, y, z, cos(phi)*speed, sin(phi)*speed, 0.0, 0.0, 1.0, q1.massMeV, emptyList(), colorCharge = 1),
            ParticleState("snap_${Random.nextLong()}", q2, x, y, z, -cos(phi)*speed, -sin(phi)*speed, 0.0, 0.0, 1.0, q2.massMeV, emptyList(), colorCharge = 2)
        )
    }

    private fun decayParticle(p: ParticleState): List<ParticleState> {
        val products = mutableListOf<ParticleState>()
        val rnd = Random
        val targets = when (p.definition.id) {
            "h" -> listOf(ElementaryParticles.PHOTON, ElementaryParticles.PHOTON)
            "z" -> listOf(ElementaryParticles.ELECTRON, ElementaryParticles.POSITRON)
            "mu" -> listOf(ElementaryParticles.ELECTRON, ElementaryParticles.PHOTON)
            "tau" -> listOf(ElementaryParticles.MUON, ElementaryParticles.PHOTON)
            "pi" -> listOf(ElementaryParticles.PHOTON, ElementaryParticles.PHOTON)
            "t" -> listOf(ElementaryParticles.W_PLUS, ElementaryParticles.BOTTOM)
            else -> listOf(ElementaryParticles.PHOTON)
        }
        
        var totalPx = 0.0
        var totalPy = 0.0
        var totalPz = 0.0
        
        for (i in targets.indices) {
            val tDef = targets[i]
            val speed = 2.0 + rnd.nextDouble(0.0, 3.0)
            val theta = rnd.nextDouble(0.0, PI)
            val phi = rnd.nextDouble(0.0, 2 * PI)
            
            var vx = speed * sin(theta) * cos(phi)
            var vy = speed * sin(theta) * sin(phi)
            var vz = speed * cos(theta)
            
            if (i == targets.size - 1) {
                vx = -totalPx
                vy = -totalPy
                vz = -totalPz
            } else {
                totalPx += vx
                totalPy += vy
                totalPz += vz
            }

            products.add(p.copy(
                id = "decay_${p.id}_$i", 
                definition = tDef, 
                vx = p.vx + vx, 
                vy = p.vy + vy, 
                vz = p.vz + vz, 
                trail = emptyList(), 
                isPrimaryBeam = null, 
                birthTimeMs = System.currentTimeMillis()
            ))
        }
        return products
    }

    private fun generateProducts(a: ParticleState, b: ParticleState): List<ParticleState> {
        val list = mutableListOf<ParticleState>()
        val rnd = Random
        val totalEnergyMeV = a.energy + b.energy
        val maxRoom = _uiState.value.maxParticles - _uiState.value.particles.size
        if (maxRoom <= 0) return emptyList()

        val count = (15 + (totalEnergyMeV / 1000.0).toInt() * 5).coerceAtMost(maxRoom).coerceAtMost(60)
        
        var netCharge = a.definition.charge + b.definition.charge
        var totalPx = 0.0
        var totalPy = 0.0
        var totalPz = 0.0
        var remainingEnergy = totalEnergyMeV

        for (i in 0 until count) {
            val possiblePool = ElementaryParticles.ALL_PARTICLES.filter { it.massMeV <= remainingEnergy * 0.5 }
            if (possiblePool.isEmpty()) break
            
            val def = if (i == count - 1) {
                ElementaryParticles.ALL_PARTICLES.find { abs(it.charge + netCharge) < 0.1 } ?: possiblePool[rnd.nextInt(possiblePool.size)]
            } else {
                possiblePool[rnd.nextInt(possiblePool.size)]
            }
            
            netCharge -= def.charge
            remainingEnergy -= def.massMeV
            
            var vx: Double
            var vy: Double
            var vz: Double
            
            if (i == count - 1) {
                vx = -totalPx
                vy = -totalPy
                vz = -totalPz
            } else {
                val pt = rnd.nextDouble(0.0, 5.0)
                val phi = rnd.nextDouble(0.0, 2 * PI)
                vx = pt * cos(phi)
                vy = pt * sin(phi)
                vz = (rnd.nextDouble() - 0.5) * 10.0
                
                totalPx += vx
                totalPy += vy
                totalPz += vz
            }
            
            val speedSq = vx*vx + vy*vy + vz*vz
            val gamma = 1.0 + (speedSq / 100.0)

            list.add(ParticleState(
                id = "prod_${System.currentTimeMillis()}_$i",
                definition = def,
                x = (a.x + b.x) / 2.0,
                y = (a.y + b.y) / 2.0,
                z = (a.z + b.z) / 2.0,
                vx = vx, vy = vy, vz = vz,
                beta = 0.0, gamma = gamma, energy = def.massMeV,
                trail = emptyList(),
                isPrimaryBeam = null,
                colorCharge = if (def.hasColorCharge) (1..3).random() else 0
            ))
        }
        return list
    }
}
