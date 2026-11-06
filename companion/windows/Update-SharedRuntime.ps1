#Requires -Version 7
[CmdletBinding(SupportsShouldProcess)]
param(
  [Parameter(Mandatory)][string]$PayloadDirectory,
  [Parameter(Mandatory)][ValidatePattern('^[A-Fa-f0-9]{64}$')][string]$ExpectedDllSha256,
  [Parameter(Mandatory)][ValidatePattern('^[A-Fa-f0-9]{64}$')][string]$ExpectedExeSha256
)
$ErrorActionPreference = 'Stop'
$adminSid = [Security.Principal.SecurityIdentifier]'S-1-5-32-544'
$root = Join-Path ([Environment]::GetFolderPath('CommonApplicationData')) 'TalinDock'
$app = Join-Path $root 'app'
$payload = (Resolve-Path -LiteralPath $PayloadDirectory).Path
if ($payload.StartsWith('\\') -or !(Test-Path -LiteralPath (Join-Path $root 'talin-shared-install-v1.txt'))) { throw 'Expected existing local Talin installation.' }
foreach ($directory in @($root,$app,$payload)) {
  if ((Get-Item -LiteralPath $directory).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked runtime paths are not allowed.' }
}
foreach ($directory in @($root,$app)) {
  $acl = Get-Acl -LiteralPath $directory
  if ($acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $adminSid.Value) { throw 'Shared runtime must remain administrator-owned.' }
  foreach ($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])) {
    $writes = [Security.AccessControl.FileSystemRights]'Write,Delete,ChangePermissions,TakeOwnership'
    if ($rule.AccessControlType -eq 'Allow' -and ($rule.FileSystemRights -band $writes) -and $rule.IdentityReference.Value -notin @('S-1-5-32-544','S-1-5-18')) { throw 'Shared code is writable by an unexpected identity.' }
  }
}
# This updater changes two code files only. Enrollment, startup and credentials stay untouched.
$updates = @(
  @{Name='Talin.Companion.exe';Hash=$ExpectedExeSha256},
  @{Name='Talin.Companion.dll';Hash=$ExpectedDllSha256}
)
foreach ($name in @('Talin.Companion.deps.json','Talin.Companion.runtimeconfig.json')) {
  if ((Get-FileHash -LiteralPath (Join-Path $payload $name)).Hash -ne (Get-FileHash -LiteralPath (Join-Path $app $name)).Hash) { throw 'Dependency/runtime changes need a full reviewed installation.' }
}
foreach ($update in $updates) {
  $source = Join-Path $payload $update.Name
  $target = Join-Path $app $update.Name
  foreach ($file in @($source,$target)) {
    if ((Get-Item -LiteralPath $file).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked code files are not allowed.' }
  }
  $update.Bytes = [IO.File]::ReadAllBytes($source)
  if ([Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($update.Bytes)) -ne $update.Hash) { throw 'Staged code hash mismatch.' }
}
$targetExe = Join-Path $app 'Talin.Companion.exe'
if (Get-CimInstance Win32_Process -Filter "Name='Talin.Companion.exe'" | Where-Object ExecutablePath -eq $targetExe) { throw 'Shared companion is running. Preserve that session and update after it stops.' }
if (!$PSCmdlet.ShouldProcess($app,'Update only hash-verified Talin executable/assembly; preserve credentials and startup')) { return }
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Windows administrator consent is required.' }
$backup = Join-Path $app ('rollback-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $backup | Out-Null
foreach ($update in $updates) {
  $target = Join-Path $app $update.Name
  $temporary = Join-Path $app ($update.Name + '.' + [Guid]::NewGuid().ToString('N') + '.pending')
  # Both fully resolved targets are fixed children of the verified administrator-owned app.
  if ([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($temporary)) -ne $app -or [IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($target)) -ne $app) { throw 'Unexpected update target.' }
  Copy-Item -LiteralPath $target -Destination (Join-Path $backup $update.Name)
  [IO.File]::WriteAllBytes($temporary,$update.Bytes)
  $fileAcl = Get-Acl -LiteralPath $target
  $fileAcl.SetOwner($adminSid)
  Set-Acl -LiteralPath $temporary -AclObject $fileAcl
  [IO.File]::Move($temporary,$target,$true)
}
@{updated=$true;dllHash=(Get-FileHash -LiteralPath (Join-Path $app 'Talin.Companion.dll')).Hash;exeHash=(Get-FileHash -LiteralPath $targetExe).Hash;credentialsChanged=$false;portsOpened=$false} | ConvertTo-Json -Compress | Set-Content -LiteralPath (Join-Path $payload 'shared-update-result.json') -Encoding UTF8
