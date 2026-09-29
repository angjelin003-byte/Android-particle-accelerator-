package com.example.app

import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.app.ui.ControlPanel
import com.example.app.ui.SimulationView
import com.example.app.viewmodel.SimulationViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val viewModel: SimulationViewModel = viewModel()
            val uiState by viewModel.uiState.collectAsState()
            val configuration = LocalConfiguration.current
            val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

            MaterialTheme(colorScheme = if (uiState.theme == "dark") darkColorScheme() else lightColorScheme()) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    if (isLandscape) {
                        Row(modifier = Modifier.fillMaxSize()) {
                            SimulationView(
                                state = uiState,
                                modifier = Modifier.weight(1.5f).fillMaxHeight()
                            )
                            ControlPanel(
                                state = uiState,
                                onTogglePlay = { viewModel.togglePlay() },
                                onReset = { viewModel.resetSimulation() },
                                onToggleTheme = { viewModel.toggleTheme() },
                                onSetBeamEnergy = { viewModel.setBeamEnergy(it) },
                                onSetCollisionAngle = { viewModel.setCollisionAngle(it) },
                                onSetTrailLength = { viewModel.setTrailLength(it) },
                                onSetSpeed = { viewModel.setSpeed(it) },
                                modifier = Modifier.weight(1f).fillMaxHeight()
                            )
                        }
                    } else {
                        Column(modifier = Modifier.fillMaxSize()) {
                            SimulationView(
                                state = uiState,
                                modifier = Modifier.weight(1f).fillMaxWidth()
                            )
                            ControlPanel(
                                state = uiState,
                                onTogglePlay = { viewModel.togglePlay() },
                                onReset = { viewModel.resetSimulation() },
                                onToggleTheme = { viewModel.toggleTheme() },
                                onSetBeamEnergy = { viewModel.setBeamEnergy(it) },
                                onSetCollisionAngle = { viewModel.setCollisionAngle(it) },
                                onSetTrailLength = { viewModel.setTrailLength(it) },
                                onSetSpeed = { viewModel.setSpeed(it) },
                                modifier = Modifier.weight(1f).fillMaxWidth()
                            )
                        }
                    }
                }
            }
        }
    }
}
