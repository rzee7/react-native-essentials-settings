#import "EssentialsSettings.h"
#import <UIKit/UIKit.h>
#import "Network/Network.h"
#import "CoreTelephony/CTTelephonyNetworkInfo.h"
#import "CoreTelephony/CTCarrier.h"
#import <AVFoundation/AVFoundation.h>
#import <sys/sysctl.h>
#import "Network/Network.h"
#import <CommonCrypto/CommonCrypto.h>
#import <ifaddrs.h>
#import <arpa/inet.h>

@interface EssentialsSettings () <NativeEssentialsSettingsSpec>
@end

@implementation EssentialsSettings

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"colorSchemeChanged"];
}

- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleTraitChange)
                                               name:@"RCTUserInterfaceStyleDidChangeNotification"
                                             object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)handleTraitChange
{
  [self sendEventWithName:@"colorSchemeChanged"
                     body:@{@"colorScheme": [self getColorScheme]}];
}

- (NSString *)getColorScheme
{
  UITraitCollection *traits = nil;

  if (@available(iOS 13.0, *)) {
    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
      if ([scene isKindOfClass:[UIWindowScene class]]) {
        UIWindowScene *windowScene = (UIWindowScene *)scene;
        for (UIWindow *window in windowScene.windows) {
          if (window.isKeyWindow) {
            traits = window.traitCollection;
            break;
          }
        }
      }
    }
  }

  if (traits == nil) {
    traits = [UITraitCollection currentTraitCollection];
  }

  switch (traits.userInterfaceStyle) {
    case UIUserInterfaceStyleDark:
      return @"dark";
    case UIUserInterfaceStyleLight:
      return @"light";
    case UIUserInterfaceStyleUnspecified:
    default:
      return @"unspecified";
  }
}

- (NSNumber *)getFontScale
{
  CGFloat scale = [[UIFontMetrics defaultMetrics] scaledValueForValue:1.0];
  return @(scale);
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

- (NSNumber *)getDisplayWidth
{
  CGRect screenBounds = [UIScreen mainScreen].bounds;
  return @(screenBounds.size.width);
}

- (NSNumber *)getDisplayHeight
{
  CGRect screenBounds = [UIScreen mainScreen].bounds;
  return @(screenBounds.size.height);
}

- (NSNumber *)getDisplayScale
{
  return @([UIScreen mainScreen].scale);
}

- (NSString *)getDisplayOrientation
{
  if (@available(iOS 13.0, *)) {
    UIInterfaceOrientation orientation = UIInterfaceOrientationUnknown;

    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
      if ([scene isKindOfClass:[UIWindowScene class]]) {
        UIWindowScene *windowScene = (UIWindowScene *)scene;
        orientation = windowScene.interfaceOrientation;
        break;
      }
    }

    if (orientation == UIInterfaceOrientationLandscapeLeft ||
        orientation == UIInterfaceOrientationLandscapeRight) {
      return @"landscape";
    }
    return @"portrait";
  }

  // Fallback for iOS 12 and earlier
  UIInterfaceOrientation orientation = UIApplication.sharedApplication.statusBarOrientation;
  if (UIInterfaceOrientationIsLandscape(orientation)) {
    return @"landscape";
  }
  return @"portrait";
}

- (NSString *)getDisplaySize
{
  // iOS doesn't have an Android-style screen size category.
  // Derive it from the screen's diagonal in inches.
  CGRect bounds = [UIScreen mainScreen].bounds;
  CGFloat scale = [UIScreen mainScreen].scale;
  CGFloat widthInches = (bounds.size.width * scale) / 163.0; // approximate PPI
  CGFloat heightInches = (bounds.size.height * scale) / 163.0;
  CGFloat diagonal = sqrt(widthInches * widthInches + heightInches * heightInches);

  if (diagonal < 4.0) {
    return @"small";
  } else if (diagonal < 6.0) {
    return @"normal";
  } else if (diagonal < 8.0) {
    return @"large";
  }
  return @"xlarge";
}

- (NSString *)getLocale
{
  return [NSLocale currentLocale].localeIdentifier;
}

- (NSString *)getLanguage
{
  return [NSLocale currentLocale].languageCode ?: @"";
}

- (NSString *)getCountry
{
  return [NSLocale currentLocale].countryCode ?: @"";
}

