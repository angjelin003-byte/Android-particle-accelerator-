package com.example.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
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
        tonalElevation = 2.dp
    ) {
        Column(
            modifier = Modifier
                .verticalScroll(scrollState)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "COLLIDER LAB",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        ),
                        color = textColor
                    )
                    Text(
                        "Compact v1.2",
                        style = MaterialTheme.typography.labelSmall,
                        color = secondaryTextColor
                    )
                }
                
                IconButton(onClick = onToggleTheme) {
                    Text(
                        if (isDark) "🌙" else "☀️",
                        fontSize = 18.sp
                    )
                }
            }

            // Main Controls Card
            OutlinedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.outlinedCardColors(containerColor = surfaceColor)
            ) {
                Row(
                    modifier = Modifier.padding(8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onTogglePlay,
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(0.dp),
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text(if (state.isRunning) "PAUSE" else "RUN")
                    }
                    
                    OutlinedButton(
                        onClick = onReset,
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(0.dp),
                        shape = MaterialTheme.shapes.small
                    ) {
                        Text("RESET")
                    }
                }
            }

            // Parameters
            CompactSlider(
                label = "Beam Energy",
                value = state.beamEnergyMeV.toFloat(),
                onValueChange = { onSetBeamEnergy(it.toDouble()) },
                valueRange = 100f..14000f,
                unit = "MeV",
                color = textColor,
                secondaryColor = secondaryTextColor
            )

            CompactSlider(
                label = "Angle",
                value = state.collisionAngleDeg.toFloat(),
                onValueChange = { onSetCollisionAngle(it.toDouble()) },
                valueRange = 0f..180f,
                unit = "°",
                color = textColor,
                secondaryColor = secondaryTextColor
            )

            CompactSlider(
                label = "Speed",
                value = state.speedMultiplier.toFloat(),
                onValueChange = { onSetSpeed(it.toDouble()) },
                valueRange = 0.2f..3.0f,
                unit = "x",
                format = "%.1f",
                color = textColor,
                secondaryColor = secondaryTextColor
            )

            CompactSlider(
                label = "Trails",
                value = state.trailLength.toFloat(),
                onValueChange = { onSetTrailLength(it.toInt()) },
                valueRange = 10f..400f,
                unit = "px",
                color = textColor,
                secondaryColor = secondaryTextColor
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Status Info
            OutlinedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.outlinedCardColors(containerColor = surfaceColor.copy(alpha = 0.5f))
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    StatusRow("Status", if (state.isRunning) "Simulating" else "Standby", textColor, secondaryTextColor)
                    StatusRow("Particles", state.particles.size.toString(), textColor, secondaryTextColor)
                }
            }
        }
    }
}

@Composable
fun CompactSlider(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    valueRange: ClosedFloatingPointRange<Float>,
    unit: String,
    format: String = "%.0f",
    color: androidx.compose.ui.graphics.Color,
    secondaryColor: androidx.compose.ui.graphics.Color
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Text(
                label,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = color
            )
            Text(
                "${format.format(value)} $unit",
                style = MaterialTheme.typography.labelSmall,
                color = secondaryColor
            )
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = valueRange,
            modifier = Modifier.height(32.dp)
        )
    }
}

@Composable
fun StatusRow(label: String, value: String, color: androidx.compose.ui.graphics.Color, secondaryColor: androidx.compose.ui.graphics.Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = secondaryColor)
        Text(value, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = color)
    }
}
