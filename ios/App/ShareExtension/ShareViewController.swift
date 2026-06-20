import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private let appGroupID = "group.com.giftapp.gift.shared"
    private let pendingKey = "pendingShareUrl"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.black.withAlphaComponent(0.35)
        handleShare()
    }

    private func handleShare() {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            return close()
        }

        for item in items {
            guard let attachments = item.attachments else { continue }
            for attachment in attachments {
                if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    attachment.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] data, _ in
                        if let url = data as? URL {
                            self?.deepLink(url: url.absoluteString)
                        } else {
                            self?.close()
                        }
                    }
                    return
                }
                if attachment.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    attachment.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] data, _ in
                        if let text = data as? String, let extracted = self?.firstURL(in: text) {
                            self?.deepLink(url: extracted)
                        } else if let text = data as? String {
                            self?.deepLink(url: "", title: text)
                        } else {
                            self?.close()
                        }
                    }
                    return
                }
            }
        }
        close()
    }

    private func firstURL(in text: String) -> String? {
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let range = NSRange(location: 0, length: text.utf16.count)
        if let match = detector?.firstMatch(in: text, options: [], range: range),
           let url = match.url {
            return url.absoluteString
        }
        return nil
    }

    private func deepLink(url: String, title: String = "") {
        var components = URLComponents()
        components.scheme = "gift"
        components.host = "add-item"
        var query: [URLQueryItem] = []
        if !url.isEmpty { query.append(URLQueryItem(name: "url", value: url)) }
        if !title.isEmpty { query.append(URLQueryItem(name: "title", value: title)) }
        components.queryItems = query.isEmpty ? nil : query

        guard let link = components.url else { return close() }

        // Persist to the shared App Group container so the main app can pick
        // it up when it next becomes active. iOS blocks share extensions from
        // launching apps via custom URL schemes, so we rely on the user
        // opening the app after dismissing the share sheet.
        if let defaults = UserDefaults(suiteName: appGroupID) {
            defaults.set(link.absoluteString, forKey: pendingKey)
            defaults.synchronize()
            NSLog("[ShareExtension] wrote pending share: %@", link.absoluteString)
        } else {
            NSLog("[ShareExtension] WARNING: App Group %@ not available — pending share NOT persisted", appGroupID)
        }

        DispatchQueue.main.async { [weak self] in
            self?.presentConfirmation(link: link)
        }
    }

    private func presentConfirmation(link: URL) {
        let card = UIView()
        card.backgroundColor = UIColor.white
        card.layer.cornerRadius = 16
        card.translatesAutoresizingMaskIntoConstraints = false

        let label = UILabel()
        label.text = "Saved to GIFT"
        label.font = .systemFont(ofSize: 17, weight: .semibold)
        label.textAlignment = .center
        label.textColor = .black
        label.translatesAutoresizingMaskIntoConstraints = false

        let sub = UILabel()
        sub.text = "Open GIFT to add it to a list"
        sub.font = .systemFont(ofSize: 13, weight: .regular)
        sub.textAlignment = .center
        sub.textColor = UIColor.darkGray
        sub.translatesAutoresizingMaskIntoConstraints = false

        card.addSubview(label)
        card.addSubview(sub)
        view.addSubview(card)

        NSLayoutConstraint.activate([
            card.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            card.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            card.widthAnchor.constraint(equalToConstant: 260),
            card.heightAnchor.constraint(equalToConstant: 90),

            label.topAnchor.constraint(equalTo: card.topAnchor, constant: 18),
            label.leadingAnchor.constraint(equalTo: card.leadingAnchor),
            label.trailingAnchor.constraint(equalTo: card.trailingAnchor),

            sub.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 4),
            sub.leadingAnchor.constraint(equalTo: card.leadingAnchor),
            sub.trailingAnchor.constraint(equalTo: card.trailingAnchor),
        ])

        // Best-effort attempt: some iOS versions/hosts still allow this. If
        // it works we get a one-tap experience; if not, the App Group handoff
        // covers the user when they open GIFT manually.
        extensionContext?.open(link) { success in
            NSLog("[ShareExtension] extensionContext.open success=%d", success)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) { [weak self] in
            self?.close()
        }
    }

    private func close() {
        DispatchQueue.main.async { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }
}
