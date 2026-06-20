import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private let appGroupID = "group.com.giftapp.gift.shared"
    private let pendingKey = "pendingShareUrl"
    private let universalLinkBase = "https://gift-app-lyart.vercel.app/add-item"

    private var didClose = false
    private var loadTimeoutWorkItem: DispatchWorkItem?
    private var pendingLink: URL?
    private var cardContainer: UIView?

    override func viewDidLoad() {
        super.viewDidLoad()
        // Semi-opaque scrim behind the card so the user sees something land.
        view.backgroundColor = UIColor.black.withAlphaComponent(0.35)
        NSLog("[ShareExtension] viewDidLoad")

        // Hard ceiling on attachment extraction. If iOS hangs loadItem, we
        // bail out and close so the host app (Chrome, Safari) isn't stuck
        // behind our extension forever.
        let timeout = DispatchWorkItem { [weak self] in
            NSLog("[ShareExtension] load timeout reached")
            self?.close(reason: "load timeout")
        }
        loadTimeoutWorkItem = timeout
        DispatchQueue.main.asyncAfter(deadline: .now() + 4.0, execute: timeout)

        handleShare()
    }

    private func handleShare() {
        guard let items = extensionContext?.inputItems as? [NSExtensionItem] else {
            NSLog("[ShareExtension] no inputItems")
            return close(reason: "no inputItems")
        }
        NSLog("[ShareExtension] %d inputItem(s)", items.count)

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
                    self?.savePendingAndShowCard(urlString: url.absoluteString)
                } else if let s = data as? String, let detected = self?.firstURL(in: s) {
                    self?.savePendingAndShowCard(urlString: detected)
                } else {
                    NSLog("[ShareExtension] URL attachment yielded unexpected type: %@", String(describing: type(of: data)))
                    self?.close(reason: "url extract failed")
                }
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
                    self?.savePendingAndShowCard(urlString: detected)
                } else if let s = data as? String {
                    self?.savePendingAndShowCard(urlString: "", title: s)
                } else {
                    self?.close(reason: "text extract failed")
                }
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

    private func savePendingAndShowCard(urlString: String, title: String = "") {
        guard var components = URLComponents(string: universalLinkBase) else {
            NSLog("[ShareExtension] bad universalLinkBase")
            return close(reason: "bad link base")
        }
        var query: [URLQueryItem] = []
        if !urlString.isEmpty { query.append(URLQueryItem(name: "url", value: urlString)) }
        if !title.isEmpty { query.append(URLQueryItem(name: "title", value: title)) }
        components.queryItems = query.isEmpty ? nil : query

        guard let link = components.url else {
            NSLog("[ShareExtension] could not assemble Universal Link")
            return close(reason: "assemble failed")
        }

        if let defaults = UserDefaults(suiteName: appGroupID) {
            defaults.set(link.absoluteString, forKey: pendingKey)
            defaults.synchronize()
            NSLog("[ShareExtension] saved pending: %@", link.absoluteString)
        } else {
            NSLog("[ShareExtension] WARNING App Group %@ unavailable", appGroupID)
        }

        loadTimeoutWorkItem?.cancel()
        pendingLink = link

        DispatchQueue.main.async { [weak self] in
            self?.presentCard()
        }
    }

    private func presentCard() {
        let card = UIView()
        card.backgroundColor = .white
        card.layer.cornerRadius = 20
        card.layer.shadowColor = UIColor.black.cgColor
        card.layer.shadowOpacity = 0.2
        card.layer.shadowOffset = CGSize(width: 0, height: 8)
        card.layer.shadowRadius = 16
        card.translatesAutoresizingMaskIntoConstraints = false

        let title = UILabel()
        title.text = "Saved to GIFT"
        title.font = .systemFont(ofSize: 17, weight: .semibold)
        title.textAlignment = .center
        title.textColor = .black
        title.translatesAutoresizingMaskIntoConstraints = false

        let subtitle = UILabel()
        subtitle.text = "Open the app to finish adding it"
        subtitle.font = .systemFont(ofSize: 13)
        subtitle.textAlignment = .center
        subtitle.textColor = UIColor.darkGray
        subtitle.numberOfLines = 0
        subtitle.translatesAutoresizingMaskIntoConstraints = false

        let openButton = UIButton(type: .system)
        openButton.setTitle("Open in GIFT", for: .normal)
        openButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        openButton.backgroundColor = .black
        openButton.setTitleColor(.white, for: .normal)
        openButton.layer.cornerRadius = 12
        openButton.translatesAutoresizingMaskIntoConstraints = false
        openButton.addTarget(self, action: #selector(handleOpenTapped), for: .touchUpInside)

        let doneButton = UIButton(type: .system)
        doneButton.setTitle("Later", for: .normal)
        doneButton.titleLabel?.font = .systemFont(ofSize: 15)
        doneButton.setTitleColor(UIColor.darkGray, for: .normal)
        doneButton.translatesAutoresizingMaskIntoConstraints = false
        doneButton.addTarget(self, action: #selector(handleLaterTapped), for: .touchUpInside)

        card.addSubview(title)
        card.addSubview(subtitle)
        card.addSubview(openButton)
        card.addSubview(doneButton)
        view.addSubview(card)
        cardContainer = card

        NSLayoutConstraint.activate([
            card.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            card.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            card.widthAnchor.constraint(equalToConstant: 300),

            title.topAnchor.constraint(equalTo: card.topAnchor, constant: 24),
            title.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 20),
            title.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -20),

            subtitle.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 6),
            subtitle.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 20),
            subtitle.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -20),

            openButton.topAnchor.constraint(equalTo: subtitle.bottomAnchor, constant: 20),
            openButton.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 20),
            openButton.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -20),
            openButton.heightAnchor.constraint(equalToConstant: 48),

            doneButton.topAnchor.constraint(equalTo: openButton.bottomAnchor, constant: 6),
            doneButton.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 20),
            doneButton.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -20),
            doneButton.heightAnchor.constraint(equalToConstant: 40),
            doneButton.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -12),
        ])

        card.alpha = 0
        card.transform = CGAffineTransform(scaleX: 0.9, y: 0.9)
        UIView.animate(withDuration: 0.22, delay: 0, options: .curveEaseOut) {
            card.alpha = 1
            card.transform = .identity
        }
    }

    @objc private func handleOpenTapped() {
        guard let link = pendingLink else { return close(reason: "tap without link") }
        NSLog("[ShareExtension] user tapped Open in GIFT")
        // Hand off — explicit user gesture is more likely to get past iOS's
        // sandboxing on share-extension-to-app launches than an auto-fire.
        extensionContext?.open(link) { [weak self] success in
            NSLog("[ShareExtension] extensionContext.open success=%d", success)
            self?.close(reason: success ? "user-tap success" : "user-tap failed")
        }
        // Give iOS up to 2s to complete the hand-off; close either way.
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.close(reason: "user-tap fallback close")
        }
    }

    @objc private func handleLaterTapped() {
        NSLog("[ShareExtension] user tapped Later")
        close(reason: "user later")
    }

    private func close(reason: String) {
        guard !didClose else { return }
        didClose = true
        loadTimeoutWorkItem?.cancel()
        NSLog("[ShareExtension] closing (%@)", reason)
        DispatchQueue.main.async { [weak self] in
            self?.extensionContext?.completeRequest(returningItems: nil)
        }
    }
}
