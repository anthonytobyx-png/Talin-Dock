# iPad USB second display setup

Verified on 6 November 2026: the iPad is an actual USB-connected extended Windows display, with touchscreen control. The owner confirmed moving an ordinary window onto it and controlling it by touch. Talin layout changes are deferred to a later task.

## Installed and verified

- Official Apple Mobile Device Support 19.4.0.10 installed successfully. Its USB service is running and listens only on loopback. Full iTunes, Apple Music, subscriptions and paid services were not installed or activated for this setup.
- Official spacedesk Windows DRIVER 2.2.35 installed with exit code zero, without requiring a restart. Its signature verified as Datronicsoft Inc.; the Apple package signature and winget SHA-256 also verified. The owner explicitly approved the free personal/non-commercial license and reports the free iPad Viewer installed.
- Normal Windows administrator consent was required. The first spacedesk attempt was cancelled before installation; the owner then requested retry and the approved installation succeeded. No Windows security prompt was automated or bypassed.
- A program-scoped inbound Windows Firewall Block rule applies to the spacedesk service on all profiles. The installer was passed WIXUI_SPECIALDLGCHECKBOX=0 to omit its normal firewall exception. Other rules were preserved. No port forwarding or network-sharing fallback was configured. The service has a TCP listener, but inbound network access is blocked; do not describe it as having no listener.
- The official console reports iOS USB ON, one connected USB display, zero connected network displays, and the server connected. No device identifiers, pairing records or passwords are included in this document.
- Windows reports the original primary display at 1920 x 1080, origin (0,0), and an additional 2048 x 1536 display at (1920,0). This confirms extended desktop mode to the right, rather than duplication. The existing main screen remains primary.
- Native audio readback retained the previous speaker device, volume and mute state. The iPad was not made the sound output. No household preferences, provider credentials or companion pairing were changed.
- The spacedesk Windows service is configured for automatic startup. An actual reboot and unplug/reconnect cycle were not tested; do not claim those acceptance results or a measured frame rate/USB latency.

## Everyday use

Keep the USB data cable connected, unlock the iPad and open spacedesk Viewer. If its USB connection prompt appears, tap Connect. Move a Windows window past the main screen's right edge to use the iPad. Touch input was physically confirmed by the owner. The Windows PC must remain on for the extended display.

Use only the free personal/non-commercial license. The installed console currently states its free-driver expiry is 31 December 2027; the vendor's free-use model requires installing a newer free driver after expiry. Do not activate Business purchases, subscriptions, paid plans or payment trials.

The USB display software is separate from Talin's Windows companion. It streams a Windows screen and touch input. It does not make Talin's existing cloud device/PC commands travel over USB. The standalone Safari Home app remains independent of the PC and retains its own settings. Windows browser sign-in is separate from the Safari session; never copy cookies or extract passwords to avoid normal sign-in.

Talin's dashboard layout can be changed in the web app without reinstalling the display driver. Changing layout, Windows screen arrangement, orientation or audio routing is not part of this completed installation. Physical Safari acceptance, Samsung's separate one-time iPad identity/trust setup, and calendar integration remain separate tasks.

Primary references: [official USB instructions](https://manual.spacedesk.net/iOSUSBCableConnection.html), [free private-use licensing](https://www.spacedesk.net/licensing/), [license terms](https://www.spacedesk.net/license-terms-for-spacedesk-viewer-on-windows-android-and-ios-devices/), [official driver download](https://www.spacedesk.net/download/), [iPad Viewer](https://apps.apple.com/app/id1069217220).
