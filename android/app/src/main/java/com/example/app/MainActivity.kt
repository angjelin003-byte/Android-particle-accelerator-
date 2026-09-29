package com.example.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.app.ui.ControlPanel
import com.example.app.ui.SimulationView
import com.example.app.viewmodel.SimulationViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val viewModel: SimulationViewModel = viewModel()
            val uiState by viewModel.uiState.collectAsState()

            MaterialTheme(colorScheme = if (uiState.theme == "dark") darkColorScheme() else lightColorScheme()) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    Column {
                        SimulationView(modifier = Modifier.weight(1f))
                        ControlPanel(
                            state = uiState,
                            onTogglePlay = { viewModel.togglePlay() },
                            onToggleTheme = { viewModel.toggleTheme() },
                            onSetLayout = { viewModel.setLayout(it) },
                            onSetTrailLength = { viewModel.setTrailLength(it) }
                        )
                    }
                }
            }
        }
    }
}
