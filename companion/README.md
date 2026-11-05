# Talin Windows companion

A user-local, optional Windows companion. Home never requires this process. The PC makes outbound HTTPS requests to the existing Talin Pages API; the hosted iPad browser uses its usual household login. No LAN ports, router changes, separate widget passwords or extra iPad certificate are needed for this computer route. Internet is required; USB, direct LAN transport and macOS are not implemented.

## Build and prepare

Use the current free .NET 10 LTS SDK from Microsoft. The project is Windows-only and dependencies are locked. Do not use the obsolete system .NET 6 runtime for this application.

    dotnet restore companion/windows/Talin.Companion.csproj --locked-mode
    dotnet publish companion/windows/Talin.Companion.csproj -c Release -r win-x64 --self-contained true

Copy the publish output to the current Windows user's LocalAppData/TalinDock/app. Run Talin.Companion.exe --prepare. It creates an owner-only directory, DPAPI-encrypted companion.dpapi and a pairing-request.json containing only a computer ID, friendly name, platform and one-way token verifier. Never upload the DPAPI state, print its decrypted token or put it in a browser. Import the public pairing request in authenticated Talin Settings -> Household connections -> Computer connections after reviewing the access scope. Starting an unpaired/revoked companion stops with HTTP 401; it does not enroll itself.

The normal executable uses the fixed https://talin-dock.pages.dev origin, default system TLS verification and no redirects. Run it under the desktop Windows user, not an elevated system service. An optional current-user Run entry may be enabled only as part of the approved PC pairing; quote the executable's absolute path and pass no credentials on the command line. To stop automatic startup, remove that one TalinDock Companion Run value. Revoke access in Talin Settings to invalidate its token and remove its latest private report. Do not delete unrelated Windows startup entries or household data.

The isolated --development option requires a separately prepared state directory and permits only loopback http://127.0.0.1:8790. It is solely for the disposable local test runtime; production credentials are bound to the HTTPS origin. --probe prints actual hardware/audio metadata without credentials; --audio-self-test briefly changes master volume by one percentage point and restores original volume/mute in finally. It never captures microphone audio.

## Scope and privacy

Measured CPU comes from Windows system-time deltas and memory from GlobalMemoryStatusEx. Optional NVIDIA data comes from the installed nvidia-smi executable. CPU temperature is not estimated. Windows Core Audio supplies master volume, default multimedia output, up to 32 sessions on that output, and default communications-microphone mute. Process names are reported; paths and titles are not. Audio-session identifiers are hashed before sending. No recordings, playback titles, screenshots or file contents are sent. The cloud stores only the latest snapshot and seven days of bounded command records; revocation clears the snapshot. Household profiles are preferences, not distinct access identities.

The ten advertised actions are masterVolume, masterMute, sessionVolume, sessionMute, microphoneMute, mediaPlayPause, mediaPrevious, mediaNext, showDesktop and taskManager. Native audio writes confirm readback. Windows input acknowledgement is not proof of a player's state. Task Manager launches only the fixed Windows system executable; there is no arbitrary program path or shell text from the network. Lock, sleep, screenshots and output switching stay unavailable.

Reports are around five seconds while watched, fifteen seconds idle. Browser polling pauses when hidden. A 45-second watch lease automatically expires. Stale/absent reports disable controls after thirty seconds. Commands are bounded, capability-checked and limited to twenty/minute/computer and one thousand/day/household. Atomic claims and a persisted local last-command ID prevent automatic replay after crashes. Missing/late acknowledgements are unknown rather than successful. A command already executing can finish during revocation. Free Cloudflare quotas are shared with the rest of Talin; limit exhaustion fails unavailable rather than activating a paid plan.

## Validation

Local native testing verified CPU/memory/NVIDIA data, audio enumeration, direct master-volume write/readback, and the full test Pages/D1 queue -> real Windows companion -> Core Audio -> acknowledgement/report path. Original master volume/mute were restored; per-session volume was tested without changing its level. No media keys, desktop shortcuts, microphone unmute, sleep or lock were automatically triggered. Tests use a disposable test-only cloud identity and database; they do not authenticate against production. Windows CI builds the companion; app tests cover privacy normalization, token isolation, commands claimed once, CSRF, revocation, acknowledgement UI and offline guards. Physical iPad acceptance is deferred.

Dependencies: [NAudio](https://github.com/naudio/NAudio) (MIT, Mark Heath and contributors), [Microsoft .NET](https://dotnet.microsoft.com/) and System.Security.Cryptography.ProtectedData. NuGet package/license metadata accompanies the build dependency records. Do not claim unsigned locally built binaries are Microsoft-signed. Primary references: [Core Audio sessions](https://learn.microsoft.com/en-us/windows/win32/api/audiopolicy/nf-audiopolicy-iaudiosessionmanager-getsimpleaudiovolume), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).
