package com.example.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.app.types.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlin.math.*

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
        if (running) {
            startSimulation()
        } else {
            simulationJob?.cancel()
            simulationJob = null
        }
    }

    fun togglePanel() {
        _uiState.value = _uiState.value.copy(isPanelExpanded = !_uiState.value.isPanelExpanded)
    }

    fun toggleTheme() {
        val current = _uiState.value.theme
        _uiState.value = _uiState.value.copy(theme = if (current == "dark") "light" else "dark")
    }

    fun setBeamEnergy(energy: Double) {
        _uiState.value = _uiState.value.copy(beamEnergyMeV = energy)
        resetSimulation()
    }

    fun setCollisionAngle(angle: Double) {
        _uiState.value = _uiState.value.copy(collisionAngleDeg = angle)
        resetSimulation()
    }

    fun setTrailLength(length: Int) {
        _uiState.value = _uiState.value.copy(trailLength = length)
    }

    fun setSpeed(speed: Double) {
        _uiState.value = _uiState.value.copy(speedMultiplier = speed)
    }

    fun updateCamera(rotateX: Float, rotateY: Float) {
        _uiState.value = _uiState.value.copy(
            cameraRotationX = (_uiState.value.cameraRotationX + rotateX).coerceIn(-60f, 60f),
            cameraRotationY = _uiState.value.cameraRotationY + rotateY
        )
    }

    fun resetSimulation() {
        simulationJob?.cancel()
        simulationJob = null
        
        val energy = _uiState.value.beamEnergyMeV
        val angleRad = Math.toRadians(_uiState.value.collisionAngleDeg)
        
        val m = 938.27
        val totalE = energy + m
        val gamma = totalE / m
        val beta = sqrt(max(0.0, 1.0 - 1.0 / (gamma * gamma)))
        val p = gamma * m * beta

        val p1Vx = beta * 6.0
        val p1Vy = 0.0
        
        val p2Vx = -beta * 6.0 * cos(angleRad)
        val p2Vy = -beta * 6.0 * sin(angleRad)

        val beamA = ParticleState(
            id = "beam_a",
            definitionId = "proton",
            name = "Proton A",
            symbol = "p+",
            color = "#818CF8",
            category = ParticleCategory.BARYON,
            x = -400.0,
            y = 0.0,
            z = 0.0,
            vx = p1Vx,
            vy = p1Vy,
            vz = 0.0,
            mass = m,
            charge = 1.0,
            beta = beta,
            gamma = gamma,
            px = p,
            py = 0.0,
            pz = 0.0,
            pTotal = p,
            energy = totalE,
            kineticEnergy = energy,
            radius = 12.0,
            trail = emptyList(),
            isPrimaryBeam = "A",
            isReactionProduct = false
        )

        val beamB = ParticleState(
            id = "beam_b",
            definitionId = "proton",
            name = "Proton B",
            symbol = "p+",
            color = "#F472B6",
            category = ParticleCategory.BARYON,
            x = 400.0,
            y = 0.0,
            z = 0.0,
            vx = p2Vx,
            vy = p2Vy,
            vz = 0.0,
            mass = m,
            charge = 1.0,
            beta = beta,
            gamma = gamma,
            px = -p * cos(angleRad),
            py = -p * sin(angleRad),
            pz = 0.0,
            pTotal = p,
            energy = totalE,
            kineticEnergy = energy,
            radius = 12.0,
            trail = emptyList(),
            isPrimaryBeam = "B",
            isReactionProduct = false
        )

        _uiState.value = _uiState.value.copy(
            particles = listOf(beamA, beamB),
            isRunning = false
        )
    }

    private fun startSimulation() {
        simulationJob?.cancel()
        simulationJob = viewModelScope.launch(Dispatchers.Default) {
            while (isActive) {
                val state = _uiState.value
                if (!state.isRunning) break
                
                var collided = false
                val updated = mutableListOf<ParticleState>()
                val newParticles = mutableListOf<ParticleState>()

                for (p in state.particles) {
                    if (p.annihilated && p.trail.isEmpty()) continue
                    
                    val nx = p.x + p.vx * state.speedMultiplier
                    val ny = p.y + p.vy * state.speedMultiplier
                    val nz = p.z + p.vz * state.speedMultiplier
                    
                    val newTrail = (p.trail + TrailPoint(p.x, p.y, p.z, System.currentTimeMillis().toDouble()))
                        .takeLast(state.trailLength)
                        
                    updated.add(
                        p.copy(
                            x = nx,
                            y = ny,
                            z = nz,
                            trail = newTrail
                        )
                    )
                }

                val a = updated.find { it.isPrimaryBeam == "A" }
                val b = updated.find { it.isPrimaryBeam == "B" }
                
                if (a != null && b != null && !collided) {
                    val dist = sqrt((a.x - b.x).pow(2) + (a.y - b.y).pow(2) + (a.z - b.z).pow(2))
                    if (dist < 20.0) {
                        collided = true
                        val products = generateReactionProducts(a, b)
                        newParticles.addAll(updated.map { if (it.isPrimaryBeam != null) it.copy(annihilated = true) else it })
                        newParticles.addAll(products)
                    }
                }

                _uiState.value = _uiState.value.copy(
                    particles = if (collided) newParticles else updated
                )
                
                delay(16)
            }
        }
    }

    private fun generateReactionProducts(a: ParticleState, b: ParticleState): List<ParticleState> {
        val list = mutableListOf<ParticleState>()
        val rnd = kotlin.random.Random
        val count = 12 + rnd.nextInt(12)
        
        val colors = listOf("#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#A855F7", "#22D3EE")
        
        for (i in 0 until count) {
            val theta = rnd.nextDouble(0.0, PI) // Polar angle
            val phi = rnd.nextDouble(0.0, 2 * PI) // Azimuthal angle
            val speed = 2.0 + rnd.nextDouble(0.0, 8.0)
            
            val vx = speed * sin(theta) * cos(phi)
            val vy = speed * sin(theta) * sin(phi)
            val vz = speed * cos(theta)
            
            val m = 139.5
            val energy = m * (1.1 + rnd.nextDouble(0.0, 4.0))
            val gamma = energy / m
            val beta = sqrt(max(0.0, 1.0 - 1.0 / (gamma * gamma)))
            val p = gamma * m * beta
            
            list.add(
                ParticleState(
                    id = "prod_$i",
                    definitionId = "pion",
                    name = "Particle #$i",
                    symbol = if (i % 2 == 0) "π" else "K",
                    color = colors[rnd.nextInt(colors.size)],
                    category = ParticleCategory.MESON,
                    x = (a.x + b.x) / 2.0,
                    y = (a.y + b.y) / 2.0,
                    z = (a.z + b.z) / 2.0,
                    vx = vx,
                    vy = vy,
                    vz = vz,
                    mass = m,
                    charge = 0.0,
                    beta = beta,
                    gamma = gamma,
                    px = p * sin(theta) * cos(phi),
                    py = p * sin(theta) * sin(phi),
                    pz = p * cos(theta),
                    pTotal = p,
                    energy = energy,
                    kineticEnergy = energy - m,
                    radius = 7.0,
                    trail = emptyList(),
                    isPrimaryBeam = null,
                    isReactionProduct = true
                )
            )
        }
        return list
    }

    override fun onCleared() {
        super.onCleared()
        simulationJob?.cancel()
    }
}
