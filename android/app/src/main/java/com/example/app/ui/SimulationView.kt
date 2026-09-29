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
    // Use customBgColor if set, otherwise fallback to theme default
    val bgColor = state.customBgColor ?: if (isDark) AppTheme.DarkBg else AppTheme.LightBg
    val gridColor = if (isDark) Color(0x1AFFFFFF) else Color(0x1A000000)

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .background(bgColor)
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    onRotate(dragAmount.y * 0.5f, dragAmount.x * 0.5f)
                }
            }
    ) {
        val centerX = size.width / 2f
        val centerY = size.height / 2f
        val fov = 1200f

        fun project(x: Double, y: Double, z: Double): Triple<Float, Float, Float>? {
            val cosY = cos(Math.toRadians(state.cameraRotationY.toDouble()))
            val sinY = sin(Math.toRadians(state.cameraRotationY.toDouble()))
            val x1 = x * cosY - z * sinY
            val z1 = x * sinY + z * cosY

            val cosX = cos(Math.toRadians(state.cameraRotationX.toDouble()))
            val sinX = sin(Math.toRadians(state.cameraRotationX.toDouble()))
            val y2 = y * cosX - z1 * sinX
            val z2 = y * sinX + z1 * cosX

            val depth = z2 + state.cameraDistance.toDouble()
            if (depth <= 10) return null

            val scale = fov / depth.toFloat()
            val px = (centerX + x1 * scale).toFloat()
            val py = (centerY + y2 * scale).toFloat()
            
            return Triple(px, py, scale)
        }

        // Draw 3D Detector Cylinder (Visual Reference)
        for (z_off in listOf(-400.0, 0.0, 400.0)) {
            val circlePath = Path()
            var first = true
            for (angle in 0..360 step 15) {
                val rad = Math.toRadians(angle.toDouble())
                val p = project(300.0 * cos(rad), 300.0 * sin(rad), z_off)
                if (p != null) {
                    if (first) circlePath.moveTo(p.first, p.second) else circlePath.lineTo(p.first, p.second)
                    first = false
                }
            }
            drawPath(circlePath, gridColor.copy(alpha = 0.05f), style = Stroke(width = 1f))
        }

        // Project and depth-sort particles
        val renderList = state.particles.mapNotNull { p ->
            val proj = project(p.x, p.y, p.z) ?: return@mapNotNull null
            val trailProj = p.trail.mapNotNull { project(it.x, it.y, it.z) }
            Quadruple(p, proj, trailProj, proj.third)
        }.sortedBy { it.fourth }

        // Draw Trails
        for (item in renderList) {
            val p = item.first
            val trail = item.third
            if (trail.size < 2) continue
            
            val pColor = try { Color(android.graphics.Color.parseColor(p.definition.color)) } catch (e: Exception) { Color.Gray }
            val trailPath = Path()
            trailPath.moveTo(trail[0].first, trail[0].second)
            for (i in 1 until trail.size) {
                trailPath.lineTo(trail[i].first, trail[i].second)
            }
            drawPath(trailPath, pColor.copy(alpha = 0.25f), style = Stroke(width = (p.definition.radius * 0.3 * item.fourth / 10f).toFloat().coerceAtLeast(1f)))
        }

        // Draw Particles
        for (item in renderList) {
            val p = item.first
            val proj = item.second
            val px = proj.first
            val py = proj.second
            val scale = proj.third
            
            val pColor = try { Color(android.graphics.Color.parseColor(p.definition.color)) } catch (e: Exception) { Color.Gray }
            val radius = (p.definition.radius * scale / 10f).toFloat().coerceAtLeast(2f)

            // Dynamic glow based on scale
            drawCircle(pColor.copy(alpha = 0.3f), radius * 2f, Offset(px, py))
            drawCircle(pColor, radius, Offset(px, py))
            drawCircle(Color.White.copy(alpha = 0.7f), radius * 0.35f, Offset(px - radius * 0.3f, py - radius * 0.3f))
        }
    }
}

data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
