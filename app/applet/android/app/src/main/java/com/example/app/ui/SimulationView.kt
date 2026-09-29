package com.example.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import com.example.app.types.SimulationState
import com.example.app.types.AppTheme

@Composable
fun SimulationView(state: SimulationState, modifier: Modifier = Modifier) {
    val isDark = state.theme == "dark"
    val bgColor = if (isDark) AppTheme.DarkBg else AppTheme.LightBg
    val gridColor = if (isDark) Color(0x1AFFFFFF) else Color(0x1A000000)
    val axisColor = if (isDark) Color(0x33FFFFFF) else Color(0x33000000)

    Canvas(modifier = modifier.fillMaxSize().background(bgColor)) {
        val centerX = size.width / 2f
        val centerY = size.height / 2f

        // Draw radial grid
        for (r in listOf(150f, 300f, 450f, 600f)) {
            drawCircle(
                color = gridColor,
                radius = r,
                center = Offset(centerX, centerY),
                style = Stroke(width = 1f)
            )
        }

        // Draw crosshair axes
        drawLine(axisColor, Offset(0f, centerY), Offset(size.width, centerY), 1f)
        drawLine(axisColor, Offset(centerX, 0f), Offset(centerX, size.height), 1f)

        // Draw trails first
        for (p in state.particles) {
            if (p.annihilated && p.trail.isEmpty()) continue
            
            val particleColor = try {
                Color(android.graphics.Color.parseColor(p.color))
            } catch (e: Exception) {
                Color.Gray
            }

            if (p.trail.size > 1) {
                val trailPath = Path()
                val startPoint = p.trail.first()
                trailPath.moveTo((centerX + startPoint.x).toFloat(), (centerY + startPoint.y).toFloat())
                
                for (i in 1 until p.trail.size) {
                    val tp = p.trail[i]
                    trailPath.lineTo((centerX + tp.x).toFloat(), (centerY + tp.y).toFloat())
                }
                
                drawPath(
                    path = trailPath,
                    color = particleColor.copy(alpha = 0.3f),
                    style = Stroke(width = (p.radius / 2).toFloat())
                )
            }
        }

        // Draw active particles
        for (p in state.particles) {
            if (p.annihilated) continue

            val particleColor = try {
                Color(android.graphics.Color.parseColor(p.color))
            } catch (e: Exception) {
                Color.Gray
            }

            val px = (centerX + p.x).toFloat()
            val py = (centerY + p.y).toFloat()

            // Outer glow
            drawCircle(
                color = particleColor.copy(alpha = 0.4f),
                radius = (p.radius * 1.5).toFloat(),
                center = Offset(px, py)
            )
            
            // Core
            drawCircle(
                color = particleColor,
                radius = p.radius.toFloat(),
                center = Offset(px, py)
            )
            
            // Highlight
            drawCircle(
                color = Color.White.copy(alpha = 0.8f),
                radius = (p.radius * 0.4).toFloat(),
                center = Offset(px - (p.radius * 0.2).toFloat(), py - (p.radius * 0.2).toFloat())
            )
        }
    }
}
