package com.essentialssettings

import android.content.res.Configuration
import com.facebook.react.bridge.ReactApplicationContext
import android.text.TextUtils
import java.util.Locale
import java.util.TimeZone
import android.text.format.DateFormat
import java.text.DecimalFormatSymbols
import java.util.Currency
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.telephony.TelephonyManager
import com.facebook.react.bridge.Promise
import java.net.HttpURLConnection
import java.net.URL
import android.content.pm.PackageManager
import android.media.AudioManager
import android.os.Build
import android.provider.Settings
import android.os.BatteryManager
import android.content.Intent
import android.content.IntentFilter
import java.security.MessageDigest
import android.content.ClipboardManager
import android.content.ClipData
import android.util.DisplayMetrics
import android.view.WindowManager
import com.facebook.react.bridge.ReadableMap
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.HapticFeedbackConstants
import android.net.Uri
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.io.File
import java.security.GeneralSecurityException
import java.security.KeyStore

class EssentialsSettingsModule(private val reactContext: ReactApplicationContext) :
    NativeEssentialsSettingsSpec(reactContext) {

    override fun getColorScheme(): String {
        val nightMode = reactContext.resources.configuration.uiMode and
                Configuration.UI_MODE_NIGHT_MASK

        return when (nightMode) {
            Configuration.UI_MODE_NIGHT_YES -> "dark"
            Configuration.UI_MODE_NIGHT_NO -> "light"
            else -> "unspecified"
        }
    }

    override fun getFontScale(): Double {
        return reactContext.resources.configuration.fontScale.toDouble()
    }

    // ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

    override fun getDisplayWidth(): Double {
        val metrics = getDisplayMetrics()
        val widthPx = metrics.widthPixels
        val density = metrics.density
        return (widthPx / density).toDouble()
    }

    override fun getDisplayHeight(): Double {
        val metrics = getDisplayMetrics()
        val heightPx = metrics.heightPixels
        val density = metrics.density
        return (heightPx / density).toDouble()
    }

    override fun getDisplayScale(): Double {
        return getDisplayMetrics().density.toDouble()
    }

    override fun getDisplayOrientation(): String {
        val orientation = reactContext.resources.configuration.orientation
        return if (orientation == Configuration.ORIENTATION_LANDSCAPE) {
            "landscape"
        } else {
            "portrait"
        }
    }

    override fun getDisplaySize(): String {
        val screenLayout = reactContext.resources.configuration.screenLayout
        val size = screenLayout and Configuration.SCREENLAYOUT_SIZE_MASK

        return when (size) {
            Configuration.SCREENLAYOUT_SIZE_SMALL -> "small"
            Configuration.SCREENLAYOUT_SIZE_NORMAL -> "normal"
            Configuration.SCREENLAYOUT_SIZE_LARGE -> "large"
            Configuration.SCREENLAYOUT_SIZE_XLARGE -> "xlarge"
            else -> "unknown"
        }
    }

    // Helper — returns current display metrics
    private fun getDisplayMetrics(): DisplayMetrics {
        val metrics = DisplayMetrics()
        val windowManager = reactContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(metrics)
        return metrics
    }

    override fun getLocale(): String {
        return Locale.getDefault().toString()
    }

    override fun getLanguage(): String {
        return Locale.getDefault().language
    }

    override fun getCountry(): String {
        return Locale.getDefault().country
    }

    override fun isRTL(): Boolean {
        return TextUtils.getLayoutDirectionFromLocale(Locale.getDefault()) ==
                android.view.View.LAYOUT_DIRECTION_RTL
    }

    override fun getTimeZone(): String {
        return TimeZone.getDefault().id
    }

    // NOTE: Android's Locale API does not expose a direct "uses metric system"
    // flag the way iOS's NSLocaleUsesMetricSystem does. This is a heuristic
    // based on country code — the same approach used by react-native-localize.
    override fun usesMetricSystem(): Boolean {
        val imperialCountries = setOf("US", "LR", "MM")
        return !imperialCountries.contains(Locale.getDefault().country.uppercase())
    }

    override fun getCurrencyCode(): String {
        return try {
            Currency.getInstance(Locale.getDefault()).currencyCode
        } catch (e: Exception) {
            ""
        }
    }

    override fun uses24HourClock(): Boolean {
        return DateFormat.is24HourFormat(reactContext)
    }

    // NOTE: Android does not expose the calendar identifier (gregorian, buddhist,
    // islamic) through the Locale API. This always returns "gregorian", which is
    // correct for the vast majority of users. A true implementation would need to
    // read from the system Settings provider, which is out of scope for v0.3.0.
    override fun getCalendar(): String {
        return "gregorian"
    }

    override fun getDecimalSeparator(): String {
        return DecimalFormatSymbols.getInstance(Locale.getDefault()).decimalSeparator.toString()
    }

    // NOTE: Same heuristic approach as usesMetricSystem. Only the US officially
    // uses Fahrenheit. All other countries default to Celsius.
    override fun getTemperatureUnit(): String {
        return if (Locale.getDefault().country.uppercase() == "US") "fahrenheit" else "celsius"
    }

    // ---------------------------------------------------------------------------
// Network — connectivity
// ---------------------------------------------------------------------------

    override fun isConnected(): Boolean {
        val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    override fun getConnectionType(): String {
        val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return "none"
        val caps = cm.getNetworkCapabilities(network) ?: return "unknown"

        return when {
            caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH) -> "bluetooth"
            caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> "vpn"
            else -> "unknown"
        }
    }

    override fun getCellularGeneration(): String? {
        val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return null
        val caps = cm.getNetworkCapabilities(network) ?: return null

        if (!caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
            return null
        }

        // Use TelephonyManager directly instead of caps.dataNetworkType
        val tm = reactContext.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        @Suppress("DEPRECATION")
        return when (tm.networkType) {
            TelephonyManager.NETWORK_TYPE_NR -> "5g"
            TelephonyManager.NETWORK_TYPE_LTE -> "4g"
            TelephonyManager.NETWORK_TYPE_HSPAP,
            TelephonyManager.NETWORK_TYPE_HSPA,
            TelephonyManager.NETWORK_TYPE_HSDPA,
            TelephonyManager.NETWORK_TYPE_HSUPA,
            TelephonyManager.NETWORK_TYPE_UMTS,
            TelephonyManager.NETWORK_TYPE_EVDO_0,
            TelephonyManager.NETWORK_TYPE_EVDO_A,
            TelephonyManager.NETWORK_TYPE_EVDO_B -> "3g"

            TelephonyManager.NETWORK_TYPE_GPRS,
            TelephonyManager.NETWORK_TYPE_EDGE,
            TelephonyManager.NETWORK_TYPE_CDMA,
            TelephonyManager.NETWORK_TYPE_1xRTT,
            TelephonyManager.NETWORK_TYPE_IDEN -> "2g"

            else -> null
        }
    }

// ---------------------------------------------------------------------------
// Network — Wi-Fi signal (Android only)
// ---------------------------------------------------------------------------

    override fun getWifiSignalStrength(): Double? {
        val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return null
        val caps = cm.getNetworkCapabilities(network) ?: return null

        if (!caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            return null
        }

        val wifiManager = reactContext.applicationContext
            .getSystemService(Context.WIFI_SERVICE) as WifiManager

        @Suppress("DEPRECATION")
        val rssi = wifiManager.connectionInfo?.rssi ?: return null

        // Android returns -127 for "unknown"
        if (rssi == -127) return null

        return rssi.toDouble()
    }

    override fun getWifiSignalLevel(): Double? {
        val rssi = getWifiSignalStrength() ?: return null
        val wifiManager = reactContext.applicationContext
            .getSystemService(Context.WIFI_SERVICE) as WifiManager

        // 5 levels: 0 (worst) to 4 (best)
        @Suppress("DEPRECATION")
        val level = WifiManager.calculateSignalLevel(rssi.toInt(), 5)
        return level.toDouble()
    }

    override fun getWifiLinkSpeed(): Double? {
        val cm = reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return null
        val caps = cm.getNetworkCapabilities(network) ?: return null

        if (!caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            return null
        }

        val wifiManager = reactContext.applicationContext
            .getSystemService(Context.WIFI_SERVICE) as WifiManager

        @Suppress("DEPRECATION")
        val speed = wifiManager.connectionInfo?.linkSpeed ?: return null

        // Android returns -1 for "unknown"
        if (speed < 0) return null

        return speed.toDouble()
    }

    // ---------------------------------------------------------------------------
// Network — measurement (async)
// ---------------------------------------------------------------------------

    override fun measureLatency(promise: Promise) {
        Thread {
            try {
                val url = URL("https://www.google.com/generate_204")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "HEAD"
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                conn.useCaches = false

                val start = System.nanoTime()
                val code = conn.responseCode
                val elapsedMs = (System.nanoTime() - start) / 1_000_000.0

                conn.disconnect()

                if (code in 200..399) {
                    promise.resolve(elapsedMs)
                } else {
                    promise.reject("latency_error", "HTTP $code")
                }
            } catch (e: Exception) {
                promise.reject("latency_error", e.message, e)
            }
        }.start()
    }

    override fun measureDownloadSpeed(promise: Promise) {
        Thread {
            try {
                val url = URL("https://speed.cloudflare.com/__down?bytes=100000")
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 10000
                conn.readTimeout = 10000
                conn.useCaches = false

                val start = System.nanoTime()

                var totalBytes = 0
                conn.inputStream.use { input ->
                    val buffer = ByteArray(8192)
                    var read: Int
                    while (input.read(buffer).also { read = it } != -1) {
                        totalBytes += read
                    }
                }

                val elapsedSec = (System.nanoTime() - start) / 1_000_000_000.0
                conn.disconnect()

                if (elapsedSec <= 0) {
                    promise.resolve(0.0)
                    return@Thread
                }

                val bits = totalBytes.toDouble() * 8.0
                val mbps = (bits / elapsedSec) / 1_000_000.0
                promise.resolve(mbps)
            } catch (e: Exception) {
                promise.reject("speed_error", e.message, e)
            }
        }.start()
    }

    override fun measurePacketLoss(promise: Promise) {
        Thread {
            val totalPings = 5
            var failures = 0

            try {
                val url = URL("https://www.google.com/generate_204")

                for (i in 0 until totalPings) {
                    try {
                        val conn = url.openConnection() as HttpURLConnection
                        conn.requestMethod = "HEAD"
                        conn.connectTimeout = 3000
                        conn.readTimeout = 3000
                        conn.useCaches = false

                        val code = conn.responseCode
                        if (code !in 200..399) failures++
                        conn.disconnect()
                    } catch (e: Exception) {
                        failures++
                    }
                }

                val lossPercent = (failures.toDouble() / totalPings.toDouble()) * 100.0
                promise.resolve(lossPercent)
            } catch (e: Exception) {
                promise.reject("packet_loss_error", e.message, e)
            }
        }.start()
    }

    override fun measureQuality(promise: Promise) {
        Thread {
            var latencyMs = -1.0
            var downloadMbps = -1.0
            var packetLossPercent = -1.0

            // Latency
            try {
                val url = URL("https://www.google.com/generate_204")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "HEAD"
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                conn.useCaches = false

                val start = System.nanoTime()
                val code = conn.responseCode
                latencyMs = (System.nanoTime() - start) / 1_000_000.0
                conn.disconnect()
                if (code !in 200..399) latencyMs = -1.0
            } catch (e: Exception) {
                latencyMs = -1.0
            }

            // Download speed
            try {
                val url = URL("https://speed.cloudflare.com/__down?bytes=100000")
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 10000
                conn.readTimeout = 10000
                conn.useCaches = false

                val start = System.nanoTime()
                var totalBytes = 0
                conn.inputStream.use { input ->
                    val buffer = ByteArray(8192)
                    var read: Int
                    while (input.read(buffer).also { read = it } != -1) {
                        totalBytes += read
                    }
                }
                val elapsedSec = (System.nanoTime() - start) / 1_000_000_000.0
                conn.disconnect()

                if (elapsedSec > 0) {
                    val bits = totalBytes.toDouble() * 8.0
                    downloadMbps = (bits / elapsedSec) / 1_000_000.0
                }
            } catch (e: Exception) {
                downloadMbps = -1.0
            }

            // Packet loss
            try {
                val url = URL("https://www.google.com/generate_204")
                var failures = 0
                val totalPings = 5
                for (i in 0 until totalPings) {
                    try {
                        val conn = url.openConnection() as HttpURLConnection
                        conn.requestMethod = "HEAD"
                        conn.connectTimeout = 3000
                        conn.readTimeout = 3000
                        conn.useCaches = false
                        val code = conn.responseCode
                        if (code !in 200..399) failures++
                        conn.disconnect()
                    } catch (e: Exception) {
                        failures++
                    }
                }
                packetLossPercent = (failures.toDouble() / totalPings.toDouble()) * 100.0
            } catch (e: Exception) {
                packetLossPercent = -1.0
            }

            // Compute score
            val latencyScore = if (latencyMs < 0) 0.0 else Math.max(0.0, 100.0 - (latencyMs / 5.0))
            val speedScore = if (downloadMbps < 0) 0.0 else Math.min(100.0, downloadMbps * 2.0)
            val lossScore = if (packetLossPercent < 0) 0.0 else Math.max(0.0, 100.0 - (packetLossPercent * 5.0))

            val score = (latencyScore * 0.4) + (speedScore * 0.4) + (lossScore * 0.2)

            val tier = when {
                score >= 80 -> "excellent"
                score >= 60 -> "good"
                score >= 40 -> "fair"
                score >= 10 -> "poor"
                else -> "offline"
            }

            val result = com.facebook.react.bridge.Arguments.createMap().apply {
                putDouble("latencyMs", latencyMs)
                putDouble("downloadMbps", downloadMbps)
                putDouble("packetLossPercent", packetLossPercent)
                putDouble("score", Math.round(score).toDouble())
                putString("tier", tier)
            }

            promise.resolve(result)
        }.start()
    }

    // ---------------------------------------------------------------------------
// Device — App Information
// ---------------------------------------------------------------------------

    override fun getAppVersion(): String {
        return try {
            val pInfo = reactContext.packageManager.getPackageInfo(reactContext.packageName, 0)
            pInfo.versionName ?: ""
        } catch (e: PackageManager.NameNotFoundException) {
            ""
        }
    }

    override fun getBuildNumber(): String {
        return try {
            val pInfo = reactContext.packageManager.getPackageInfo(reactContext.packageName, 0)
            pInfo.versionCode.toString()
        } catch (e: PackageManager.NameNotFoundException) {
            ""
        }
    }

    override fun getBundleId(): String {
        return reactContext.packageName
    }

    override fun getApplicationName(): String {
        return try {
            val appInfo = reactContext.applicationInfo
            reactContext.packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            ""
        }
    }

// ---------------------------------------------------------------------------
// Device — Hardware
// ---------------------------------------------------------------------------

    override fun getDeviceName(): String {
        return Build.MODEL ?: ""
    }

    override fun getSystemName(): String {
        return "Android"
    }

    override fun getSystemVersion(): String {
        return Build.VERSION.RELEASE ?: ""
    }

    override fun getModel(): String {
        return Build.MODEL ?: ""
    }

    override fun isEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.FINGERPRINT.contains("test-keys")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.PRODUCT.contains("sdk")
                || Build.PRODUCT.contains("emulator")
                || "google_sdk" == Build.PRODUCT
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")))
    }

    override fun isHeadphonesConnected(): Boolean {
        val audioManager = reactContext.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
        return audioManager.isWiredHeadsetOn || audioManager.isBluetoothA2dpOn || audioManager.isBluetoothScoOn
    }

    // ---------------------------------------------------------------------------
