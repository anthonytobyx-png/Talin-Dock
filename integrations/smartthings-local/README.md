# Authenticated SmartThings TV LAN route

This household integration runs inside the TV's existing Edge hub. The hosted Talin browser connects directly to the private HTTPS listener using an installed client identity. The PC is used for commissioning only. Native owner-managed SmartThings Rules translate on/off request events into the real TV's switch commands and mirror SmartThings-reported state. Those rules currently report executionLocation Cloud, so internet is required. No third-party OAuth client, official CLI token copied into Talin, paid API, Alexa, external bridge or port forwarding is used.

## Verified household result

Mutual TLS with the household CA accepted the matching identity and rejected missing, untrusted-signature and server-purpose client certificates. A real On request through this endpoint produced On in a separate official provider read. A 60-second hub timer produced On with the requesting process closed; Off was then requested and the starting Off state restored. Timer cancellation and saved history across driver updates were verified. The HTTPS endpoint remained reachable while SmartThings reported TV Off. These provider readings do not establish independent physical observation or physical iPad/PC-shutdown acceptance.

Only power and timers are exposed. Hub acceptance is not appliance execution. The UI labels the last SmartThings report, its receipt time and the absence of an underlying TV sample timestamp. It never invents volume, source, app identifiers or online TV status.

## Security and deployment

Public source contains no private keys. The instance-only src/local_config.lua must be assembled in the owner's protected commissioning directory, never this checkout, and contains only the server key/certificate and public CA. It is excluded by gitignore. CA signing and client private keys are not uploaded to Samsung. The public root certificate may be distributed by Talin; it is not a credential.

The household root includes IP name constraints for 192.168.1.3/32 and DNS constraints limited to reserved .invalid names. Current server/client certificates expire 7 December 2027. Renewal and revocation require replacing the relevant identity/CA and private driver configuration. No trust-store change or debugger-certificate exception is automated. Owners must review and install/trust the public root and password-encrypted client identity on each authorised browser device. Keys belong in the OS keychain, never browser storage. Only the non-sensitive endpoint address is stored locally.

POST requires exact Origin https://talin-dock.pages.dev and text/plain JSON with a bounded body. This avoids credential-free CORS preflight on older Safari while retaining origin validation and mandatory mutual TLS. GET responses grant CORS to Talin only. Header/body limits, timeouts and four concurrent client slots bound resource use. State-changing requests reserve idempotency IDs before publishing; uncertain requests are not automatically replayed. There are no arbitrary destination or device-ID parameters.

Timers are persisted as immutable JSON strings because the hub datastore wraps table values. Startup re-arms pending timers; claimed/uncertain actions are not retried and timers overdue by more than two minutes expire. Recent flash writes can be lost after abrupt power failure. Ten pending timers and 64 recent records are allowed. A sent timer means published to SmartThings, not physical confirmation.

The package replaces the earlier diagnostic packageKey for this existing household hub; do not install it blindly on another household. Use its own generated capability namespace, actual verified TV and LAN-device IDs, and owner-only channel. The five native rules are: request On -> TV switch On; request Off -> TV switch Off; TV switch On/Off -> reportPower On/Off; status request -> report the latest cached TV switch state. Provision only after capability metadata propagates; an initial validation rejection created no rule. Instance rule JSON/IDs and CLI credentials stay outside the repository.

## Maintenance limits and acceptance

Samsung only supports port 0 binding for Edge server sockets. The listener port changes after a hub/driver restart. Read local-tls:PORT:ready on the Talin hub connection test device, then update TV connection setup in Talin. Current deployed endpoint is https://192.168.1.3:42047. The browser cannot discover arbitrary LAN ports. A TV IP change requires an updated scoped server certificate, CSP allowlist and endpoint. No unsupported port-binding bypass is attempted.

Physical Safari 15/iPad Air 2 certificate import, touch targets, cross-origin client-certificate selection, PC-off control, background timers and cold offline reopening remain owner acceptance checks. If Safari cannot authenticate, controls remain disabled; do not bypass certificate errors. The one-time commissioning helper serves only a strongly password-encrypted PKCS#12 identity for 30 minutes, displays its DPAPI-protected password only over loopback on the PC, logs no requests, and exposes no appliance controls. Stop it after pairing. It is not a runtime dependency.

Run test.lua with Fengari (23 boundary/idempotency/timer checks). App tests cover allowed endpoint validation, malformed reports, stale/offline controls and separation of hub acknowledgement from TV state. Real TLS negative tests and provider checks are separate from mocks.

Primary references: [Edge LAN/server restrictions](https://developer.smartthings.com/docs/devices/hub-connected/lan), [TLS API](https://developer.smartthings.com/docs/edge-device-drivers/ssl.html), [native Rules](https://developer.smartthings.com/docs/automations/rules), [device persistence limitations](https://developer.smartthings.com/docs/edge-device-drivers/device.html), [SmartThings free CLI/Rules policy](https://blog.smartthings.com/smartthings-updates/smartthings-api-additional-details-for-developers-and-business-partners/), [Apple certificate management](https://support.apple.com/en-gb/guide/deployment/depb5eff8914/web).
