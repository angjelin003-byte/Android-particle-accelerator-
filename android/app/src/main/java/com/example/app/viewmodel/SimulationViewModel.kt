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

    fun setBombardmentType(type: BombardmentType) {
        _uiState.value = _uiState.value.copy(bombardmentType = type)
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

    fun updateCamera(rotateX: Float, rotateY: Float) {
        _uiState.value = _uiState.value.copy(
            cameraRotationX = (_uiState.value.cameraRotationX + rotateX).coerceIn(-60f, 60f),
            cameraRotationY = _uiState.value.cameraRotationY + rotateY
        )
    }

    fun resetSimulation() {
        stopSimulation()
        
        val type = _uiState.value.bombardmentType
        val energyMeV = _uiState.value.beamEnergyGeV * 1000.0
        
        val (p1Def, p2Def) = when (type) {
            BombardmentType.PROTON_PROTON -> ElementaryParticles.PROTON to ElementaryParticles.PROTON
            BombardmentType.ELECTRON_POSITRON -> ElementaryParticles.ELECTRON to ElementaryParticles.POSITRON
            BombardmentType.PROTON_ANTIPROTON -> ElementaryParticles.PROTON to ElementaryParticles.ANTIPROTON
            BombardmentType.HEAVY_ION -> ElementaryParticles.LEAD to ElementaryParticles.LEAD
            BombardmentType.CUSTOM -> ElementaryParticles.TOP to ElementaryParticles.HIGGS
        }

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
                isPrimaryBeam = side
            )
        }

        _uiState.value = _uiState.value.copy(
            particles = listOf(
                createBeamParticle(p1Def, -500.0, "A"),
                createBeamParticle(p2Def, 500.0, "B")
            ),
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
                val collisionProducts = mutableListOf<ParticleState>()

                for (p in state.particles) {
                    if (p.annihilated) continue
                    
                    val nx = p.x + p.vx * state.speedMultiplier
                    val ny = p.y + p.vy * state.speedMultiplier
                    val nz = p.z + p.vz * state.speedMultiplier
                    
                    val newTrail = (p.trail + TrailPoint(p.x, p.y, p.z)).takeLast(state.trailLength)
                    updated.add(p.copy(x = nx, y = ny, z = nz, trail = newTrail))
                }

                val a = updated.find { it.isPrimaryBeam == "A" }
                val b = updated.find { it.isPrimaryBeam == "B" }
                
                if (a != null && b != null && !collided) {
                    val dist = sqrt((a.x - b.x).pow(2) + (a.y - b.y).pow(2) + (a.z - b.z).pow(2))
                    if (dist < 20.0) {
                        collided = true
                        collisionProducts.addAll(generateProducts(a, b))
                        updated.forEachIndexed { i, p -> if (p.isPrimaryBeam != null) updated[i] = p.copy(annihilated = true) }
                    }
                }

                _uiState.value = _uiState.value.copy(
                    particles = if (collided) updated.filter { !it.annihilated } + collisionProducts else updated
                )
                
                delay(16)
            }
        }
    }

    private fun generateProducts(a: ParticleState, b: ParticleState): List<ParticleState> {
        val list = mutableListOf<ParticleState>()
        val rnd = kotlin.random.Random
        val energyGeV = _uiState.value.beamEnergyGeV
        val count = (8 + rnd.nextInt(12) * (energyGeV / 2).toInt()).coerceAtMost(60)
        
        val particlePool = listOf(
            ElementaryParticles.PHOTON, ElementaryParticles.GLUON, 
            ElementaryParticles.MUON, ElementaryParticles.TAU, 
            ElementaryParticles.PION, ElementaryParticles.UP, ElementaryParticles.DOWN,
            ElementaryParticles.CHARM, ElementaryParticles.STRANGE,
            ElementaryParticles.TOP, ElementaryParticles.BOTTOM,
            ElementaryParticles.W_PLUS, ElementaryParticles.W_MINUS,
            ElementaryParticles.Z_BOSON, ElementaryParticles.HIGGS
        )

        for (i in 0 until count) {
            val def = particlePool[rnd.nextInt(particlePool.size)]
            val theta = rnd.nextDouble(0.0, PI)
            val phi = rnd.nextDouble(0.0, 2 * PI)
            val speed = 2.0 + rnd.nextDouble(1.0, 7.0)
            
            list.add(ParticleState(
                id = "prod_${System.currentTimeMillis()}_$i",
                definition = def,
                x = (a.x + b.x) / 2.0,
                y = (a.y + b.y) / 2.0,
                z = (a.z + b.z) / 2.0,
                vx = speed * sin(theta) * cos(phi),
                vy = speed * sin(theta) * sin(phi),
                vz = speed * cos(theta),
                beta = 0.0, gamma = 1.0, energy = def.massMeV,
                trail = emptyList(),
                isPrimaryBeam = null
            ))
        }
        return list
    }
}
