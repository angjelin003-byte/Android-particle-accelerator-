package com.example.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.app.viewmodel.SimulationState

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

    Column(
        modifier = modifier
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text("Relativistic Collision Lab", style = MaterialTheme.typography.titleMedium)

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = onTogglePlay,
                modifier = Modifier.weight(1f)
            ) {
                Text(if (state.isRunning) "Pause" else "Run")
            }
            OutlinedButton(
                onClick = onReset,
                modifier = Modifier.weight(1f)
            ) {
                Text("Reset")
            }
        }

        Button(
            onClick = onToggleTheme,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Theme: ${state.theme.replaceFirstChar { it.uppercase() }}")
        }

        Divider()

        // Beam Energy Slider
        Text("Beam Energy: ${state.beamEnergyMeV.toInt()} MeV", style = MaterialTheme.typography.bodyMedium)
        Slider(
            value = state.beamEnergyMeV.toFloat(),
            onValueChange = { onSetBeamEnergy(it.toDouble()) },
            valueRange = 100f..14000f
        )

        // Collision Angle Slider
        Text("Collision Angle: ${state.collisionAngleDeg.toInt()}°", style = MaterialTheme.typography.bodyMedium)
        Slider(
            value = state.collisionAngleDeg.toFloat(),
            onValueChange = { onSetCollisionAngle(it.toDouble()) },
            valueRange = 0f..180f
        )

        // Speed Slider
        Text("Simulation Speed: %.1fx".format(state.speedMultiplier), style = MaterialTheme.typography.bodyMedium)
        Slider(
            value = state.speedMultiplier.toFloat(),
            onValueChange = { onSetSpeed(it.toDouble()) },
            valueRange = 0.2f..3.0f
        )

        // Trail Length Slider
        Text("Trail Length: ${state.trailLength}", style = MaterialTheme.typography.bodyMedium)
        Slider(
            value = state.trailLength.toFloat(),
            onValueChange = { onSetTrailLength(it.toInt()) },
            valueRange = 10f..500f
        )
    }
}
