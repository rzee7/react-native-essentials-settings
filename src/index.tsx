import { useEffect, useState } from 'react';
import {
  useColorScheme as useRNColorScheme,
  useWindowDimensions,
} from 'react-native';
import NativeEssentialsSettings from './NativeEssentialsSettings';

/**
 * One-shot read of the current color scheme from our native module.
 */
export function getColorScheme(): string {
  return NativeEssentialsSettings.getColorScheme();
}

/**
 * One-shot read of the current font scale from our native module.
 * 1.0 = default, > 1.0 = enlarged, < 1.0 = reduced.
 */
export function getFontScale(): number {
  return NativeEssentialsSettings.getFontScale();
}

/**
 * React hook — returns the live color scheme.
 *
 * Uses React Native's built-in useColorScheme() for live updates,
 * and our native module for the authoritative initial value.
 */
export function useColorScheme(): string {
  const rnScheme = useRNColorScheme();
  const [scheme, setScheme] = useState<string>(() => {
    try {
      return getColorScheme();
    } catch {
      return 'unspecified';
    }
  });

  // When RN's appearance listener fires, update our state.
  useEffect(() => {
    if (rnScheme) {
      setScheme(rnScheme);
    }
  }, [rnScheme]);

  return scheme;
}

/**
 * React hook — returns the current font scale.
 * Note: this does not update live yet (v0.2.0 will add that).
 */
export function useFontScale(): number {
  const [scale, setScale] = useState<number>(() => {
    try {
      return getFontScale();
    } catch {
      return 1.0;
    }
  });

  useEffect(() => {
    try {
      setScale(getFontScale());
    } catch {
      // keep the default
    }
  }, []);

  return scale;
}

// ---------------------------------------------------------------------------
// Locale (grouped namespace)
// ---------------------------------------------------------------------------

/**
 * Unified locale API.
 *
 * @example
 * Locale.getLocale();           // "en_IN"
 * Locale.isRTL();               // false
 * Locale.usesMetricSystem();    // true
 * Locale.getCurrencyCode();     // "INR"
 */
export const Locale = {
  // -------------------------------------------------------------------------
  // Tier 1 — Identity & region
  // -------------------------------------------------------------------------

  /**
   * Full locale identifier.
   * @returns e.g. "en_IN", "en_US"
   */
  getLocale(): string {
    return NativeEssentialsSettings.getLocale();
  },

  /**
   * ISO 639 language code.
   * @returns e.g. "en", "hi"
   */
  getLanguage(): string {
    return NativeEssentialsSettings.getLanguage();
  },

  /**
   * ISO 3166 country code.
   * @returns e.g. "IN", "US"
   */
  getCountry(): string {
    return NativeEssentialsSettings.getCountry();
  },

  /**
   * Whether the current layout direction is right-to-left.
   * @returns boolean
   */
  isRTL(): boolean {
    return NativeEssentialsSettings.isRTL();
  },

  /**
   * IANA time zone identifier.
   * @returns e.g. "Asia/Kolkata", "America/New_York"
   */
  getTimeZone(): string {
    return NativeEssentialsSettings.getTimeZone();
  },

  // -------------------------------------------------------------------------
  // Tier 2 — Preferences & formatting
  // -------------------------------------------------------------------------

  /**
   * Whether the user's locale uses the metric system.
   *
   * NOTE: On Android this is a heuristic based on country code, since
   * Android's Locale API does not expose a direct metric-system flag.
   * @returns boolean
   */
  usesMetricSystem(): boolean {
    return NativeEssentialsSettings.usesMetricSystem();
  },

  /**
   * ISO 4217 currency code for the locale.
   * @returns e.g. "INR", "USD"
   */
  getCurrencyCode(): string {
    return NativeEssentialsSettings.getCurrencyCode();
  },

  /**
   * Whether the user prefers a 24-hour clock.
   * @returns boolean
   */
  uses24HourClock(): boolean {
    return NativeEssentialsSettings.uses24HourClock();
  },

  /**
   * Calendar identifier in use.
   *
   * NOTE: On Android this always returns "gregorian", since Android's
   * Locale API does not expose the calendar identifier. iOS returns the
   * actual calendar (e.g. "buddhist", "islamic").
   * @returns e.g. "gregorian"
   */
  getCalendar(): string {
    return NativeEssentialsSettings.getCalendar();
  },

  /**
   * Decimal separator character.
   * @returns e.g. ".", ","
   */
  getDecimalSeparator(): string {
    return NativeEssentialsSettings.getDecimalSeparator();
  },

  /**
   * Preferred temperature unit.
   *
   * NOTE: On Android this is a country-based heuristic (US → fahrenheit,
   * all others → celsius).
   * @returns 'celsius' | 'fahrenheit'
   */
  getTemperatureUnit(): string {
    return NativeEssentialsSettings.getTemperatureUnit();
  },
};

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