- (NSNumber *)isRTL
{
  if (@available(iOS 9.0, *)) {
    return @(UIApplication.sharedApplication.userInterfaceLayoutDirection ==
             UIUserInterfaceLayoutDirectionRightToLeft);
  }
  return @(NO);
}

- (NSString *)getTimeZone
{
  return [NSTimeZone localTimeZone].name;
}

- (NSNumber *)usesMetricSystem
{
  NSLocale *locale = [NSLocale currentLocale];
  NSNumber *usesMetric = [locale objectForKey:NSLocaleUsesMetricSystem];
  return usesMetric ?: @(NO);
}

- (NSString *)getCurrencyCode
{
  NSLocale *locale = [NSLocale currentLocale];
  return [locale objectForKey:NSLocaleCurrencyCode] ?: @"";
}

- (NSNumber *)uses24HourClock
{
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  [formatter setLocale:[NSLocale currentLocale]];
  [formatter setDateStyle:NSDateFormatterNoStyle];
  [formatter setTimeStyle:NSDateFormatterShortStyle];
  NSString *format = [formatter dateFormat];
  return @([format rangeOfString:@"H"].location != NSNotFound ||
           [format rangeOfString:@"k"].location != NSNotFound);
}

- (NSString *)getCalendar
{
  NSCalendar *calendar = [NSCalendar currentCalendar];
  return calendar.calendarIdentifier ?: @"gregorian";
}

- (NSString *)getDecimalSeparator
{
  NSLocale *locale = [NSLocale currentLocale];
  return [locale objectForKey:NSLocaleDecimalSeparator] ?: @".";
}

- (NSString *)getTemperatureUnit
{
  // Public API, iOS 16+
  if (@available(iOS 16.0, *)) {
    NSMeasurementFormatter *formatter = [[NSMeasurementFormatter alloc] init];
    NSMeasurement *measurement = [[NSMeasurement alloc] initWithDoubleValue:0.0
                                                                       unit:[NSUnitTemperature celsius]];
    NSString *formatted = [formatter stringFromMeasurement:measurement];
    return [formatted containsString:@"F"] ? @"fahrenheit" : @"celsius";
  }

  // Fallback for iOS 15 and earlier: use the metric system as heuristic
  NSNumber *usesMetric = [[NSLocale currentLocale] objectForKey:NSLocaleUsesMetricSystem];
  return [usesMetric boolValue] ? @"celsius" : @"fahrenheit";
}

// ---------------------------------------------------------------------------
// Network — connectivity
// ---------------------------------------------------------------------------

- (NSNumber *)isConnected
{
  if (@available(iOS 12.0, *)) {
    nw_path_monitor_t monitor = nw_path_monitor_create();
    __block BOOL connected = NO;
    dispatch_semaphore_t sema = dispatch_semaphore_create(0);

    nw_path_monitor_set_update_handler(monitor, ^(nw_path_t path) {
      connected = (nw_path_get_status(path) == nw_path_status_satisfied);
      dispatch_semaphore_signal(sema);
    });

    nw_path_monitor_set_queue(monitor, dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0));
    nw_path_monitor_start(monitor);

    dispatch_semaphore_wait(sema, dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC));
    nw_path_monitor_cancel(monitor);

    return @(connected);
  }
  return @(NO);
}

- (NSString *)getConnectionType
{
  if (@available(iOS 12.0, *)) {
    nw_path_monitor_t monitor = nw_path_monitor_create();
    __block NSString *type = @"unknown";
    dispatch_semaphore_t sema = dispatch_semaphore_create(0);

    nw_path_monitor_set_update_handler(monitor, ^(nw_path_t path) {
      if (nw_path_get_status(path) == nw_path_status_satisfied) {
        if (nw_path_uses_interface_type(path, nw_interface_type_wifi)) {
          type = @"wifi";
        } else if (nw_path_uses_interface_type(path, nw_interface_type_cellular)) {
          type = @"cellular";
        } else if (nw_path_uses_interface_type(path, nw_interface_type_wired)) {
          type = @"ethernet";
        } else {
          type = @"unknown";
        }
      } else {
        type = @"none";
      }
      dispatch_semaphore_signal(sema);
    });

    nw_path_monitor_set_queue(monitor, dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0));
    nw_path_monitor_start(monitor);

    dispatch_semaphore_wait(sema, dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC));
    nw_path_monitor_cancel(monitor);

    return type;
  }
  return @"unknown";
}

