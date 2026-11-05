-- Read-only runtime probe. No tokens, household readings or appliance commands.
local Driver = require "st.driver"
local capabilities = require "st.capabilities"
local cosock = require "cosock"
local socket = cosock.socket
local ssl = cosock.ssl
local HOST = "talin-dock.pages.dev"

local function probe(driver, device)
  cosock.spawn(function()
    local conn
    local stage = "tcp"
    local ok = pcall(function()
      conn = assert(socket.tcp())
      conn:settimeout(8)
      assert(conn:connect(HOST, 443))
      stage = "tls-wrap"
      conn = assert(ssl.wrap(conn, {
        mode = "client", protocol = "any", verify = "peer",
        options = {"all", "no_sslv2", "no_sslv3", "no_tlsv1", "no_tlsv1_1"},
        cafile = "./roots.pem",
      }))
      conn:settimeout(8)
      stage = "tls-handshake"
      conn:sni(HOST)
      assert(conn:dohandshake())
      -- Fail closed if this hub lacks certificate/hostname inspection.
      stage = "certificate-api"
      assert(type(conn.getpeercertificate) == "function")
      local cert = assert(conn:getpeercertificate())
      stage = "hostname-api"
      assert(type(cert.checkhost) == "function")
      stage = "hostname-check"
      assert(cert:checkhost(HOST))
      stage = "public-http"
      assert(conn:send("GET /api/session HTTP/1.1\r\nHost: " .. HOST .. "\r\nConnection: close\r\n\r\n"))
      local status = assert(conn:receive("*l"))
      assert(status:match("^HTTP/1%.[01] 200 "))
    end)
    if conn then pcall(function() conn:close() end) end
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
  lifecycle_handlers = { init = probe },
  capability_handlers = { [capabilities.refresh.ID] = { [capabilities.refresh.commands.refresh.NAME] = probe } },
})
driver:run()
