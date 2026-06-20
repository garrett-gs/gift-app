import Foundation
import Capacitor

// Custom Capacitor plugin that lets the JS-side push Supabase auth state
// into the App Group container so the iOS Share Extension can call our
// API on the user's behalf without needing the WebView's session cookies.

@objc(ShareCredentialsPlugin)
public class ShareCredentialsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ShareCredentialsPlugin"
    public let jsName = "ShareCredentials"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
    ]

    private let appGroupID = "group.com.giftapp.gift.shared"
    private let tokenKey = "supabaseAccessToken"
    private let userIdKey = "supabaseUserId"
    private let defaultRegistryKey = "defaultRegistryId"
    private let apiBaseKey = "apiBase"
    private let tokenExpiresAtKey = "supabaseAccessTokenExpiresAt"

    @objc func set(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            call.reject("App Group \(appGroupID) unavailable")
            return
        }
        if let token = call.getString("token") {
            defaults.set(token, forKey: tokenKey)
        }
        if let userId = call.getString("userId") {
            defaults.set(userId, forKey: userIdKey)
        }
        if let registryId = call.getString("defaultRegistryId") {
            defaults.set(registryId, forKey: defaultRegistryKey)
        }
        if let apiBase = call.getString("apiBase") {
            defaults.set(apiBase, forKey: apiBaseKey)
        }
        if let expiresAt = call.getDouble("expiresAt") {
            defaults.set(expiresAt, forKey: tokenExpiresAtKey)
        }
        defaults.synchronize()
        NSLog("[ShareCredentials] saved auth state")
        call.resolve()
    }

    @objc func clear(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            call.reject("App Group \(appGroupID) unavailable")
            return
        }
        defaults.removeObject(forKey: tokenKey)
        defaults.removeObject(forKey: userIdKey)
        defaults.removeObject(forKey: defaultRegistryKey)
        defaults.removeObject(forKey: apiBaseKey)
        defaults.removeObject(forKey: tokenExpiresAtKey)
        defaults.synchronize()
        NSLog("[ShareCredentials] cleared auth state")
        call.resolve()
    }
}