// Device — Battery
// ---------------------------------------------------------------------------

    override fun getBatteryLevel(): Double {
        val intent = reactContext.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        ) ?: return -1.0

        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)

        if (level < 0 || scale <= 0) return -1.0

        return (level.toDouble() / scale.toDouble())
    }

    override fun getBatteryState(): String {
        val intent = reactContext.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        ) ?: return "unknown"

        val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)

        return when (status) {
            BatteryManager.BATTERY_STATUS_CHARGING -> "charging"
            BatteryManager.BATTERY_STATUS_FULL -> "full"
            BatteryManager.BATTERY_STATUS_DISCHARGING,
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "unplugged"

            else -> "unknown"
        }
    }

// ---------------------------------------------------------------------------
// Device — Persistent ID
// ---------------------------------------------------------------------------

    override fun getUniqueId(promise: Promise) {
        Thread {
            try {
                // ANDROID_ID persists across uninstall/reinstall as long as
                // the signing key and package name stay the same (API 26+).
                @Suppress("HardwareIds")
                val androidId = Settings.Secure.getString(
                    reactContext.contentResolver,
                    Settings.Secure.ANDROID_ID
                ) ?: ""

                // Combine with package name so different apps get different IDs
                val input = "$androidId:${reactContext.packageName}"

                // SHA-256 hash
                val digest = MessageDigest.getInstance("SHA-256")
                val hashBytes = digest.digest(input.toByteArray(Charsets.UTF_8))

                val hex = hashBytes.joinToString("") { "%02x".format(it) }

                promise.resolve(hex)
            } catch (e: Exception) {
                promise.reject("unique_id_error", e.message, e)
            }
        }.start()
    }

    // ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

    override fun getClipboardString(promise: Promise) {
        try {
            val clipboard = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = clipboard.primaryClip

            if (clip == null || clip.itemCount == 0) {
                promise.resolve("")
                return
            }

            val text = clip.getItemAt(0).coerceToText(reactContext).toString()
            promise.resolve(text)
        } catch (e: Exception) {
            promise.reject("clipboard_error", e.message, e)
        }
    }

    override fun setClipboardString(text: String, promise: Promise) {
        try {
            val clipboard = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("essentials", text)
            clipboard.setPrimaryClip(clip)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("clipboard_error", e.message, e)
        }
    }

    override fun hasClipboardString(promise: Promise) {
        try {
            val clipboard = reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val hasText = clipboard.hasPrimaryClip() &&
                    clipboard.primaryClipDescription?.hasMimeType("text/plain") == true
            promise.resolve(hasText)
        } catch (e: Exception) {
            promise.reject("clipboard_error", e.message, e)
        }
    }

    // ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------

    override fun share(options: ReadableMap, promise: Promise) {
        try {
            val message = if (options.hasKey("message")) options.getString("message") else null
            val url = if (options.hasKey("url")) options.getString("url") else null

            if (message.isNullOrEmpty() && url.isNullOrEmpty()) {
                promise.reject("share_error", "No message or url provided")
                return
            }

            // Combine message and url — Android's ACTION_SEND only takes one text field
            val combined = buildString {
                if (!message.isNullOrEmpty()) append(message)
                if (!url.isNullOrEmpty()) {
                    if (isNotEmpty()) append("\n\n")
                    append(url)
                }
            }

            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, combined)
                type = "text/plain"
            }

            val chooser = Intent.createChooser(sendIntent, null).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            reactContext.startActivity(chooser)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("share_error", e.message, e)
        }
    }

    // ---------------------------------------------------------------------------
