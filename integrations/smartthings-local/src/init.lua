local Driver = require "st.driver"
local json = require "st.json"
local capabilities = require "st.capabilities"
local diagnostic = capabilities["talentlaugh16714.talinHubDiagnostic"]
local bridge = capabilities["talentlaugh16714.talinTvLocalBridge"]
local apis = {}
local function initialize(driver, device)
  device:try_update_metadata({profile = "talin-tv-local"})
  local function report(value) device:emit_event(diagnostic.stage(value)) end
  if not apis[device.id] then
    local initialized, failure = pcall(function()
    apis[device.id] = require("bridge").new({
      get = function()
        local raw = device:get_field("talin-local-state-v1")
        if type(raw) == "string" then
          return json.decode(raw)
        end
      end,
      -- Store an immutable JSON string; hub datastore table proxies must never
      -- replace the mutable timer/request tables held by callback closures.
      set = function(state) device:set_field("talin-local-state-v1", json.encode(state), {persist = true}) end,
    }, function(action)
      if action:sub(1, 7) == "remote-" then
        -- This existing bounded string attribute is already supported by the
        -- installed device profile; the HTTP boundary allowlists every action.
        device:emit_event(diagnostic.stage(action, {state_change = true}))
      else
        device:emit_event(bridge.request(action, {state_change = true}))
      end
    end, function(delay, callback) driver:call_with_delay(delay, callback) end, os.time)
    end)
    if not initialized then
      -- No credential module has been loaded at this point. Expose only a
      -- generic state/bootstrap failure, never serialized state or keys.
      report("local-state:invalid")
      return
    end
  end
  local configured, secrets = pcall(require, "local_config")
  if not configured then report("local-tls:not-configured") return end
  local ok = pcall(function() require("https").start(device, secrets, apis[device.id], report) end)
  if not ok then report("local-tls:start-unavailable") end
end
local driver = Driver("talin-tv-local", {
  lifecycle_handlers = {init = initialize},
  capability_handlers = {
    [capabilities.refresh.ID] = {[capabilities.refresh.commands.refresh.NAME] = initialize},
    [bridge.ID] = {[bridge.commands.reportPower.NAME] = function(_, device, command)
      if apis[device.id] then
        apis[device.id].report(command.args.power)
        device:emit_event(bridge.reportedPower(command.args.power))
      end
    end},
  },
})
driver:run()
