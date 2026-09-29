package com.example.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import com.example.app.types.SimulationState
import com.example.app.types.AppTheme
import kotlin.math.*

@Composable
fun SimulationView(
    state: SimulationState, 
    onRotate: (Float, Float) -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = state.theme == "dark"
    val bgColor = if (isDark) AppTheme.DarkBg else AppTheme.LightBg
    val gridColor = if (isDark) Color(0x1AFFFFFF) else Color(0x1A000000)

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .background(bgColor)
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    // Drag X controls camera Y rotation, Drag Y controls camera X rotation
                    onRotate(dragAmount.y * 0.5f, dragAmount.x * 0.5f)
                }
            }
    ) {
        val centerX = size.width / 2f
        val centerY = size.height / 2f
        val fov = 1000f // Field of view

        // Helper for perspective projection
        fun project(x: Double, y: Double, z: Double): Triple<Float, Float, Float>? {
            // Rotate around Y axis
            val cosY = cos(Math.toRadians(state.cameraRotationY.toDouble()))
            val sinY = sin(Math.toRadians(state.cameraRotationY.toDouble()))
            val x1 = x * cosY - z * sinY
            val z1 = x * sinY + z * cosY

            // Rotate around X axis
            val cosX = cos(Math.toRadians(state.cameraRotationX.toDouble()))
            val sinX = sin(Math.toRadians(state.cameraRotationX.toDouble()))
            val y2 = y * cosX - z1 * sinX
            val z2 = y * sinX + z1 * cosX

            // Distance from camera
            val depth = z2 + state.cameraDistance.toDouble()
            if (depth <= 10) return null

            val scale = fov / depth.toFloat()
            val px = (centerX + x1 * scale).toFloat()
            val py = (centerY + y2 * scale).toFloat()
            
            return Triple(px, py, scale)
        }

        // Draw 3D Grid Rings
        for (r in listOf(200f, 400f, 600f)) {
            val gridPath = Path()
            var first = true
            for (angle in 0..360 step 10) {
                val rad = Math.toRadians(angle.toDouble())
                val gx = r * cos(rad)
                val gz = r * sin(rad)
                val p = project(gx, 0.0, gz)
                if (p != null) {
                    if (first) gridPath.moveTo(p.first, p.second) else gridPath.lineTo(p.first, p.second)
                    first = false
                }
            }
            drawPath(gridPath, gridColor, style = Stroke(width = 1f))
        }

        // Depth sort particles for correct rendering
        val sortedParticles = state.particles
            .mapNotNull { p ->
                val proj = project(p.x, p.y, p.z)
                if (proj != null) Triple(p, proj, proj.third) else null
            }
            .sortedBy { it.third } // Sort by scale (distance proxy)

        // Draw trails
        for (item in sortedParticles) {
            val p = item.first
            if (p.annihilated && p.trail.isEmpty()) continue
            
            val particleColor = try {
                Color(android.graphics.Color.parseColor(p.color))
            } catch (e: Exception) {
                Color.Gray
            }

            if (p.trail.size > 1) {
                val trailPath = Path()
                var first = true
                for (tp in p.trail) {
                    val pt = project(tp.x, tp.y, tp.z)
                    if (pt != null) {
                        if (first) trailPath.moveTo(pt.first, pt.second) else trailPath.lineTo(pt.first, pt.second)
                        first = false
                    }
                }
                drawPath(
                    path = trailPath,
                    color = particleColor.copy(alpha = 0.3f),
                    style = Stroke(width = (p.radius * 0.4 * item.third / 10f).toFloat().coerceAtLeast(1f))
                )
            }
        }

        // Draw active particles as 3D spheres (glow + core)
        for (item in sortedParticles) {
            val p = item.first
            if (p.annihilated) continue

            val proj = item.second
            val px = proj.first
            val py = proj.second
            val scale = proj.third
            
            val particleColor = try {
                Color(android.graphics.Color.parseColor(p.color))
            } catch (e: Exception) {
                Color.Gray
            }

            val dynamicRadius = (p.radius * scale / 10f).toFloat().coerceAtLeast(2f)

            // Outer glow
            drawCircle(
                color = particleColor.copy(alpha = 0.3f),
                radius = dynamicRadius * 2f,
                center = Offset(px, py)
            )
            
            // Core
            drawCircle(
                color = particleColor,
                radius = dynamicRadius,
                center = Offset(px, py)
            )
            
            // 3D Highlight
            drawCircle(
                color = Color.White.copy(alpha = 0.6f),
                radius = dynamicRadius * 0.4f,
                center = Offset(px - dynamicRadius * 0.3f, py - dynamicRadius * 0.3f)
            )
        }
    }
}