// Haptics
// ---------------------------------------------------------------------------

    override fun hapticImpact(style: String) {
        val durationMs = when (style) {
            "light" -> 10L
            "heavy" -> 30L
            else -> 20L // medium
        }

        val amplitude = when (style) {
            "light" -> 80
            "heavy" -> 255
            else -> 160 // medium
        }

        vibrateInternal(durationMs, amplitude)
    }

    override fun hapticNotification(type: String) {
        val pattern = when (type) {
            "success" -> longArrayOf(0, 20, 40, 20)
            "warning" -> longArrayOf(0, 30, 30, 30)
            "error" -> longArrayOf(0, 50, 40, 50, 40, 50)
            else -> longArrayOf(0, 20, 40, 20) // default success
        }
        val amplitudes = when (type) {
            "success" -> intArrayOf(0, 160, 0, 160)
            "warning" -> intArrayOf(0, 180, 0, 180)
            "error" -> intArrayOf(0, 200, 0, 200, 0, 200)
            else -> intArrayOf(0, 160, 0, 160)
        }
        vibratePattern(pattern, amplitudes)
    }

    override fun hapticSelection() {
        vibrateInternal(10L, 80)
    }

    override fun vibrate() {
        vibrateInternal(400L, VibrationEffect.DEFAULT_AMPLITUDE)
    }

