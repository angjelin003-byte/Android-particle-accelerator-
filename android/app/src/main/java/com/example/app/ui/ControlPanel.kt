package com.example.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.app.viewmodel.SimulationState

@Composable
fun ControlPanel(
    state: SimulationState,
    onTogglePlay: () -> Unit,
    onToggleTheme: () -> Unit,
    onSetLayout: (String) -> Unit,
    onSetTrailLength: (Int) -> Unit
) {
    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = onTogglePlay) {
            Text(if (state.isRunning) "Pause" else "Run")
        }
        Button(onClick = onToggleTheme) {
            Text("Toggle Theme: ${state.theme}")
        }
        Button(onClick = { onSetLayout(if (state.layout == "vertical") "horizontal" else "vertical") }) {
            Text("Layout: ${state.layout}")
        }
        // Trail length slider placeholder
        Text("Trail Length: ${state.trailLength}")
        Slider(
            value = state.trailLength.toFloat(),
            onValueChange = { onSetTrailLength(it.toInt()) },
            valueRange = 10f..1000f
        )
    }
}
