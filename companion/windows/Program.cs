using System.Diagnostics;
using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Text.Json;
using NAudio.CoreAudioApi;

internal record Completion(string Id, bool Ok);
internal record Configuration(string Id, string Name, string Origin, string Token, string? LastCommand = null, Completion? Completed = null);
internal static class Program
{
    internal static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    static string Argument(string[] args, string flag, string fallback) => Array.IndexOf(args, flag) is var i && i >= 0 && i + 1 < args.Length ? args[i + 1] : fallback;
    static string StateFile = "";
    static void Save(Configuration state)
    {
        byte[] plain = JsonSerializer.SerializeToUtf8Bytes(state, Json);
        byte[] encrypted = ProtectedData.Protect(plain, null, DataProtectionScope.CurrentUser);
        CryptographicOperations.ZeroMemory(plain);
        File.WriteAllBytes(StateFile + ".tmp", encrypted);
        File.Move(StateFile + ".tmp", StateFile, true);
    }
    static Configuration Load() => JsonSerializer.Deserialize<Configuration>(ProtectedData.Unprotect(File.ReadAllBytes(StateFile), null, DataProtectionScope.CurrentUser), Json) ?? throw new InvalidDataException();
    static async Task<int> Main(string[] args)
    {
        if (!OperatingSystem.IsWindows()) return 1;
        try
        {
            if (args.Contains("--probe")) { _ = await Machine.Sample(); await Task.Delay(300); Console.WriteLine(JsonSerializer.Serialize(await Machine.Sample(), Json)); return 0; }
            if (args.Contains("--audio-self-test")) { Console.WriteLine(JsonSerializer.Serialize(Machine.AudioSelfTest(), Json)); return 0; }
            string directory = Argument(args, "--state-dir", Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TalinDock"));
            Directory.CreateDirectory(directory);
            var security = new DirectorySecurity();
            security.SetAccessRuleProtection(true, false);
            security.AddAccessRule(new FileSystemAccessRule(WindowsIdentity.GetCurrent().User!, FileSystemRights.FullControl, InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit, PropagationFlags.None, AccessControlType.Allow));
            new DirectoryInfo(directory).SetAccessControl(security);
            StateFile = Path.Combine(directory, "companion.dpapi");
            if (args.Contains("--prepare"))
            {
                if (!File.Exists(StateFile))
                {
                    string origin = "https://talin-dock.pages.dev";
                    if (args.Contains("--development")) origin = "http://127.0.0.1:8790";
                    Save(new(Guid.NewGuid().ToString(), Argument(args, "--name", "Windows desktop"), origin, Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant()));
                }
                var setup = Load();
                File.WriteAllText(Path.Combine(directory, "pairing-request.json"), JsonSerializer.Serialize(new { id = setup.Id, name = setup.Name, platform = "Windows", tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(setup.Token))).ToLowerInvariant() }, Json));
                Console.WriteLine("Pairing request prepared. Credentials are encrypted for this Windows user and are not printed."); return 0;
            }
            var state = Load();
            if (state.Origin != "https://talin-dock.pages.dev" && !(args.Contains("--development") && state.Origin == "http://127.0.0.1:8790")) return 1;
            using var mutex = new Mutex(true, "Local\\TalinDock-" + state.Id, out bool created);
            if (!created) return 0;
            using var client = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = TimeSpan.FromSeconds(15) };
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", state.Token);
            int failures = 0;
            Console.WriteLine("Talin companion started. Outbound HTTPS only; no listening network ports.");
            while (true)
            {
                int delay = 15;
                try
                {
                    using var response = await client.PostAsJsonAsync(state.Origin + "/api/computers/agent", new { snapshot = await Machine.Sample(), completed = state.Completed }, Json);
                    if (response.StatusCode == HttpStatusCode.Unauthorized) { Console.WriteLine("Computer is not paired or access was revoked. Companion stopped."); return 2; }
                    response.EnsureSuccessStatusCode();
                    using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                    var root = document.RootElement;
                    delay = root.GetProperty("pollSeconds").GetInt32() == 5 ? 5 : 15;
                    state = state with { Completed = null };
                    if (root.TryGetProperty("command", out var command) && command.ValueKind == JsonValueKind.Object)
                    {
                        string id = command.GetProperty("id").GetString()!;
                        bool ok = false;
                        if (Guid.TryParse(id, out _) && state.LastCommand != id)
                        {
                            state = state with { LastCommand = id, Completed = null }; Save(state);
                            try { ok = Machine.Execute(command); } catch { /* Unknown outcome is not retried. */ }
                        }
                        state = state with { Completed = new(id, ok) };
                        delay = 1; // Acknowledge once, then return to bounded normal polling.
                    }
                    Save(state); failures = 0;
                }
                catch { failures++; delay = Math.Min(60, 15 * failures); }
                await Task.Delay(TimeSpan.FromSeconds(delay));
            }
        }
        catch { Console.Error.WriteLine("Companion could not start. Check the protected configuration and Windows audio availability."); return 1; }
    }
}

