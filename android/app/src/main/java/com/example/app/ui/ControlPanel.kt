package com.example.app.ui

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app.types.*
import android.content.res.Configuration

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ControlPanel(
    state: SimulationState,
    onTogglePlay: () -> Unit,
    onReset: () -> Unit,
    onToggleTheme: () -> Unit,
    onToggleOrientation: () -> Unit,
    onSetBgColor: (Color?) -> Unit,
    onSetActiveSection: (String) -> Unit,
    onSelectParticleA: (ParticleDefinition) -> Unit,
    onSelectParticleB: (ParticleDefinition) -> Unit,
    onSetBeamEnergy: (Double) -> Unit,
    onSetTrailLength: (Int) -> Unit,
    onSetSpeed: (Double) -> Unit,
    onSetMaxParticles: (Int) -> Unit,
    onSetMagneticField: (Double) -> Unit,
    onTogglePanel: () -> Unit,
    onExit: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val isDark = state.theme == "dark"
    val surfaceColor = if (isDark) AppTheme.DarkSurface else AppTheme.LightSurface
    val textColor = if (isDark) AppTheme.DarkText else AppTheme.LightText
    val secondaryTextColor = if (isDark) AppTheme.DarkTextSecondary else AppTheme.LightTextSecondary
    
    val configuration = LocalConfiguration.current
    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

    Surface(
        modifier = modifier,
        color = surfaceColor,
        tonalElevation = 6.dp
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onTogglePanel) {
                        Icon(
                            imageVector = if (state.isPanelExpanded) Icons.Default.Close else Icons.Default.Menu,
                            contentDescription = "Menu",
                            tint = textColor
                        )
                    }
                    if (state.isPanelExpanded) {
                        Row(modifier = Modifier.padding(start = 4.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            AppTheme.BgPalette.forEach { color ->
                                Box(
                                    modifier = Modifier.size(16.dp).clip(CircleShape).background(color).clickable { onSetBgColor(color) }
                                        .then(if (state.customBgColor == color) Modifier.background(Color.Gray.copy(0.4f)) else Modifier)
                                )
                            }
                        }
                    }
                }
                if (state.isPanelExpanded) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = onTogglePlay) {
                            Icon(if (state.isRunning) Icons.Default.Close else Icons.Default.PlayArrow, "Play", tint = AppTheme.DarkPrimary)
                        }
                        IconButton(onClick = onReset) {
                            Icon(Icons.Default.Refresh, "Reset", tint = textColor)
                        }
                        IconButton(onClick = onToggleTheme) {
                            Icon(if (isDark) Icons.Default.Build else Icons.Default.Settings, "Theme", tint = AppTheme.DarkAccent)
                        }
                        IconButton(onClick = onToggleOrientation) {
                            Icon(Icons.Default.Refresh, "Orientation", tint = AppTheme.DarkAccent)
                        }
                        IconButton(onClick = onExit) {
                            Icon(Icons.Default.ExitToApp, "Exit", tint = Color.Red.copy(alpha = 0.8f))
                        }
                    }
                }
            }

            AnimatedVisibility(
                visible = state.isPanelExpanded,
                enter = if (isLandscape) (expandHorizontally() + fadeIn()) else (expandVertically() + fadeIn()),
                exit = if (isLandscape) (shrinkHorizontally() + fadeOut()) else (shrinkVertically() + fadeOut())
            ) {
                Column(modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp)) {
                    TabRow(
                        selectedTabIndex = when(state.activeSection) { "BEAM" -> 0; "PARTICLES" -> 1; "PHYSICS" -> 2; else -> 0 },
                        containerColor = Color.Transparent,
                        contentColor = AppTheme.DarkPrimary,
                        divider = {}
                    ) {
                        listOf("BEAM", "PARTICLES", "PHYSICS").forEachIndexed { index, title ->
                            Tab(
                                selected = state.activeSection == title,
                                onClick = { onSetActiveSection(title) },
                                text = { Text(title, fontSize = 8.sp, fontWeight = FontWeight.Bold) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Column(
                        modifier = Modifier.weight(1f).verticalScroll(scrollState),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            color = Color.Transparent,
                            border = BorderStroke(1.dp, textColor.copy(0.1f)),
                            shape = MaterialTheme.shapes.extraSmall
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                when (state.activeSection) {
                                    "BEAM" -> {
                                        LabSlider("Center-Mass Energy", state.beamEnergyGeV, onSetBeamEnergy, 1f..14f, "GeV", "%.1f", textColor, secondaryTextColor)
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Surface(color = textColor.copy(alpha = 0.05f), shape = MaterialTheme.shapes.extraSmall) {
                                            Column(modifier = Modifier.padding(8.dp)) {
                                                InfoRow("BEAM A", state.selectedParticleA.name, textColor, secondaryTextColor)
                                                InfoRow("BEAM B", state.selectedParticleB.name, textColor, secondaryTextColor)
                                            }
                                        }
                                    }
                                    "PARTICLES" -> {
                                        Text("PRIMARY SPECIES", style = MaterialTheme.typography.labelSmall, color = secondaryTextColor, fontWeight = FontWeight.Bold)
                                        ParticleSelector(selected = state.selectedParticleA, onSelect = onSelectParticleA, textColor = textColor)
                                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = textColor.copy(0.1f))
                                        Text("TARGET SPECIES", style = MaterialTheme.typography.labelSmall, color = secondaryTextColor, fontWeight = FontWeight.Bold)
                                        ParticleSelector(selected = state.selectedParticleB, onSelect = onSelectParticleB, textColor = textColor)
                                    }
                                    "PHYSICS" -> {
                                        LabSlider("Entity Cap", state.maxParticles.toDouble(), { onSetMaxParticles(it.toInt()) }, 50f..500f, "objs", "%.0f", textColor, secondaryTextColor)
                                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = textColor.copy(0.1f))
                                        Text("DETECTOR SPECS", style = MaterialTheme.typography.labelSmall, color = secondaryTextColor, fontWeight = FontWeight.Bold)
                                        LabSlider("Magnetic Field", state.magneticFieldTesla, onSetMagneticField, 0f..5f, "T", "%.1f", textColor, secondaryTextColor)
                                        LabSlider("Simulation Speed", state.speedMultiplier, onSetSpeed, 0.05f..5.0f, "c", "%.2f", textColor, secondaryTextColor)
                                        LabSlider("Trail Intensity", state.trailLength.toDouble(), { onSetTrailLength(it.toInt()) }, 10f..500f, "px", "%.0f", textColor, secondaryTextColor)
                                    }
                                }
                            }
                        }
                    }

                    Surface(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        color = textColor.copy(alpha = 0.03f),
                        border = BorderStroke(1.dp, textColor.copy(0.05f)),
                        shape = MaterialTheme.shapes.extraSmall
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column {
                                    Text("LUMINOSITY (E)", style = MaterialTheme.typography.labelSmall, color = secondaryTextColor, fontSize = 7.sp)
                                    Text("${state.beamEnergyGeV * 2} GeV", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Black), color = AppTheme.DarkAccent)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("LIVE EVENTS", style = MaterialTheme.typography.labelSmall, color = secondaryTextColor, fontSize = 7.sp)
                                    Text("${state.particles.size}", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Black), color = textColor)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ParticleSelector(selected: ParticleDefinition, onSelect: (ParticleDefinition) -> Unit, textColor: Color) {
    FlowRow(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        ElementaryParticles.ALL_PARTICLES.forEach { p ->
            FilterChip(
                selected = selected.id == p.id,
                onClick = { onSelect(p) },
                label = { Text(p.name, fontSize = 8.sp) },
                shape = MaterialTheme.shapes.extraSmall,
                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = AppTheme.DarkPrimary.copy(alpha = 0.2f), selectedLabelColor = textColor)
            )
        }
    }
}

@Composable
fun LabSlider(label: String, value: Double, onValueChange: (Double) -> Unit, range: ClosedFloatingPointRange<Float>, unit: String, format: String, color: Color, secColor: Color) {
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 10.sp), color = color)
            Text("${format.format(value)} $unit", style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp), color = secColor)
        }
        Slider(value = value.toFloat(), onValueChange = { onValueChange(it.toDouble()) }, valueRange = range, modifier = Modifier.height(24.dp), colors = SliderDefaults.colors(thumbColor = AppTheme.DarkAccent, activeTrackColor = AppTheme.DarkAccent.copy(alpha = 0.4f)))
    }
}

@Composable
fun InfoRow(l: String, v: String, c: Color, sc: Color) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(l, style = MaterialTheme.typography.labelSmall, color = sc, fontSize = 8.sp)
        Text(v, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = c, fontSize = 8.sp)
    }
}
