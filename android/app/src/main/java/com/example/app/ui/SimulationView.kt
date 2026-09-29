package com.example.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app.types.SimulationState
import com.example.app.types.AppTheme
import kotlin.math.*
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.graphics.nativeCanvas

@OptIn(ExperimentalTextApi::class)
@Composable
fun SimulationView(
    state: SimulationState, 
    onRotate: (Float, Float) -> Unit,
    onZoom: (Float) -> Unit,
    onPan: (Float, Float) -> Unit,
    onSelectParticle: (String?) -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = state.theme == "dark"
    val bgColor = state.customBgColor ?: if (isDark) AppTheme.DarkBg else AppTheme.LightBg
    val gridColor = if (isDark) Color(0x1AFFFFFF) else Color(0x1A000000)
    
    val textMeasurer = rememberTextMeasurer()

    Canvas(
        modifier = modifier
            .fillMaxSize()
            .background(bgColor)
            .pointerInput(Unit) {
                detectTransformGestures { centroid, pan, zoom, rotation ->
                    if (zoom != 1f) onZoom(zoom)
                    if (pan != Offset.Zero) onPan(pan.x, pan.y)
                }
            }
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    // Drag is used for rotation when only one finger is used, 
                    // but detectTransformGestures usually consumes these if not careful.
                    // However, standard behavior is drag = rotate, pinch = zoom, 2-finger drag = pan.
                    // detectTransformGestures handles zoom/pan/rotation. 
                    // Let's use it for all.
                }
            }
            .pointerInput(state.particles, state.cameraRotationX, state.cameraRotationY, state.cameraDistance, state.cameraTranslationX, state.cameraTranslationY) {
                detectTapGestures { offset ->
                    var foundId: String? = null
                    val centerX = size.width / 2f + state.cameraTranslationX
                    val centerY = size.height / 2f + state.cameraTranslationY
                    val fov = 1200f

                    fun projectLocal(x: Double, y: Double, z: Double): Triple<Float, Float, Float>? {
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
                        return Triple((centerX + x1 * scale).toFloat(), (centerY + y2 * scale).toFloat(), scale)
                    }

                    val sorted = state.particles
                        .mapNotNull { p -> projectLocal(p.x, p.y, p.z)?.let { it to p } }
                        .sortedByDescending { it.first.third }

                    for ((proj, p) in sorted) {
                        val px = proj.first
                        val py = proj.second
                        // Larger hit area for easier touch: at least 48px radius for interaction
                        val hitRadius = max(48f, (p.definition.radius * proj.third / 5f).toFloat())
                        
                        val dist = sqrt((offset.x - px).pow(2) + (offset.y - py).pow(2))
                        if (dist < hitRadius) {
                            foundId = p.id
                            break
                        }
                    }
                    onSelectParticle(if (state.selectedParticleId == foundId) null else foundId)
                }
            }
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    onRotate(dragAmount.y * 0.5f, dragAmount.x * 0.5f)
                }
            }
    ) {
        val centerX = size.width / 2f + state.cameraTranslationX
        val centerY = size.height / 2f + state.cameraTranslationY
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

        // Draw Detector Cylinder
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

        val renderList = state.particles.mapNotNull { p ->
            val proj = project(p.x, p.y, p.z) ?: return@mapNotNull null
            val trailProj = p.trail.mapNotNull { project(it.x, it.y, it.z) }
            Quadruple(p, proj, trailProj, proj.third)
        }.sortedBy { it.fourth }

        for (item in renderList) {
            val p = item.first
            val trail = item.third
            if (trail.size < 2) continue
            val pColor = try { Color(android.graphics.Color.parseColor(p.definition.color)) } catch (e: Exception) { Color.Gray }
            val trailPath = Path()
            trailPath.moveTo(trail[0].first, trail[0].second)
            for (i in 1 until trail.size) { trailPath.lineTo(trail[i].first, trail[i].second) }
            drawPath(trailPath, pColor.copy(alpha = 0.25f), style = Stroke(width = (p.definition.radius * 0.3 * item.fourth / 10f).toFloat().coerceAtLeast(1f)))
        }

        for (item in renderList) {
            val p = item.first
            val proj = item.second
            val px = proj.first
            val py = proj.second
            val scale = proj.third
            val pColor = try { Color(android.graphics.Color.parseColor(p.definition.color)) } catch (e: Exception) { Color.Gray }
            val radius = (p.definition.radius * scale / 10f).toFloat().coerceAtLeast(2f)

            drawCircle(pColor.copy(alpha = 0.3f), radius * 2f, Offset(px, py))
            drawCircle(pColor, radius, Offset(px, py))
            drawCircle(Color.White.copy(alpha = 0.7f), radius * 0.35f, Offset(px - radius * 0.3f, py - radius * 0.3f))

            if (p.id == state.selectedParticleId) {
                val label = "${p.definition.name} (${p.definition.symbol})"
                val textLayout = textMeasurer.measure(
                    text = AnnotatedString(label),
                    style = TextStyle(color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, background = Color.Black.copy(alpha = 0.7f))
                )
                val bubbleWidth = textLayout.size.width.toFloat() + 16f
                val bubbleHeight = textLayout.size.height.toFloat() + 8f
                val bx = px - bubbleWidth / 2f
                val by = py - radius - bubbleHeight - 10f
                drawRect(color = Color.Black.copy(alpha = 0.7f), topLeft = Offset(bx, by), size = androidx.compose.ui.geometry.Size(bubbleWidth, bubbleHeight))
                drawText(textLayoutResult = textLayout, topLeft = Offset(bx + 8f, by + 4f))
                drawLine(color = Color.White.copy(alpha = 0.5f), start = Offset(px, py - radius), end = Offset(px, by + bubbleHeight), strokeWidth = 2f)
            }
        }

        // Scale Bar
        val refLength3D = 100.0
        val scaleAtCenter = fov / state.cameraDistance
        val barWidthPx = (refLength3D * scaleAtCenter).toFloat()
        val margin = 40f
        val startX = margin
        val startY = size.height - margin
        drawLine(color = Color.White.copy(alpha = 0.8f), start = Offset(startX, startY), end = Offset(startX + barWidthPx, startY), strokeWidth = 3f)
        drawLine(color = Color.White, start = Offset(startX, startY - 8f), end = Offset(startX, startY + 8f), strokeWidth = 3f)
        drawLine(color = Color.White, start = Offset(startX + barWidthPx, startY - 8f), end = Offset(startX + barWidthPx, startY + 8f), strokeWidth = 3f)
        val scaleLabel = "1.0 fm"
        val labelLayout = textMeasurer.measure(text = AnnotatedString(scaleLabel), style = TextStyle(color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold))
        drawText(textLayoutResult = labelLayout, topLeft = Offset(startX + (barWidthPx / 2f) - (labelLayout.size.width / 2f), startY - labelLayout.size.height - 4f))
    }
}

data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