internal static class Machine
{
    static ulong previousIdle, previousTotal;
    static string SessionId(AudioSessionControl session) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(session.GetSessionInstanceIdentifier))).ToLowerInvariant();
    static double Percent(float value) => Math.Round(Math.Clamp(value * 100, 0, 100), 1);
    static string Limited(string value, int max) => new(value.Where(c => !char.IsControl(c)).Take(max).ToArray());
    static object? Audio()
    {
        using var enumerator = new MMDeviceEnumerator();
        using var device = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
        var sessions = new List<object>();
        var collection = device.AudioSessionManager.Sessions;
        for (int i = 0; i < Math.Min(collection.Count, 32); i++)
        {
            using var session = collection[i];
            try
            {
                string name = "System sounds";
                if (!session.IsSystemSoundsSession) { using var process = Process.GetProcessById((int)session.GetProcessID); name = process.ProcessName; }
                sessions.Add(new { id = SessionId(session), name = Limited(name, 80), volume = Percent(session.SimpleAudioVolume.Volume), muted = session.SimpleAudioVolume.Mute });
            }
            catch { /* Sessions may disappear between enumeration and reading. */ }
        }
        bool? microphone = null;
        try { using var capture = enumerator.GetDefaultAudioEndpoint(DataFlow.Capture, Role.Communications); microphone = capture.AudioEndpointVolume.Mute; } catch { }
        return new { volume = Percent(device.AudioEndpointVolume.MasterVolumeLevelScalar), muted = device.AudioEndpointVolume.Mute, output = Limited(device.FriendlyName, 128), sessions, microphoneMuted = microphone };
    }
    static async Task<object?> Gpu()
    {
        try
        {
            string exe = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "System32", "nvidia-smi.exe");
            if (!File.Exists(exe)) return null;
            using var process = Process.Start(new ProcessStartInfo(exe, "--query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true })!;
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(3));
            string data = await process.StandardOutput.ReadToEndAsync(timeout.Token); await process.WaitForExitAsync(timeout.Token);
            string[] parts = data.Split('\n')[0].Split(',').Select(p => p.Trim()).ToArray();
            if (parts.Length != 5) return null;
            return new { name = Limited(parts[0], 128), loadPercent = double.Parse(parts[1], CultureInfo.InvariantCulture), temperatureC = double.Parse(parts[2], CultureInfo.InvariantCulture), memoryUsedMb = double.Parse(parts[3], CultureInfo.InvariantCulture), memoryTotalMb = double.Parse(parts[4], CultureInfo.InvariantCulture) };
        }
        catch { return null; }
    }
    internal static async Task<object> Sample()
    {
        double? cpu = null;
        if (Native.GetSystemTimes(out ulong idle, out ulong kernel, out ulong user))
        {
            ulong total = kernel + user;
            if (previousTotal > 0 && total > previousTotal) cpu = Math.Round(Math.Clamp(100.0 * (1.0 - (double)(idle - previousIdle) / (total - previousTotal)), 0, 100), 1);
            previousIdle = idle; previousTotal = total;
        }
        var memory = new Native.MemoryStatus { Length = (uint)Marshal.SizeOf<Native.MemoryStatus>() };
        if (!Native.GlobalMemoryStatusEx(ref memory)) throw new InvalidOperationException();
        object? audio = null; try { audio = Audio(); } catch { }
        var capabilities = new List<string>();
        if (audio != null) capabilities.AddRange(["masterVolume", "masterMute", "sessionVolume", "sessionMute"]);
        if (audio != null && JsonSerializer.SerializeToElement(audio, Program.Json).GetProperty("microphoneMuted").ValueKind != JsonValueKind.Null) capabilities.Add("microphoneMute");
        if (Environment.UserInteractive) capabilities.AddRange(["mediaPlayPause", "mediaPrevious", "mediaNext", "showDesktop", "taskManager"]);
        return new { sampledAt = DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture), cpuPercent = cpu, memoryUsedMb = Math.Round((memory.TotalPhysical - memory.AvailablePhysical) / 1048576.0), memoryTotalMb = Math.Round(memory.TotalPhysical / 1048576.0), gpu = await Gpu(), audio, capabilities };
    }
    internal static bool Execute(JsonElement command)
    {
        string action = command.GetProperty("action").GetString()!;
        if (action == "taskManager") { Process.Start(new ProcessStartInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "Taskmgr.exe")) { UseShellExecute = false }); return true; }
        if (action == "showDesktop") return Native.Keys([0x5B, 0x44], true);
        if (action.StartsWith("media")) return action switch { "mediaPlayPause" => Native.Keys([0xB3], false), "mediaPrevious" => Native.Keys([0xB1], false), "mediaNext" => Native.Keys([0xB0], false), _ => false };
        using var enumerator = new MMDeviceEnumerator();
        using var device = enumerator.GetDefaultAudioEndpoint(action == "microphoneMute" ? DataFlow.Capture : DataFlow.Render, action == "microphoneMute" ? Role.Communications : Role.Multimedia);
        if (action == "masterVolume") { float value = command.GetProperty("value").GetInt32() / 100f; if (value < 0 || value > 1) return false; device.AudioEndpointVolume.MasterVolumeLevelScalar = value; return Math.Abs(device.AudioEndpointVolume.MasterVolumeLevelScalar - value) <= .02; }
        if (action is "masterMute" or "microphoneMute") { bool value = command.GetProperty("value").GetBoolean(); device.AudioEndpointVolume.Mute = value; return device.AudioEndpointVolume.Mute == value; }
        if (action is "sessionVolume" or "sessionMute")
        {
            string id = command.GetProperty("sessionId").GetString()!;
            var sessions = device.AudioSessionManager.Sessions;
            for (int i = 0; i < sessions.Count; i++)
            {
                using var session = sessions[i]; if (SessionId(session) != id) continue;
                if (action == "sessionMute") { bool value = command.GetProperty("value").GetBoolean(); session.SimpleAudioVolume.Mute = value; return session.SimpleAudioVolume.Mute == value; }
                float volume = command.GetProperty("value").GetInt32() / 100f; if (volume < 0 || volume > 1) return false;
                session.SimpleAudioVolume.Volume = volume; return Math.Abs(session.SimpleAudioVolume.Volume - volume) <= .02;
            }
        }
        return false;
    }
    internal static object AudioSelfTest()
    {
        using var enumerator = new MMDeviceEnumerator(); using var device = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
        float original = device.AudioEndpointVolume.MasterVolumeLevelScalar; bool mute = device.AudioEndpointVolume.Mute;
        bool changed = false, restored = false;
        try { float target = original > .99f ? original - .01f : original + .01f; device.AudioEndpointVolume.MasterVolumeLevelScalar = target; changed = Math.Abs(device.AudioEndpointVolume.MasterVolumeLevelScalar - target) <= .02; device.AudioEndpointVolume.Mute = mute; }
        finally { device.AudioEndpointVolume.MasterVolumeLevelScalar = original; restored = Math.Abs(device.AudioEndpointVolume.MasterVolumeLevelScalar - original) <= .001 && device.AudioEndpointVolume.Mute == mute; }
        return new { masterVolumeReadback = changed, startingStateRestored = restored, microphoneCaptured = false };
    }
}
internal static class Native
{
    [DllImport("kernel32.dll")] internal static extern bool GetSystemTimes(out ulong idle, out ulong kernel, out ulong user);
    [DllImport("kernel32.dll")] internal static extern bool GlobalMemoryStatusEx(ref MemoryStatus status);
    [StructLayout(LayoutKind.Sequential)] internal struct MemoryStatus { internal uint Length, Load; internal ulong TotalPhysical, AvailablePhysical, TotalPageFile, AvailablePageFile, TotalVirtual, AvailableVirtual, AvailableExtendedVirtual; }
    [StructLayout(LayoutKind.Sequential)] struct Input { internal uint Type; internal Union Data; }
    [StructLayout(LayoutKind.Explicit)] struct Union { [FieldOffset(0)] internal Keyboard Keyboard; [FieldOffset(0)] internal Mouse Mouse; }
    [StructLayout(LayoutKind.Sequential)] struct Keyboard { internal ushort Vk, Scan; internal uint Flags, Time; internal IntPtr Extra; }
    [StructLayout(LayoutKind.Sequential)] struct Mouse { internal int X, Y; internal uint Data, Flags, Time; internal IntPtr Extra; }
    [DllImport("user32.dll", SetLastError = true)] static extern uint SendInput(uint count, Input[] inputs, int size);
    internal static bool Keys(ushort[] keys, bool chord)
    {
        var inputs = new List<Input>();
        foreach (ushort key in keys) inputs.Add(new() { Type = 1, Data = new() { Keyboard = new() { Vk = key } } });
        foreach (ushort key in keys.Reverse()) inputs.Add(new() { Type = 1, Data = new() { Keyboard = new() { Vk = key, Flags = 2 } } });
        return SendInput((uint)inputs.Count, inputs.ToArray(), Marshal.SizeOf<Input>()) == inputs.Count;
    }
}
