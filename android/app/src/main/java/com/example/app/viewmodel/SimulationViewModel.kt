package com.example.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.app.types.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlin.math.*

data class SimulationState(
    val particles: List<ParticleState> = emptyList(),
    val isRunning: Boolean = false,
    val theme: String = "dark",
    val beamEnergyMeV: Double = 7000.0, // 7 GeV
    val collisionAngleDeg: Double = 180.0,
    val trailLength: Int = 200,
    val speedMultiplier: Double = 1.0,
    val selectedParticleId: String? = null
)

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
        }
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

    fun selectParticle(id: String?) {
        _uiState.value = _uiState.value.copy(selectedParticleId = id)
    }

    fun resetSimulation() {
        simulationJob?.cancel()
        val energy = _uiState.value.beamEnergyMeV
        val angleRad = Math.toRadians(_uiState.value.collisionAngleDeg)

        // Proton rest mass ~ 938.27 MeV
        val m = 938.27
        val totalE = energy + m
        val gamma = totalE / m
        val beta = sqrt(max(0.0, 1.0 - 1.0 / (gamma * gamma)))
        val p = gamma * m * beta

        val p1Vx = beta * 4.0
        val p1Vy = 0.0
        val p2Vx = -beta * 4.0 * cos(angleRad)
        val p2Vy = -beta * 4.0 * sin(angleRad)

        val beamA = ParticleState(
            id = "beam_a",
            definitionId = "proton",
            name = "Proton A",
            symbol = "p+",
            color = "#00FFFF",
            category = ParticleCategory.BARYON,
            x = -250.0,
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
            radius = 14.0,
            trail = emptyList(),
            isPrimaryBeam = "A",
            isReactionProduct = false
        )

        val beamB = ParticleState(
            id = "beam_b",
            definitionId = "proton",
            name = "Proton B",
            symbol = "p+",
            color = "#FF00FF",
            category = ParticleCategory.BARYON,
            x = 250.0,
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
            radius = 14.0,
            trail = emptyList(),
            isPrimaryBeam = "B",
            isReactionProduct = false
        )

        _uiState.value = _uiState.value.copy(
            particles = listOf(beamA, beamB),
            isRunning = false,
            selectedParticleId = null
        )
    }

    private fun startSimulation() {
        simulationJob = viewModelScope.launch(Dispatchers.Default) {
            while (isActive) {
                val state = _uiState.value
                var collided = false
                val updated = mutableListOf<ParticleState>()
                val newParticles = mutableListOf<ParticleState>()

                for (p in state.particles) {
                    if (p.annihilated) continue

                    val nx = p.x + p.vx * state.speedMultiplier
                    val ny = p.y + p.vy * state.speedMultiplier
                    val nz = p.z + p.vz * state.speedMultiplier

                    val newTrail = (listOf(TrailPoint(p.x, p.y, p.z, System.currentTimeMillis().toDouble())) + p.trail)
                        .take(state.trailLength)

                    updated.add(
                        p.copy(
                            x = nx,
                            y = ny,
                            z = nz,
                            trail = newTrail
                        )
                    )
                }

                // Check collision between Beam A and Beam B
                val a = updated.find { it.isPrimaryBeam == "A" }
                val b = updated.find { it.isPrimaryBeam == "B" }
                if (a != null && b != null && !collided) {
                    val dist = sqrt((a.x - b.x).pow(2) + (a.y - b.y).pow(2))
                    if (dist < 25.0) {
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
        val count = 5 + rnd.nextInt(5) // 5 to 9 products
        for (i in 0 until count) {
            val angle = rnd.nextDouble(0.0, 2 * PI)
            val speed = 2.5 + rnd.nextDouble(0.0, 5.0)
            val m = 139.5
            val energy = m * (1.2 + rnd.nextDouble(0.0, 2.0))
            val gamma = energy / m
            val beta = sqrt(max(0.0, 1.0 - 1.0 / (gamma * gamma)))
            val p = gamma * m * beta

            list.add(
                ParticleState(
                    id = "prod_$i",
                    definitionId = if (i % 2 == 0) "pion_plus" else "photon",
                    name = if (i % 2 == 0) "Charged Pion #${i + 1}" else "Photon #${i + 1}",
                    symbol = if (i % 2 == 0) "π⁺" else "γ",
                    color = if (i % 2 == 0) "#FFD700" else "#00FFFF",
                    category = if (i % 2 == 0) ParticleCategory.MESON else ParticleCategory.GAUGE_BOSON,
                    x = (a.x + b.x) / 2.0,
                    y = (a.y + b.y) / 2.0,
                    z = 0.0,
                    vx = cos(angle) * speed,
                    vy = sin(angle) * speed,
                    vz = rnd.nextDouble(-1.5, 1.5),
                    mass = m,
                    charge = if (i % 2 == 0) 1.0 else 0.0,
                    beta = beta,
                    gamma = gamma,
                    px = p * cos(angle),
                    py = p * sin(angle),
                    pz = 0.0,
                    pTotal = p,
                    energy = energy,
                    kineticEnergy = energy - m,
                    radius = 9.0,
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
