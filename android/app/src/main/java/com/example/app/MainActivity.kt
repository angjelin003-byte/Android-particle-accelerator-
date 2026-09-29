package com.example.app

import android.content.pm.ActivityInfo
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.app.ui.ControlPanel
import com.example.app.ui.SimulationView
import com.example.app.viewmodel.SimulationViewModel
import com.example.app.types.AppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val viewModel: SimulationViewModel = viewModel()
            val uiState by viewModel.uiState.collectAsState()
            
            // Sync physical orientation with manual override
            LaunchedEffect(uiState.forceLandscape) {
                requestedOrientation = if (uiState.forceLandscape) {
                    ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
                } else {
                    ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                }
            }

            val isDark = uiState.theme == "dark"
            val bgColor = if (isDark) AppTheme.DarkBg else AppTheme.LightBg

            // Dynamic panel size based on expansion state
            val panelWidth by animateDpAsState(
                targetValue = if (uiState.isPanelExpanded) 280.dp else 60.dp,
                label = "Panel Expansion"
            )

            MaterialTheme(
                colorScheme = if (isDark) {
                    darkColorScheme(
                        primary = AppTheme.DarkPrimary,
                        surface = AppTheme.DarkSurface,
                        background = AppTheme.DarkBg,
                        onSurface = AppTheme.DarkText
                    )
                } else {
                    lightColorScheme(
                        primary = AppTheme.LightPrimary,
                        surface = AppTheme.LightSurface,
                        background = AppTheme.LightBg,
                        onSurface = AppTheme.LightText
                    )
                }
            ) {
                Surface(modifier = Modifier.fillMaxSize(), color = bgColor) {
                    Row(modifier = Modifier.fillMaxSize()) {
                        // Main Viewport
                        Box(modifier = Modifier.weight(1f).fillMaxHeight()) {
                            SimulationView(
                                state = uiState,
                                onRotate = { rx, ry -> viewModel.updateCamera(rx, ry) },
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        
                        // Right-aligned Foldable Control Panel
                        ControlPanel(
                            state = uiState,
                            onTogglePlay = { viewModel.togglePlay() },
                            onReset = { viewModel.resetSimulation() },
                            onToggleTheme = { viewModel.toggleTheme() },
                            onToggleOrientation = { viewModel.toggleOrientation() },
                            onSetBombardmentType = { viewModel.setBombardmentType(it) },
                            onSetBeamEnergy = { viewModel.setBeamEnergy(it) },
                            onSetTrailLength = { viewModel.setTrailLength(it) },
                            onSetSpeed = { viewModel.setSpeed(it) },
                            onTogglePanel = { viewModel.togglePanel() },
                            modifier = Modifier.width(panelWidth)
                        )
                    }
                }
            }
        }
    }
}
