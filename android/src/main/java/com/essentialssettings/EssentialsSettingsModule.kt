package com.essentialssettings

import com.facebook.react.bridge.ReactApplicationContext

class EssentialsSettingsModule(reactContext: ReactApplicationContext) :
  NativeEssentialsSettingsSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeEssentialsSettingsSpec.NAME
  }
}