/**
 * Unified network API.
 *
 * @example
 * Network.isConnected();           // true
 * Network.getConnectionType();     // "wifi"
 * Network.getCellularGeneration(); // "5g"
 * await Network.measureLatency();  // 42
 */
export const Network = {
  // -------------------------------------------------------------------------
  // Connectivity (cross-platform)
  // -------------------------------------------------------------------------

  /**
   * Whether the device is currently connected.
   */
  isConnected(): boolean {
    return NativeEssentialsSettings.isConnected();
  },

  /**
   * Connection type.
   * @returns 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'vpn' | 'none' | 'unknown'
   */
  getConnectionType(): string {
    return NativeEssentialsSettings.getConnectionType();
  },

  /**
   * Cellular generation, or null if not on cellular.
   * @returns '2g' | '3g' | '4g' | '5g' | null
   */
  getCellularGeneration(): string | null {
    return NativeEssentialsSettings.getCellularGeneration();
  },

  // -------------------------------------------------------------------------
  // Wi-Fi signal (Android only; null on iOS)
  // -------------------------------------------------------------------------

  /**
   * Wi-Fi signal strength in dBm.
   *
   * NOTE: Android only. Returns null on iOS, since Apple does not expose
   * Wi-Fi signal strength to third-party apps.
   * @returns e.g. -45 (excellent), -72 (fair) | null
   */
  getWifiSignalStrength(): number | null {
    return NativeEssentialsSettings.getWifiSignalStrength();
  },

  /**
   * Wi-Fi signal level in bars (0-4).
   *
   * NOTE: Android only. Returns null on iOS.
   */
  getWifiSignalLevel(): number | null {
    return NativeEssentialsSettings.getWifiSignalLevel();
  },

  /**
   * Wi-Fi link speed in Mbps.
   *
   * NOTE: Android only. Returns null on iOS.
   */
  getWifiLinkSpeed(): number | null {
    return NativeEssentialsSettings.getWifiLinkSpeed();
  },

  // -------------------------------------------------------------------------
  // Measurement (async, cross-platform)
  // -------------------------------------------------------------------------

  /**
   * Measure round-trip latency to a known host.
   * @returns milliseconds
   */
  measureLatency(): Promise<number> {
    return NativeEssentialsSettings.measureLatency();
  },

  /**
   * Measure download throughput.
   * @returns Mbps
   */
  measureDownloadSpeed(): Promise<number> {
    return NativeEssentialsSettings.measureDownloadSpeed();
  },

  /**
   * Approximate packet loss percentage (0-100).
   */
  measurePacketLoss(): Promise<number> {
    return NativeEssentialsSettings.measurePacketLoss();
  },

  /**
   * Full quality report: latency, speed, loss, score, and tier.
   * @returns { latencyMs, downloadMbps, packetLossPercent, score, tier }
   */
  measureQuality(): Promise<{
    latencyMs: number;
    downloadMbps: number;
    packetLossPercent: number;
    score: number;
    tier: string;
  }> {
    return NativeEssentialsSettings.measureQuality();
  },
};

// ---------------------------------------------------------------------------
// Device
// ---------------------------------------------------------------------------

