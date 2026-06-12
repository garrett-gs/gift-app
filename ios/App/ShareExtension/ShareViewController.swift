import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
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

        DispatchQueue.main.async { [weak self] in
            self?.openURL(link)
            self?.close()
        }
    }

    // Share Extensions can't call UIApplication.open directly, so we walk the
    // responder chain to find a UIApplication and call its `openURL:` selector.
    @discardableResult
    private func openURL(_ url: URL) -> Bool {
        var responder: UIResponder? = self
        let selector = sel_registerName("openURL:")
        while let r = responder {
            if r.responds(to: selector) {
                _ = r.perform(selector, with: url)
                return true
            }
            responder = r.next
        }
        return false
    }

    private func close() {
        DispatchQueue.main.async { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }
}
