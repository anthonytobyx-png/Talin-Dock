local cosock = require "cosock"
local json = require "st.json"
local origin = require("bridge").origin
local started = {}
local M = {}
function M.start(device, secrets, api, report)
  if started[device.id] then report("local-tls:" .. started[device.id] .. ":ready") return end
  cosock.spawn(function()
    local listener
    local ok = pcall(function()
      listener = assert(cosock.socket.tcp())
      listener:settimeout(5)
      assert(listener:bind("0.0.0.0", 0))
      assert(listener:listen(2))
      local _, port = listener:getsockname()
      assert(type(port) == "number")
      started[device.id] = port
      report("local-tls:" .. port .. ":ready")
      local active = 0
      while true do
        listener:settimeout(nil)
        local client = assert(listener:accept())
        if active >= 4 then client:close() else
          active = active + 1
          cosock.spawn(function()
            local stream = client
            pcall(function()
              stream = assert(cosock.ssl.wrap(client, {
                mode = "server", protocol = "any", verify = {"peer", "fail_if_no_peer_cert"},
                options = {"all", "no_sslv2", "no_sslv3", "no_tlsv1", "no_tlsv1_1"},
                cafile = secrets.ca, certificates = {{certificate = secrets.certificate, key = secrets.key}},
              }))
              stream:settimeout(5)
              assert(stream:dohandshake())
              local deadline = os.time() + 5
              local line = assert(stream:receive("*l"))
              assert(#line <= 128)
              local method, path = line:match("^(%u+) (/v1/[%w/]+) HTTP/1%.[01]$")
              assert(method and path)
              local headers, size, done = {}, 0, false
              for _ = 1, 32 do
                assert(os.time() <= deadline)
                line = assert(stream:receive("*l"))
                size = size + #line
                assert(size <= 4096)
                if line == "" then done = true break end
                local key, value = line:match("^([%w%-]+):%s*(.-)%s*$")
                assert(key and not headers[key:lower()])
                headers[key:lower()] = value
              end
              assert(done and not headers["transfer-encoding"])
              local length = headers["content-length"] or "0"
              assert(length:match("^%d+$") and tonumber(length) <= 1024)
              length = tonumber(length)
              local data
              if length > 0 then
                assert(os.time() <= deadline)
                local body = assert(stream:receive(length))
                data = json.decode(body)
              end
              local status, result = api.handle(method, path, headers, data)
              local body = status == 204 and "" or json.encode(result)
              assert(stream:send("HTTP/1.1 " .. status .. " Result\r\nContent-Type: application/json\r\nCache-Control: no-store\r\nConnection: close\r\nAccess-Control-Allow-Origin: " .. origin .. "\r\nAccess-Control-Allow-Credentials: true\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type, X-Talin-Request\r\nAccess-Control-Allow-Private-Network: true\r\nVary: Origin\r\nContent-Length: " .. #body .. "\r\n\r\n" .. body))
            end)
            pcall(function() stream:close() end)
            active = active - 1
          end, "Talin authenticated LAN client")
        end
      end
    end)
    if not ok then
      started[device.id] = nil
      if listener then pcall(function() listener:close() end) end
      report("local-tls:unavailable")
    end
  end, "Talin authenticated LAN endpoint")
end
return M
