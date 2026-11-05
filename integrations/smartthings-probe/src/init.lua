-- Read-only runtime probe. No tokens, household readings or appliance commands.
local Driver = require "st.driver"
local capabilities = require "st.capabilities"
local cosock = require "cosock"
local socket = cosock.socket
local ssl = cosock.ssl
local diagnostic = capabilities["talentlaugh16714.talinHubDiagnostic"]
local HOST = "talin-dock.pages.dev"

local function probe(driver, device)
  local function report(value)
    if device:supports_capability(diagnostic) then
      device:emit_event(diagnostic.stage(value))
    end
  end
  device:emit_event(capabilities.contactSensor.contact.open())
  report("boot")
  cosock.spawn(function()
    local conn
    local stage = "tcp"
    local function progress(value)
      stage = value
      report(value)
    end
    local ok = pcall(function()
      progress("roots")
      local ROOTS = require "roots"
      progress("tcp")
      conn = assert(socket.tcp())
      conn:settimeout(8)
      assert(conn:connect(HOST, 443))
      progress("tls-wrap")
      conn = assert(ssl.wrap(conn, {
        mode = "client", protocol = "any", verify = "peer",
        options = {"all", "no_sslv2", "no_sslv3", "no_tlsv1", "no_tlsv1_1"},
        cafile = ROOTS,
      }))
      conn:settimeout(8)
      progress("tls-handshake")
      conn:sni(HOST)
      assert(conn:dohandshake())
      -- Fail closed if this hub lacks certificate/hostname inspection.
      progress("certificate-api")
      assert(type(conn.getpeercertificate) == "function")
      local cert = assert(conn:getpeercertificate())
      progress("hostname-api")
      assert(type(cert.checkhost) == "function")
      progress("hostname-check")
      assert(cert:checkhost(HOST))
      progress("public-http")
      assert(conn:send("GET /api/session HTTP/1.1\r\nHost: " .. HOST .. "\r\nConnection: close\r\n\r\n"))
      local status = assert(conn:receive("*l"))
      assert(status:match("^HTTP/1%.[01] 200 "))
    end)
    if conn then pcall(function() conn:close() end) end
    report(ok and "verified" or (stage .. ":failed"))
    device:emit_event(ok and capabilities.contactSensor.contact.closed() or capabilities.contactSensor.contact.open())
    print(ok and "Talin probe: verified TLS and public API available" or ("Talin probe: unavailable at " .. stage .. "; no device control enabled"))
  end, "Talin read-only HTTPS probe")
end
local function discovery(driver)
  for _, device in ipairs(driver:get_devices()) do
    if device.device_network_id == "talin-hub-https-probe" then return end
  end
  driver:try_create_device({ type="LAN", device_network_id="talin-hub-https-probe",
    label="Talin hub connection test", profile="talin-hub-probe",
    manufacturer="Talin Dock", model="HTTPS diagnostic" })
end
local driver = Driver("talin-hub-https-probe", {
  discovery = discovery,
  lifecycle_handlers = {
    init = function(driver, device)
      device:try_update_metadata({ profile = "talin-hub-probe" })
      probe(driver, device)
    end,
    infoChanged = probe,
  },
  capability_handlers = { [capabilities.refresh.ID] = { [capabilities.refresh.commands.refresh.NAME] = probe } },
})
driver:call_with_delay(2, function() discovery(driver) end, "create-read-only-probe")
driver:run()
