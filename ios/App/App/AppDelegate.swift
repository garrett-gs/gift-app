import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    private let appGroupID = "group.com.giftapp.gift.shared"
    private let pendingShareKey = "pendingShareUrl"
    private var hasConsumedThisLaunch = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Give Capacitor a beat to spin up its bridge before we replay any
        // share-extension URL through the App plugin.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.consumePendingShare()
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}

    func applicationDidEnterBackground(_ application: UIApplication) {
        // A genuine background trip means the user might come back with a
        // newly-shared URL. Re-arm the consume gate so the next foreground
        // can replay it. Transient bounces (notification banners, control
        // center, etc.) don't fire didEnterBackground, so the gate stays shut
        // for those and the WebView isn't churned.
        hasConsumedThisLaunch = false
    }

    func applicationWillEnterForeground(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {
        guard !hasConsumedThisLaunch else { return }
        consumePendingShare()
    }

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    private func consumePendingShare() {
        hasConsumedThisLaunch = true
        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            NSLog("[GIFT] App Group %@ unavailable — share extension hand-off disabled", appGroupID)
            return
        }
        guard let urlString = defaults.string(forKey: pendingShareKey),
              let url = URL(string: urlString) else {
            return
        }
        defaults.removeObject(forKey: pendingShareKey)
        defaults.synchronize()
        NSLog("[GIFT] consuming pending share: %@", urlString)
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
    }
}
