package com.example.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.app.types.ParticleState
import com.example.app.types.TrailPoint
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlin.math.sqrt

data class SimulationState(
    val particles: List<ParticleState> = emptyList(),
    val isRunning: Boolean = false,
    val theme: String = "dark",
    val layout: String = "vertical",
    val trailLength: Int = 200
)

class SimulationViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(SimulationState())
    val uiState: StateFlow<SimulationState> = _uiState

    private var simulationJob: Job? = null

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

    private fun startSimulation() {
        simulationJob = viewModelScope.launch(Dispatchers.Default) {
            while (isActive) {
                // Simplified simulation step
                val updatedParticles = _uiState.value.particles.map { p ->
                    p.copy(
                        x = p.x + p.vx * 1.0,
                        y = p.y + p.vy * 1.0,
                        z = p.z + p.vz * 1.0
                    )
                }
                
                _uiState.value = _uiState.value.copy(particles = updatedParticles)
                delay(16) // ~60 FPS
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        simulationJob?.cancel()
    }
}