- (NSString *)getCellularGeneration
{
  if (@available(iOS 12.0, *)) {
    CTTelephonyNetworkInfo *info = [[CTTelephonyNetworkInfo alloc] init];
    NSDictionary<NSString *, NSString *> *technologies = info.serviceCurrentRadioAccessTechnology;

    if (technologies.count == 0) {
      return nil;
    }

    for (NSString *tech in technologies.allValues) {
      if ([tech isEqualToString:CTRadioAccessTechnologyNR] ||
          [tech isEqualToString:CTRadioAccessTechnologyNRNSA]) {
        return @"5g";
      }
      if ([tech isEqualToString:CTRadioAccessTechnologyLTE]) {
        return @"4g";
      }
      if ([tech isEqualToString:CTRadioAccessTechnologyWCDMA] ||
          [tech isEqualToString:CTRadioAccessTechnologyHSDPA] ||
          [tech isEqualToString:CTRadioAccessTechnologyHSUPA] ||
          [tech isEqualToString:CTRadioAccessTechnologyCDMA1x] ||
          [tech isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
          [tech isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
          [tech isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
          [tech isEqualToString:CTRadioAccessTechnologyeHRPD]) {
        return @"3g";
      }
      if ([tech isEqualToString:CTRadioAccessTechnologyGPRS] ||
          [tech isEqualToString:CTRadioAccessTechnologyEdge]) {
        return @"2g";
      }
    }
  }
  return nil;
}

// ---------------------------------------------------------------------------
// Network — Wi-Fi signal (Android only; iOS returns nil)
// ---------------------------------------------------------------------------

- (NSNumber *)getWifiSignalStrength
{
  // iOS does not expose Wi-Fi signal strength to third-party apps.
  return nil;
}

- (NSNumber *)getWifiSignalLevel
{
  return nil;
}

- (NSNumber *)getWifiLinkSpeed
{
  return nil;
}

// ---------------------------------------------------------------------------
// Network — measurement (async)
// ---------------------------------------------------------------------------

- (void)measureLatency:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  // Use a tiny endpoint that responds fast. Google's generate_204 is a classic.
  NSURL *url = [NSURL URLWithString:@"https://www.google.com/generate_204"];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  request.HTTPMethod = @"HEAD";
  request.timeoutInterval = 5.0;
  request.cachePolicy = NSURLRequestReloadIgnoringLocalCacheData;

  NSDate *start = [NSDate date];

  NSURLSessionDataTask *task = [[NSURLSession sharedSession]
    dataTaskWithRequest:request
      completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error) {
          reject(@"latency_error", error.localizedDescription, error);
          return;
        }
        NSTimeInterval elapsed = [[NSDate date] timeIntervalSinceDate:start];
        resolve(@(elapsed * 1000.0)); // ms
      }];

  [task resume];
}

- (void)measureDownloadSpeed:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
  // Download a known-size file. 100 KB is enough for a quick sample.
  NSURL *url = [NSURL URLWithString:@"https://speed.cloudflare.com/__down?bytes=100000"];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  request.timeoutInterval = 10.0;
  request.cachePolicy = NSURLRequestReloadIgnoringLocalCacheData;

  NSDate *start = [NSDate date];

  NSURLSessionDataTask *task = [[NSURLSession sharedSession]
    dataTaskWithRequest:request
      completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error) {
          reject(@"speed_error", error.localizedDescription, error);
          return;
        }
        NSTimeInterval elapsed = [[NSDate date] timeIntervalSinceDate:start];
        if (elapsed <= 0) {
          resolve(@(0));
          return;
        }
        double bytes = (double)data.length;
        double bits = bytes * 8.0;
        double mbps = (bits / elapsed) / 1000000.0;
        resolve(@(mbps));
      }];

  [task resume];
}

