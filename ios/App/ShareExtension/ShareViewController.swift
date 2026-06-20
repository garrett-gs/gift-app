import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private let appGroupID = "group.com.giftapp.gift.shared"
    private let pendingKey = "pendingShareUrl"
    private let tokenKey = "supabaseAccessToken"
    private let defaultRegistryKey = "defaultRegistryId"
    private let apiBaseKey = "apiBase"
    private let fallbackApiBase = "https://gift-app-lyart.vercel.app"

    private var didClose = false
    private var loadTimeoutWorkItem: DispatchWorkItem?
    private var sharedURL: String?

    private var card: UIView?
    private var titleLabel: UILabel?
    private var subtitleLabel: UILabel?
    private var primaryButton: UIButton?
    private var secondaryButton: UIButton?
    private var spinner: UIActivityIndicatorView?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.black.withAlphaComponent(0.35)
        NSLog("[ShareExtension] viewDidLoad")

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
            return close(reason: "no inputItems")
        }
        var attachments: [NSItemProvider] = []
        for item in items {
            attachments.append(contentsOf: item.attachments ?? [])
        }

        if let urlAttachment = attachments.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
            urlAttachment.loadItem(forTypeIdentifier: UTType.url.identifier) { [weak self] data, _ in
                if let url = data as? URL {
                    self?.didExtractURL(url.absoluteString)
                } else if let s = data as? String, let detected = self?.firstURL(in: s) {
                    self?.didExtractURL(detected)
                } else {
                    self?.close(reason: "url extract failed")
                }
            }
            return
        }
        if let textAttachment = attachments.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) {
            textAttachment.loadItem(forTypeIdentifier: UTType.plainText.identifier) { [weak self] data, _ in
                if let s = data as? String, let detected = self?.firstURL(in: s) {
                    self?.didExtractURL(detected)
                } else {
                    self?.close(reason: "text had no URL")
                }
            }
            return
        }
        close(reason: "no usable attachment")
    }

    private func didExtractURL(_ url: String) {
        loadTimeoutWorkItem?.cancel()
        sharedURL = url
        // Always persist as a fallback so the user opening GIFT picks it
        // up even if the network add fails or they're signed out.
        persistPending(url: url)
        DispatchQueue.main.async { [weak self] in
            self?.renderInitialCard()
        }
    }

    private func persistPending(url: String) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
        var components = URLComponents(string: "\(fallbackApiBase)/add-item")
        components?.queryItems = [URLQueryItem(name: "url", value: url)]
        if let link = components?.url {
            defaults.set(link.absoluteString, forKey: pendingKey)
            defaults.synchronize()
            NSLog("[ShareExtension] persisted fallback: %@", link.absoluteString)
        }
    }

    private func hasAuth() -> Bool {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let token = defaults.string(forKey: tokenKey),
              !token.isEmpty else { return false }
        return true
    }

    private func firstURL(in text: String) -> String? {
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) else {
            return nil
        }
        let range = NSRange(location: 0, length: text.utf16.count)
        return detector.firstMatch(in: text, options: [], range: range)?.url?.absoluteString
    }

    // MARK: - Card UI

    private func renderInitialCard() {
        let signedIn = hasAuth()
        showCard(
            title: signedIn ? "Add to GIFT?" : "Sign in to GIFT",
            subtitle: signedIn
                ? "Tap below and it'll save straight to your registry."
                : "Open GIFT to sign in. Your link will be waiting.",
            primaryTitle: signedIn ? "Add to GIFT" : "Open GIFT",
            primaryAction: #selector(handlePrimaryTapped),
            secondaryTitle: "Cancel",
            secondaryAction: #selector(handleCancelTapped)
        )
    }

    private func showCard(
        title: String,
        subtitle: String,
        primaryTitle: String,
        primaryAction: Selector,
        secondaryTitle: String?,
        secondaryAction: Selector?
    ) {
        if let existing = card {
            existing.removeFromSuperview()
        }
        let container = UIView()
        container.backgroundColor = .white
        container.layer.cornerRadius = 20
        container.layer.shadowColor = UIColor.black.cgColor
        container.layer.shadowOpacity = 0.2
        container.layer.shadowOffset = CGSize(width: 0, height: 8)
        container.layer.shadowRadius = 16
        container.translatesAutoresizingMaskIntoConstraints = false

        let titleLabel = UILabel()
        titleLabel.text = title
        titleLabel.font = .systemFont(ofSize: 17, weight: .semibold)
        titleLabel.textAlignment = .center
        titleLabel.textColor = .black
        titleLabel.translatesAutoresizingMaskIntoConstraints = false

        let subtitleLabel = UILabel()
        subtitleLabel.text = subtitle
        subtitleLabel.font = .systemFont(ofSize: 13)
        subtitleLabel.textAlignment = .center
        subtitleLabel.textColor = UIColor.darkGray
        subtitleLabel.numberOfLines = 0
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false

        let primary = UIButton(type: .system)
        primary.setTitle(primaryTitle, for: .normal)
        primary.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        primary.backgroundColor = .black
        primary.setTitleColor(.white, for: .normal)
        primary.layer.cornerRadius = 12
        primary.translatesAutoresizingMaskIntoConstraints = false
        primary.addTarget(self, action: primaryAction, for: .touchUpInside)

        let spin = UIActivityIndicatorView(style: .medium)
        spin.color = .white
        spin.translatesAutoresizingMaskIntoConstraints = false
        spin.hidesWhenStopped = true
        primary.addSubview(spin)

        container.addSubview(titleLabel)
        container.addSubview(subtitleLabel)
        container.addSubview(primary)

        var bottomAnchor = primary.bottomAnchor
        var secondaryBtn: UIButton?
        if let secondaryTitle = secondaryTitle, let secondaryAction = secondaryAction {
            let secondary = UIButton(type: .system)
            secondary.setTitle(secondaryTitle, for: .normal)
            secondary.titleLabel?.font = .systemFont(ofSize: 15)
            secondary.setTitleColor(UIColor.darkGray, for: .normal)
            secondary.translatesAutoresizingMaskIntoConstraints = false
            secondary.addTarget(self, action: secondaryAction, for: .touchUpInside)
            container.addSubview(secondary)
            secondaryBtn = secondary

            NSLayoutConstraint.activate([
                secondary.topAnchor.constraint(equalTo: primary.bottomAnchor, constant: 6),
                secondary.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
                secondary.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -20),
                secondary.heightAnchor.constraint(equalToConstant: 40),
            ])
            bottomAnchor = secondary.bottomAnchor
        }

        view.addSubview(container)

        NSLayoutConstraint.activate([
            container.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            container.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            container.widthAnchor.constraint(equalToConstant: 300),

            titleLabel.topAnchor.constraint(equalTo: container.topAnchor, constant: 24),
            titleLabel.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -20),

            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 6),
            subtitleLabel.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
            subtitleLabel.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -20),

            primary.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 20),
            primary.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
            primary.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -20),
            primary.heightAnchor.constraint(equalToConstant: 48),

            spin.centerXAnchor.constraint(equalTo: primary.centerXAnchor),
            spin.centerYAnchor.constraint(equalTo: primary.centerYAnchor),

            bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -12),
        ])

        container.alpha = 0
        container.transform = CGAffineTransform(scaleX: 0.92, y: 0.92)
        UIView.animate(withDuration: 0.22, delay: 0, options: .curveEaseOut) {
            container.alpha = 1
            container.transform = .identity
        }

        self.card = container
        self.titleLabel = titleLabel
        self.subtitleLabel = subtitleLabel
        self.primaryButton = primary
        self.secondaryButton = secondaryBtn
        self.spinner = spin
    }

    private func showLoading(title: String, subtitle: String) {
        titleLabel?.text = title
        subtitleLabel?.text = subtitle
        primaryButton?.setTitle("", for: .normal)
        primaryButton?.isEnabled = false
        secondaryButton?.isHidden = true
        spinner?.startAnimating()
    }

    private func showSuccess(registryTitle: String?) {
        titleLabel?.text = "Added!"
        if let name = registryTitle, !name.isEmpty {
            subtitleLabel?.text = "Saved to “\(name)”"
        } else {
            subtitleLabel?.text = "Saved to your registry."
        }
        primaryButton?.removeFromSuperview()
        secondaryButton?.removeFromSuperview()
        spinner?.stopAnimating()
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self] in
            self?.close(reason: "added")
        }
    }

    private func showFailure(message: String) {
        titleLabel?.text = "Couldn't add it"
        subtitleLabel?.text = message
        primaryButton?.setTitle("Open GIFT instead", for: .normal)
        primaryButton?.isEnabled = true
        secondaryButton?.setTitle("Cancel", for: .normal)
        secondaryButton?.isHidden = false
        spinner?.stopAnimating()
        // Repoint primary to "open GIFT" — the App Group fallback URL is
        // already persisted, so opening GIFT will pick it up.
        primaryButton?.removeTarget(nil, action: nil, for: .allEvents)
        primaryButton?.addTarget(self, action: #selector(handleOpenGiftTapped), for: .touchUpInside)
    }

    // MARK: - Actions

    @objc private func handlePrimaryTapped() {
        guard let url = sharedURL else { return close(reason: "no url") }
        if hasAuth() {
            postToAPI(url: url)
        } else {
            openGiftApp()
        }
    }

    @objc private func handleOpenGiftTapped() {
        openGiftApp()
    }

    @objc private func handleCancelTapped() {
        close(reason: "cancel")
    }

    private func openGiftApp() {
        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            return close(reason: "open without group")
        }
        let apiBase = defaults.string(forKey: apiBaseKey) ?? fallbackApiBase
        guard let url = URL(string: "\(apiBase)/add-item") else {
            return close(reason: "bad open url")
        }
        extensionContext?.open(url) { [weak self] success in
            NSLog("[ShareExtension] open success=%d", success)
            self?.close(reason: "open done")
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            self?.close(reason: "open fallback")
        }
    }

    private func postToAPI(url: String) {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let token = defaults.string(forKey: tokenKey),
              !token.isEmpty else {
            showFailure(message: "Sign in to GIFT first.")
            return
        }
        let apiBase = defaults.string(forKey: apiBaseKey) ?? fallbackApiBase
        let registryId = defaults.string(forKey: defaultRegistryKey)

        guard let endpoint = URL(string: "\(apiBase)/api/items/add") else {
            showFailure(message: "Bad API base URL.")
            return
        }

        showLoading(title: "Adding to GIFT…", subtitle: "Saving the link to your registry.")

        var req = URLRequest(url: endpoint)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.timeoutInterval = 20

        var body: [String: String] = ["url": url]
        if let registryId = registryId, !registryId.isEmpty {
            body["registryId"] = registryId
        }
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: req) { [weak self] data, response, error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                if let error = error {
                    NSLog("[ShareExtension] API error: %@", error.localizedDescription)
                    self.showFailure(message: "Network error. We saved the link — open GIFT to add.")
                    return
                }
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                let payload = data.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
                if status == 200, let payload = payload, payload["success"] as? Bool == true {
                    let registryTitle = payload["registryTitle"] as? String
                    self.showSuccess(registryTitle: registryTitle)
                    NSLog("[ShareExtension] add success")
                    // Clear the fallback pending URL since the item is already
                    // in the user's registry — no need for the app to ask.
                    self.clearPendingFallback()
                } else {
                    let message = (payload?["error"] as? String) ?? "Something went wrong."
                    NSLog("[ShareExtension] add failed status=%d msg=%@", status, message)
                    self.showFailure(message: message)
                }
            }
        }.resume()
    }

    private func clearPendingFallback() {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
        defaults.removeObject(forKey: pendingKey)
        defaults.synchronize()
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
