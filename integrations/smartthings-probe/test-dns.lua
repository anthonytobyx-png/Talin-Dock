local dns = dofile("integrations/smartthings-probe/src/dns.lua")
local function n16(v) return string.char(math.floor(v/256), v%256) end
local function encoded(host)
  local t = {}
  for label in host:gmatch("[^.]+") do t[#t+1] = string.char(#label)..label end
  return table.concat(t).."\0"
end
local host, id = "probe.example", 1234
local query = dns.query(host, id)
local function header(count, flags, nonce) return n16(nonce or id)..n16(flags or 33152)..n16(1)..n16(count)..string.rep("\0",4) end
local function record(owner, kind, data, ttl) return owner..n16(kind)..n16(1)..n16(0)..n16(ttl or 60)..n16(#data)..data end
local answer = header(1)..query:sub(13)..record("\192\12",1,string.char(8,8,8,8))
local passed = 0
local function check(value) assert(value); passed = passed + 1 end
local function rejected(packet) local ok = pcall(dns.parse,packet,host,id);check(not ok) end
local ip, ttl = dns.parse(answer,host,id)
check(ip == "8.8.8.8" and ttl == 60)
rejected(header(1,33664)..answer:sub(13)) -- truncated response flag
rejected(header(1,nil,id+1)..answer:sub(13))
rejected(header(1)..dns.query("wrong.example",id):sub(13)..record("\192\12",1,string.char(8,8,8,8)))
rejected(answer:sub(1,-2))
rejected(header(1).."\192\12"..string.rep("\0",20)) -- compression loop
rejected(header(1)..query:sub(13)..record(encoded("unrelated.example"),1,string.char(8,8,8,8)))
for _, bytes in ipairs({{10,0,0,1},{127,0,0,1},{169,254,1,1},{172,16,0,1},{192,168,1,1},{100,64,0,1},{224,0,0,1},{0,0,0,0}}) do
  rejected(header(1)..query:sub(13)..record("\192\12",1,string.char(table.unpack(bytes))))
end
local alias = header(2)..query:sub(13)..record("\192\12",5,encoded("edge.example"),30)..record(encoded("edge.example"),1,string.char(8,8,4,4),60)
ip, ttl = dns.parse(alias,host,id)
check(ip == "8.8.4.4" and ttl == 30)
local calls, closed = 0, 0
local fake = {udp=function()
  calls = calls + 1
  local peer, sent
  return {
    settimeout=function(_,seconds) assert(seconds == 3) end,
    setpeername=function(_,value,port) peer=value;assert(port == 53);return 1 end,
    send=function(_,value) sent=value;return #value end,
    receive=function() if peer == "192.168.1.1" then return nil,"timeout" end;return sent:sub(1,2)..answer:sub(3) end,
    close=function() closed=closed+1 end,
  }
end}
check(dns.resolve(host,fake,100,{"192.168.1.1","1.1.1.1"}) == "8.8.8.8" and calls == 2 and closed == 2)
check(dns.resolve(host,fake,159) == "8.8.8.8" and calls == 2)
check(dns.resolve(host,fake,160,{"192.168.1.1","1.1.1.1"}) == "8.8.8.8" and calls == 4 and closed == 4)
print(passed.." DNS validation, timeout, fallback and TTL checks passed")