- (void)measurePacketLoss:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  // Approximate: fire 5 small HEAD requests, count failures.
  const int totalPings = 5;
  __block int failures = 0;
  __block int completed = 0;

  NSURL *url = [NSURL URLWithString:@"https://www.google.com/generate_204"];

  for (int i = 0; i < totalPings; i++) {
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    request.HTTPMethod = @"HEAD";
    request.timeoutInterval = 3.0;
    request.cachePolicy = NSURLRequestReloadIgnoringLocalCacheData;

    NSURLSessionDataTask *task = [[NSURLSession sharedSession]
      dataTaskWithRequest:request
        completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
          if (error) {
            failures++;
          }
          completed++;
          if (completed == totalPings) {
            double lossPercent = ((double)failures / (double)totalPings) * 100.0;
            resolve(@(lossPercent));
          }
        }];

    [task resume];
  }
}

- (void)measureQuality:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  // Run latency + speed + loss in parallel, combine into a score.
  dispatch_group_t group = dispatch_group_create();
  __block double latencyMs = -1;
  __block double downloadMbps = -1;
  __block double packetLossPercent = -1;

  dispatch_group_enter(group);
  [self measureLatency:^(id result) {
    if ([result isKindOfClass:[NSNumber class]]) {
      latencyMs = [result doubleValue];
    }
    dispatch_group_leave(group);
  } reject:^(NSString *code, NSString *msg, NSError *err) {
    dispatch_group_leave(group);
  }];

  dispatch_group_enter(group);
  [self measureDownloadSpeed:^(id result) {
    if ([result isKindOfClass:[NSNumber class]]) {
      downloadMbps = [result doubleValue];
    }
    dispatch_group_leave(group);
  } reject:^(NSString *code, NSString *msg, NSError *err) {
    dispatch_group_leave(group);
  }];

  dispatch_group_enter(group);
  [self measurePacketLoss:^(id result) {
    if ([result isKindOfClass:[NSNumber class]]) {
      packetLossPercent = [result doubleValue];
    }
    dispatch_group_leave(group);
  } reject:^(NSString *code, NSString *msg, NSError *err) {
    dispatch_group_leave(group);
  }];

  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    // Score: 0-100. Higher is better.
    double latencyScore = latencyMs < 0 ? 0 : MAX(0, 100 - (latencyMs / 5.0));
    double speedScore = downloadMbps < 0 ? 0 : MIN(100, downloadMbps * 2.0);
    double lossScore = packetLossPercent < 0 ? 0 : MAX(0, 100 - (packetLossPercent * 5.0));

    double score = (latencyScore * 0.4) + (speedScore * 0.4) + (lossScore * 0.2);

    NSString *tier;
    if (score >= 80) {
      tier = @"excellent";
    } else if (score >= 60) {
      tier = @"good";
    } else if (score >= 40) {
      tier = @"fair";
    } else if (score >= 10) {
      tier = @"poor";
    } else {
      tier = @"offline";
    }

    resolve(@{
      @"latencyMs": @(latencyMs),
      @"downloadMbps": @(downloadMbps),
      @"packetLossPercent": @(packetLossPercent),
      @"score": @(round(score)),
      @"tier": tier,
    });
  });
}

// ---------------------------------------------------------------------------
// Device — App Information
// ---------------------------------------------------------------------------

- (NSString *)getAppVersion
{
  NSString *version = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  return version ?: @"";
}

- (NSString *)getBuildNumber
{
  NSString *build = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
  return build ?: @"";
}

- (NSString *)getBundleId
{
  NSString *bundleId = [[NSBundle mainBundle] bundleIdentifier];
  return bundleId ?: @"";
}

- (NSString *)getApplicationName
{
  NSString *name = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
  if (!name) {
    name = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleName"];
  }
  return name ?: @"";
}

// ---------------------------------------------------------------------------
// Device — Hardware
// ---------------------------------------------------------------------------

- (NSString *)getDeviceName
{
  return [UIDevice currentDevice].name ?: @"";
}

- (NSString *)getSystemName
{
  return [UIDevice currentDevice].systemName ?: @"";
}

- (NSString *)getSystemVersion
{
  return [UIDevice currentDevice].systemVersion ?: @"";
}

- (NSString *)getModel
{
  // Returns hardware identifier like "iPhone17,1"
  size_t size;
  sysctlbyname("hw.machine", NULL, &size, NULL, 0);
  char *machine = (char *)malloc(size);
  sysctlbyname("hw.machine", machine, &size, NULL, 0);
  NSString *model = [NSString stringWithUTF8String:machine];
  free(machine);
  return model ?: @"";
}

