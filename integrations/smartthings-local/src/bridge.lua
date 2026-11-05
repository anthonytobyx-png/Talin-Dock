-- Authenticated LAN request boundary. No account tokens or network destinations.
local M = {}
local ORIGIN = "https://talin-dock.pages.dev"
local function identifier(s)
  return type(s) == "string" and #s >= 16 and #s <= 64 and not s:find("[^%w%-]")
end
local function power(s) return s == "on" or s == "off" end
function M.new(store, emit, schedule, clock)
  local state = store.get() or { requests = {}, timers = {}, reportedPower = "unknown" }
  local function save() store.set(state) end
  local function request(action, id)
    if state.requests[id] then return false end
    local count = 0
    for key, stamp in pairs(state.requests) do
      if clock() - stamp > 86400 then state.requests[key] = nil else count = count + 1 end
    end
    if count >= 256 then error("request limit") end
    state.requests[id] = clock()
    save() -- Reserve before publishing; uncertain requests are never replayed.
    emit(action)
    return true
  end
  local function arm(timer)
    schedule(math.max(1, timer.dueAt - clock()), function()
      if timer.status ~= "pending" then return end
      if clock() < timer.dueAt then arm(timer) return end
      if clock() - timer.dueAt > 120 then timer.status = "expired" save() return end
      timer.status = "claimed"
      save()
      local ok = pcall(request, timer.action, timer.id)
      timer.status = ok and "sent" or "unknown"
      save()
    end)
  end
  for _, timer in ipairs(state.timers) do
    if timer.status == "claimed" then timer.status = "unknown" save() end
    if timer.status == "pending" then arm(timer) end
  end
  local api = {}
  function api.report(value)
    if not power(value) then return end
    state.reportedPower, state.reportedAt = value, clock()
    save()
  end
  function api.handle(method, path, headers, data)
    if method == "OPTIONS" then
      if headers.origin ~= ORIGIN or headers["access-control-request-method"] ~= "POST" then return 403, {} end
      return 204, {}
    end
    if method == "GET" and path == "/v1/status" then
      return 200, { version = 1, reportedPower = state.reportedPower,
        reportedAt = state.reportedAt or 0, timers = state.timers,
        source = "SmartThings rule; underlying device sample time unavailable" }
    end
    -- A CORS-safelisted POST avoids credential-free preflight on Safari 15.
    -- Exact Origin is mandatory; client identity is authenticated by TLS.
    if method ~= "POST" or headers.origin ~= ORIGIN or
      headers["content-type"] ~= "text/plain" or type(data) ~= "table" or not identifier(data.id) then return 403, {} end
    if path == "/v1/power" and (power(data.action) or data.action == "status") then
      local ok, fresh = pcall(request, data.action, data.id)
      if not ok then return 503, { error = "Request outcome unknown; do not automatically retry." } end
      return 202, { accepted = true, duplicate = not fresh, deviceConfirmed = false }
    end
    if path == "/v1/timers" and power(data.action) and type(data.seconds) == "number" and
      data.seconds == math.floor(data.seconds) and data.seconds >= 60 and data.seconds <= 86400 then
      for _, timer in ipairs(state.timers) do if timer.id == data.id then return 200, timer end end
      local pending, retained = 0, {}
      for _, timer in ipairs(state.timers) do
        if timer.status == "pending" then pending = pending + 1 end
        if timer.status == "pending" or clock() - timer.dueAt < 86400 then retained[#retained + 1] = timer end
      end
      if pending >= 10 or #retained >= 64 then return 429, {} end
      local timer = { id = data.id, action = data.action, dueAt = clock() + data.seconds, status = "pending" }
      retained[#retained + 1] = timer
      state.timers = retained
      save()
      arm(timer)
      return 201, timer
    end
    if path == "/v1/timers/cancel" and identifier(data.timerId) then
      for _, timer in ipairs(state.timers) do
        if timer.id == data.timerId then
          if timer.status ~= "pending" then return 409, { error = "Timer already claimed or completed." } end
          timer.status = "cancelled" save() return 200, { cancelled = true }
        end
      end
      return 404, {}
    end
    return 400, {}
  end
  return api
end
M.origin = ORIGIN
return M
