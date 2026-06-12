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

        NSLog("[ShareExtension] opening %@", link.absoluteString)

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            // Modern API — the host (Safari, etc) opens the URL on our behalf
            // and the share sheet dismisses automatically. completeRequest
            // happens after the host has handed off.
            self.extensionContext?.open(link) { success in
                NSLog("[ShareExtension] extensionContext.open success=%d", success)
                if !success {
                    // Fall back to the responder-chain hack
                    self.openViaResponderChain(link)
                }
                self.close()
            }
        }
    }

    @discardableResult
    private func openViaResponderChain(_ url: URL) -> Bool {
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
