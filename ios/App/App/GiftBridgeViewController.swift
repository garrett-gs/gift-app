import UIKit
import Capacitor

// Subclass of Capacitor's bridge view controller so we can register
// our custom Swift plugins programmatically — `cap sync` regenerates
// capacitor.config.json and would overwrite any manual packageClassList
// additions, so the storyboard-level subclass is the durable hook.

class GiftBridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        _ = bridge?.registerPluginType(ShareCredentialsPlugin.self)
        NSLog("[GIFT] registered ShareCredentialsPlugin")
    }
}
