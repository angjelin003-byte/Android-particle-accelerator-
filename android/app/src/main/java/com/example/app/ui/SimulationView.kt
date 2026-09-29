package com.example.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

@Composable
fun SimulationView(modifier: Modifier = Modifier) {
    // Placeholder for 3D Scene
    Canvas(modifier = modifier) {
        drawCircle(color = Color.Cyan, radius = 50f)
    }
}
