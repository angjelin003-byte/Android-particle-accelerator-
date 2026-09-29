package com.relativistic.particlecollider

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.WindowInsetsController
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private var webView: WebView? = null
    private val TAG = "ParticleCollider"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            // Apply dark system bar styling safely
            window.statusBarColor = Color.parseColor("#07090E")
            window.navigationBarColor = Color.parseColor("#07090E")

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.insetsController?.setSystemBarsAppearance(
                    0,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not set status bar colors", e)
        }

        try {
            val wv = WebView(this).apply {
                setLayerType(View.LAYER_TYPE_HARDWARE, null)
                setBackgroundColor(Color.parseColor("#07090E"))
            }
            webView = wv
            setContentView(wv)

            configureWebSettings(wv.settings)

            // Setup WebViewAssetLoader to serve assets over https://appassets.androidplatform.net
            // This eliminates file:/// CORS issues and enables modern ES Modules & WebGL
            val assetLoader = WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
                .build()

            wv.webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView?,
                    request: WebResourceRequest?
                ): WebResourceResponse? {
                    request?.url?.let { uri ->
                        val response = assetLoader.shouldInterceptRequest(uri)
                        if (response != null) return response
                    }
                    return super.shouldInterceptRequest(view, request)
                }
            }

            wv.webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    consoleMessage?.let {
                        Log.d(TAG, "WebView Console [${it.messageLevel()}]: ${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                    }
                    return super.onConsoleMessage(consoleMessage)
                }
            }

            // Handle Back button navigation
            onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (wv.canGoBack()) {
                        wv.goBack()
                    } else {
                        finish()
                    }
                }
            })

            // Load the application securely via WebViewAssetLoader domain
            wv.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        } catch (e: Throwable) {
            Log.e(TAG, "Fatal error initializing WebView", e)
            val errorView = TextView(this).apply {
                text = "Failed to launch simulation engine: ${e.message}\nPlease ensure Android System WebView is updated."
                setTextColor(Color.WHITE)
                setBackgroundColor(Color.parseColor("#07090E"))
                setPadding(50, 100, 50, 50)
            }
            setContentView(errorView)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebSettings(settings: WebSettings) {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            builtInZoomControls = false
            displayZoomControls = false
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
    }

    override fun onResume() {
        super.onResume()
        webView?.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView?.onPause()
    }

    override fun onDestroy() {
        webView?.destroy()
        super.onDestroy()
    }
}