- (NSNumber *)isEmulator
{
#if TARGET_OS_SIMULATOR
  return @(YES);
#else
  return @(NO);
#endif
}

- (NSNumber *)isHeadphonesConnected
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  AVAudioSessionRouteDescription *route = session.currentRoute;

  for (AVAudioSessionPortDescription *output in route.outputs) {
    if ([output.portType isEqualToString:AVAudioSessionPortHeadphones] ||
        [output.portType isEqualToString:AVAudioSessionPortBluetoothA2DP] ||
        [output.portType isEqualToString:AVAudioSessionPortBluetoothHFP] ||
        [output.portType isEqualToString:AVAudioSessionPortBluetoothLE]) {
      return @(YES);
    }
  }
  return @(NO);
}

// ---------------------------------------------------------------------------
// Device — Battery
// ---------------------------------------------------------------------------

- (NSNumber *)getBatteryLevel
{
  [UIDevice currentDevice].batteryMonitoringEnabled = YES;
  float level = [UIDevice currentDevice].batteryLevel;

  // batteryLevel returns -1.0 if monitoring is disabled or unavailable
  return @(level);
}

- (NSString *)getBatteryState
{
  [UIDevice currentDevice].batteryMonitoringEnabled = YES;

  switch ([UIDevice currentDevice].batteryState) {
    case UIDeviceBatteryStateCharging:
      return @"charging";
    case UIDeviceBatteryStateFull:
      return @"full";
    case UIDeviceBatteryStateUnplugged:
      return @"unplugged";
    case UIDeviceBatteryStateUnknown:
    default:
      return @"unknown";
  }
}

// ---------------------------------------------------------------------------
// Device — Persistent ID (Keychain-backed)
// ---------------------------------------------------------------------------

- (void)getUniqueId:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  NSString *service = @"com.essentialssettings.uniqueid";
  NSString *account = @"device";

  // Try to read existing ID from Keychain
  NSMutableDictionary *query = [NSMutableDictionary dictionary];
  query[(__bridge id)kSecClass] = (__bridge id)kSecClassGenericPassword;
  query[(__bridge id)kSecAttrService] = service;
  query[(__bridge id)kSecAttrAccount] = account;
  query[(__bridge id)kSecReturnData] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;

  CFTypeRef dataTypeRef = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &dataTypeRef);

  NSString *rawId = nil;

  if (status == errSecSuccess && dataTypeRef != NULL) {
    NSData *data = (__bridge_transfer NSData *)dataTypeRef;
    rawId = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  }

  // If not found, generate a new UUID and store it
  if (rawId == nil) {
    rawId = [[NSUUID UUID] UUIDString];

    NSMutableDictionary *saveQuery = [NSMutableDictionary dictionary];
    saveQuery[(__bridge id)kSecClass] = (__bridge id)kSecClassGenericPassword;
    saveQuery[(__bridge id)kSecAttrService] = service;
    saveQuery[(__bridge id)kSecAttrAccount] = account;
    saveQuery[(__bridge id)kSecValueData] = [rawId dataUsingEncoding:NSUTF8StringEncoding];
    saveQuery[(__bridge id)kSecAttrAccessible] = (__bridge id)kSecAttrAccessibleAfterFirstUnlock;

    SecItemAdd((__bridge CFDictionaryRef)saveQuery, NULL);
  }

  // Hash with SHA-256 for privacy
  NSData *inputData = [rawId dataUsingEncoding:NSUTF8StringEncoding];
  unsigned char hash[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(inputData.bytes, (CC_LONG)inputData.length, hash);
  NSMutableString *hex = [NSMutableString stringWithCapacity:CC_SHA256_DIGEST_LENGTH * 2];
  for (int i = 0; i < CC_SHA256_DIGEST_LENGTH; i++) {
    [hex appendFormat:@"%02x", hash[i]];
  }

  resolve([hex copy]);
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

- (void)getClipboardString:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
    NSString *text = pasteboard.string ?: @"";
    resolve(text);
  });
}

- (void)setClipboardString:(NSString *)text
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
    pasteboard.string = text ?: @"";
    resolve(nil);
  });
}

- (void)hasClipboardString:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
    resolve(@(pasteboard.hasStrings));
  });
}

// ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------

