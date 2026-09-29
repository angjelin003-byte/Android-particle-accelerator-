package com.example.app

import android.content.pm.ActivityInfo
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
            
            LaunchedEffect(uiState.forceLandscape) {
                requestedOrientation = if (uiState.forceLandscape) {
                    ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
                } else {
                    ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                }
            }

            val isDark = uiState.theme == "dark"
            val bgColor = uiState.customBgColor ?: if (isDark) AppTheme.DarkBg else AppTheme.LightBg

            // Calculate 35% of screen dimensions
            val screenWidth = configuration.screenWidthDp.dp
            val screenHeight = configuration.screenHeightDp.dp
            
            val targetPanelWidth = screenWidth * 0.35f
            val targetPanelHeight = screenHeight * 0.35f

            // Dynamic panel size based on expansion state and orientation
            val panelDim by animateDpAsState(
                targetValue = if (uiState.isPanelExpanded) {
                    if (isLandscape) targetPanelWidth else targetPanelHeight
                } else {
                    60.dp // Collapsed size
                },
                label = "Panel Dimension"
            )

            MaterialTheme(
                colorScheme = if (isDark) {
                    darkColorScheme(
                        primary = AppTheme.DarkPrimary,
                        surface = AppTheme.DarkSurface,
                        background = bgColor,
                        onSurface = AppTheme.DarkText
                    )
                } else {
                    lightColorScheme(
                        primary = AppTheme.LightPrimary,
                        surface = AppTheme.LightSurface,
                        background = bgColor,
                        onSurface = AppTheme.LightText
                    )
                }
            ) {
                Surface(modifier = Modifier.fillMaxSize(), color = bgColor) {
                    if (isLandscape) {
                        Row(modifier = Modifier.fillMaxSize()) {
                            Box(modifier = Modifier.weight(1f).fillMaxHeight()) {
                                SimulationView(
                                    state = uiState,
                                    onRotate = { rx, ry -> viewModel.updateCamera(rx, ry) },
                                    onSelectParticle = { id -> viewModel.selectParticle(id) },
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                            
                            ControlPanel(
                                state = uiState,
                                onTogglePlay = { viewModel.togglePlay() },
                                onReset = { viewModel.resetSimulation() },
                                onToggleTheme = { viewModel.toggleTheme() },
                                onToggleOrientation = { viewModel.toggleOrientation() },
                                onSetBgColor = { viewModel.setBgColor(it) },
                                onSetActiveSection = { viewModel.setActiveSection(it) },
                                onSelectParticleA = { viewModel.selectParticleA(it) },
                                onSelectParticleB = { viewModel.selectParticleB(it) },
                                onSetBeamEnergy = { viewModel.setBeamEnergy(it) },
                                onSetTrailLength = { viewModel.setTrailLength(it) },
                                onSetSpeed = { viewModel.setSpeed(it) },
                                onSetMagneticField = { viewModel.setMagneticField(it) },
                                onSetForceScale = { f, s -> viewModel.setForceScale(f, s) },
                                onTogglePanel = { viewModel.togglePanel() },
                                onExit = { finish() },
                                modifier = Modifier.width(panelDim).fillMaxHeight()
                            )
                        }
                    } else {
                        Column(modifier = Modifier.fillMaxSize()) {
                            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                                SimulationView(
                                    state = uiState,
                                    onRotate = { rx, ry -> viewModel.updateCamera(rx, ry) },
                                    onSelectParticle = { id -> viewModel.selectParticle(id) },
                                    modifier = Modifier.fillMaxSize()
                                )
                            }
                            
                            ControlPanel(
                                state = uiState,
                                onTogglePlay = { viewModel.togglePlay() },
                                onReset = { viewModel.resetSimulation() },
                                onToggleTheme = { viewModel.toggleTheme() },
                                onToggleOrientation = { viewModel.toggleOrientation() },
                                onSetBgColor = { viewModel.setBgColor(it) },
                                onSetActiveSection = { viewModel.setActiveSection(it) },
                                onSelectParticleA = { viewModel.selectParticleA(it) },
                                onSelectParticleB = { viewModel.selectParticleB(it) },
                                onSetBeamEnergy = { viewModel.setBeamEnergy(it) },
                                onSetTrailLength = { viewModel.setTrailLength(it) },
                                onSetSpeed = { viewModel.setSpeed(it) },
                                onSetMagneticField = { viewModel.setMagneticField(it) },
                                onSetForceScale = { f, s -> viewModel.setForceScale(f, s) },
                                onTogglePanel = { viewModel.togglePanel() },
                                onExit = { finish() },
                                modifier = Modifier.fillMaxWidth().height(panelDim)
                            )
                        }
                    }
                }
            }
        }
    }
}
