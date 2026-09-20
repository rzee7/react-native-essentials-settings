import { useState, useEffect } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import {
  Clipboard,
  Device,
  Display,
  Haptics,
  Launcher,
  Locale,
  Network,
  Share,
  useColorScheme,
  useFontScale,
  useOrientation,
  Preferences,
  SecureStorage,
  useBattery,
  useNetworkState,
} from 'react-native-essentials-settings';

export default function App() {
  const scheme = useColorScheme();
  const fontScale = useFontScale();
  const orientation = useOrientation();
  const battery = useBattery();
  const networkState = useNetworkState();

  const isDark = scheme === 'dark';

  const [quality, setQuality] = useState<string>('—');
  const [measuring, setMeasuring] = useState(false);
  const [uniqueId, setUniqueId] = useState<string>('—');
  const [clipboardValue, setClipboardValue] = useState<string>('—');
  const [prefValue, setPrefValue] = useState<string>('—');
  const [secureValue, setSecureValue] = useState<string>('—');

  useEffect(() => {
    Device.getUniqueId()
      .then((id) => setUniqueId(id.slice(0, 16) + '…'))
      .catch((e) => setUniqueId(`error: ${String(e)}`));
  }, []);

  const runMeasure = async () => {
    setMeasuring(true);
    setQuality('measuring…');
    try {
      const result = await Network.measureQuality();
      setQuality(
        `${result.tier} (${result.score}) · ${Math.round(
          result.latencyMs
        )}ms · ${result.downloadMbps.toFixed(1)}Mbps`
      );
    } catch (e) {
      setQuality(`error: ${String(e)}`);
    } finally {
      setMeasuring(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, isDark && styles.containerDark]}
    >
      <Section title="Appearance" isDark={isDark} />
      <Row label="Color Scheme" value={scheme} isDark={isDark} />
      <Row label="Font Scale" value={fontScale.toFixed(2)} isDark={isDark} />

      <Section title="Display" isDark={isDark} />
      <Row
        label="Width"
        value={`${Display.getWidth().toFixed(0)} dp`}
        isDark={isDark}
      />
      <Row
        label="Height"
        value={`${Display.getHeight().toFixed(0)} dp`}
        isDark={isDark}
      />
      <Row
        label="Scale"
        value={Display.getScale().toFixed(2)}
        isDark={isDark}
      />
      <Row label="Orientation" value={orientation} isDark={isDark} />
      <Row label="Size" value={Display.getSize()} isDark={isDark} />

      <Section title="Locale — Identity" isDark={isDark} />
      <Row label="Locale" value={Locale.getLocale()} isDark={isDark} />
      <Row label="Language" value={Locale.getLanguage()} isDark={isDark} />
      <Row label="Country" value={Locale.getCountry()} isDark={isDark} />
      <Row label="isRTL" value={String(Locale.isRTL())} isDark={isDark} />
      <Row label="Time Zone" value={Locale.getTimeZone()} isDark={isDark} />

      <Section title="Locale — Preferences" isDark={isDark} />
      <Row
        label="Metric System"
        value={String(Locale.usesMetricSystem())}
        isDark={isDark}
      />
      <Row label="Currency" value={Locale.getCurrencyCode()} isDark={isDark} />
      <Row
        label="24-Hour Clock"
        value={String(Locale.uses24HourClock())}
        isDark={isDark}
      />
      <Row label="Calendar" value={Locale.getCalendar()} isDark={isDark} />
      <Row
        label="Decimal Sep."
        value={`"${Locale.getDecimalSeparator()}"`}
        isDark={isDark}
      />
      <Row
        label="Temperature"
        value={Locale.getTemperatureUnit()}
        isDark={isDark}
      />

      <Section title="Network" isDark={isDark} />
      <Row
        label="Connected"
        value={String(Network.isConnected())}
        isDark={isDark}
      />
      <Row label="Type" value={Network.getConnectionType()} isDark={isDark} />
      <Row
        label="Live Quality"
        value={networkState.qualityLabel}
        isDark={isDark}
      />
      <Row label="Live Tier" value={networkState.quality} isDark={isDark} />
      <Row
        label="Generation"
        value={Network.getCellularGeneration() ?? '—'}
        isDark={isDark}
      />
      <Row
        label="WiFi RSSI"
        value={String(Network.getWifiSignalStrength() ?? '—')}
        isDark={isDark}
      />
      <Row
        label="WiFi Bars"
        value={String(Network.getWifiSignalLevel() ?? '—')}
        isDark={isDark}
      />
      <Row
        label="WiFi Speed"
        value={String(Network.getWifiLinkSpeed() ?? '—')}
        isDark={isDark}
      />

      <Pressable
        onPress={runMeasure}
        disabled={measuring}
        style={[
          styles.button,
          isDark && styles.buttonDark,
          measuring && styles.buttonDisabled,
        ]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          {measuring ? 'Measuring…' : 'Measure Quality'}
        </Text>
      </Pressable>
      <Row label="Quality" value={quality} isDark={isDark} />

      <Section title="Device — App" isDark={isDark} />
      <Row label="App Version" value={Device.getAppVersion()} isDark={isDark} />
      <Row
        label="Build Number"
        value={Device.getBuildNumber()}
        isDark={isDark}
      />
      <Row label="Bundle ID" value={Device.getBundleId()} isDark={isDark} />
      <Row
        label="App Name"
        value={Device.getApplicationName()}
        isDark={isDark}
      />

      <Section title="Device — Hardware" isDark={isDark} />
      <Row label="Device Name" value={Device.getDeviceName()} isDark={isDark} />
      <Row
        label="System"
        value={`${Device.getSystemName()} ${Device.getSystemVersion()}`}
        isDark={isDark}
      />
      <Row label="Model" value={Device.getModel()} isDark={isDark} />
      <Row
        label="Emulator"
        value={String(Device.isEmulator())}
        isDark={isDark}
      />
      <Row
        label="Headphones"
        value={String(Device.isHeadphonesConnected())}
        isDark={isDark}
      />

      <Section title="Device — Battery" isDark={isDark} />
      <Row
        label="Level"
        value={
          Device.getBatteryLevel() >= 0
            ? `${Math.round(Device.getBatteryLevel() * 100)}%`
            : '—'
        }
        isDark={isDark}
      />
      <Row label="State" value={Device.getBatteryState()} isDark={isDark} />

      <Row
        label="Live Level"
        value={battery.level >= 0 ? `${Math.round(battery.level * 100)}%` : '—'}
        isDark={isDark}
      />
      <Row label="Live State" value={battery.state} isDark={isDark} />

      <Section title="Device — Persistent ID" isDark={isDark} />
      <Row label="Unique ID" value={uniqueId} isDark={isDark} />

      <Section title="Launcher" isDark={isDark} />
      <Pressable
        onPress={() => Launcher.openURL('https://reactnative.dev')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Open URL
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Launcher.dial('+919876543210')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Dial Number
        </Text>
      </Pressable>
      <Pressable
        onPress={() =>
          Launcher.email('hi@example.com', {
            subject: 'Hello',
            body: 'Sent from react-native-essentials-settings',
          })
        }
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Send Email
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Launcher.sms('+919876543210', { body: 'Hi there!' })}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Send SMS
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Launcher.openAppSettings()}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Open App Settings
        </Text>
      </Pressable>

      <Pressable
        onPress={() => Launcher.openSettings('notification')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Open Notification Settings
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Launcher.openSettings('location')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Open Location Settings
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Launcher.openSettings('wifi')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Open Wi-Fi Settings
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Launcher.openSettings('bluetooth')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Open Bluetooth Settings
        </Text>
      </Pressable>

      <Section title="Haptics" isDark={isDark} />
      <Pressable
        onPress={() => Haptics.impact('light')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Impact Light
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Haptics.impact('medium')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Impact Medium
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Haptics.impact('heavy')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Impact Heavy
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Haptics.notification('success')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Notification Success
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Haptics.notification('error')}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Notification Error
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Haptics.selection()}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Selection
        </Text>
      </Pressable>
      <Pressable
        onPress={() => Haptics.vibrate()}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Vibrate (Android only)
        </Text>
      </Pressable>

      <Section title="Preferences" isDark={isDark} />
      <Pressable
        onPress={async () => {
          await Preferences.set('demo_key', `value_${Date.now()}`);
          setPrefValue('set ✓');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Set String
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          const value = await Preferences.get('demo_key');
          setPrefValue(value ?? '(missing)');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Get String
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await Preferences.setObject('demo_object', {
            name: 'Riyaz',
            ts: Date.now(),
          });
          setPrefValue('object set ✓');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Set Object
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          const obj = await Preferences.getObject<{ name: string; ts: number }>(
            'demo_object'
          );
          setPrefValue(obj ? JSON.stringify(obj) : '(missing)');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Get Object
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          const exists = await Preferences.has('demo_key');
          setPrefValue(`has: ${exists}`);
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Has Key
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await Preferences.clear();
          setPrefValue('cleared ✓');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Clear All
        </Text>
      </Pressable>
      <Row label="Value" value={prefValue} isDark={isDark} />

      <Section title="Secure Storage" isDark={isDark} />
      <Pressable
        onPress={async () => {
          await SecureStorage.set('demo_token', `token_${Date.now()}`);
          setSecureValue('set ✓');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Set Token
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          const value = await SecureStorage.get('demo_token');
          setSecureValue(value ?? '(missing)');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Get Token
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await SecureStorage.setObject(
            'demo_secure_object',
            { user: 'Riyaz', ts: Date.now() },
            'afterFirstUnlock'
          );
          setSecureValue('object set ✓');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Set Object (afterFirstUnlock)
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          const obj = await SecureStorage.getObject<{
            user: string;
            ts: number;
          }>('demo_secure_object');
          setSecureValue(obj ? JSON.stringify(obj) : '(missing)');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Get Object
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          const exists = await SecureStorage.has('demo_token');
          setSecureValue(`has: ${exists}`);
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Has Token
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await SecureStorage.clear();
          setSecureValue('cleared ✓');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Clear All
        </Text>
      </Pressable>
      <Row label="Value" value={secureValue} isDark={isDark} />

      <Section title="Share" isDark={isDark} />
      <Pressable
        onPress={async () => {
          try {
            await Share.share({
              message: 'Hello from react-native-essentials-settings',
              url: 'https://github.com/rzee7/react-native-essentials-settings',
            });
          } catch (e) {
            // ignored
          }
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Share Text + Link
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          try {
            await Share.share({ url: 'https://reactnative.dev' });
          } catch (e) {
            // ignored
          }
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Share URL Only
        </Text>
      </Pressable>

      <Section title="Clipboard" isDark={isDark} />
      <Pressable
        onPress={async () => {
          await Clipboard.setString(`Hello from ${Date.now()}`);
          setClipboardValue('set ✓');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Copy to Clipboard
        </Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          const text = await Clipboard.getString();
          setClipboardValue(text || '(empty)');
        }}
        style={[styles.button, isDark && styles.buttonDark]}
      >
        <Text style={[styles.buttonText, isDark && styles.textDark]}>
          Read Clipboard
        </Text>
      </Pressable>
      <Row label="Value" value={clipboardValue} isDark={isDark} />

      <Text style={[styles.hint, isDark && styles.textMutedDark]}>
        Color scheme updates live. Font scale updates on reload (iOS) or live
        (Android). Network measurement uses real data — use sparingly.
      </Text>
    </ScrollView>
  );
}

function Section({ title, isDark }: { title: string; isDark: boolean }) {
  return (
    <Text
      style={[
        styles.sectionTitle,
        isDark && styles.textMutedDark,
        styles.spacer,
      ]}
    >
      {title}
    </Text>
  );
}

function Row({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, isDark && styles.textMutedDark]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, isDark && styles.textDark]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    flexGrow: 1,
  },
  containerDark: { backgroundColor: '#000000' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  spacer: { marginTop: 32 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: '#666666',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  textDark: { color: '#ffffff' },
  textMutedDark: { color: '#888888' },
  button: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDark: { backgroundColor: '#222222' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  hint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 40,
    textAlign: 'center',
    lineHeight: 18,
  },
});
