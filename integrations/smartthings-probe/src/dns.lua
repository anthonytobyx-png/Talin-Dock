-- Bounded DNS A lookup. DNS answers are untrusted; HTTPS still verifies CA and hostname.
local M = {}
local cache = {}
local function u16(s, p)
  assert(p + 1 <= #s, "truncated DNS field")
  return s:byte(p) * 256 + s:byte(p + 1)
end
local function bytes16(v) return string.char(math.floor(v / 256), v % 256) end
local function name(s, p, seen, depth)
  seen, depth = seen or {}, depth or 0
  assert(depth < 16 and not seen[p], "DNS name loop")
  seen[p] = true
  local labels, size = {}, 0
  while true do
    local len = assert(s:byte(p), "truncated DNS name")
    if len == 0 then return table.concat(labels, "."):lower(), p + 1 end
    if len >= 192 then
      local pointer = (len - 192) * 256 + assert(s:byte(p + 1)) + 1
      local tail = name(s, pointer, seen, depth + 1)
      labels[#labels + 1] = tail
      return table.concat(labels, "."):lower(), p + 2
    end
    assert(len <= 63 and p + len <= #s, "invalid DNS label")
    local label = s:sub(p + 1, p + len)
    assert(not label:find("[^%w_%-]"), "invalid DNS name")
    size = size + len + 1
    assert(size <= 254, "long DNS name")
    labels[#labels + 1], p = label, p + len + 1
  end
end
function M.query(host, id)
  assert(#host <= 253 and host:match("^[%w%.%-]+$"), "invalid DNS host")
  local labels = {}
  for part in host:gmatch("[^.]+") do
    assert(#part > 0 and #part <= 63, "invalid DNS label")
    labels[#labels + 1] = string.char(#part) .. part
  end
  return bytes16(id) .. "\1\0\0\1\0\0\0\0\0\0" .. table.concat(labels) .. "\0\0\1\0\1"
end
local function publicIPv4(a, b, c)
  return not (a == 0 or a == 10 or a == 127 or a >= 224 or
    (a == 169 and b == 254) or (a == 172 and b >= 16 and b <= 31) or
    (a == 192 and b == 168) or (a == 100 and b >= 64 and b <= 127) or
    (a == 192 and b == 0) or (a == 198 and (b == 18 or b == 19)) or
    (a == 198 and b == 51 and c == 100) or (a == 203 and b == 0 and c == 113))
end
function M.parse(packet, host, id)
  assert(#packet >= 12 and #packet <= 4096, "invalid DNS length")
  assert(u16(packet, 1) == id, "DNS transaction mismatch")
  local flags = u16(packet, 3)
  assert(math.floor(flags / 32768) == 1 and math.floor(flags / 2048) % 16 == 0 and
    math.floor(flags / 512) % 2 == 0 and flags % 16 == 0, "DNS response error")
  local count = u16(packet, 7)
  assert(u16(packet, 5) == 1 and count > 0 and count <= 32, "invalid DNS count")
  local question, p = name(packet, 13)
  assert(question == host:lower() and u16(packet, p) == 1 and u16(packet, p + 2) == 1, "DNS question mismatch")
  p = p + 4
  local records = {}
  for _ = 1, count do
    local owner
    owner, p = name(packet, p)
    assert(p + 9 <= #packet, "truncated DNS record")
    local kind, class, length = u16(packet, p), u16(packet, p + 2), u16(packet, p + 8)
    local ttl = u16(packet, p + 4) * 65536 + u16(packet, p + 6)
    p = p + 10
    assert(p + length - 1 <= #packet, "truncated DNS data")
    if class == 1 and kind == 5 then
      local target, finish = name(packet, p)
      assert(finish <= p + length, "invalid DNS alias")
      records[#records + 1] = {owner = owner, target = target, ttl = ttl}
    elseif class == 1 and kind == 1 and length == 4 then
      local a, b, c, d = packet:byte(p, p + 3)
      if publicIPv4(a, b, c) then
        records[#records + 1] = {owner = owner, ip = table.concat({a, b, c, d}, "."), ttl = ttl}
      end
    end
    p = p + length
  end
  local allowed, minimum = {[host:lower()] = true}, 3600
  for _ = 1, 16 do
    for _, record in ipairs(records) do
      if allowed[record.owner] then
        minimum = math.min(minimum, record.ttl)
        if record.ip then return record.ip, math.max(1, minimum) end
        if record.target then allowed[record.target] = true end
      end
    end
  end
  error("no public DNS A answer")
end
function M.resolve(host, socket, now, resolvers)
  now = now or os.time()
  if cache[host] and cache[host].expires > now then return cache[host].ip end
  local lastError
  for _, resolver in ipairs(resolvers or {"1.1.1.1"}) do
    local udp
    local ok, ip, ttl = pcall(function()
      udp = assert(socket.udp())
      udp:settimeout(3)
      assert(udp:setpeername(resolver, 53))
      local id = math.random(0, 65535)
      assert(udp:send(M.query(host, id)))
      return M.parse(assert(udp:receive(4096)), host, id)
    end)
    if udp then pcall(function() udp:close() end) end
    if ok then
      cache[host] = {ip = ip, expires = now + ttl}
      return ip
    end
    lastError = ip
  end
  error("DNS lookup unavailable: " .. tostring(lastError))
end
return M