- (void)share:(JS::NativeEssentialsSettings::SpecShareOptions &)options
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject
{
   NSString *message = options.message() ?: nil;
  NSString *urlString = options.url() ?: nil;

  NSMutableArray *items = [NSMutableArray array];
  if (message) [items addObject:message];
  if (urlString) {
    NSURL *url = [NSURL URLWithString:urlString];
    if (url) [items addObject:url];
  }

  if (items.count == 0) {
    reject(@"share_error", @"No message or url provided", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    UIActivityViewController *activityVC =
      [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];

    UIViewController *rootVC = UIApplication.sharedApplication.keyWindow.rootViewController;
    if (!rootVC) {
      reject(@"share_error", @"No root view controller", nil);
      return;
    }

    // iPad requires a popover anchor
    if (activityVC.popoverPresentationController) {
      activityVC.popoverPresentationController.sourceView = rootVC.view;
      activityVC.popoverPresentationController.sourceRect = CGRectMake(
        rootVC.view.bounds.size.width / 2,
        rootVC.view.bounds.size.height / 2,
        0, 0
      );
      activityVC.popoverPresentationController.permittedArrowDirections = 0;
    }

    activityVC.completionWithItemsHandler = ^(UIActivityType activityType, BOOL completed, NSArray *returnedItems, NSError *error) {
      if (error) {
        reject(@"share_error", error.localizedDescription, error);
        return;
      }
      resolve(@(completed));
    };

    [rootVC presentViewController:activityVC animated:YES completion:nil];
  });
}

// ---------------------------------------------------------------------------
// Haptics
// ---------------------------------------------------------------------------

- (void)hapticImpact:(NSString *)style
{
  if (@available(iOS 10.0, *)) {
    UIImpactFeedbackStyle feedbackStyle = UIImpactFeedbackStyleMedium;

    if ([style isEqualToString:@"light"]) {
      feedbackStyle = UIImpactFeedbackStyleLight;
    } else if ([style isEqualToString:@"heavy"]) {
      feedbackStyle = UIImpactFeedbackStyleHeavy;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      UIImpactFeedbackGenerator *generator =
        [[UIImpactFeedbackGenerator alloc] initWithStyle:feedbackStyle];
      [generator prepare];
      [generator impactOccurred];
    });
  }
}

- (void)hapticNotification:(NSString *)type
{
  if (@available(iOS 10.0, *)) {
    UINotificationFeedbackType feedbackType = UINotificationFeedbackTypeSuccess;

    if ([type isEqualToString:@"warning"]) {
      feedbackType = UINotificationFeedbackTypeWarning;
    } else if ([type isEqualToString:@"error"]) {
      feedbackType = UINotificationFeedbackTypeError;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
      UINotificationFeedbackGenerator *generator =
        [[UINotificationFeedbackGenerator alloc] init];
      [generator prepare];
      [generator notificationOccurred:feedbackType];
    });
  }
}

- (void)hapticSelection
{
  if (@available(iOS 10.0, *)) {
    dispatch_async(dispatch_get_main_queue(), ^{
      UISelectionFeedbackGenerator *generator =
        [[UISelectionFeedbackGenerator alloc] init];
      [generator prepare];
      [generator selectionChanged];
    });
  }
}

- (void)vibrate
{
  // iOS does not provide a raw vibration API for third-party apps.
  // Apple discourages it — use hapticImpact or hapticNotification instead.
  // This is a deliberate no-op.
}

// ---------------------------------------------------------------------------
// Launcher
// ---------------------------------------------------------------------------

- (void)openURL:(NSString *)url
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  NSURL *nsUrl = [NSURL URLWithString:url];
  if (!nsUrl) {
    reject(@"launcher_error", @"Invalid URL", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication.sharedApplication openURL:nsUrl
                                     options:@{}
                           completionHandler:^(BOOL success) {
      resolve(@(success));
    }];
  });
}

- (void)dial:(NSString *)phoneNumber
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  NSString *cleaned = [phoneNumber stringByReplacingOccurrencesOfString:@" " withString:@""];
  NSString *encoded = [cleaned stringByAddingPercentEncodingWithAllowedCharacters:
                       [NSCharacterSet URLHostAllowedCharacterSet]];
  NSString *urlString = [NSString stringWithFormat:@"tel:%@", encoded];

  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    reject(@"launcher_error", @"Invalid phone number", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication.sharedApplication openURL:url
                                     options:@{}
                           completionHandler:^(BOOL success) {
      resolve(@(success));
    }];
  });
}

