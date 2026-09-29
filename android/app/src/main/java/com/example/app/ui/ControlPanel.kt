package com.example.app.ui

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app.types.SimulationState
import com.example.app.types.AppTheme

@Composable
fun ControlPanel(
    state: SimulationState,
    onTogglePlay: () -> Unit,
    onReset: () -> Unit,
    onToggleTheme: () -> Unit,
    onSetBeamEnergy: (Double) -> Unit,
    onSetCollisionAngle: (Double) -> Unit,
    onSetTrailLength: (Int) -> Unit,
    onSetSpeed: (Double) -> Unit,
    onTogglePanel: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val isDark = state.theme == "dark"
    val surfaceColor = if (isDark) AppTheme.DarkSurface else AppTheme.LightSurface
    val textColor = if (isDark) AppTheme.DarkText else AppTheme.LightText
    val secondaryTextColor = if (isDark) AppTheme.DarkTextSecondary else AppTheme.LightTextSecondary

    Surface(
        modifier = modifier.fillMaxHeight(),
        color = surfaceColor,
        tonalElevation = 8.dp
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Fold Button Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                IconButton(onClick = onTogglePanel) {
                    Icon(
                        imageVector = if (state.isPanelExpanded) Icons.Default.KeyboardArrowRight else Icons.Default.KeyboardArrowLeft,
                        contentDescription = "Toggle Panel",
                        tint = textColor
                    )
                }
            }

            AnimatedVisibility(
                visible = state.isPanelExpanded,
                enter = expandHorizontally() + fadeIn(),
                exit = shrinkHorizontally() + fadeOut()
            ) {
                Column(
                    modifier = Modifier
                        .verticalScroll(scrollState)
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .width(280.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Header
                    Column {
                        Text(
                            "QUANTUM LAB 3D",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 2.sp
                            ),
                            color = textColor
                        )
                        Text(
                            "High-Energy Physics Simulation",
                            style = MaterialTheme.typography.labelSmall,
                            color = secondaryTextColor
                        )
                    }

                    // Theme & Primary Controls
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onTogglePlay,
                            modifier = Modifier.weight(1f),
                            shape = MaterialTheme.shapes.medium,
                            colors = ButtonDefaults.buttonColors(containerColor = AppTheme.DarkPrimary)
                        ) {
                            Text(if (state.isRunning) "PAUSE" else "INITIATE", fontSize = 12.sp)
                        }
                        
                        IconButton(
                            onClick = onToggleTheme,
                            modifier = Modifier.size(48.dp)
                        ) {
                            Text(if (isDark) "🌙" else "☀️")
                        }
                    }

                    OutlinedButton(
                        onClick = onReset,
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.medium
                    ) {
                        Text("RESET CHAMBER", fontSize = 12.sp)
                    }

                    HorizontalDivider(color = secondaryTextColor.copy(alpha = 0.2f))

                    // Parameters
                    CompactParameter(
                        label = "Luminosity / Energy",
                        value = state.beamEnergyMeV,
                        onValueChange = onSetBeamEnergy,
                        valueRange = 100f..14000f,
                        unit = "MeV",
                        color = textColor,
                        secondaryColor = secondaryTextColor
                    )

                    CompactParameter(
                        label = "Injection Angle",
                        value = state.collisionAngleDeg,
                        onValueChange = onSetCollisionAngle,
                        valueRange = 0f..180f,
                        unit = "°",
                        color = textColor,
                        secondaryColor = secondaryTextColor
                    )

                    CompactParameter(
                        label = "Temporal Scale",
                        value = state.speedMultiplier,
                        onValueChange = onSetSpeed,
                        valueRange = 0.1f..3.0f,
                        unit = "x",
                        format = "%.1f",
                        color = textColor,
                        secondaryColor = secondaryTextColor
                    )

                    CompactParameter(
                        label = "Decay Trails",
                        value = state.trailLength.toDouble(),
                        onValueChange = { onSetTrailLength(it.toInt()) },
                        valueRange = 10f..500f,
                        unit = "px",
                        color = textColor,
                        secondaryColor = secondaryTextColor
                    )

                    Spacer(modifier = Modifier.weight(1f))

                    // Chamber Status
                    Surface(
                        color = textColor.copy(alpha = 0.05f),
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            ChamberInfo("VACUUM", "STABLE", textColor, secondaryTextColor)
                            ChamberInfo("ENTROPY", state.particles.size.toString(), textColor, secondaryTextColor)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CompactParameter(
    label: String,
    value: Double,
    onValueChange: (Double) -> Unit,
    valueRange: ClosedFloatingPointRange<Float>,
    unit: String,
    format: String = "%.0f",
    color: Color,
    secondaryColor: Color
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = color)
            Text("${format.format(value)} $unit", style = MaterialTheme.typography.labelSmall, color = secondaryColor)
        }
        Slider(
            value = value.toFloat(),
            onValueChange = { onValueChange(it.toDouble()) },
            valueRange = valueRange,
            colors = SliderDefaults.colors(thumbColor = AppTheme.DarkAccent, activeTrackColor = AppTheme.DarkAccent.copy(alpha = 0.5f))
        )
    }
}

@Composable
fun ChamberInfo(label: String, value: String, color: Color, secondaryColor: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = secondaryColor)
        Text(value, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = color)
    }
}