export const Device = {
  // -------------------------------------------------------------------------
  // App Information
  // -------------------------------------------------------------------------

  /** App version. e.g. "1.0.0" */
  getAppVersion(): string {
    return NativeEssentialsSettings.getAppVersion();
  },

  /** Build number. e.g. "42" */
  getBuildNumber(): string {
    return NativeEssentialsSettings.getBuildNumber();
  },

  /** Bundle identifier. e.g. "com.example.app" */
  getBundleId(): string {
    return NativeEssentialsSettings.getBundleId();
  },

  /** App display name. e.g. "My App" */
  getApplicationName(): string {
    return NativeEssentialsSettings.getApplicationName();
  },

  // -------------------------------------------------------------------------
  // Hardware Info
  // -------------------------------------------------------------------------

  /** Device name. iOS: "John's iPhone". Android: model name. */
  getDeviceName(): string {
    return NativeEssentialsSettings.getDeviceName();
  },

  /** OS name. "iOS" | "Android" */
  getSystemName(): string {
    return NativeEssentialsSettings.getSystemName();
  },

  /** OS version. e.g. "26.0" (iOS), "16" (Android) */
  getSystemVersion(): string {
    return NativeEssentialsSettings.getSystemVersion();
  },

  /** Device model. iOS: "iPhone17,1". Android: "Pixel 8". */
  getModel(): string {
    return NativeEssentialsSettings.getModel();
  },

  /** Whether the app is running on a simulator or emulator. */
  isEmulator(): boolean {
    return NativeEssentialsSettings.isEmulator();
  },

  /** Whether headphones (wired or Bluetooth) are connected. */
  isHeadphonesConnected(): boolean {
    return NativeEssentialsSettings.isHeadphonesConnected();
  },

  // -------------------------------------------------------------------------
  // Battery
  // -------------------------------------------------------------------------

  /** Battery level from 0.0 to 1.0. Returns -1.0 if unknown. */
  getBatteryLevel(): number {
    return NativeEssentialsSettings.getBatteryLevel();
  },

  /** 'charging' | 'full' | 'unplugged' | 'unknown' */
  getBatteryState(): string {
    return NativeEssentialsSettings.getBatteryState();
  },

  // -------------------------------------------------------------------------
  // Persistent ID
  // -------------------------------------------------------------------------

  /**
   * Persistent device identifier that survives app uninstall/reinstall.
   *
   * ⚠️ Returns a SHA-256 hash, not the raw underlying ID.
   * Resets on factory reset. Do not use for advertising or cross-app tracking.
   */
  getUniqueId(): Promise<string> {
    return NativeEssentialsSettings.getUniqueId();
  },
};

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

export const Clipboard = {
  /**
   * Get the current clipboard text.
   *
   * ⚠️ On iOS 16+, this shows a system "Allow Paste?" prompt.
   * Returns an empty string if the user declines.
   */
  getString(): Promise<string> {
    return NativeEssentialsSettings.getClipboardString();
  },

  /**
   * Write text to the clipboard.
   *
   * ⚠️ On Android 13+, the system shows a "Copied" toast automatically.
   */
  setString(text: string): Promise<void> {
    return NativeEssentialsSettings.setClipboardString(text);
  },

  /**
   * Whether the clipboard currently contains text.
   *
   * ⚠️ On iOS, this checks for any strings in the pasteboard without
   * triggering the privacy prompt.
   */
  hasString(): Promise<boolean> {
    return NativeEssentialsSettings.hasClipboardString();
  },
};

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export const Display = {
  /**
   * Screen width in density-independent pixels (dp).
   */
  getWidth(): number {
    return NativeEssentialsSettings.getDisplayWidth();
  },

  /**
   * Screen height in density-independent pixels (dp).
   */
  getHeight(): number {
    return NativeEssentialsSettings.getDisplayHeight();
  },

  /**
   * Pixel density scale. e.g. 2.0, 3.0.
   */
  getScale(): number {
    return NativeEssentialsSettings.getDisplayScale();
  },

  /**
   * Current orientation.
   * 'portrait' | 'landscape'
   */
  getOrientation(): string {
    return NativeEssentialsSettings.getDisplayOrientation();
  },

  /**
   * Physical screen size category.
   * 'small' | 'normal' | 'large' | 'xlarge' | 'unknown'
   */
  getSize(): string {
    return NativeEssentialsSettings.getDisplaySize();
  },
};

/**
 * React hook — returns the current orientation.
 * Updates live when the device rotates.
 */
export function useOrientation(): string {
  const { width, height } = useWindowDimensions();
  return width > height ? 'landscape' : 'portrait';
}

// ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------

export const Share = {
  /**
   * Open the native share sheet with text and/or a URL.
   *
   * ⚠️ Note about the return value:
   * - On iOS, returns true if the user completed the share, false if cancelled.
   * - On Android, always returns true once the chooser opens. Android
   *   doesn't provide a reliable way to detect cancellation.
   *
   * @param options.message Text to share.
   * @param options.url Optional URL. On Android, it's appended to message.
   */
  share(options: { message?: string; url?: string }): Promise<boolean> {
    return NativeEssentialsSettings.share(options);
  },
};

// ---------------------------------------------------------------------------
// Haptics
// ---------------------------------------------------------------------------

