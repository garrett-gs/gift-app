import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private let appGroupID = "group.com.giftapp.gift.shared"
    private let pendingKey = "pendingShareUrl"

    private var didClose = false
    private var timeoutWorkItem: DispatchWorkItem?

    override func viewDidLoad() {
        super.viewDidLoad()
        // Invisible — don't block the host app's UI while we work.
        view.backgroundColor = .clear
        NSLog("[ShareExtension] viewDidLoad")

        // Hard ceiling: if anything hangs, dismiss after 3 seconds no matter what.
        let timeout = DispatchWorkItem { [weak self] in
            NSLog("[ShareExtension] timeout reached")
            self?.close(reason: "timeout")
        }
        timeoutWorkItem = timeout
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0, execute: timeout)

        handleShare()
    }

    private func handleShare() {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            NSLog("[ShareExtension] no inputItems")
            return close(reason: "no inputItems")
        }
        NSLog("[ShareExtension] %d inputItem(s)", items.count)

        // Collect every attachment across every item, then try them in priority
        // order: URL first, then plain text. Some hosts (e.g. Chrome) attach
        // multiple representations and burying the URL deeper than the others.
        var attachments: [NSItemProvider] = []
        for item in items {
            attachments.append(contentsOf: item.attachments ?? [])
        }
        NSLog("[ShareExtension] %d attachment(s)", attachments.count)

        if let urlAttachment = attachments.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
            NSLog("[ShareExtension] using URL attachment")
            urlAttachment.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] data, error in
                if let error = error {
                    NSLog("[ShareExtension] loadItem URL error: %@", error.localizedDescription)
                }
                if let url = data as? URL {
                    self?.savePending(urlString: url.absoluteString)
                } else if let s = data as? String, let detected = self?.firstURL(in: s) {
                    self?.savePending(urlString: detected)
                } else {
                    NSLog("[ShareExtension] URL attachment yielded unexpected type: %@", String(describing: type(of: data)))
                }
                self?.close(reason: "url done")
            }
            return
        }

        if let textAttachment = attachments.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) {
            NSLog("[ShareExtension] using text attachment")
            textAttachment.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] data, error in
                if let error = error {
                    NSLog("[ShareExtension] loadItem text error: %@", error.localizedDescription)
                }
                if let s = data as? String, let detected = self?.firstURL(in: s) {
                    self?.savePending(urlString: detected)
                } else if let s = data as? String {
                    self?.savePending(urlString: "", title: s)
                }
                self?.close(reason: "text done")
            }
            return
        }

        NSLog("[ShareExtension] no usable attachment found")
        close(reason: "no usable attachment")
    }

    private func firstURL(in text: String) -> String? {
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) else {
            return nil
        }
        let range = NSRange(location: 0, length: text.utf16.count)
        return detector.firstMatch(in: text, options: [], range: range)?.url?.absoluteString
    }

    private func savePending(urlString: String, title: String = "") {
        var components = URLComponents()
        components.scheme = "gift"
        components.host = "add-item"
        var query: [URLQueryItem] = []
        if !urlString.isEmpty { query.append(URLQueryItem(name: "url", value: urlString)) }
        if !title.isEmpty { query.append(URLQueryItem(name: "title", value: title)) }
        components.queryItems = query.isEmpty ? nil : query

        guard let link = components.url else {
            NSLog("[ShareExtension] could not assemble gift:// URL")
            return
        }

        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            NSLog("[ShareExtension] WARNING App Group %@ unavailable", appGroupID)
            return
        }

        defaults.set(link.absoluteString, forKey: pendingKey)
        defaults.synchronize()
        NSLog("[ShareExtension] saved pending: %@", link.absoluteString)
    }

    private func close(reason: String) {
        guard !didClose else { return }
        didClose = true
        timeoutWorkItem?.cancel()
        NSLog("[ShareExtension] closing (%@)", reason)
        DispatchQueue.main.async { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }
}
