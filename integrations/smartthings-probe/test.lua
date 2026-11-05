-- Security checks run in Lua with mocked hub APIs; no network or credentials.
local passed = 0
package.loaded["roots"] = "public-root-fixture"
for _, scenario in ipairs({"success", "tcp-failure", "chain-failure", "missing-certificate-api", "missing-hostname-api", "wrong-hostname", "http-error"}) do
  local emitted, sent
  local conn = {}
  function conn:settimeout() end
  function conn:connect() if scenario == "tcp-failure" then return nil end return 1 end
  function conn:sni() end -- LuaSec returns no result on successful SNI setup.
  function conn:dohandshake() if scenario == "chain-failure" then return nil end return true end
  function conn:close() end
  function conn:send(request) sent = request return #request end
  function conn:receive() return scenario == "http-error" and "HTTP/1.1 503 Unavailable" or "HTTP/1.1 200 OK" end
  if scenario ~= "missing-certificate-api" then
    function conn:getpeercertificate()
      if scenario == "missing-hostname-api" then return {} end
      return { checkhost = function(_, host) assert(host == "talin-dock.pages.dev") return scenario ~= "wrong-hostname" end }
    end
  end
  package.loaded["cosock"] = { socket = { tcp = function() return conn end }, ssl = {
    wrap = function(sock, config)
      assert(config.verify == "peer" and config.cafile == "public-root-fixture")
      assert(config.options[6] == "no_tlsv1_1" or config.options[5] == "no_tlsv1_1")
      return sock
    end,
  }, spawn = function(callback) callback() end }
  package.loaded["st.capabilities"] = { contactSensor = { contact = {
    closed = function() return "closed" end, open = function() return "open" end,
  } }, refresh = { ID = "refresh", commands = { refresh = { NAME = "refresh" } } } }
  package.loaded["st.driver"] = function(_, config)
    local driver = { call_with_delay = function() end, run = function(self) config.lifecycle_handlers.init(self, {
      emit_event = function(_, value) emitted = value end,
    }) end }
    return driver
  end
  dofile("integrations/smartthings-probe/src/init.lua")
  assert(emitted == (scenario == "success" and "closed" or "open"), scenario)
  if scenario ~= "success" and scenario ~= "http-error" then assert(sent == nil, scenario .. " sent data before verified TLS") end
  if sent then assert(sent == "GET /api/session HTTP/1.1\r\nHost: talin-dock.pages.dev\r\nConnection: close\r\n\r\n") end
  passed = passed + 1
end
print(passed .. " read-only hub probe security checks passed")