export const Haptics = {
  /**
   * Trigger an impact feedback.
   *
   * ⚠️ No-op on devices without haptic hardware.
   *
   * @param style 'light' | 'medium' | 'heavy'
   */
  impact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
    NativeEssentialsSettings.hapticImpact(style);
  },

  /**
   * Trigger a notification feedback.
   *
   * ⚠️ No-op on devices without haptic hardware.
   *
   * @param type 'success' | 'warning' | 'error'
   */
  notification(type: 'success' | 'warning' | 'error' = 'success'): void {
    NativeEssentialsSettings.hapticNotification(type);
  },

  /**
   * Trigger a selection feedback (subtle tick).
   * Use when the user changes a selection — picker, segmented control, etc.
   */
  selection(): void {
    NativeEssentialsSettings.hapticSelection();
  },

  /**
   * Trigger a generic vibration.
   *
   * ⚠️ iOS: no-op. Use `impact` or `notification` instead.
   * ⚠️ Android: requires the VIBRATE permission in your AndroidManifest.
   */
  vibrate(): void {
    NativeEssentialsSettings.vibrate();
  },
};

// ---------------------------------------------------------------------------
// Launcher
// ---------------------------------------------------------------------------

export const Launcher = {
  /**
   * Open a URL in the system browser (or another app for custom schemes).
   */
  openURL(url: string): Promise<boolean> {
    return NativeEssentialsSettings.openURL(url);
  },

  /**
   * Open the phone dialer with a number prefilled.
   * Does NOT place a call — the user must confirm.
   */
  dial(phoneNumber: string): Promise<boolean> {
    return NativeEssentialsSettings.dial(phoneNumber);
  },

  /**
   * Open the default email client.
   */
  email(
    address: string,
    options: { subject?: string; body?: string } = {}
  ): Promise<boolean> {
    return NativeEssentialsSettings.email(address, options);
  },

  /**
   * Open the default SMS app.
   */
  sms(phoneNumber: string, options: { body?: string } = {}): Promise<boolean> {
    return NativeEssentialsSettings.sms(phoneNumber, options);
  },

  /**
   * Open the app's settings page in the system Settings app.
   * Useful for sending users to grant permissions.
   */
  openAppSettings(): Promise<boolean> {
    return NativeEssentialsSettings.openAppSettings();
  },

  /**
   * Open a specific system settings screen.
   *
   * ⚠️ PLATFORM DIFFERENCES:
   * - **Android**: Opens the exact screen requested.
   * - **iOS**: Apple only allows apps to open their own settings page.
   *   All values fall back to the app settings page.
   *
   * @param screen The settings screen to open.
   */
  openSettings(
    screen:
      | 'app'
      | 'notification'
      | 'location'
      | 'wifi'
      | 'bluetooth'
      | 'display'
      | 'sound'
      | 'battery'
      | 'apps'
      | 'nfc'
      | 'airplane'
  ): Promise<boolean> {
    return NativeEssentialsSettings.openSettings(screen);
  },
};

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export const Preferences = {
  /**
   * Read a string value from preferences.
   * Returns null if the key doesn't exist.
   *
   * ⚠️ NOT encrypted. Use SecureStorage for sensitive data.
   */
  get(key: string): Promise<string | null> {
    return NativeEssentialsSettings.preferencesGet(key);
  },

  /**
   * Write a string value to preferences.
   * Overwrites if the key already exists.
   */
  set(key: string, value: string): Promise<void> {
    return NativeEssentialsSettings.preferencesSet(key, value);
  },

  /**
   * Read a JSON-serializable object from preferences.
   * Returns null if the key doesn't exist or the stored value isn't valid JSON.
   */
  async getObject<T = any>(key: string): Promise<T | null> {
    const raw = await NativeEssentialsSettings.preferencesGet(key);
    if (raw === null) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Write a JSON-serializable object to preferences.
   * Internally serializes to a JSON string.
   */
  setObject(key: string, value: unknown): Promise<void> {
    return NativeEssentialsSettings.preferencesSet(key, JSON.stringify(value));
  },

  /**
   * Remove a key from preferences.
   */
  remove(key: string): Promise<void> {
    return NativeEssentialsSettings.preferencesRemove(key);
  },

  /**
   * Remove all keys from preferences.
   *
   * ⚠️ Clears ALL preferences for this app's library namespace.
   */
  clear(): Promise<void> {
    return NativeEssentialsSettings.preferencesClear();
  },

  /**
   * Check if a key exists in preferences.
   */
  has(key: string): Promise<boolean> {
    return NativeEssentialsSettings.preferencesHas(key);
  },
};

// ---------------------------------------------------------------------------
// SecureStorage
// ---------------------------------------------------------------------------

export type SecureStorageAccessibility =
  | 'whenUnlocked'
  | 'afterFirstUnlock'
  | 'whenUnlockedThisDeviceOnly'
  | 'afterFirstUnlockThisDeviceOnly';

export const SecureStorage = {
  /**
   * Read a value from secure storage.
   * Returns null if the key doesn't exist.
   *
   * ⚠️ Encrypted at rest. Slower than Preferences.
   */
  get(key: string): Promise<string | null> {
    return NativeEssentialsSettings.secureStorageGet(key);
  },

  /**
   * Write a value to secure storage.
   *
   * @param key The key to store under.
   * @param value The value to store.
   * @param accessibility iOS only. Defaults to 'whenUnlocked'. Ignored on Android.
   */
  set(
    key: string,
    value: string,
    accessibility: SecureStorageAccessibility = 'whenUnlocked'
  ): Promise<void> {
    return NativeEssentialsSettings.secureStorageSet(key, value, accessibility);
  },

  /**
   * Read a JSON-serializable object from secure storage.
   * Returns null if the key doesn't exist or the stored value isn't valid JSON.
   */
  async getObject<T = any>(key: string): Promise<T | null> {
    const raw = await NativeEssentialsSettings.secureStorageGet(key);
    if (raw === null) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Write a JSON-serializable object to secure storage.
   */
  setObject(
    key: string,
    value: unknown,
    accessibility: SecureStorageAccessibility = 'whenUnlocked'
  ): Promise<void> {
    return NativeEssentialsSettings.secureStorageSet(
      key,
      JSON.stringify(value),
      accessibility
    );
  },

  /**
   * Remove a key from secure storage.
   */
  remove(key: string): Promise<void> {
    return NativeEssentialsSettings.secureStorageRemove(key);
  },

  /**
   * Remove all keys from secure storage.
   *
   * ⚠️ Clears ALL secure storage for this app's library namespace.
   */
  clear(): Promise<void> {
    return NativeEssentialsSettings.secureStorageClear();
  },

  /**
   * Check if a key exists in secure storage.
   */
  has(key: string): Promise<boolean> {
    return NativeEssentialsSettings.secureStorageHas(key);
  },
};

// ---------------------------------------------------------------------------
// useBattery
// ---------------------------------------------------------------------------

export type BatteryInfo = {
  level: number;
  state: string;
};

/**
 * React hook — returns live battery info.
 * Updates whenever the battery level or charging state changes.
 *
 * @returns { level, state }
 *   - level: 0.0 to 1.0 (-1.0 if unknown)
 *   - state: 'charging' | 'full' | 'unplugged' | 'unknown'
 */
export function useBattery(): BatteryInfo {
  const [battery, setBattery] = useState<BatteryInfo>(() => ({
    level: NativeEssentialsSettings.getBatteryLevel(),
    state: NativeEssentialsSettings.getBatteryState(),
  }));

  useEffect(() => {
    const subscription = NativeEssentialsSettings.onBatteryChanged(
      (event: BatteryInfo) => {
        setBattery(event);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return battery;
}

// ---------------------------------------------------------------------------
// useNetworkState
// ---------------------------------------------------------------------------

export type NetworkQuality = 'offline' | 'poor' | 'fair' | 'good' | 'excellent';

export type NetworkStateInfo = {
  isConnected: boolean;
  type: string;
  generation: string | null;
  quality: NetworkQuality;
  qualityLabel: string;
  wifiStrength: number | null;
  wifiBars: number | null;
};

/**
 * React hook — returns live network state.
 * Updates whenever connectivity, type, or quality changes.
 */
export function useNetworkState(): NetworkStateInfo {
  const [state, setState] = useState<NetworkStateInfo>(() => ({
    isConnected: Network.isConnected(),
    type: Network.getConnectionType(),
    generation: Network.getCellularGeneration(),
    quality: 'fair',
    qualityLabel: 'Fair',
    wifiStrength: Network.getWifiSignalStrength(),
    wifiBars: Network.getWifiSignalLevel(),
  }));

  useEffect(() => {
    console.log('[useNetworkState] subscribing to onNetworkChanged');
    console.log(
      '[useNetworkState] onNetworkChanged type:',
      typeof (NativeEssentialsSettings as any).onNetworkChanged
    );

    const subscription = NativeEssentialsSettings.onNetworkChanged(
      (event: NetworkStateInfo) => {
        console.log('[useNetworkState] EVENT RECEIVED:', event);
        setState(event);
      }
    );

    return () => {
      console.log('[useNetworkState] unsubscribing');
      subscription.remove();
    };
  }, []);

  return state;
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default NativeEssentialsSettings;
