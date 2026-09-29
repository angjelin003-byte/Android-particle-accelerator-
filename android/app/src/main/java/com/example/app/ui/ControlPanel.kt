package com.example.app.ui

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app.types.SimulationState
import com.example.app.types.AppTheme
import com.example.app.types.BombardmentType

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ControlPanel(
    state: SimulationState,
    onTogglePlay: () -> Unit,
    onReset: () -> Unit,
    onToggleTheme: () -> Unit,
    onToggleOrientation: () -> Unit,
    onSetBombardmentType: (BombardmentType) -> Unit,
    onSetBeamEnergy: (Double) -> Unit,
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
        tonalElevation = 6.dp
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onTogglePanel) {
                    Icon(
                        imageVector = if (state.isPanelExpanded) Icons.Default.Close else Icons.Default.Menu,
                        contentDescription = "Menu",
                        tint = textColor
                    )
                }
                
                if (state.isPanelExpanded) {
                    Row {
                        IconButton(onClick = onToggleOrientation) {
                            Icon(
                                imageVector = if (state.forceLandscape) Icons.Default.Refresh else Icons.Default.Build,
                                contentDescription = "Orientation",
                                tint = AppTheme.DarkAccent
                            )
                        }
                        IconButton(onClick = onToggleTheme) {
                            Text(if (isDark) "🌙" else "☀️", fontSize = 16.sp)
                        }
                    }
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
                        .padding(horizontal = 16.dp)
                        .width(260.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("ATLAS DETECTOR v2", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Black), color = textColor)

                    Surface(color = textColor.copy(alpha = 0.05f), shape = MaterialTheme.shapes.medium) {
                        Row(modifier = Modifier.padding(4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Button(onClick = onTogglePlay, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = AppTheme.DarkPrimary)) {
                                Text(if (state.isRunning) "PAUSE" else "RUN", fontSize = 11.sp)
                            }
                            OutlinedButton(onClick = onReset, modifier = Modifier.weight(1f)) {
                                Text("RESET", fontSize = 11.sp)
                            }
                        }
                    }

                    Text("MODE", style = MaterialTheme.typography.labelSmall, color = secondaryTextColor)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        BombardmentType.values().forEach { type ->
                            FilterChip(
                                selected = state.bombardmentType == type,
                                onClick = { onSetBombardmentType(type) },
                                label = { Text(type.label, fontSize = 10.sp) }
                            )
                        }
                    }

                    HorizontalDivider(color = textColor.copy(alpha = 0.1f))

                    LabSlider("Energy", state.beamEnergyGeV, onSetBeamEnergy, 1f..14f, "GeV", "%.1f", textColor, secondaryTextColor)
                    LabSlider("Temporal", state.speedMultiplier, onSetSpeed, 0.2f..3.0f, "x", "%.1f", textColor, secondaryTextColor)
                    LabSlider("Trails", state.trailLength.toDouble(), { onSetTrailLength(it.toInt()) }, 10f..400f, "px", "%.0f", textColor, secondaryTextColor)

                    Surface(color = AppTheme.DarkAccent.copy(alpha = 0.1f), shape = MaterialTheme.shapes.small) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            InfoRow("STATUS", if (state.isRunning) "CAPTURING" else "IDLE", textColor, secondaryTextColor)
                            InfoRow("EVENTS", state.particles.size.toString(), textColor, secondaryTextColor)
                            InfoRow("SYMMETRY", state.bombardmentType.label, textColor, secondaryTextColor)
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
fun LabSlider(label: String, value: Double, onValueChange: (Double) -> Unit, range: ClosedFloatingPointRange<Float>, unit: String, format: String, color: Color, secColor: Color) {
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = color)
            Text("${format.format(value)} $unit", style = MaterialTheme.typography.labelSmall, color = secColor)
        }
        Slider(
            value = value.toFloat(), onValueChange = { onValueChange(it.toDouble()) }, valueRange = range,
            modifier = Modifier.height(30.dp),
            colors = SliderDefaults.colors(thumbColor = AppTheme.DarkAccent, activeTrackColor = AppTheme.DarkAccent.copy(alpha = 0.4f))
        )
    }
}

@Composable
fun InfoRow(l: String, v: String, c: Color, sc: Color) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(l, style = MaterialTheme.typography.labelSmall, color = sc, fontSize = 9.sp)
        Text(v, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = c, fontSize = 9.sp)
    }
}
