package com.example.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import com.example.app.viewmodel.SimulationState

@Composable
fun SimulationView(state: SimulationState, modifier: Modifier = Modifier) {
    val isDark = state.theme == "dark"
    val bgColor = if (isDark) Color(0xFF0F172A) else Color(0xFFF8FAFC)
    val gridColor = if (isDark) Color(0x33334155) else Color(0x33CBD5E1)

    Canvas(modifier = modifier.fillMaxSize().background(bgColor)) {
        val centerX = size.width / 2f
        val centerY = size.height / 2f

        // Draw detector grid rings
        for (r in listOf(100f, 200f, 300f, 400f)) {
            drawCircle(
                color = gridColor,
                radius = r,
                center = Offset(centerX, centerY),
                style = Stroke(width = 1f)
            )
        }

        // Draw axes
        drawLine(gridColor, Offset(0f, centerY), Offset(size.width, centerY), 1f)
        drawLine(gridColor, Offset(centerX, 0f), Offset(centerX, size.height), 1f)

        // Draw trails and particles
        for (p in state.particles) {
            for (tp in p.trail) {
                val tpx = (centerX + tp.x).toFloat()
                val tpy = (centerY + tp.y).toFloat()
                drawCircle(
                    color = Color.parse(p.color).copy(alpha = 0.4f),
                    radius = maxOf(2f, (p.radius * 0.4f).toFloat()),
                    center = Offset(tpx, tpy)
                )
            }

            val px = (centerX + p.x).toFloat()
            val py = (centerY + p.y).toFloat()

            drawCircle(
                color = Color.parse(p.color),
                radius = p.radius.toFloat(),
                center = Offset(px, py)
            )
        }
    }
}

fun Color.Companion.parse(colorStr: String): Color {
    return Color(android.graphics.Color.parseColor(colorStr))
}