- (void)email:(NSString *)address
      options:(JS::NativeEssentialsSettings::SpecEmailOptions &)options
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject
{
  NSString *subject = options.subject() ?: @"";
  NSString *body = options.body() ?: @"";

  NSString *urlString = [NSString stringWithFormat:
    @"mailto:%@?subject=%@&body=%@",
    [address stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLHostAllowedCharacterSet]],
    [subject stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]],
    [body stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]]
  ];

  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    reject(@"launcher_error", @"Invalid email parameters", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication.sharedApplication openURL:url
                                     options:@{}
                           completionHandler:^(BOOL success) {
      resolve(@(success));
    }];
  });
}

- (void)sms:(NSString *)phoneNumber
    options:(JS::NativeEssentialsSettings::SpecSmsOptions &)options
    resolve:(RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject
{
  NSString *body = options.body() ?: @"";

  NSString *urlString = [NSString stringWithFormat:
    @"sms:%@&body=%@",
    [phoneNumber stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLHostAllowedCharacterSet]],
    [body stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]]
  ];

  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    reject(@"launcher_error", @"Invalid SMS parameters", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication.sharedApplication openURL:url
                                     options:@{}
                           completionHandler:^(BOOL success) {
      resolve(@(success));
    }];
  });
}

- (void)openAppSettings:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  NSURL *url = [NSURL URLWithString:UIApplicationOpenSettingsURLString];
  if (!url) {
    reject(@"launcher_error", @"Cannot open app settings", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication.sharedApplication openURL:url
                                     options:@{}
                           completionHandler:^(BOOL success) {
      resolve(@(success));
    }];
  });
}

- (void)openSettings:(NSString *)screen
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  // iOS only allows third-party apps to open their own settings page.
  // There is no supported way to open system-wide settings screens
  // (notification, location, wifi, etc.) from an app.
  //
  // We fall back to the app's own settings page for all values.

  NSURL *url = [NSURL URLWithString:UIApplicationOpenSettingsURLString];
  if (!url) {
    reject(@"launcher_error", @"Cannot open app settings", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    [UIApplication.sharedApplication openURL:url
                                     options:@{}
                           completionHandler:^(BOOL success) {
      resolve(@(success));
    }];
  });
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

- (void)preferencesGet:(NSString *)key
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  NSString *value = [[NSUserDefaults standardUserDefaults] stringForKey:key];
  resolve(value);
}

- (void)preferencesSet:(NSString *)key
                 value:(NSString *)value
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [[NSUserDefaults standardUserDefaults] setObject:value forKey:key];
  [[NSUserDefaults standardUserDefaults] synchronize];
  resolve(nil);
}

- (void)preferencesRemove:(NSString *)key
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
  [[NSUserDefaults standardUserDefaults] synchronize];
  resolve(nil);
}

- (void)preferencesClear:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  NSString *bundleId = [[NSBundle mainBundle] bundleIdentifier];
  [[NSUserDefaults standardUserDefaults] removePersistentDomainForName:bundleId];
  [[NSUserDefaults standardUserDefaults] synchronize];
  resolve(nil);
}

- (void)preferencesHas:(NSString *)key
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  id value = [[NSUserDefaults standardUserDefaults] objectForKey:key];
  resolve(@(value != nil));
}

// ---------------------------------------------------------------------------
// SecureStorage — Keychain-backed
// ---------------------------------------------------------------------------

static NSString *const kSecureStorageService = @"com.essentialssettings.securestorage";

// Helper — build the base Keychain query for a given key
static NSMutableDictionary *secureStorageQuery(NSString *key) {
  NSMutableDictionary *query = [NSMutableDictionary dictionary];
  query[(__bridge id)kSecClass] = (__bridge id)kSecClassGenericPassword;
  query[(__bridge id)kSecAttrService] = kSecureStorageService;
  query[(__bridge id)kSecAttrAccount] = key;
  return query;
}

