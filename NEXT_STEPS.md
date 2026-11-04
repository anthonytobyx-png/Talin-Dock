# Next steps

1. Review the Phase 1 UI, preserved specification and requirement revisions. Compare against Main.dc.html/Portrait.dc.html or supplied screenshots when available.
2. Run the physical iPad checklist, especially storage, touch targets, font layout, memory and HTTPS Home Screen installation. Add offline shell caching/update tests and PNG manifest sizes before treating this as an offline PWA.
3. Select location and a weather service with acceptable free terms, attribution, rate limits and privacy. Implement bounded requests, cache age and stale/offline handling using WeatherProvider. No paid API keys.
4. Decide real authentication/household authorisation and calendar sharing policy before adding private data. Select provider(s), implement secure OAuth callbacks/token revocation and read-only scopes first. Replace OS-calendar requirements.
5. Verify Samsung UE43U8000F control route, standby behaviour and read-back on the LAN; separately evaluate free SmartThings cloud access. Decide whether an optional low-power bridge is justified. Do not expose a LAN control service publicly.
6. Verify Tuya model/data points and durable free access; implement humidity-only readings, timestamps and measured stale thresholds. Add history only after deciding where collection runs while Safari sleeps.
7. Wire both adapters to shared live device state, implement integration health, bounded read backoff and safe command acknowledgement. Enable each control only after a reported capability and route-specific tests.
8. Add configuration backup and schema migrations, room/device management and widget reorder/resize. Keep tokens and private content out of browser preference storage.
9. Add capability-aware scenes only after actual control paths are reliable. Later consider speech, computer companions and display hand-off separately; none should be needed for Home.
10. After owner approval, deploy only the reviewed static build on Cloudflare Pages Free, validate security headers and monitor free-tier quotas. Never add paid services or expose control endpoints without approval.
