# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Released]

## [0.7.0] — 2026-09-20

### Added

- **Live event emitters** on iOS and Android
  - `onBatteryChanged` — fires when battery level or charging state changes
  - `onNetworkChanged` — fires when connectivity, type, or signal changes
- **`useBattery()` hook** — live battery level and charging state
- **`useNetworkState()` hook** — live network state with derived quality tier
  - `quality`: `'offline' | 'poor' | 'fair' | 'good' | 'excellent'`
  - `qualityLabel`: `'Offline' | 'Slow' | 'Fair' | 'Fast' | 'Very fast'`
  - Includes connection type, cellular generation, Wi-Fi strength, and bars
- **`useAppState()` hook** — live app state (`active` / `background` / `inactive`)
- **`useKeyboard()` hook** — keyboard visibility and height
- **`useOrientation()` hook** — live orientation (`portrait` / `landscape`)

### Changed

- **Android event emitter fix** — removed the shadowed `mEventEmitterCallback`
  field from the Kotlin module. The base class field is now used, which fixes
  the null-callback crash on API 30+.
- **iOS observer lifecycle fix** — `startObserving` and `stopObserving` are now
  called via `initialize` / `dealloc` on the module, since the module no longer
  inherits from `RCTEventEmitter`.

### Fixed

- iOS network events now fire correctly in the New Architecture
- Android network events no longer crash with `NullPointerException` on
  `emitOnNetworkChanged`
- `getCellularGeneration()` wraps `SecurityException` on Android 11+ and
  returns `null` when `READ_PHONE_STATE` is not granted

## [0.6.2] — 2026-09-19

### Added

- **SecureStorage** namespace — encrypted key-value storage
  - iOS: Keychain-backed, with configurable accessibility
  - Android: `EncryptedSharedPreferences`
  - Includes `getObject` / `setObject` helpers
- **Preferences** namespace — plain key-value storage
  - `get`, `set`, `remove`, `clear`, `has`
  - Includes `getObject` / `setObject` helpers
- **Haptics** namespace — `impact`, `notification`, `selection`, `vibrate`
- **Launcher** namespace — `openURL`, `dial`, `email`, `sms`, `openSettings`
- **Device** namespace — app info, hardware info, battery, persistent ID
- **Display** namespace — width, height, scale, orientation, size
- **Demo screenshots** in the README

### Fixed

- Android `EncryptedSharedPreferences` now recovers from device migration
  (backup restored on a new device) instead of crashing
- Wi-Fi permissions documented for Android 13+ (`NEARBY_WIFI_DEVICES`)

## [0.6.0] — 2026-09-18

### Added

- Initial public release
- **Appearance** namespace — color scheme, font scale
- **Locale** namespace — language, country, RTL, time zone, currency,
  calendar, temperature unit
- **Network** namespace — connectivity, cellular generation, Wi-Fi signal,
  latency and speed measurement
- **Clipboard** namespace — `getString`, `setString`, `hasString`
- **Share** namespace — native share sheet
- Turbo Module for the New Architecture
- Full TypeScript types
- Yarn 4 monorepo structure with example app
