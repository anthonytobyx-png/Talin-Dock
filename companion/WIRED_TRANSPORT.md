# Wired iPad transport research — 6 November 2026

Target: the existing iPad Air 2 / iPadOS 15, Windows PC, free private household use, controls inside Talin, one household sign-in, and Home still usable with the PC off. Research is not a working USB integration or a latency measurement.

## Findings from upstream projects

| Option | Verified documentation | Fit for Talin |
| --- | --- | --- |
| [spacedesk direct USB](https://manual.spacedesk.net/iOSUSBCableConnection.html) | Direct iOS USB uses its native Viewer and Apple Mobile Device Service/iTunes. The current [App Store listing](https://apps.apple.com/us/app/spacedesk-usb-display-for-pc/id1069217220) requires iPadOS 15. [Private non-commercial use is free](https://www.spacedesk.net/licensing/); the driver has an expiry requiring a free newer driver. | Plausible existing-cable option for displaying a Windows browser running Talin. It is a second display with desktop input, not a USB network API for the standalone iPad web app. It does not remove Talin's cloud polling delay. No installation or actual iPad test has been performed. It exposes broader desktop viewing/input than the current allowlisted companion. |
| [EternalMonitor](https://github.com/sidebandstudio/EternalMonitor) | MIT, Windows-to-native-iPad screen streaming over USB/Wi-Fi. Upstream currently requires iPadOS 17 and TestFlight. | Incompatible with the target iPadOS 15. Not selected. |
| [Windows iPhone USB reverse tethering](https://github.com/0xbaksa/iphone-usb-reverse-tethering-windows) | Experimental USB CDC-NCM networking, tested on one iPhone PID 12A8 / iOS 17-era descriptors / Windows 11 build 26200. Installs a filter driver, detaches Apple's lower filter, disables photo import and configures Internet Connection Sharing. | iPad Air 2/iPadOS 15 compatibility is unproven. No script or driver was installed. Requires device-specific inspection before considering any experiment. Networking alone would still not replace the current cloud transport. |
| [libusbmuxd / iproxy](https://github.com/libimobiledevice/libusbmuxd) | Open-source port forwarding from a host port to a listening iOS-device port. | A useful building block for a native iPad app, not a ready reverse tunnel from Safari to the Windows companion. No jailbreaking or developer tunnel was attempted. |
| [Touch Portal](https://touchportal.com/faq.php) | Its FAQ explicitly excludes iOS USB mode; USB support is Windows/Android. | Not the requested wired iPad route. |
| Lightning Ethernet | An adapter can provide the iPad with an ordinary wired network; see this [iPad Ethernet setup](https://k-series-support.lightspeedhq.com/hc/en-us/articles/13510971075611-Connecting-an-iPad-via-Ethernet-adapter). | A possible future transport for the standalone Safari app if suitable hardware is already available. It is not an ordinary Lightning-to-PC data cable. No hardware was bought or assumed present. |

Safari does not expose WebUSB: [MDN's browser compatibility source](https://github.com/mdn/browser-compat-data/blob/main/api/USB.json) records Safari/iOS support as false. Therefore the hosted Talin page cannot simply claim a USB interface with JavaScript. Native screen-streaming applications can use USB mechanisms that the webpage cannot.

## Current state and next acceptance gate

The existing outbound HTTPS companion remains active. On 6 November the deployed Computer page received current measured CPU/memory/NVIDIA/audio reports; both per-Windows-account identities were listed. Its visible cloud request time is not command latency, and active sampling remains about five seconds. A cable carrying the same cloud traffic would not remove that polling interval.

No Apple/iPad/spacedesk PnP device or Apple/spacedesk service was found during this inspection. The owner has been asked only to connect and unlock the iPad so its actual available interfaces can be inspected. No Trust This Computer approval, driver replacement, screen-capture expansion, firewall rule, certificate change or paid option has been accepted.

For the standalone Talin experience, retain the working cloud fallback while evaluating an authenticated direct local transport. Such a transport must enforce computer-specific authorization, session isolation, command bounds and revocation; restrict browser origins; validate TLS; avoid exposing the companion's cloud token; and measure real command acknowledgement latency. A local link must not make Home depend on the PC. Ethernet and Wi-Fi can carry the same local protocol; a verified USB network could too. None of those faster local routes is implemented or claimed working yet.

A screen-streaming alternative must be labelled as such. Do not silently replace the standalone iPad Home app with a Windows screen or claim that installing a display driver makes existing Talin commands local. Physical iPad setup remains deferred except for the requested read-only cable feasibility inspection.
