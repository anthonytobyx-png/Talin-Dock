# SmartThings hub HTTPS probe

A read-only Edge driver for testing this TV hub before building a control bridge. It creates one virtual contact sensor named Talin hub connection test, makes one outbound TLS request on initialization/refresh, and opens no inbound listener. Closed means CA verification, hostname verification and HTTP 200 from the fixed public Talin session endpoint succeeded. Open means unavailable or unsupported. It never sends account tokens, reads household data or controls physical devices. No recurring polling, paid API plan or trial is involved.

The bundled public root certificates come from the official Node.js 24.20.0 trust bundle (GTS and ISRG roots). TLS 1.0/1.1, certificate bypasses, redirects and unverified hostname fallbacks are prohibited. Unsupported runtime certificate methods fail closed. A successful probe does not establish TV control or operation with the TV screen off.

Install only within the owner’s authorised diagnostic scope. Use Samsung's official CLI and a private owner driver channel. This driver is diagnostic source, not an enabled Talin adapter.

## Owner-only channel notice

This channel is for the household owner’s diagnostic setup only. No invitations are published, no third party receives access, and no subscription, payment or additional legal agreement is created. The diagnostic performs only the fixed public request described above. The contact sensor is a diagnostic result, not a physical door or a verified TV-control connection.

Samsung’s CLI excludes loose files outside src/profiles/config. The CA bundle is therefore an included Lua module, supplied as PEM contents to ssl.wrap. The driver schedules creation of its sole diagnostic device on startup; phone Scan nearby can be required to start an unassigned driver. The source tests use Fengari via npm and make no network requests.

Primary references: [SmartThings SSL configuration](https://developer.smartthings.com/docs/edge-device-drivers/ssl.html), [driver lifecycle and timers](https://developer.smartthings.com/docs/edge-device-drivers/driver.html), and [cosock TLS wrapper](https://github.com/cosock/cosock/blob/master/cosock/ssl.lua). Actual support for certificate inspection must still be verified on the TV hub.

The driver requires both lan and discovery permissions. Changing permissions requires a new packageKey, so the corrected diagnostic uses talin-hub-https-probe-v2. A managed LAN diagnostic is the runtime test; a cloud-created VIRTUAL record is insufficient evidence that a Lua driver runs. The earlier empty VIRTUAL setup record is labelled inactive.

An optional read-only custom capability reports literal startup/failure stages through the authenticated cloud status API. Its creation definition is capability.json; create it with the official CLI and replace the generated capability ID in src/init.lua and profiles/probe.yml for a different household. The current generated ID is public capability metadata, not a credential. Device profile updates are requested by the driver for its own diagnostic only. No debugger trust exception, account token, appliance action or repeated polling is used.

## Actual TV-hub result (5 November 2026)

The managed LAN probe runs. Native hostname resolution stalled; bounded DNS through the verified household router (192.168.1.1) succeeded. The module checks transaction/question/response fields, compression bounds, CNAME chains and TTLs, and accepts public IPv4 answers only. DNS remains untrusted: TLS requires CA and hostname verification. Adjust the explicit router address for another household.

Public TCP returned Network is unreachable. This matches Samsung's intentional LAN private-address restriction. Do not evade it; outbound Cloudflare polling on this hub is not supported. See [Samsung engineer explanation](https://community.smartthings.com/t/edge-drivers-private-addresses-lan/257846/11) and [permission documentation](https://developer.smartthings.com/docs/devices/hub-connected/driver-components-and-structure).

A separate private local TLS experiment did not prove a listener or client authentication and is excluded from this public package. No local_config, private keys or inbound endpoint is included. Refresh is manual; failure leaves contact open. This tile is neither TV power nor a physical door sensor.

Run Fengari with test.lua and test-dns.lua: 8 TLS/capability failure paths and 19 DNS checks. Mocks do not establish hardware TLS support. Native TV Off/On and provider reads were separately verified with the owner's official CLI session. CLI credentials are not repurposed as a hosted application integration.