// Helper — map accessibility string to Keychain constant
static CFStringRef accessibilityConstant(NSString *value) {
  if ([value isEqualToString:@"afterFirstUnlock"]) {
    return kSecAttrAccessibleAfterFirstUnlock;
  }
  if ([value isEqualToString:@"whenUnlockedThisDeviceOnly"]) {
    return kSecAttrAccessibleWhenUnlockedThisDeviceOnly;
  }
  if ([value isEqualToString:@"afterFirstUnlockThisDeviceOnly"]) {
    return kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;
  }
  // Default
  return kSecAttrAccessibleWhenUnlocked;
}

- (void)secureStorageGet:(NSString *)key
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  NSMutableDictionary *query = secureStorageQuery(key);
  query[(__bridge id)kSecReturnData] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;

  CFTypeRef dataTypeRef = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &dataTypeRef);

  if (status == errSecSuccess && dataTypeRef != NULL) {
    NSData *data = (__bridge_transfer NSData *)dataTypeRef;
    NSString *value = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    resolve(value);
    return;
  }

  if (status == errSecItemNotFound) {
    resolve(nil);
    return;
  }

  reject(@"secure_storage_error",
         [NSString stringWithFormat:@"Keychain read failed: %d", (int)status],
         nil);
}

- (void)secureStorageSet:(NSString *)key
                   value:(NSString *)value
           accessibility:(NSString *)accessibility
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  CFStringRef accessibilityConst = accessibilityConstant(accessibility);

  // Try to update first
  NSMutableDictionary *query = secureStorageQuery(key);
  NSDictionary *updates = @{
    (__bridge id)kSecValueData: [value dataUsingEncoding:NSUTF8StringEncoding],
    (__bridge id)kSecAttrAccessible: (__bridge id)accessibilityConst,
  };

  OSStatus updateStatus = SecItemUpdate((__bridge CFDictionaryRef)query,
                                         (__bridge CFDictionaryRef)updates);

  if (updateStatus == errSecSuccess) {
    resolve(nil);
    return;
  }

  if (updateStatus != errSecItemNotFound) {
    reject(@"secure_storage_error",
           [NSString stringWithFormat:@"Keychain update failed: %d", (int)updateStatus],
           nil);
    return;
  }

  // Not found — add a new item
  NSMutableDictionary *addQuery = secureStorageQuery(key);
  addQuery[(__bridge id)kSecValueData] = [value dataUsingEncoding:NSUTF8StringEncoding];
  addQuery[(__bridge id)kSecAttrAccessible] = (__bridge id)accessibilityConst;

  OSStatus addStatus = SecItemAdd((__bridge CFDictionaryRef)addQuery, NULL);

  if (addStatus == errSecSuccess) {
    resolve(nil);
    return;
  }

  reject(@"secure_storage_error",
         [NSString stringWithFormat:@"Keychain add failed: %d", (int)addStatus],
         nil);
}

- (void)secureStorageRemove:(NSString *)key
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject
{
  NSMutableDictionary *query = secureStorageQuery(key);
  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);

  if (status == errSecSuccess || status == errSecItemNotFound) {
    resolve(nil);
    return;
  }

  reject(@"secure_storage_error",
         [NSString stringWithFormat:@"Keychain delete failed: %d", (int)status],
         nil);
}

- (void)secureStorageClear:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  NSMutableDictionary *query = [NSMutableDictionary dictionary];
  query[(__bridge id)kSecClass] = (__bridge id)kSecClassGenericPassword;
  query[(__bridge id)kSecAttrService] = kSecureStorageService;

  OSStatus status = SecItemDelete((__bridge CFDictionaryRef)query);

  if (status == errSecSuccess || status == errSecItemNotFound) {
    resolve(nil);
    return;
  }

  reject(@"secure_storage_error",
         [NSString stringWithFormat:@"Keychain clear failed: %d", (int)status],
         nil);
}

- (void)secureStorageHas:(NSString *)key
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  NSMutableDictionary *query = secureStorageQuery(key);
  query[(__bridge id)kSecReturnData] = @YES;
  query[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;

  CFTypeRef dataTypeRef = NULL;
  OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &dataTypeRef);

  if (dataTypeRef != NULL) {
    CFRelease(dataTypeRef);
  }

  resolve(@(status == errSecSuccess));
}

RCT_EXPORT_METHOD(addListener:(NSString *)eventName)
{
  [super addListener:eventName];
}

RCT_EXPORT_METHOD(removeListeners:(double)count)
{
  [super removeListeners:count];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeEssentialsSettingsSpecJSI>(params);
}

@end