// ---------------------------------------------------------------------------
// Haptics — private helpers
// ---------------------------------------------------------------------------

    private fun getVibrator(): Vibrator? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = reactContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            reactContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    private fun vibrateInternal(durationMs: Long, amplitude: Int) {
        val vibrator = getVibrator() ?: return
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val effect = VibrationEffect.createOneShot(durationMs, amplitude)
            vibrator.vibrate(effect)
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(durationMs)
        }
    }

    private fun vibratePattern(timings: LongArray, amplitudes: IntArray) {
        val vibrator = getVibrator() ?: return
        if (!vibrator.hasVibrator()) return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val effect = VibrationEffect.createWaveform(timings, amplitudes, -1)
            vibrator.vibrate(effect)
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(timings, -1)
        }
    }

    // ---------------------------------------------------------------------------
// Launcher
// ---------------------------------------------------------------------------

    override fun openURL(url: String, promise: Promise) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    override fun dial(phoneNumber: String, promise: Promise) {
        try {
            val uri = Uri.parse("tel:" + Uri.encode(phoneNumber))
            val intent = Intent(Intent.ACTION_DIAL, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    override fun email(address: String, options: ReadableMap, promise: Promise) {
        try {
            val subject = if (options.hasKey("subject")) options.getString("subject") else null
            val body = if (options.hasKey("body")) options.getString("body") else null

            val uriBuilder = Uri.Builder()
                .scheme("mailto")
                .opaquePart(address)

            val queryParams = mutableListOf<String>()
            if (!subject.isNullOrEmpty()) {
                queryParams.add("subject=" + Uri.encode(subject))
            }
            if (!body.isNullOrEmpty()) {
                queryParams.add("body=" + Uri.encode(body))
            }
            if (queryParams.isNotEmpty()) {
                uriBuilder.encodedQuery(queryParams.joinToString("&"))
            }

            val intent = Intent(Intent.ACTION_SENDTO, uriBuilder.build()).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    override fun sms(phoneNumber: String, options: ReadableMap, promise: Promise) {
        try {
            val body = if (options.hasKey("body")) options.getString("body") else null

            val uri = Uri.parse("smsto:" + Uri.encode(phoneNumber))
            val intent = Intent(Intent.ACTION_SENDTO, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                if (!body.isNullOrEmpty()) {
                    putExtra("sms_body", body)
                }
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    override fun openAppSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", reactContext.packageName, null)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    // ---------------------------------------------------------------------------
// Launcher — specific settings screens
// ---------------------------------------------------------------------------

    override fun openSettings(screen: String, promise: Promise) {
        try {
            val action = when (screen) {
                "app" -> Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                "notification" -> Settings.ACTION_APP_NOTIFICATION_SETTINGS
                "location" -> Settings.ACTION_LOCATION_SOURCE_SETTINGS
                "wifi" -> Settings.ACTION_WIFI_SETTINGS
                "bluetooth" -> Settings.ACTION_BLUETOOTH_SETTINGS
                "display" -> Settings.ACTION_DISPLAY_SETTINGS
                "sound" -> Settings.ACTION_SOUND_SETTINGS
                "battery" -> Settings.ACTION_BATTERY_SAVER_SETTINGS
                "apps" -> Settings.ACTION_MANAGE_APPLICATIONS_SETTINGS
                "nfc" -> Settings.ACTION_NFC_SETTINGS
                "airplane" -> Settings.ACTION_AIRPLANE_MODE_SETTINGS
                else -> Settings.ACTION_APPLICATION_DETAILS_SETTINGS
            }

            val intent = Intent(action).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

                // App-specific screens need the package name
                if (screen == "app" || screen == "notification") {
                    data = Uri.fromParts("package", reactContext.packageName, null)
                }
            }

            // Android 8+ needs extra flags for notification settings
            if (screen == "notification") {
                intent.putExtra("app_package", reactContext.packageName)
                intent.putExtra("app_uid", reactContext.applicationInfo.uid)
            }

            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    // ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

    private fun getPreferences(): SharedPreferences {
        return reactContext.getSharedPreferences(
            "react_native_essentials_settings",
            Context.MODE_PRIVATE
        )
    }

    override fun preferencesGet(key: String, promise: Promise) {
        try {
            val prefs = getPreferences()
            val value = prefs.getString(key, null)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("preferences_error", e.message, e)
        }
    }

    override fun preferencesSet(key: String, value: String, promise: Promise) {
        try {
            val prefs = getPreferences()
            prefs.edit().putString(key, value).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("preferences_error", e.message, e)
        }
    }

    override fun preferencesRemove(key: String, promise: Promise) {
        try {
            val prefs = getPreferences()
            prefs.edit().remove(key).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("preferences_error", e.message, e)
        }
    }

    override fun preferencesClear(promise: Promise) {
        try {
            val prefs = getPreferences()
            prefs.edit().clear().apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("preferences_error", e.message, e)
        }
    }

    override fun preferencesHas(key: String, promise: Promise) {
        try {
            val prefs = getPreferences()
            promise.resolve(prefs.contains(key))
        } catch (e: Exception) {
            promise.reject("preferences_error", e.message, e)
        }
    }

    // ---------------------------------------------------------------------------
// SecureStorage — EncryptedSharedPreferences
// ---------------------------------------------------------------------------

    private var securePrefs: SharedPreferences? = null

    private fun getSecurePreferences(): SharedPreferences {
        securePrefs?.let { return it }

        val prefs = try {
            createSecurePreferences()
        } catch (e: GeneralSecurityException) {
            // Backup restored on a new device — the master key is gone.
            // The old data is unrecoverable, so delete and recreate.
            deleteSecurePreferences()
            createSecurePreferences()
        }

        securePrefs = prefs
        return prefs
    }

    private fun createSecurePreferences(): SharedPreferences {
        val masterKey = MasterKey.Builder(reactContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        return EncryptedSharedPreferences.create(
            reactContext,
            "react_native_essentials_secure_storage",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    private fun deleteSecurePreferences() {
        try {
            val prefsFile = File(
                reactContext.filesDir.parent,
                "shared_prefs/react_native_essentials_secure_storage.xml"
            )
            if (prefsFile.exists()) {
                prefsFile.delete()
            }

            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            keyStore.deleteEntry(MasterKey.DEFAULT_MASTER_KEY_ALIAS)
        } catch (e: Exception) {
            // Best-effort cleanup; if this fails, the next create() will retry.
        }
    }

    override fun secureStorageGet(key: String, promise: Promise) {
        try {
            val prefs = getSecurePreferences()
            val value = prefs.getString(key, null)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("secure_storage_error", e.message, e)
        }
    }

    override fun secureStorageSet(
        key: String,
        value: String,
        accessibility: String?,
        promise: Promise
    ) {
        try {
            val prefs = getSecurePreferences()
            prefs.edit().putString(key, value).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("secure_storage_error", e.message, e)
        }
    }

    override fun secureStorageRemove(key: String, promise: Promise) {
        try {
            val prefs = getSecurePreferences()
            prefs.edit().remove(key).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("secure_storage_error", e.message, e)
        }
    }

    override fun secureStorageClear(promise: Promise) {
        try {
            val prefs = getSecurePreferences()
            prefs.edit().clear().apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("secure_storage_error", e.message, e)
        }
    }

    override fun secureStorageHas(key: String, promise: Promise) {
        try {
            val prefs = getSecurePreferences()
            promise.resolve(prefs.contains(key))
        } catch (e: Exception) {
            promise.reject("secure_storage_error", e.message, e)
        }
    }

    override fun addListener(eventName: String?) {
        // Required by NativeEventEmitter, no-op for now.
    }

    override fun removeListeners(count: Double) {
        // Required by NativeEventEmitter, no-op for now.
    }

    companion object {
        const val NAME = NativeEssentialsSettingsSpec.NAME
    }
}