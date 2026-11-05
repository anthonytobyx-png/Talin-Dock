# SmartThings hub HTTPS probe

A read-only Edge driver for testing this TV hub before building a control bridge. It creates one virtual contact sensor named Talin hub connection test, makes one outbound TLS request on initialization/refresh, and opens no inbound listener. Closed means CA verification, hostname verification and HTTP 200 from the fixed public Talin session endpoint succeeded. Open means unavailable or unsupported. It never sends account tokens, reads household data or controls physical devices. No recurring polling, paid API plan or trial is involved.

The bundled public root certificates come from the official Node.js 24.20.0 trust bundle (GTS and ISRG roots). TLS 1.0/1.1, certificate bypasses, redirects and unverified hostname fallbacks are prohibited. Unsupported runtime certificate methods fail closed. A successful probe does not establish TV control or operation with the TV screen off.

Install only within the owner’s authorised diagnostic scope. Use Samsung's official CLI and a private owner driver channel. This driver is diagnostic source, not an enabled Talin adapter.

## Owner-only channel notice

This channel is for the household owner’s diagnostic setup only. No invitations are published, no third party receives access, and no subscription, payment or additional legal agreement is created. The diagnostic performs only the fixed public request described above. The contact sensor is a diagnostic result, not a physical door or a verified TV-control connection.

Samsung’s CLI excludes loose files outside src/profiles/config. The CA bundle is therefore an included Lua module, supplied as PEM contents to ssl.wrap. The driver schedules creation of its sole diagnostic device on startup; phone Scan nearby can be required to start an unassigned driver. The source tests use Fengari via npm and make no network requests.
