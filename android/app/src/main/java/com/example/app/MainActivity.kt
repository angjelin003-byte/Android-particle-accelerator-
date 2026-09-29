package com.example.app

import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
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
            val configuration = LocalConfiguration.current
            val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
            
            val isDark = uiState.theme == "dark"
            val bgColor = if (isDark) AppTheme.DarkBg else AppTheme.LightBg

            // Panel animation state
            val panelWidth by animateDpAsState(
                targetValue = if (uiState.isPanelExpanded) 300.dp else 60.dp,
                label = "Panel Width"
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
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = bgColor
                ) {
                    if (isLandscape) {
                        Row(modifier = Modifier.fillMaxSize()) {
                            Box(modifier = Modifier.weight(1f).fillMaxHeight()) {
                                SimulationView(
                                    state = uiState,
                                    onRotate = { rx, ry -> viewModel.updateCamera(rx, ry) },
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                            
                            VerticalDivider(
                                thickness = 1.dp, 
                                color = if (isDark) AppTheme.DarkTextSecondary.copy(alpha = 0.1f) else AppTheme.LightTextSecondary.copy(alpha = 0.1f)
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
                                onTogglePanel = { viewModel.togglePanel() },
                                modifier = Modifier.width(panelWidth)
                            )
                        }
                    } else {
                        Column(modifier = Modifier.fillMaxSize()) {
                            Box(modifier = Modifier.weight(1.5f).fillMaxWidth()) {
                                SimulationView(
                                    state = uiState,
                                    onRotate = { rx, ry -> viewModel.updateCamera(rx, ry) },
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                            
                            HorizontalDivider(
                                thickness = 1.dp, 
                                color = if (isDark) AppTheme.DarkTextSecondary.copy(alpha = 0.1f) else AppTheme.LightTextSecondary.copy(alpha = 0.1f)
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
                                onTogglePanel = { viewModel.togglePanel() },
                                modifier = Modifier.weight(1f).fillMaxWidth()
                            )
                        }
                    }
                }
            }
        }
    }
}
