[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)][string]$PayloadDirectory,
  [Parameter(Mandatory)][string]$BootstrapFile,
  [Parameter(Mandatory)][string]$TargetSid,
  [Parameter(Mandatory)][string]$TargetProfile,
  [Parameter(Mandatory)][string]$ResultFile
)
$ErrorActionPreference = 'Stop'
$administratorSid = [Security.Principal.SecurityIdentifier]'S-1-5-32-544'
$systemSid = [Security.Principal.SecurityIdentifier]'S-1-5-18'
$usersSid = [Security.Principal.SecurityIdentifier]'S-1-5-11'
$secondUserSid = [Security.Principal.SecurityIdentifier]$TargetSid
$profile = Get-CimInstance Win32_UserProfile | Where-Object SID -eq $TargetSid
if (!$profile -or $profile.Special -or [IO.Path]::GetFullPath($profile.LocalPath) -ne [IO.Path]::GetFullPath($TargetProfile)) { throw 'Target Windows profile did not match its SID.' }
$payload = (Resolve-Path -LiteralPath $PayloadDirectory).Path
$bootstrap = (Resolve-Path -LiteralPath $BootstrapFile).Path
if ($payload.StartsWith('\\') -or $bootstrap.StartsWith('\\') -or $ResultFile.StartsWith('\\')) { throw 'Only reviewed local filesystem paths are allowed.' }
if ([IO.Path]::GetFullPath($ResultFile) -ne (Join-Path (Split-Path $bootstrap -Parent) 'install-result.json')) { throw 'Result output must stay in the prepared enrollment directory.' }
if (!(Test-Path -LiteralPath (Join-Path $payload 'Talin.Companion.exe')) -or (Get-Item -LiteralPath $bootstrap).Length -gt 16384) { throw 'Invalid reviewed payload.' }
if (Get-ChildItem -LiteralPath $payload -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw 'Reparse points are not allowed in the payload.' }
$sharedRoot = Join-Path ([Environment]::GetFolderPath('CommonApplicationData')) 'TalinDock'
$sharedApp = Join-Path $sharedRoot 'app'
$marker = Join-Path $sharedRoot 'talin-shared-install-v1.txt'
if ((Test-Path -LiteralPath $sharedRoot) -and !(Test-Path -LiteralPath $marker) -and (Get-ChildItem -LiteralPath $sharedRoot -Force)) { throw 'An unrelated existing shared folder was preserved.' }
if (Test-Path -LiteralPath $sharedRoot) {
  if ((Test-Path -LiteralPath $marker) -and ((Get-Acl -LiteralPath $sharedRoot).GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $administratorSid.Value)) { throw 'The existing shared runtime is not administrator-owned and was preserved.' }
  if ((Get-Item -LiteralPath $sharedRoot).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Unexpected shared path.' }
  if (Get-ChildItem -LiteralPath $sharedRoot -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw 'Unexpected link in shared installation.' }
}
if (!$PSCmdlet.ShouldProcess("$TargetProfile and $sharedRoot", 'Install read-only shared Talin runtime, SID-bound enrollment and second-user startup shortcut')) { return }
$principal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'This reviewed installer requires Windows administrator consent.' }
function Set-TalinFolderAcl([string]$Path, [Security.Principal.SecurityIdentifier]$ReadSid) {
  $acl = New-Object Security.AccessControl.DirectorySecurity
  $acl.SetAccessRuleProtection($true, $false)
  $acl.SetOwner($administratorSid)
  foreach ($sid in @($administratorSid,$systemSid)) { $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow'))) }
  if ($ReadSid) { $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($ReadSid,'ReadAndExecute','ContainerInherit,ObjectInherit','None','Allow'))) }
  Set-Acl -LiteralPath $Path -AclObject $acl
}
New-Item -ItemType Directory -Path $sharedRoot -Force | Out-Null
Set-TalinFolderAcl $sharedRoot $usersSid
'Talin Dock shared runtime; no household credentials in this marker.' | Set-Content -LiteralPath $marker -Encoding UTF8
$markerAcl=Get-Acl -LiteralPath $marker; $markerAcl.SetOwner($administratorSid); Set-Acl -LiteralPath $marker -AclObject $markerAcl
New-Item -ItemType Directory -Path $sharedApp -Force | Out-Null
Set-TalinFolderAcl $sharedApp $usersSid
Get-ChildItem -LiteralPath $payload | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $sharedApp -Recurse -Force }
Get-ChildItem -LiteralPath $sharedApp -Recurse -Force | ForEach-Object { $acl=Get-Acl -LiteralPath $_.FullName; $acl.SetOwner($administratorSid); Set-Acl -LiteralPath $_.FullName -AclObject $acl }
$enrollmentRoot = Join-Path $sharedRoot 'enrollment'
New-Item -ItemType Directory -Path $enrollmentRoot -Force | Out-Null
Set-TalinFolderAcl $enrollmentRoot $secondUserSid
$enrollment = Join-Path $enrollmentRoot $TargetSid
New-Item -ItemType Directory -Path $enrollment -Force | Out-Null
Set-TalinFolderAcl $enrollment $secondUserSid
$destinationBootstrap = Join-Path $enrollment 'bootstrap.dpapi'
if ((Test-Path -LiteralPath $destinationBootstrap) -and (Get-FileHash -LiteralPath $destinationBootstrap -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $bootstrap -Algorithm SHA256).Hash) { throw 'A different existing enrollment was preserved.' }
Copy-Item -LiteralPath $bootstrap -Destination $destinationBootstrap -Force
$fileAcl = New-Object Security.AccessControl.FileSecurity
$fileAcl.SetAccessRuleProtection($true,$false)
$fileAcl.SetOwner($administratorSid)
foreach ($sid in @($administratorSid,$systemSid)) { $fileAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','Allow'))) }
$fileAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($secondUserSid,'Read,Delete','Allow')))
Set-Acl -LiteralPath $destinationBootstrap -AclObject $fileAcl
$startup = Join-Path $TargetProfile 'AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup'
New-Item -ItemType Directory -Path $startup -Force | Out-Null
$shortcutPath = Join-Path $startup 'Talin Dock companion.lnk'
$shell = New-Object -ComObject WScript.Shell
if (Test-Path -LiteralPath $shortcutPath) {
  $oldShortcut = $shell.CreateShortcut($shortcutPath)
  if ($oldShortcut.TargetPath -ne (Join-Path $sharedApp 'Talin.Companion.exe')) { throw 'An unrelated startup shortcut was preserved.' }
}
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $sharedApp 'Talin.Companion.exe'
$shortcut.Arguments = '--bootstrap "' + $destinationBootstrap + '"'
$shortcut.WorkingDirectory = $sharedApp
$shortcut.Description = 'Optional Talin companion for this Windows account; outbound HTTPS only.'
$shortcut.WindowStyle = 7
$shortcut.Save()
@{installed=$true;targetSid=$TargetSid;bootstrapHash=(Get-FileHash -LiteralPath $destinationBootstrap -Algorithm SHA256).Hash;activation='Next normal sign-in to the target Windows account';portsOpened=$false;serviceInstalled=$false} | ConvertTo-Json -Compress | Set-Content -LiteralPath $ResultFile -Encoding UTF8
