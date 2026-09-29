package com.example.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app.types.SimulationState
import com.example.app.types.AppTheme
import kotlin.math.*
import androidx.compose.ui.platform.LocalDensity

data class RenderItem(
    val p: com.example.app.types.ParticleState,
    val proj: Triple<Float, Float, Float>,
    val trail: List<Triple<Float, Float, Float>>,
    val depth: Float
)

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
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    onRotate(dragAmount.y * 0.5f, dragAmount.x * 0.5f)
                }
            }
            .pointerInput(state.particles) {
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
                        val z1_rotX = y * sinX + z1 * cosX
                        val depth = z1_rotX + state.cameraDistance.toDouble()
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
                        val dist = sqrt((offset.x - px).pow(2) + (offset.y - py).pow(2))
                        if (dist < 48f) {
                            foundId = p.id
                            break
                        }
                    }
                    onSelectParticle(if (state.selectedParticleId == foundId) null else foundId)
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
            val z1_rotX = y * sinX + z1 * cosX

            val depth = z1_rotX + state.cameraDistance.toDouble()
            if (depth <= 10) return null

            val scale = fov / depth.toFloat()
            val px = (centerX + x1 * scale).toFloat()
            val py = (centerY + y2 * scale).toFloat()
            
            return Triple(px, py, scale)
        }

        // Blender-style XZ Grid
        val gridSize = 1000.0
        val gridStep = 100.0
        for (i in -10..10) {
            val s1 = project(-gridSize, 0.0, i * gridStep)
            val e1 = project(gridSize, 0.0, i * gridStep)
            if (s1 != null && e1 != null) drawLine(gridColor, Offset(s1.first, s1.second), Offset(e1.first, e1.second))
            
            val s2 = project(i * gridStep, 0.0, -gridSize)
            val e2 = project(i * gridStep, 0.0, gridSize)
            if (s2 != null && e2 != null) drawLine(gridColor, Offset(s2.first, s2.second), Offset(e2.first, e2.second))
        }

        // Scale Bar
        val sRef1 = project(0.0, 0.0, 0.0)
        val sRef2 = project(100.0, 0.0, 0.0)
        if (sRef1 != null && sRef2 != null) {
            val barW = abs(sRef2.first - sRef1.first)
            val bx = 40f
            val by = size.height - 60f
            drawLine(Color.White, Offset(bx, by), Offset(bx + barW, by), strokeWidth = 3f)
            drawLine(Color.White, Offset(bx, by - 10f), Offset(bx, by + 10f), strokeWidth = 2f)
            drawLine(Color.White, Offset(bx + barW, by - 10f), Offset(bx + barW, by + 10f), strokeWidth = 2f)
            drawText(textMeasurer, "1.0 fm", Offset(bx, by + 15f), style = TextStyle(color = Color.White, fontSize = 10.sp))
        }

        val renderItems = state.particles.mapNotNull { p ->
            val proj = project(p.x, p.y, p.z) ?: return@mapNotNull null
            val trail = p.trail.mapNotNull { project(it.x, it.y, it.z) }
            RenderItem(p, proj, trail, proj.third)
        }.sortedBy { it.depth }

        // Trails
        for (item in renderItems) {
            if (item.trail.size < 2) continue
            val c = try { Color(android.graphics.Color.parseColor(item.p.definition.color)) } catch (e: Exception) { Color.Gray }
            val path = Path()
            path.moveTo(item.trail[0].first, item.trail[0].second)
            for (i in 1 until item.trail.size) path.lineTo(item.trail[i].first, item.trail[i].second)
            drawPath(path, c.copy(0.2f), style = Stroke(width = (item.p.definition.radius * 0.2 * item.depth / 10f).toFloat().coerceAtLeast(0.5f)))
        }

        // Particles with Lorentz Contraction
        for (item in renderItems) {
            val p = item.p
            val proj = item.proj
            val scale = proj.third
            val c = try { Color(android.graphics.Color.parseColor(p.definition.color)) } catch (e: Exception) { Color.Gray }
            val baseR = (p.definition.radius * scale / 10f).toFloat().coerceAtLeast(1f)

            val speed = sqrt(p.vx.pow(2) + p.vy.pow(2) + p.vz.pow(2))
            val angle = if (speed > 1e-6) atan2(p.vy, p.vx).toFloat() * (180f / PI.toFloat()) else 0f
            val squash = 1f / p.gamma.toFloat().coerceAtLeast(1f)

            rotate(degrees = angle, pivot = Offset(proj.first, proj.second)) {
                scale(scaleX = squash, scaleY = 1f, pivot = Offset(proj.first, proj.second)) {
                    drawCircle(c.copy(0.3f), baseR * 2.2f, Offset(proj.first, proj.second))
                    drawCircle(c, baseR, Offset(proj.first, proj.second))
                    drawCircle(Color.White.copy(0.8f), baseR * 0.4f, Offset(proj.first - baseR * 0.3f, proj.second - baseR * 0.3f))
                }
            }

            if (p.id == state.selectedParticleId) {
                val label = "${p.definition.name} (${p.definition.symbol})"
                val layout = textMeasurer.measure(AnnotatedString(label), TextStyle(color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold))
                val bw = layout.size.width + 20f
                val bh = layout.size.height + 10f
                val bx = proj.first - bw/2f
                val by = proj.second - baseR - bh - 15f
                drawRoundRect(Color.Black.copy(0.7f), Offset(bx, by), Size(bw, bh), CornerRadius(8f, 8f))
                drawText(layout, topLeft = Offset(bx + 10f, by + 5f))
                drawLine(Color.White.copy(0.5f), Offset(proj.first, proj.second - baseR), Offset(proj.first, by + bh), strokeWidth = 2f)
            }
        }
    }
}
