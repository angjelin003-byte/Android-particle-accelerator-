# Keep JavascriptInterfaces and WebView
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep native physics models
-keep class com.relativistic.particlecollider.model.** { *; }
-keep class com.relativistic.particlecollider.physics.** { *; }
