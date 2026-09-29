package com.example.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.app.types.ParticleCategory
import com.example.app.types.ParticleState
import com.example.app.types.TrailPoint
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class SimulationState(
    val particles: List<ParticleState> = emptyList(),
    val isRunning: Boolean = false,
    val theme: String = "dark",
    val layout: String = "vertical",
    val trailLength: Int = 200,
    val isLandscape: Boolean = false
)

class SimulationViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(SimulationState())
    val uiState: StateFlow<SimulationState> = _uiState

    private var simulationJob: Job? = null

    init {
        // Initialize with default particles to ensure valid initial state
        _uiState.value = _uiState.value.copy(
            particles = listOf(
                ParticleState(
                    id = "p1",
                    definitionId = "proton",
                    name = "Proton",
                    symbol = "p",
                    color = "#EF4444",
                    category = ParticleCategory.BARYON,
                    x = -100.0, y = 0.0, z = 0.0,
                    vx = 5.0, vy = 0.0, vz = 0.0,
                    mass = 938.27, charge = 1.0,
                    beta = 0.99, gamma = 7.0,
                    px = 4691.0, py = 0.0, pz = 0.0, pTotal = 4691.0,
                    energy = 5629.0, kineticEnergy = 4691.0,
                    radius = 8.0,
                    trail = emptyList(),
                    isPrimaryBeam = "A",
                    isReactionProduct = false
                ),
                ParticleState(
                    id = "p2",
                    definitionId = "proton",
                    name = "Proton",
                    symbol = "p",
                    color = "#3B82F6",
                    category = ParticleCategory.BARYON,
                    x = 100.0, y = 0.0, z = 0.0,
                    vx = -5.0, vy = 0.0, vz = 0.0,
                    mass = 938.27, charge = 1.0,
                    beta = 0.99, gamma = 7.0,
                    px = -4691.0, py = 0.0, pz = 0.0, pTotal = 4691.0,
                    energy = 5629.0, kineticEnergy = 4691.0,
                    radius = 8.0,
                    trail = emptyList(),
                    isPrimaryBeam = "B",
                    isReactionProduct = false
                )
            )
        )
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
        val currentTheme = _uiState.value.theme
        _uiState.value = _uiState.value.copy(theme = if (currentTheme == "dark") "light" else "dark")
    }

    fun setLayout(layout: String) {
        _uiState.value = _uiState.value.copy(layout = layout)
    }

    fun setTrailLength(length: Int) {
        _uiState.value = _uiState.value.copy(trailLength = length)
    }

    fun toggleOrientation() {
        val next = !_uiState.value.isLandscape
        _uiState.value = _uiState.value.copy(isLandscape = next)
    }

    private fun startSimulation() {
        simulationJob = viewModelScope.launch(Dispatchers.Default) {
            while (isActive) {
                val updatedParticles = _uiState.value.particles.map { p ->
                    p.copy(
                        x = p.x + p.vx * 1.0,
                        y = p.y + p.vy * 1.0,
                        z = p.z + p.vz * 1.0
                    )
                }
                
                _uiState.value = _uiState.value.copy(particles = updatedParticles)
                delay(16)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        simulationJob?.cancel()
    }
}
