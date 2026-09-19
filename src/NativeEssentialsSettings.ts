import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // -------------------------------------------------------------------------
  // Appearance
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Display
  // -------------------------------------------------------------------------

  /**
   * Screen width in density-independent pixels (dp).
   * e.g. 390 on iPhone 17 Pro, 411 on Pixel 8.
   */
  getDisplayWidth(): number;

  /**
   * Screen height in density-independent pixels (dp).
   * e.g. 844 on iPhone 17 Pro, 914 on Pixel 8.
   */
  getDisplayHeight(): number;

  /**
   * Pixel density scale. e.g. 3.0 on iPhone 17 Pro, 2.625 on Pixel 8.
   */
  getDisplayScale(): number;

  /**
   * Current orientation.
   * 'portrait' | 'landscape'
   */
  getDisplayOrientation(): string;

  /**
   * Physical screen size category.
   * 'small' | 'normal' | 'large' | 'xlarge' | 'unknown'
   *
   * NOTE: On iOS, this is derived from screen dimensions since iOS
   * doesn't expose a direct screen size category.
   */
  getDisplaySize(): string;

  /** Current system color scheme. 'light' | 'dark' | 'unspecified' */
  getColorScheme(): string;

  /** User's preferred font scale. 1.0 = default. */
  getFontScale(): number;

  // -------------------------------------------------------------------------
  // Locale — Tier 1 (identity & region)
  // -------------------------------------------------------------------------

  /** Full locale identifier. e.g. "en_IN" */
  getLocale(): string;

  /** ISO 639 language code. e.g. "en" */
  getLanguage(): string;

  /** ISO 3166 country code. e.g. "IN" */
  getCountry(): string;

  /** Whether the current layout direction is RTL. */
  isRTL(): boolean;

  /** IANA time zone. e.g. "Asia/Kolkata" */
  getTimeZone(): string;

  // -------------------------------------------------------------------------
  // Locale — Tier 2 (preferences & formatting)
  // -------------------------------------------------------------------------

  /** Whether the locale uses the metric system. */
  usesMetricSystem(): boolean;

  /** ISO 4217 currency code. e.g. "INR" */
  getCurrencyCode(): string;

  /** Whether the user prefers 24-hour time. */
  uses24HourClock(): boolean;

  /** Calendar identifier. e.g. "gregorian" */
  getCalendar(): string;

  /** Decimal separator character. e.g. "." */
  getDecimalSeparator(): string;

  /** Preferred temperature unit. 'celsius' | 'fahrenheit' */
  getTemperatureUnit(): string;

  // -------------------------------------------------------------------------
  // Network — connectivity (cross-platform)
  // -------------------------------------------------------------------------

  /** Whether the device is currently connected. */
  isConnected(): boolean;

  /** Connection type. 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'vpn' | 'none' | 'unknown' */
  getConnectionType(): string;

  /** Cellular generation. '2g' | '3g' | '4g' | '5g' | null */
  getCellularGeneration(): string | null;

  // -------------------------------------------------------------------------
  // Network — Wi-Fi signal (Android only; null on iOS)
  // -------------------------------------------------------------------------

  /** Wi-Fi RSSI in dBm. Android only. e.g. -45 (excellent) | null on iOS */
  getWifiSignalStrength(): number | null;

  /** Wi-Fi signal level in bars (0-4). Android only. | null on iOS */
  getWifiSignalLevel(): number | null;

  /** Wi-Fi link speed in Mbps. Android only. | null on iOS */
  getWifiLinkSpeed(): number | null;

  // -------------------------------------------------------------------------
  // Network — measurement (async, cross-platform)
  // -------------------------------------------------------------------------

  /**
   * Measure round-trip latency to a known host.
   *
   * ⚠️ PRECAUTION:
   * - Makes a real network request. Do not call on every render.
   * - Uses ~1 KB of data (HEAD request only).
   * - Times out after 5 seconds.
   * - Rejects if the request fails.
   *
   * @returns Latency in milliseconds.
   */
  measureLatency(): Promise<number>;

  /**
   * Measure download throughput.
   *
   * ⚠️ PRECAUTION:
   * - Downloads ~100 KB of data. This costs bandwidth and battery.
   * - Do not call more than once per minute.
   * - Do not call on metered connections without user consent.
   * - Times out after 10 seconds.
   *
   * @returns Download speed in Mbps.
   */
  measureDownloadSpeed(): Promise<number>;

  /**
   * Measure approximate packet loss.
   *
   * ⚠️ PRECAUTION:
   * - Fires 5 separate HEAD requests (~5 KB total).
   * - Takes 1–15 seconds depending on network.
   * - Result is an approximation, not true ICMP ping loss.
   * - Rejects if all requests fail.
   *
   * @returns Packet loss percentage (0–100).
   */
  measurePacketLoss(): Promise<number>;

  /**
   * Full network quality report.
   *
   * ⚠️ PRECAUTION:
   * - Makes MULTIPLE network requests in parallel.
   * - Downloads ~100 KB and fires 7+ HTTP requests.
   * - Takes 3–15 seconds to complete.
   * - Do NOT call on every app launch — cache the result.
   * - Do NOT call while the user is on a metered connection
   *   unless they've opted in.
   * - The score is derived from latency (40%), download speed (40%),
   *   and packet loss (20%). It is a heuristic, not a guarantee.
   *
   * @returns { latencyMs, downloadMbps, packetLossPercent, score, tier }
   */
  measureQuality(): Promise<{
    latencyMs: number;
    downloadMbps: number;
    packetLossPercent: number;
    score: number;
    tier: string;
  }>;

  // -------------------------------------------------------------------------
  // Device — App Information
  // -------------------------------------------------------------------------

  /** App version string. iOS: CFBundleShortVersionString. Android: versionName. */
  getAppVersion(): string;

  /** Build number. iOS: CFBundleVersion. Android: versionCode. */
  getBuildNumber(): string;

  /** App bundle identifier. e.g. "com.example.app" */
  getBundleId(): string;

  /** App display name. e.g. "My App" */
  getApplicationName(): string;

  // -------------------------------------------------------------------------
  // Device — Hardware Info
  // -------------------------------------------------------------------------

  /** Device model. e.g. "iPhone 17 Pro", "Pixel 8" */
  getDeviceName(): string;

  /** OS name. e.g. "iOS", "Android" */
  getSystemName(): string;

  /** OS version. e.g. "26.0", "16" */
  getSystemVersion(): string;

  /** Device model identifier. e.g. "iPhone17,1", "Pixel 8" */
  getModel(): string;

  /** Whether the app is running on an emulator/simulator. */
  isEmulator(): boolean;

  /** Whether headphones (wired or Bluetooth) are currently connected. */
  isHeadphonesConnected(): boolean;

  // -------------------------------------------------------------------------
  // Device — Battery
  // -------------------------------------------------------------------------

  /**
   * Battery level from 0.0 (empty) to 1.0 (full).
   * Returns -1.0 if the level cannot be determined.
   */
  getBatteryLevel(): number;

  /**
   * Battery state.
   * 'charging' | 'full' | 'unplugged' | 'unknown'
   */
  getBatteryState(): string;

  // -------------------------------------------------------------------------
  // Device — Persistent ID
  // -------------------------------------------------------------------------

  /**
   * Persistent device identifier that survives app uninstall/reinstall.
   * Returns a 64-character hex string (SHA-256 hash of the underlying ID).
   */
  getUniqueId(): Promise<string>;

  // -------------------------------------------------------------------------
  // Clipboard
  // -------------------------------------------------------------------------

  /**
   * Get the current clipboard text.
   *
   * ⚠️ PRECAUTION:
   * - iOS 16+ shows a system privacy prompt when reading the clipboard.
   *   The user must approve each read.
   * - Android 10+ restricts clipboard access when the app is in the
   *   background. Reading in the foreground works normally.
   *
   * @returns The clipboard text, or an empty string if nothing is copied.
   */
  getClipboardString(): Promise<string>;

  /**
   * Write text to the clipboard.
   *
   * ⚠️ PRECAUTION:
   * - On iOS 16+, this may trigger a privacy notification.
   * - On Android 13+, the system shows a "Copied" toast automatically.
   *
   * @param text The text to copy.
   */
  setClipboardString(text: string): Promise<void>;

  /**
   * Whether the clipboard currently contains text.
   */
  hasClipboardString(): Promise<boolean>;

  // -------------------------------------------------------------------------
  // Share
  // -------------------------------------------------------------------------

  /**
   * Open the native share sheet with text and/or a URL.
   *
   * ⚠️ PRECAUTION:
   * - Shows the system share sheet. The user chooses the destination.
   * - On iOS, if both `message` and `url` are provided, some targets
   *   may only receive one.
   * - On Android, `url` is appended to `message` since the OS doesn't
   *   have a separate URL field.
   *
   * @param options.message Text to share.
   * @param options.url Optional URL to share.
   * @returns Whether the user completed the share (true) or dismissed (false).
   */
  share(options: { message?: string; url?: string }): Promise<boolean>;

  // -------------------------------------------------------------------------
  // Haptics
  // -------------------------------------------------------------------------

  /**
   * Trigger an impact feedback.
   *
   * ⚠️ PRECAUTION:
   * - No-op on devices without haptic hardware (most older Android).
   * - On iOS, requires iPhone 7 or later.
   * - Ignored if the user has disabled haptics in system settings.
   *
   * @param style 'light' | 'medium' | 'heavy'
   */
  hapticImpact(style: string): void;

  /**
   * Trigger a notification feedback.
   *
   * ⚠️ PRECAUTION:
   * - No-op on devices without haptic hardware.
   * - Ignored if haptics are disabled in system settings.
   *
   * @param type 'success' | 'warning' | 'error'
   */
  hapticNotification(type: string): void;

  /**
   * Trigger a selection feedback (subtle tick).
   * Use when the user changes a selection — picker, segmented control, etc.
   */
  hapticSelection(): void;

  /**
   * Trigger a generic vibration.
   *
   * ⚠️ PRECAUTION:
   * - iOS: no-op. Apple discourages raw vibration for third-party apps;
   *   use `hapticImpact` or `hapticNotification` instead.
   * - Android: requires `<uses-permission android:name="android.permission.VIBRATE" />`.
   */
  vibrate(): void;

  // -------------------------------------------------------------------------
  // Launcher
  // -------------------------------------------------------------------------

  /**
   * Open a URL in the system browser.
   *
   * ⚠️ PRECAUTION:
   * - Supports http, https, and custom schemes (e.g. myapp://).
   * - The URL must be valid or the native call rejects.
   *
   * @param url The URL to open.
   * @returns true if opened, false if the OS refused (unknown scheme).
   */
  openURL(url: string): Promise<boolean>;

  /**
   * Open the phone dialer with a number prefilled.
   * Does NOT place a call — the user must confirm.
   *
   * @param phoneNumber The number to dial.
   */
  dial(phoneNumber: string): Promise<boolean>;

  /**
   * Open the default email client.
   *
   * @param address Recipient address.
   * @param options.subject Optional subject line.
   * @param options.body Optional body text.
   */
  email(
    address: string,
    options: { subject?: string; body?: string }
  ): Promise<boolean>;

  /**
   * Open the default SMS app.
   *
   * @param phoneNumber Recipient number.
   * @param options.body Optional message body.
   */
  sms(phoneNumber: string, options: { body?: string }): Promise<boolean>;

  /**
   * Open the app's settings page in the system Settings app.
   * Useful for sending users to grant permissions.
   */
  openAppSettings(): Promise<boolean>;

  // -------------------------------------------------------------------------
  // Launcher — specific settings screens
  // -------------------------------------------------------------------------

  /**
   * Open a specific system settings screen.
   *
   * ⚠️ PLATFORM DIFFERENCES:
   * - **Android**: Opens the exact screen requested (notification, location,
   *   app details, etc.).
   * - **iOS**: Apple only allows third-party apps to open their own settings
   *   page. All values fall back to `UIApplicationOpenSettingsURLString`.
   *   There is no supported way to jump to system-wide settings screens.
   *
   * @param screen The settings screen to open.
   *   - 'app'          → App details / permissions
   *   - 'notification' → App notification settings
   *   - 'location'     → Device location source (GPS toggle)
   *   - 'wifi'         → Wi-Fi settings
   *   - 'bluetooth'    → Bluetooth settings
   *   - 'display'      → Display settings
   *   - 'sound'        → Sound settings
   *   - 'battery'      → Battery settings
   *   - 'apps'         → Installed apps list
   *   - 'nfc'          → NFC settings
   *   - 'airplane'     → Airplane mode settings
   * @returns true if the screen opened, false otherwise.
   */
  openSettings(screen: string): Promise<boolean>;

  // -------------------------------------------------------------------------
  // Preferences — plain key-value storage
  // -------------------------------------------------------------------------

  /**
   * Read a string value from preferences.
   *
   * ⚠️ PRECAUTION:
   * - NOT encrypted. Do not use for tokens, passwords, or sensitive data.
   * - Use `SecureStorage` for anything sensitive.
   *
   * @returns The stored string, or null if the key doesn't exist.
   */
  preferencesGet(key: string): Promise<string | null>;

  /**
   * Write a string value to preferences.
   */
  preferencesSet(key: string, value: string): Promise<void>;

  /**
   * Remove a key from preferences.
   */
  preferencesRemove(key: string): Promise<void>;

  /**
   * Remove all keys from preferences.
   *
   * ⚠️ PRECAUTION: This clears ALL preferences for the app.
   */
  preferencesClear(): Promise<void>;

  /**
   * Check if a key exists in preferences.
   */
  preferencesHas(key: string): Promise<boolean>;

  // -------------------------------------------------------------------------
  // SecureStorage — encrypted key-value storage
  // -------------------------------------------------------------------------

  /**
   * Read a value from secure storage.
   *
   * ⚠️ PRECAUTION:
   * - This IS encrypted (Keychain on iOS, EncryptedSharedPreferences on Android).
   * - Use for tokens, passwords, API keys — anything sensitive.
   * - iOS Keychain persists across app uninstall. Android does not.
   * - Slower than Preferences (crypto overhead).
   *
   * @returns The stored string, or null if the key doesn't exist.
   */
  secureStorageGet(key: string): Promise<string | null>;

  /**
   * Write a value to secure storage.
   *
   * @param key The key to store under.
   * @param value The value to store.
   * @param accessibility iOS only. Controls when the Keychain item is readable.
   *   - 'whenUnlocked' (default) — only when device is unlocked
   *   - 'afterFirstUnlock' — after first unlock since boot
   *   - 'whenUnlockedThisDeviceOnly' — no iCloud/backup migration
   *   - 'afterFirstUnlockThisDeviceOnly' — no migration
   *   Ignored on Android.
   */
  secureStorageSet(
    key: string,
    value: string,
    accessibility?: string
  ): Promise<void>;

  /**
   * Remove a key from secure storage.
   */
  secureStorageRemove(key: string): Promise<void>;

  /**
   * Remove all keys from secure storage.
   *
   * ⚠️ PRECAUTION: This clears ALL secure storage for the app.
   */
  secureStorageClear(): Promise<void>;

  /**
   * Check if a key exists in secure storage.
   */
  secureStorageHas(key: string): Promise<boolean>;

  // -------------------------------------------------------------------------
  // Required by NativeEventEmitter (internal)
  // -------------------------------------------------------------------------

  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('EssentialsSettings');
